/**
 * MISSION: OUTPOST - Mission Rules
 * NASA Space Apps Challenge 2026
 *
 * Pure functions that evaluate mission outcome conditions.
 * Uses only the MissionStatus enum from src/types/game.js.
 * Independent of React, Firebase, and resource-change logic.
 *
 * All failure thresholds are GAME SIMULATION values chosen for playability.
 * They are NOT real astronaut life-support or NASA safety limits.
 */

import { MissionStatus } from '../types/game.js';

// ─── GAME SIMULATION thresholds ───────────────────────────────────────────────

/**
 * Resource levels at which the mission immediately fails.
 * Any single condition being true is sufficient to end the mission.
 * GAME SIMULATION values — not real NASA astronaut safety limits.
 *
 * Conditions:
 *   - oxygen    <= 0   : crew suffocates
 *   - power     <= 0   : life-support systems collapse
 *   - food      <= 0   : crew starves
 *   - radiation >= 100 : lethal cumulative radiation dose
 */
const FAILURE_THRESHOLDS = Object.freeze({
  oxygenMin:    0,    // oxygen at or below this → failure
  powerMin:     0,    // power at or below this → failure
  foodMin:      0,    // food at or below this → failure
  radiationMax: 100,  // radiation at or above this → failure
});

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Checks whether the mission has failed based on current resource levels.
 * Any single failure condition is sufficient.
 *
 * GAME SIMULATION failure conditions:
 *   - oxygen    <= 0   (suffocation)
 *   - power     <= 0   (life-support collapse)
 *   - food      <= 0   (starvation)
 *   - radiation >= 100 (lethal radiation dose)
 *
 * Defensive: a missing, null, or non-object `resources` argument is treated
 * as a failure state rather than throwing.
 *
 * @param {import('../types/game.js').Resources} resources - Current resource levels.
 * @returns {boolean} `true` if the mission has failed.
 */
export function isMissionFailed(resources) {
  if (resources === null || resources === undefined || typeof resources !== 'object') {
    return true; // defensive: corrupt state = failure
  }
  return (
    resources.oxygen    <= FAILURE_THRESHOLDS.oxygenMin    ||
    resources.power     <= FAILURE_THRESHOLDS.powerMin     ||
    resources.food      <= FAILURE_THRESHOLDS.foodMin      ||
    resources.radiation >= FAILURE_THRESHOLDS.radiationMax
  );
}

/**
 * Checks whether the mission has been completed by surviving to the target Sol.
 *
 * The mission is completed when `round >= targetRound`. Since the mission starts
 * at round 1 and each `advanceMission()` call increments round by 1, reaching
 * round 20 requires exactly 19 advances.
 *
 * Both `round` and `targetRound` must be finite numbers greater than 0 for
 * this to return `true`. Invalid inputs always return `false`.
 *
 * @param {number} round - Current Sol number (from `mission.round`).
 * @param {number} targetRound - The Sol the mission aims to reach (e.g. 20).
 * @returns {boolean} `true` if the target Sol has been reached or surpassed.
 */
export function isMissionCompleted(round, targetRound) {
  return (
    typeof round        === 'number' && isFinite(round)        && round        > 0 &&
    typeof targetRound  === 'number' && isFinite(targetRound)  && targetRound  > 0 &&
    round >= targetRound
  );
}

/**
 * Evaluates and returns the correct MissionStatus for the given mission state.
 *
 * **Failure takes priority over completion.** If a resource hits its failure
 * threshold on the same Sol that the target round is reached, the mission
 * is marked as FAILED, not COMPLETED.
 *
 * Decision order (checked top to bottom, first match wins):
 *   1. LOBBY       — mission has not yet started; returned unchanged.
 *   2. FAILED      — any resource is at a failure threshold.
 *   3. COMPLETED   — round >= targetRound with all resources above thresholds.
 *   4. IN_PROGRESS — none of the above conditions are met.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {number} targetRound - The Sol required to complete the mission.
 * @returns {'lobby'|'in_progress'|'completed'|'failed'}
 */
export function evaluateMissionStatus(mission, targetRound) {
  if (mission === null || mission === undefined || typeof mission !== 'object') {
    return MissionStatus.FAILED; // defensive: corrupt state = failure
  }

  // 1. Not started — do not evaluate gameplay conditions
  if (mission.status === MissionStatus.LOBBY) {
    return MissionStatus.LOBBY;
  }

  // 2. Failure check — takes priority over completion (correction #6)
  if (isMissionFailed(mission.resources)) {
    return MissionStatus.FAILED;
  }

  // 3. Completion check — only reached if no failure condition is active
  if (isMissionCompleted(mission.round, targetRound)) {
    return MissionStatus.COMPLETED;
  }

  // 4. Mission is ongoing
  return MissionStatus.IN_PROGRESS;
}
