/**
 * MISSION: OUTPOST - Player State Manager
 * NASA Space Apps Challenge 2026
 *
 * Pure functions for managing crew member state transitions.
 * Handles the active → trapped → rescued/eliminated lifecycle and rescue deadlines.
 *
 * Independent of React, Firebase, resource consumption, and task logic.
 *
 * GAME SIMULATION: Rescue deadline = currentSol + 3.
 * A trapped player not rescued by their deadline is auto-eliminated.
 * Eliminated players are excluded from resource consumption.
 * Rescued players return to active on the Sol after rescue (one-Sol recovery).
 */

import { createMission } from '../types/game.js';

// ─── GAME SIMULATION constants ────────────────────────────────────────────────

/**
 * Number of Sols a trapped player has before automatic elimination.
 * GAME SIMULATION value — not a real NASA rescue operations parameter.
 *
 * Example: trapped at Sol 5 → rescueDeadline = 8 → eliminated at start of Sol 8 advance.
 *
 * @type {number}
 */
const RESCUE_DEADLINE_WINDOW = 3;

// ─── Player State Enumeration ─────────────────────────────────────────────────

/**
 * Valid operational states for a crew member during a mission.
 * String values match the `playerState` field on the Player typedef in game.js.
 *
 * @type {Readonly<{ ACTIVE: string, TRAPPED: string, RESCUED: string, ELIMINATED: string }>}
 */
export const PlayerState = Object.freeze({
  ACTIVE:     'active',
  TRAPPED:    'trapped',
  RESCUED:    'rescued',
  ELIMINATED: 'eliminated',
});

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Applies an updater function to a single player in the mission's players array.
 * Returns a new Mission object — never mutates the input.
 * Players not matching `playerId` are returned unchanged.
 *
 * @param {import('../types/game.js').Mission} mission
 * @param {string} playerId
 * @param {function(import('../types/game.js').Player): Partial<import('../types/game.js').Player>} updater
 *   Returns a partial object of fields to merge into the matched player.
 *   Return an empty object `{}` to leave the player unchanged.
 * @returns {import('../types/game.js').Mission}
 */
function updatePlayerInMission(mission, playerId, updater) {
  if (!Array.isArray(mission.players)) return mission;

  const newPlayers = mission.players.map(p =>
    p.id === playerId ? { ...p, ...updater(p) } : p
  );

  return createMission({ ...mission, players: newPlayers });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Transitions a player from `active` → `trapped` and sets their rescue deadline.
 * Has no effect if the player is not currently `active`.
 * Never mutates the input mission.
 *
 * GAME SIMULATION: rescueDeadline = currentSol + RESCUE_DEADLINE_WINDOW (3).
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {string} playerId - ID of the player to trap.
 * @param {number} currentSol - Current Sol number (from mission.round).
 * @returns {import('../types/game.js').Mission} New mission with updated player state.
 */
export function trapPlayer(mission, playerId, currentSol) {
  return updatePlayerInMission(mission, playerId, (p) => {
    if (p.playerState !== PlayerState.ACTIVE) return {};
    const deadline = (typeof currentSol === 'number' && isFinite(currentSol))
      ? currentSol + RESCUE_DEADLINE_WINDOW
      : null;
    return { playerState: PlayerState.TRAPPED, rescueDeadline: deadline };
  });
}

/**
 * Transitions a player from `trapped` → `rescued`.
 * Has no effect if the player is not currently `trapped`.
 * The player returns to `active` on the following Sol via `resolveRescuedPlayers()`.
 * Never mutates the input mission.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {string} playerId - ID of the player to rescue.
 * @returns {import('../types/game.js').Mission} New mission with updated player state.
 */
export function rescuePlayer(mission, playerId) {
  return updatePlayerInMission(mission, playerId, (p) => {
    if (p.playerState !== PlayerState.TRAPPED) return {};
    return { playerState: PlayerState.RESCUED, rescueDeadline: null };
  });
}

/**
 * Transitions a player to `eliminated`. This is a final, irreversible state.
 * Has no effect if the player is already `eliminated`.
 * Never mutates the input mission.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @param {string} playerId - ID of the player to eliminate.
 * @returns {import('../types/game.js').Mission} New mission with updated player state.
 */
export function eliminatePlayer(mission, playerId) {
  return updatePlayerInMission(mission, playerId, (p) => {
    if (p.playerState === PlayerState.ELIMINATED) return {};
    return { playerState: PlayerState.ELIMINATED, rescueDeadline: null };
  });
}

/**
 * Checks all `trapped` players and auto-eliminates any whose rescue deadline
 * has been reached at the start of the current Sol advance.
 *
 * Called at the beginning of `advanceMission()`, before round increment.
 * A player with `rescueDeadline` <= `mission.round` is eliminated.
 * Never mutates the input mission.
 *
 * GAME SIMULATION: Trapped at Sol N → deadline N+3 → eliminated at start of Sol N+3 advance.
 * Players have 3 advance opportunities (Sols N+1, N+2 advance begins) to be rescued.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @returns {import('../types/game.js').Mission} New mission with overdue trapped players eliminated.
 */
export function processRescueDeadlines(mission) {
  if (!Array.isArray(mission.players)) return mission;

  const currentSol = mission.round;
  let updated = mission;

  for (const player of mission.players) {
    if (
      player.playerState === PlayerState.TRAPPED &&
      typeof player.rescueDeadline === 'number' &&
      currentSol >= player.rescueDeadline
    ) {
      updated = eliminatePlayer(updated, player.id);
    }
  }

  return updated;
}

/**
 * Transitions all `rescued` players → `active` at the start of a new Sol.
 * This implements the one-Sol recovery period after a rescue.
 *
 * Called at the beginning of `advanceMission()`, after `processRescueDeadlines()`.
 * Never mutates the input mission.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @returns {import('../types/game.js').Mission} New mission with rescued players now active.
 */
export function resolveRescuedPlayers(mission) {
  if (!Array.isArray(mission.players)) return mission;

  const newPlayers = mission.players.map(p =>
    p.playerState === PlayerState.RESCUED
      ? { ...p, playerState: PlayerState.ACTIVE }
      : p
  );

  return createMission({ ...mission, players: newPlayers });
}

/**
 * Returns only the players with `playerState === 'active'`.
 * Used by `advanceMission()` to determine how many players consume resources.
 * Trapped, rescued, and eliminated players do not consume oxygen, power, or food.
 *
 * Returns a new array — never mutates the input.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @returns {import('../types/game.js').Player[]} Active players only.
 */
export function getActivePlayers(mission) {
  if (!Array.isArray(mission.players)) return [];
  return mission.players.filter(p => p.playerState === PlayerState.ACTIVE);
}
