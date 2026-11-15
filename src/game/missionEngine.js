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
 *   8. Build a SolRecord snapshot and append it to mission history.
 *   9. Reset `emergencyPenalties` to zero for the next Sol.
 *  10. Return a new Mission object via `createMission()`.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {{
 *   targetRound?:        number,
 *   tasksCompleted?:     Object[],
 *   emergenciesApplied?: string[]
 * }} [options={}]
 *   Optional configuration:
 *   - `targetRound`:        Sol to reach for completion. Invalid values fall back to DEFAULT_MISSION_LENGTH.
 *   - `tasksCompleted`:     TaskRecord array from this Sol (passed to history).
 *   - `emergenciesApplied`: Emergency event IDs applied this Sol (passed to history).
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

  // Step 8: Assemble Sol record (captures end-of-Sol state) and build base mission
  const solRecord   = createSolRecord(newRound, newResources, tasksCompleted, emergenciesApplied);
  const baseMission = createMission({
    ...missionAfterRescues,          // preserves updated player states, roomCode, votes, etc.
    resources:          newResources,
    round:              newRound,
    status:             newStatus,
    emergencyPenalties: { oxygen: 0, power: 0, food: 0, radiation: 0 }, // Step 9: reset for next Sol
  });

  // Step 10: Return final mission with Sol record appended to history
  return appendSolRecord(baseMission, solRecord);
}
