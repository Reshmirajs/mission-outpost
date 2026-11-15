/**
 * MISSION: OUTPOST - Task Manager
 * NASA Space Apps Challenge 2026
 *
 * Defines role-based maintenance tasks, randomly assigns them per Sol,
 * validates assigned task execution, and applies resource rewards.
 *
 * Uses PlayerRoles and createMission from src/types/game.js, and
 * clampResources from resourceManager.js.
 * Independent of React, Firebase, emergency events, and player state transitions.
 *
 * All task reward values are GAME SIMULATION values chosen for playability.
 * They are NOT real astronaut operational procedures or NASA mission parameters.
 */

import { PlayerRoles, createMission } from '../types/game.js';
import { clampResources }              from './resourceManager.js';

// ─── GAME SIMULATION task definitions ────────────────────────────────────────

/**
 * Complete flat list of all maintenance tasks available in the game.
 * Each role has two tasks to give the random assignment system variety.
 *
 * Order matters: the FIRST task for each role matches the original single-task
 * definitions — this preserves backward compatibility for `ROLE_TASKS` and
 * `executeTask()`.
 *
 * Task shape:
 *   taskId:      string  — unique identifier
 *   name:        string  — human-readable label
 *   description: string  — flavour text shown to the player
 *   role:        string  — the PlayerRoles value eligible to perform this task
 *   reward:      object  — partial Resources delta (positive = restore, negative = reduce)
 *
 * GAME SIMULATION reward values — not real life-support or operational figures.
 *
 * | Role        | Task                       | Reward                      |
 * |-------------|----------------------------|-----------------------------|
 * | Commander   | Coordinate Systems Check   | +oxygen: 3, +power: 2       |
 * | Commander   | Crew Morale Briefing        | +food: 2, +oxygen: 2        |
 * | Engineer    | Repair Power Grid          | +power: 8                   |
 * | Engineer    | Inspect Life Support       | +power: 4, +oxygen: 3       |
 * | Botanist    | Tend Greenhouse            | +food: 8                    |
 * | Botanist    | Soil Analysis              | +food: 5, +oxygen: 2        |
 * | Medic       | Radiation Treatment        | −radiation: 6               |
 * | Medic       | Crew Health Check          | −radiation: 3, +oxygen: 2   |
 * | Scientist   | Atmospheric Analysis       | +oxygen: 5                  |
 * | Scientist   | Weather Monitoring         | +oxygen: 3, −radiation: 2   |
 *
 * @type {ReadonlyArray<{taskId:string, name:string, description:string, role:string, reward:Object}>}
 */
export const ALL_TASKS = Object.freeze([

  // ── Commander ──────────────────────────────────────────────────────────────
  Object.freeze({
    taskId:      'task_commander_coordinate_systems_check',
    name:        'Coordinate Systems Check',
    description: 'Align navigation arrays and cross-check life support telemetry across all outpost modules.',
    role:        PlayerRoles.COMMANDER,
    reward:      Object.freeze({ oxygen: 3, power: 2 }),
  }),
  Object.freeze({
    taskId:      'task_commander_crew_morale_briefing',
    name:        'Crew Morale Briefing',
    description: 'Lead a focused briefing to boost crew cohesion and ration allocation efficiency.',
    role:        PlayerRoles.COMMANDER,
    reward:      Object.freeze({ food: 2, oxygen: 2 }),
  }),

  // ── Engineer ───────────────────────────────────────────────────────────────
  Object.freeze({
    taskId:      'task_engineer_repair_power_grid',
    name:        'Repair Power Grid',
    description: 'Patch and reinforce the main reactor power distribution grid and reroute surge protectors.',
    role:        PlayerRoles.ENGINEER,
    reward:      Object.freeze({ power: 8 }),
  }),
  Object.freeze({
    taskId:      'task_engineer_inspect_life_support',
    name:        'Inspect Life Support',
    description: 'Run full diagnostics and patch micro-leaks in the outpost life support pipeline.',
    role:        PlayerRoles.ENGINEER,
    reward:      Object.freeze({ power: 4, oxygen: 3 }),
  }),

  // ── Botanist ───────────────────────────────────────────────────────────────
  Object.freeze({
    taskId:      'task_botanist_tend_greenhouse',
    name:        'Tend Greenhouse',
    description: 'Water, prune, and harvest the hydroponic food cultivation bay for maximum yield.',
    role:        PlayerRoles.BOTANIST,
    reward:      Object.freeze({ food: 8 }),
  }),
  Object.freeze({
    taskId:      'task_botanist_soil_analysis',
    name:        'Soil Analysis',
    description: 'Analyse regolith and culture medium samples to optimise oxygen-producing plant growth.',
    role:        PlayerRoles.BOTANIST,
    reward:      Object.freeze({ food: 5, oxygen: 2 }),
  }),

  // ── Medic ──────────────────────────────────────────────────────────────────
  Object.freeze({
    taskId:      'task_medic_radiation_treatment',
    name:        'Radiation Treatment',
    description: 'Administer anti-radiation medication and flush accumulated cellular damage in the crew.',
    role:        PlayerRoles.MEDIC,
    reward:      Object.freeze({ radiation: -6 }),
  }),
  Object.freeze({
    taskId:      'task_medic_crew_health_check',
    name:        'Crew Health Check',
    description: 'Run comprehensive health scans and address oxidative stress to restore crew vitality.',
    role:        PlayerRoles.MEDIC,
    reward:      Object.freeze({ radiation: -3, oxygen: 2 }),
  }),

  // ── Scientist ──────────────────────────────────────────────────────────────
  Object.freeze({
    taskId:      'task_scientist_atmospheric_analysis',
    name:        'Atmospheric Analysis',
    description: 'Measure trace gas ratios across all sealed compartments and recalibrate O2 scrubbers.',
    role:        PlayerRoles.SCIENTIST,
    reward:      Object.freeze({ oxygen: 5 }),
  }),
  Object.freeze({
    taskId:      'task_scientist_weather_monitoring',
    name:        'Weather Monitoring',
    description: 'Track solar wind and dust storm patterns to forecast and mitigate radiation exposure.',
    role:        PlayerRoles.SCIENTIST,
    reward:      Object.freeze({ oxygen: 3, radiation: -2 }),
  }),

]);

/**
 * Maps each PlayerRole to its PRIMARY (first-listed) task.
 * Derived from `ALL_TASKS` so the two data sources stay in sync.
 * Preserved for backward compatibility — `getTaskForRole()` and `executeTask()`
 * continue to behave exactly as before this update.
 * Unassigned players have no entry (key intentionally absent).
 *
 * @type {Readonly<Record<string, Object>>}
 */
export const ROLE_TASKS = Object.freeze(
  Object.fromEntries(
    [
      PlayerRoles.COMMANDER,
      PlayerRoles.ENGINEER,
      PlayerRoles.BOTANIST,
      PlayerRoles.MEDIC,
      PlayerRoles.SCIENTIST,
    ].map(role => [role, ALL_TASKS.find(t => t.role === role)])
  )
);

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Returns the PRIMARY task definition for a given role, or `null` if the role
 * has no tasks. Returns `null` for `Unassigned` and any unrecognised roles.
 * Backward-compatible with the original single-task-per-role API.
 *
 * @param {string} role - A PlayerRoles value.
 * @returns {Object|null}
 */
export function getTaskForRole(role) {
  return ROLE_TASKS[role] || null;
}

/**
 * Returns ALL task definitions eligible for a given role as an array.
 * Returns an empty array for `Unassigned` or any unrecognised role.
 *
 * @param {string} role - A PlayerRoles value.
 * @returns {Object[]}
 */
export function getTasksForRole(role) {
  return ALL_TASKS.filter(t => t.role === role);
}

/**
 * Returns a task definition by its unique `taskId`, or `null` if not found.
 *
 * @param {string} taskId
 * @returns {Object|null}
 */
export function getTaskById(taskId) {
  return ALL_TASKS.find(t => t.taskId === taskId) || null;
}

// ─── Random assignment ────────────────────────────────────────────────────────

/**
 * Randomly assigns one task per active crew member for the upcoming Sol.
 * Uses each player's role to select from their eligible task pool.
 *
 * Assignment strategy:
 *   1. For each active player, prefer tasks NOT yet assigned to another crew
 *      member this Sol (avoid cross-player task duplicates where possible).
 *   2. If every task for a role is already taken, fall back to any task for
 *      that role (graceful degradation — always assigns something).
 *   3. Players with no eligible tasks (Unassigned or unknown role) are skipped.
 *
 * The `randomFn` parameter accepts any `() => number` returning a value in [0, 1).
 * Pass a seeded or deterministic function to make assignments reproducible in tests.
 *
 * @param {import('../types/game.js').Player[]} activePlayers - Active crew members.
 * @param {function(): number} [randomFn=Math.random] - Injectable RNG for testability.
 * @returns {Record<string, string>} Map of `{ [playerId]: taskId }`.
 */
export function assignTasksForSol(activePlayers, randomFn = Math.random) {
  if (!Array.isArray(activePlayers) || activePlayers.length === 0) return {};

  const usedTaskIds = new Set();
  const assignments = {};
  const safeFn      = typeof randomFn === 'function' ? randomFn : Math.random;

  for (const player of activePlayers) {
    const roleTasks = getTasksForRole(player.role);
    if (roleTasks.length === 0) continue; // Unassigned or unknown role — no task

    // Prefer tasks not already assigned to another crew member this Sol
    const unusedTasks = roleTasks.filter(t => !usedTaskIds.has(t.taskId));
    const pool        = unusedTasks.length > 0 ? unusedTasks : roleTasks; // graceful fallback

    const picked = pool[Math.floor(safeFn() * pool.length)];
    assignments[player.id] = picked.taskId;
    usedTaskIds.add(picked.taskId);
  }

  return assignments;
}

// ─── Task execution ───────────────────────────────────────────────────────────

/**
 * Validates and executes the task ASSIGNED to a specific player for the current Sol.
 * This is the primary function for the random-assignment task system.
 *
 * Validation rules (all must pass):
 *   1. The player must exist in `mission.players`.
 *   2. The player's `playerState` must be `'active'`.
 *      Trapped, rescued, and eliminated players cannot complete tasks.
 *   3. A task must be assigned to this player in `mission.currentSolAssignments`.
 *   4. The assigned task must NOT already appear in `mission.completedSolTaskIds`
 *      (prevents double-completion of the same task in one Sol).
 *   5. The task definition must exist in `ALL_TASKS`.
 *   6. The task's `role` must match the player's role.
 *
 * On success:
 *   - The reward delta is applied to `mission.resources` and clamped to [0, 100].
 *   - `completedSolTaskIds` on the returned mission is updated with this taskId.
 *   - A TaskRecord is returned for the caller to pass to `missionHistory`.
 *   - `updatedMission` replaces the original for subsequent operations.
 *
 * On failure:
 *   - `updatedMission` is the original mission unchanged.
 *   - `taskRecord` is `null`.
 *   - `reason` explains which validation step rejected the execution.
 *
 * @param {import('../types/game.js').Mission} mission  - Current mission state.
 * @param {string}                             playerId - ID of the player completing their task.
 * @returns {{
 *   success:        boolean,
 *   updatedMission: import('../types/game.js').Mission,
 *   taskRecord:     Object|null,
 *   reason:         string
 * }}
 */
export function executeAssignedTask(mission, playerId) {
  // 1. Player must exist
  const player = Array.isArray(mission.players)
    ? mission.players.find(p => p.id === playerId)
    : null;

  if (!player) {
    return { success: false, updatedMission: mission, taskRecord: null,
      reason: `Player '${playerId}' not found in mission.` };
  }

  // 2. Player must be active
  if (player.playerState !== 'active') {
    return { success: false, updatedMission: mission, taskRecord: null,
      reason: `Player '${player.name}' cannot complete tasks (state: '${player.playerState}').` };
  }

  // 3. Player must have an assignment for this Sol
  const assignments    = (mission.currentSolAssignments && typeof mission.currentSolAssignments === 'object')
    ? mission.currentSolAssignments : {};
  const assignedTaskId = assignments[playerId];

  if (!assignedTaskId) {
    return { success: false, updatedMission: mission, taskRecord: null,
      reason: `No task has been assigned to '${player.name}' for Sol ${mission.round}.` };
  }

  // 4. Task must not already be completed this Sol
  const completed = Array.isArray(mission.completedSolTaskIds) ? mission.completedSolTaskIds : [];
  if (completed.includes(assignedTaskId)) {
    return { success: false, updatedMission: mission, taskRecord: null,
      reason: `Task '${assignedTaskId}' has already been completed this Sol.` };
  }

  // 5. Task definition must exist
  const task = getTaskById(assignedTaskId);
  if (!task) {
    return { success: false, updatedMission: mission, taskRecord: null,
      reason: `Task definition '${assignedTaskId}' not found in ALL_TASKS.` };
  }

  // 6. Task must belong to this player's role
  if (task.role !== player.role) {
    return { success: false, updatedMission: mission, taskRecord: null,
      reason: `Task '${task.name}' is for role '${task.role}', not '${player.role}'.` };
  }

  // Apply reward delta — clamped to [0, 100]
  const src = mission.resources;
  const r   = task.reward;
  const updatedResources = clampResources({
    oxygen:    (src.oxygen    ?? 100) + (r.oxygen    ?? 0),
    power:     (src.power     ?? 100) + (r.power     ?? 0),
    food:      (src.food      ?? 100) + (r.food      ?? 0),
    radiation: (src.radiation ?? 0)   + (r.radiation ?? 0),
  });

  // Update mission: apply reward and mark task complete
  const updatedMission = createMission({
    ...mission,
    resources:           updatedResources,
    completedSolTaskIds: [...completed, assignedTaskId],
  });

  const taskRecord = {
    taskId:   task.taskId,
    playerId: player.id,
    role:     player.role,
    reward:   { ...r },
    sol:      mission.round,
  };

  return {
    success: true,
    updatedMission,
    taskRecord,
    reason: `'${task.name}' completed by ${player.name} (${player.role}).`,
  };
}

/**
 * Validates and executes a maintenance task for a specific player using their
 * PRIMARY role task (the first task listed for their role).
 *
 * Preserved for backward compatibility with Phase 2 code and existing tests.
 * Does NOT enforce assignment checks, Sol-scoped completion tracking, or
 * `completedSolTaskIds`. Use `executeAssignedTask()` for the full assignment system.
 *
 * @param {import('../types/game.js').Mission} mission  - Current mission state.
 * @param {string}                             playerId - ID of the player attempting the task.
 * @returns {{
 *   success:          boolean,
 *   updatedResources: import('../types/game.js').Resources,
 *   taskRecord:       Object|null,
 *   reason:           string
 * }}
 */
export function executeTask(mission, playerId) {
  // Validation 1: player must exist
  const player = Array.isArray(mission.players)
    ? mission.players.find(p => p.id === playerId)
    : null;

  if (!player) {
    return { success: false, updatedResources: mission.resources, taskRecord: null,
      reason: `Player '${playerId}' not found in mission.` };
  }

  // Validation 2: player must be active
  if (player.playerState !== 'active') {
    return { success: false, updatedResources: mission.resources, taskRecord: null,
      reason: `Player '${player.name}' is not active (current state: '${player.playerState}').` };
  }

  // Validation 3: role must have a primary task
  const task = getTaskForRole(player.role);
  if (!task) {
    return { success: false, updatedResources: mission.resources, taskRecord: null,
      reason: `Role '${player.role}' has no maintenance task available.` };
  }

  // Apply reward delta — clamped to valid ranges
  const src = mission.resources;
  const r   = task.reward;
  const updatedResources = clampResources({
    oxygen:    (src.oxygen    ?? 100) + (r.oxygen    ?? 0),
    power:     (src.power     ?? 100) + (r.power     ?? 0),
    food:      (src.food      ?? 100) + (r.food      ?? 0),
    radiation: (src.radiation ?? 0)   + (r.radiation ?? 0),
  });

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
