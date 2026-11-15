/**
 * MISSION: OUTPOST - Mission History
 * NASA Space Apps Challenge 2026
 *
 * Pure functions for creating per-Sol snapshots, assembling SolRecord entries,
 * and appending them to the mission history log.
 *
 * Independent of React, Firebase, task logic, and player state management.
 * Uses only createResources() and createMission() from src/types/game.js.
 */

import { createResources, createMission } from '../types/game.js';

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Creates a deep-safe snapshot copy of a Resources object for archival.
 * Uses `createResources()` from game.js to ensure a consistent structure.
 * Invalid or missing fields fall back to safe defaults via createResources().
 *
 * @param {import('../types/game.js').Resources} resources - Resource levels to snapshot.
 * @returns {import('../types/game.js').Resources} A new, independent Resources copy.
 */
export function createResourceSnapshot(resources) {
  const src = (resources !== null && typeof resources === 'object') ? resources : {};
  return createResources({
    oxygen:    src.oxygen,
    power:     src.power,
    food:      src.food,
    radiation: src.radiation,
  });
}

/**
 * Factory for a TaskRecord object with safe defaults.
 *
 * A TaskRecord documents a single task execution by one crew member during one Sol.
 *
 * @typedef {Object} TaskRecord
 * @property {string} taskId   - Unique task identifier (e.g. 'task_engineer_repair_power_grid').
 * @property {string} playerId - ID of the player who performed the task.
 * @property {string} role     - The role that executed the task.
 * @property {Object} reward   - Resource delta actually applied (partial Resources-shaped object).
 * @property {number} sol      - The Sol on which the task was performed.
 *
 * @param {Partial<TaskRecord>} [overrides={}]
 * @returns {TaskRecord}
 */
export function createTaskRecord(overrides = {}) {
  return {
    taskId:   (typeof overrides.taskId   === 'string' && overrides.taskId)   ? overrides.taskId   : '',
    playerId: (typeof overrides.playerId === 'string' && overrides.playerId) ? overrides.playerId : '',
    role:     (typeof overrides.role     === 'string' && overrides.role)     ? overrides.role     : '',
    reward:   (overrides.reward !== null && typeof overrides.reward === 'object') ? { ...overrides.reward } : {},
    sol:      (typeof overrides.sol === 'number' && isFinite(overrides.sol)) ? overrides.sol      : 0,
  };
}

/**
 * Assembles one complete SolRecord documenting what happened during a finished Sol.
 *
 * @typedef {Object} SolRecord
 * @property {number}       sol                - The Sol number this record covers.
 * @property {Object}       resourceSnapshot   - Resource levels at the END of this Sol.
 * @property {TaskRecord[]} tasksCompleted     - Tasks completed during this Sol.
 * @property {string[]}     emergenciesApplied - IDs of emergency events applied during this Sol.
 * @property {Object}       assignedTasks      - Map of playerId → taskId that was assigned for this Sol.
 *
 * @param {number}       sol                - Sol number being recorded.
 * @param {import('../types/game.js').Resources} resources - End-of-Sol resource state.
 * @param {TaskRecord[]} [tasksCompleted=[]]     - Task records from this Sol.
 * @param {string[]}     [emergenciesApplied=[]] - Emergency event IDs from this Sol.
 * @param {Object}       [assignedTasks={}]      - Map of playerId → taskId that was assigned for this Sol.
 * @returns {SolRecord}
 */
export function createSolRecord(sol, resources, tasksCompleted = [], emergenciesApplied = [], assignedTasks = {}) {
  return {
    sol:                (typeof sol === 'number' && isFinite(sol)) ? sol : 0,
    resourceSnapshot:   createResourceSnapshot(resources),
    tasksCompleted:     Array.isArray(tasksCompleted)     ? [...tasksCompleted]     : [],
    emergenciesApplied: Array.isArray(emergenciesApplied) ? [...emergenciesApplied] : [],
    assignedTasks:      (assignedTasks !== null && typeof assignedTasks === 'object')
      ? { ...assignedTasks } : {},
  };
}

/**
 * Appends a SolRecord to the mission history and returns a new Mission object.
 * History grows by one entry per Sol — unbounded (20-Sol cap is enforced by
 * GAME_CONFIG.DEFAULT_MISSION_LENGTH, not by this function).
 * Never mutates the input mission.
 *
 * @param {import('../types/game.js').Mission} mission   - Current mission state.
 * @param {SolRecord}                          solRecord - The record to append.
 * @returns {import('../types/game.js').Mission} New mission with the record appended.
 */
export function appendSolRecord(mission, solRecord) {
  const existing = Array.isArray(mission.history) ? mission.history : [];
  return createMission({
    ...mission,
    history: [...existing, solRecord],
  });
}

/**
 * Returns a shallow copy of the mission history array, safe for display or inspection.
 * Does not expose the internal array reference.
 *
 * @param {import('../types/game.js').Mission} mission - Current mission state.
 * @returns {SolRecord[]}
 */
export function getMissionHistory(mission) {
  return Array.isArray(mission.history) ? [...mission.history] : [];
}
