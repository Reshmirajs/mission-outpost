/**
 * MISSION: OUTPOST - Mission Engine
 * NASA Space Apps Challenge 2026
 *
 * Orchestrates the game loop by composing resourceManager and missionRules.
 * This is the single public API surface for game state transitions.
 *
 * Uses only factory functions and constants from src/types/game.js.
 * Independent of React, Firebase, and all UI concerns.
 *
 * All configuration values are GAME SIMULATION values chosen for playability.
 * They are NOT real astronaut mission parameters or NASA operational limits.
 */

import {
  MissionStatus,
  INITIAL_RESOURCES,
  createMission,
  createResources,
} from '../types/game.js';

import { calculateConsumption, applyConsumption } from './resourceManager.js';
import { evaluateMissionStatus }                  from './missionRules.js';

// ─── GAME SIMULATION configuration ───────────────────────────────────────────

/**
 * Top-level game configuration constants.
 * All values are GAME SIMULATION values — not real mission parameters.
 *
 * Callers may override `DEFAULT_MISSION_LENGTH` per-call via `options.targetRound`.
 *
 * @type {Readonly<{ DEFAULT_MISSION_LENGTH: number }>}
 */
export const GAME_CONFIG = Object.freeze({
  /** Number of Sols a crew must survive to successfully complete a mission. */
  DEFAULT_MISSION_LENGTH: 20,
});

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Validates and returns a safe `targetRound` value.
 * Must be a finite number greater than 0; non-integer values are floored.
 * Falls back to `GAME_CONFIG.DEFAULT_MISSION_LENGTH` for any invalid input.
 *
 * @param {*} value - The raw value supplied by the caller.
 * @returns {number} A safe, positive integer target Sol.
 */
function safeTargetRound(value) {
  if (typeof value === 'number' && isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return GAME_CONFIG.DEFAULT_MISSION_LENGTH;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Creates a new Mission ready to be played.
 *
 * Always forces:
 *   - `status`    → `MissionStatus.IN_PROGRESS`
 *   - `round`     → 1
 *   - `resources` → a fresh copy of INITIAL_RESOURCES via `createResources()`
 *
 * Any other fields in `overrides` (e.g. `roomCode`, `players`, `votes`) are
 * passed through to `createMission()` and preserved. The three forced fields
 * always win over caller-supplied overrides.
 *
 * Uses `createMission()` and `createResources()` from src/types/game.js.
 *
 * @param {Partial<import('../types/game.js').Mission>} [overrides={}]
 *   Optional partial Mission fields to seed the new session.
 * @returns {import('../types/game.js').Mission}
 */
export function initMission(overrides = {}) {
  return createMission({
    ...overrides,                             // caller's optional fields first
    resources: createResources(INITIAL_RESOURCES), // then force fresh resources
    round:  1,                                // force starting Sol
    status: MissionStatus.IN_PROGRESS,        // force active status
  });
}

/**
 * Advances a mission by exactly one Sol and returns a new Mission object.
 * The original `mission` argument is **never mutated**.
 * All fields unrelated to the round advance are preserved via spread.
 *
 * Guards — returns the mission unchanged (same reference) if:
 *   - `mission.status` is `MissionStatus.LOBBY`     (not yet started)
 *   - `mission.status` is `MissionStatus.COMPLETED` (already won)
 *   - `mission.status` is `MissionStatus.FAILED`    (already lost)
 *
 * Advance steps:
 *   1. Determine effective player count (defaults to 1 if array is empty or missing).
 *   2. Calculate per-Sol resource delta via `calculateConsumption()`.
 *   3. Apply delta and clamp all resources via `applyConsumption()`.
 *   4. Increment `round` by 1 (invalid round values fall back safely to 2).
 *   5. Evaluate the new mission status via `evaluateMissionStatus()`.
 *      Failure takes priority over completion if both conditions coincide.
 *   6. Return a new Mission object via `createMission()`, spreading all
 *      original fields and replacing only `resources`, `round`, and `status`.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {{ targetRound?: number }} [options={}]
 *   Optional configuration for this advance call.
 *   - `options.targetRound`: The Sol to reach for completion. Invalid values
 *     fall back to `GAME_CONFIG.DEFAULT_MISSION_LENGTH`. Defaults to 20.
 * @returns {import('../types/game.js').Mission} A new Mission object one Sol later.
 */
export function advanceMission(mission, options = {}) {
  // Guard: return unchanged for any non-active mission status
  if (
    mission.status === MissionStatus.LOBBY     ||
    mission.status === MissionStatus.COMPLETED ||
    mission.status === MissionStatus.FAILED
  ) {
    return mission;
  }

  // Resolve configuration
  const targetRound = safeTargetRound(options?.targetRound);

  // Step 1: Effective player count — minimum 1
  const playerCount = (Array.isArray(mission.players) && mission.players.length >= 1)
    ? mission.players.length
    : 1;

  // Step 2: Calculate per-Sol resource delta
  const delta = calculateConsumption(mission.resources, playerCount);

  // Step 3: Apply delta and clamp all resource values to [0, 100]
  const newResources = applyConsumption(mission.resources, delta);

  // Step 4: Increment Sol counter; guard against a corrupt current round
  const newRound = (typeof mission.round === 'number' && isFinite(mission.round))
    ? mission.round + 1
    : 2;

  // Step 5: Evaluate new status against the updated resources and round.
  // Builds a lightweight snapshot — does not mutate `mission`.
  const snapshot  = { ...mission, resources: newResources, round: newRound };
  const newStatus = evaluateMissionStatus(snapshot, targetRound);

  // Step 6: Return a fully new Mission via factory, preserving all other fields
  return createMission({
    ...mission,          // preserve roomCode, players, votes, etc.
    resources: newResources,
    round:     newRound,
    status:    newStatus,
  });
}

/**
 * Applies one verified local task result to the mission. The UI is responsible
 * for validating the minigame; this engine entry point owns idempotency,
 * resource application and mission-status evaluation.
 *
 * @returns {{ mission: import('../types/game.js').Mission, applied: boolean }}
 */
export function completeMissionTask(mission, task, options = {}) {
  if (!mission || mission.status !== MissionStatus.IN_PROGRESS || !task?.taskId) {
    return { mission, applied: false }
  }

  const assignments = mission.taskAssignment?.tasks
  if (Array.isArray(assignments) && assignments.length) {
    const assigned = assignments.find((entry) => entry.id === task.taskId)
    if (!assigned || assigned.status === 'completed') return { mission, applied: false }
    if (assigned.assignedTo?.role && task.role && assigned.assignedTo.role !== task.role) return { mission, applied: false }
    if (assigned.assignedTo?.playerId && task.playerId && assigned.assignedTo.playerId !== task.playerId) return { mission, applied: false }
  }

  const records = Array.isArray(mission.completedTasks) ? mission.completedTasks : []
  const alreadyCompleted = records.some((record) => (
    (typeof record === 'string' ? record : record?.taskId || record?.id) === task.taskId
  ))
  if (alreadyCompleted) return { mission, applied: false }

  const resources = applyConsumption(mission.resources, task.resourceDelta || {})
  const targetRound = safeTargetRound(options.targetRound)
  const status = evaluateMissionStatus({ ...mission, resources }, targetRound)
  const record = {
    taskId: task.taskId,
    title: task.title || 'Task',
    sol: mission.round,
    completedAt: task.completedAt || new Date().toISOString(),
    completedBy: [{ playerId: task.playerId || '', role: task.role || '' }],
  }

  return {
    mission: {
      ...mission,
      resources,
      status,
      completedTasks: [...records, record],
      taskAssignment: mission.taskAssignment ? {
        ...mission.taskAssignment,
        tasks: mission.taskAssignment.tasks.map((entry) => entry.id === task.taskId
          ? { ...entry, status: 'completed', progress: 100 }
          : entry),
      } : mission.taskAssignment,
      taskProgress: mission.taskProgress ? { ...mission.taskProgress, [task.taskId]: { percent: 100 } } : mission.taskProgress,
    },
    applied: true,
  }
}
