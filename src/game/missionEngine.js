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
import {
  processRescueDeadlines,
  resolveRescuedPlayers,
  getActivePlayers,
} from './playerStateManager.js';
import { createSolRecord, appendSolRecord }       from './missionHistory.js';
import { assignTasksForSol }                      from './taskManager.js';

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
 *   - `completedSolTaskIds` → `[]`
 *   - `currentSolAssignments` → generated for all active players on Sol 1
 *
 * Any other fields in `overrides` (e.g. `roomCode`, `players`, `votes`) are
 * passed through to `createMission()` and preserved. The forced fields
 * always win over caller-supplied overrides.
 *
 * @param {Partial<import('../types/game.js').Mission>} [overrides={}]
 *   Optional partial Mission fields to seed the new session.
 * @param {{ randomFn?: function(): number }} [options={}]
 *   Optional engine options.
 *   - `options.randomFn`: injectable RNG for task assignment (default: Math.random).
 * @returns {import('../types/game.js').Mission}
 */
export function initMission(overrides = {}, options = {}) {
  const base = createMission({
    ...overrides,
    resources:           createResources(INITIAL_RESOURCES),
    round:               1,
    status:              MissionStatus.IN_PROGRESS,
    completedSolTaskIds: [],
  });

  // Generate task assignments for Sol 1
  const activePlayers = getActivePlayers(base);
  const assignments   = assignTasksForSol(activePlayers, options?.randomFn);

  return createMission({ ...base, currentSolAssignments: assignments });
}

/**
 * Advances a mission by exactly one Sol and returns a new Mission object.
 * The original `mission` argument is **never mutated**.
 * All fields unrelated to the round advance are preserved.
 *
 * Guards — returns the mission unchanged (same reference) if:
 *   - `mission.status` is `MissionStatus.LOBBY`     (not yet started)
 *   - `mission.status` is `MissionStatus.COMPLETED` (already won)
 *   - `mission.status` is `MissionStatus.FAILED`    (already lost)
 *
 * Advance steps:
 *   1. Auto-eliminate trapped players whose rescue deadline has been reached.
 *   2. Transition rescued → active (one-Sol recovery period).
 *   3. Count only active players for resource consumption.
 *   4. Calculate per-Sol resource delta via `calculateConsumption()`.
 *   5. Apply delta and clamp all resources via `applyConsumption()`.
 *   6. Increment `round` by 1.
 *   7. Evaluate new mission status (failure takes priority over completion).
 *   8. Capture outgoing Sol's assignments and build the SolRecord for history.
 *   9. Reset `emergencyPenalties` and `completedSolTaskIds` for the next Sol.
 *  10. Generate fresh task assignments for the new Sol's active players.
 *  11. Return a new Mission object via `createMission()` with history appended.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {{
 *   targetRound?:        number,
 *   tasksCompleted?:     Object[],
 *   emergenciesApplied?: string[],
 *   randomFn?:           function(): number
 * }} [options={}]
 *   Optional configuration:
 *   - `targetRound`:        Sol to reach for completion. Invalid values fall back to DEFAULT_MISSION_LENGTH.
 *   - `tasksCompleted`:     TaskRecord array from this Sol (passed to history).
 *   - `emergenciesApplied`: Emergency event IDs applied this Sol (passed to history).
 *   - `randomFn`:           Injectable RNG for task assignment (default: Math.random).
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

  // Resolve options
  const targetRound        = safeTargetRound(options?.targetRound);
  const tasksCompleted     = Array.isArray(options?.tasksCompleted)      ? options.tasksCompleted     : [];
  const emergenciesApplied = Array.isArray(options?.emergenciesApplied)  ? options.emergenciesApplied : [];
  const randomFn           = typeof options?.randomFn === 'function'     ? options.randomFn           : Math.random;

  // Step 1: Auto-eliminate trapped players whose rescue deadline has passed
  const missionAfterDeadlines = processRescueDeadlines(mission);

  // Step 2: Transition rescued → active (one-Sol recovery period)
  const missionAfterRescues = resolveRescuedPlayers(missionAfterDeadlines);

  // Step 3: Only active players consume resources; eliminated players do not
  const activePlayers = getActivePlayers(missionAfterRescues);
  const playerCount   = activePlayers.length >= 1 ? activePlayers.length : 1;

  // Step 4: Calculate per-Sol resource delta
  const delta = calculateConsumption(missionAfterRescues.resources, playerCount);

  // Step 5: Apply delta and clamp all resource values to [0, 100]
  const newResources = applyConsumption(missionAfterRescues.resources, delta);

  // Step 6: Increment Sol counter; guard against a corrupt current round
  const newRound = (typeof missionAfterRescues.round === 'number' && isFinite(missionAfterRescues.round))
    ? missionAfterRescues.round + 1
    : 2;

  // Step 7: Evaluate new status (failure takes priority over completion)
  const snapshot  = { ...missionAfterRescues, resources: newResources, round: newRound };
  const newStatus = evaluateMissionStatus(snapshot, targetRound);

  // Step 8: Capture outgoing Sol's assignments for the history record
  const prevAssignments = (missionAfterRescues.currentSolAssignments &&
    typeof missionAfterRescues.currentSolAssignments === 'object')
    ? missionAfterRescues.currentSolAssignments : {};

  const completedSol = missionAfterRescues.round;
  const solRecord = createSolRecord(
    completedSol, newResources, tasksCompleted, emergenciesApplied, prevAssignments
  );

  // Step 9: Build base mission — reset per-Sol tracking fields
  const baseMission = createMission({
    ...missionAfterRescues,
    resources:           newResources,
    round:               newRound,
    status:              newStatus,
    emergencyPenalties:  { oxygen: 0, power: 0, food: 0, radiation: 0 },
    completedSolTaskIds: [],                 // reset completed list for the new Sol
  });

  // Step 10: Generate fresh task assignments for the new Sol's active players
  const nextActivePlayers = getActivePlayers(baseMission);
  const newAssignments    = assignTasksForSol(nextActivePlayers, randomFn);
  const missionWithTasks  = createMission({
    ...baseMission,
    currentSolAssignments: newAssignments,
  });

  // Step 11: Return final mission with Sol record appended to history
  return appendSolRecord(missionWithTasks, solRecord);
}

/**
 * Ends the current Sol using the shared resource, rescue, history, and task logic.
 * totalSols counts the displayed Sol 1 through the final Sol. The round remains
 * on the final Sol when its outcome is completed.
 */
export function endMissionSol(mission, options = {}) {
  if (!mission || mission.status !== MissionStatus.IN_PROGRESS) return mission

  const totalSols = safeTargetRound(options.totalSols ?? mission.targetSols)
  const currentSol = safeTargetRound(mission.round)
  const advanced = advanceMission(mission, { ...options, targetRound: totalSols + 1 })
  if (advanced === mission) return advanced
  if (advanced.status === MissionStatus.FAILED) {
    return createMission({ ...advanced, round: currentSol, status: MissionStatus.FAILED })
  }

  if (currentSol >= totalSols) {
    return createMission({ ...advanced, round: currentSol, status: MissionStatus.COMPLETED })
  }
  return advanced
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
