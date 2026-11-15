/**
 * MISSION: OUTPOST - Task Manager
 * NASA Space Apps Challenge 2026
 *
 * Defines role-based maintenance tasks, validates task execution conditions,
 * and applies resource rewards to mission state.
 *
 * Uses only PlayerRoles from src/types/game.js and clampResources() from resourceManager.js.
 * Independent of React, Firebase, emergency events, and player state transitions.
 *
 * All task reward values are GAME SIMULATION values chosen for playability.
 * They are NOT real astronaut operational procedures or NASA mission parameters.
 */

import { PlayerRoles }   from '../types/game.js';
import { clampResources } from './resourceManager.js';

// ─── GAME SIMULATION task definitions ────────────────────────────────────────

/**
 * Maps each PlayerRole to its maintenance task definition.
 * Unassigned players have no task available (key intentionally omitted).
 *
 * Reward fields are partial Resources-shaped deltas:
 *   - Positive values restore a resource.
 *   - Negative values reduce a resource (radiation treatment reduces radiation).
 *
 * GAME SIMULATION reward values — not real life-support or operational figures:
 *
 * | Role        | Task                       | Reward                   |
 * |-------------|----------------------------|--------------------------|
 * | Commander   | Coordinate Systems Check   | +oxygen: 3, +power: 2   |
 * | Engineer    | Repair Power Grid          | +power: 8               |
 * | Botanist    | Tend Greenhouse            | +food: 8                |
 * | Medic       | Radiation Treatment        | −radiation: 6           |
 * | Scientist   | Atmospheric Analysis       | +oxygen: 5              |
 *
 * @type {Readonly<Record<string, {taskId: string, name: string, role: string, reward: Object}>>}
 */
export const ROLE_TASKS = Object.freeze({
  [PlayerRoles.COMMANDER]: Object.freeze({
    taskId: 'task_commander_coordinate_systems_check',
    name:   'Coordinate Systems Check',
    role:   PlayerRoles.COMMANDER,
    reward: Object.freeze({ oxygen: 3, power: 2 }),
  }),
  [PlayerRoles.ENGINEER]: Object.freeze({
    taskId: 'task_engineer_repair_power_grid',
    name:   'Repair Power Grid',
    role:   PlayerRoles.ENGINEER,
    reward: Object.freeze({ power: 8 }),
  }),
  [PlayerRoles.BOTANIST]: Object.freeze({
    taskId: 'task_botanist_tend_greenhouse',
    name:   'Tend Greenhouse',
    role:   PlayerRoles.BOTANIST,
    reward: Object.freeze({ food: 8 }),
  }),
  [PlayerRoles.MEDIC]: Object.freeze({
    taskId: 'task_medic_radiation_treatment',
    name:   'Radiation Treatment',
    role:   PlayerRoles.MEDIC,
    reward: Object.freeze({ radiation: -6 }),
  }),
  [PlayerRoles.SCIENTIST]: Object.freeze({
    taskId: 'task_scientist_atmospheric_analysis',
    name:   'Atmospheric Analysis',
    role:   PlayerRoles.SCIENTIST,
    reward: Object.freeze({ oxygen: 5 }),
  }),
});

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Returns the task definition for a given role, or `null` if the role has no task.
 * Returns `null` for `Unassigned` and any unrecognised role strings.
 *
 * @param {string} role - A PlayerRoles value.
 * @returns {{ taskId: string, name: string, role: string, reward: Object } | null}
 */
export function getTaskForRole(role) {
  return ROLE_TASKS[role] || null;
}

/**
 * Validates and executes a maintenance task for a specific player.
 *
 * Validation rules (all must pass for success):
 *   1. The player must exist in `mission.players`.
 *   2. The player's `playerState` must be `'active'`.
 *   3. The player's role must have an associated task (not Unassigned).
 *
 * On success:
 *   - The task reward delta is applied to `mission.resources`.
 *   - Resources are clamped to [0, 100] — task rewards cannot overfill a resource.
 *   - A TaskRecord is returned for the caller to pass to `missionHistory`.
 *
 * On failure:
 *   - `updatedResources` is the original `mission.resources` unchanged.
 *   - `taskRecord` is `null`.
 *   - `reason` explains why the task was rejected.
 *
 * This function does NOT enforce the "one task per player per Sol" rule — that
 * is the responsibility of the caller (e.g. missionEngine or UI layer).
 *
 * @param {import('../types/game.js').Mission} mission  - Current mission state.
 * @param {string}                             playerId - ID of the player attempting the task.
 * @returns {{
 *   success:          boolean,
 *   updatedResources: import('../types/game.js').Resources,
 *   taskRecord:       import('../missionHistory.js').TaskRecord | null,
 *   reason:           string
 * }}
 */
export function executeTask(mission, playerId) {
  // Validation 1: player must exist
  const player = Array.isArray(mission.players)
    ? mission.players.find(p => p.id === playerId)
    : null;

  if (!player) {
    return {
      success:          false,
      updatedResources: mission.resources,
      taskRecord:       null,
      reason:           `Player '${playerId}' not found in mission.`,
    };
  }

  // Validation 2: player must be active
  if (player.playerState !== 'active') {
    return {
      success:          false,
      updatedResources: mission.resources,
      taskRecord:       null,
      reason:           `Player '${player.name}' is not active (current state: '${player.playerState}').`,
    };
  }

  // Validation 3: role must have a task
  const task = getTaskForRole(player.role);
  if (!task) {
    return {
      success:          false,
      updatedResources: mission.resources,
      taskRecord:       null,
      reason:           `Role '${player.role}' has no maintenance task available.`,
    };
  }

  // Apply reward delta — clamped to valid ranges via clampResources()
  const src = mission.resources;
  const r   = task.reward;
  const updatedResources = clampResources({
    oxygen:    (src.oxygen    ?? 100) + (r.oxygen    ?? 0),
    power:     (src.power     ?? 100) + (r.power     ?? 0),
    food:      (src.food      ?? 100) + (r.food      ?? 0),
    radiation: (src.radiation ?? 0)   + (r.radiation ?? 0),
  });

  // Build task record for history
  const taskRecord = {
    taskId:   task.taskId,
    playerId: player.id,
    role:     player.role,
    reward:   { ...r },
    sol:      mission.round,
  };

  return {
    success: true,
    updatedResources,
    taskRecord,
    reason: `'${task.name}' completed successfully by ${player.name} (${player.role}).`,
  };
}
