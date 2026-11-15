/**
 * MISSION: OUTPOST - Shared Game Data Structures
 * NASA Space Apps Challenge 2026
 *
 * This module defines consistent shared data schemas, default states,
 * and factory helpers for the multiplayer Mars survival game.
 */

/**
 * @typedef {Object} Resources
 * @property {number} oxygen - Oxygen level percentage (0 - 100). Essential for crew survival.
 * @property {number} power - Power / Energy reserve level percentage (0 - 100). Powers life support and shields.
 * @property {number} food - Food rations percentage (0 - 100). Sustains crew stamina.
 * @property {number} radiation - Radiation exposure / danger level percentage (0 - 100). Higher values damage crew and base integrity.
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Unique identifier for the player (e.g., Firebase UID or session UUID).
 * @property {string} name - Display name chosen by the player.
 * @property {string} role - Specialization / assigned outpost role ('Mission Commander', 'Power Engineer', 'Botanist', 'Life Support Officer', 'Science & Safety Officer', 'Unassigned').
 * @property {boolean} ready - Readiness status in lobby or preparation phase.
 * @property {'active'|'trapped'|'rescued'|'eliminated'} playerState - Current operational state of this crew member.
 * @property {number|null} rescueDeadline - Sol number by which a trapped player must be rescued. Null when not trapped.
 */

/**
 * @typedef {Object} Mission
 * @property {string} roomCode - Unique 6-character room code used by players to join the outpost session.
 * @property {Player[]} players - List of active crew members connected to this mission outpost.
 * @property {Resources} resources - Shared base resources tracked throughout the mission.
 * @property {number} round - Current mission round or Sol (Mars solar day) count.
 * @property {number} [targetSols] - Configured count of playable Sols.
 * @property {Object} [missionConfiguration] - Host-selected game simulation settings.
 * @property {Object} [solClock] - Absolute start/end timestamps for the current Sol timer.
 * @property {'lobby'|'in_progress'|'completed'|'failed'} status - Current lifecycle status of the mission outpost.
 * @property {Record<string, any>} votes - Voting records for emergency events, expeditions, and resource distributions.
 * @property {Object[]} history - Ordered log of SolRecord entries, one appended per completed Sol.
 * @property {Object} emergencyPenalties - Accumulated emergency resource penalties for the current Sol. Reset to zero at the start of each new Sol.
 * @property {Record<string, string>} currentSolAssignments - Map of playerId → taskId assigned for the current Sol. Reset each Sol.
 * @property {string[]} completedSolTaskIds - Task IDs already completed this Sol. Reset each Sol to prevent duplicates.
 */

/**
 * Mission Status Enumeration
 */
export const MissionStatus = Object.freeze({
  LOBBY: 'lobby',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

/**
 * Available Astronaut Roles
 */
export const PlayerRoles = Object.freeze({
  MISSION_COMMANDER: 'Mission Commander',
  POWER_ENGINEER: 'Power Engineer',
  BOTANIST: 'Botanist',
  LIFE_SUPPORT_OFFICER: 'Life Support Officer',
  SCIENCE_SAFETY_OFFICER: 'Science & Safety Officer',
  UNASSIGNED: 'Unassigned',

  // Backward compatibility aliases
  COMMANDER: 'Mission Commander',
  ENGINEER: 'Power Engineer',
  MEDIC: 'Life Support Officer',
  SCIENTIST: 'Science & Safety Officer',
});

/**
 * Detailed role descriptions, core responsibilities, and game design rationale.
 */
export const ROLE_DETAILS = Object.freeze({
  [PlayerRoles.MISSION_COMMANDER]: Object.freeze({
    title: 'Mission Commander',
    subtitle: 'The team leader',
    desc: 'Coordinates crew decisions, leads mission briefings, helps resolve disagreements, and oversees mission objectives.',
    responsibilities: [
      'Coordinates crew decisions.',
      'Leads mission briefings.',
      'Helps resolve disagreements.',
      'Oversees mission objectives.',
    ],
    why: 'Children understand the concept of a team leader.',
  }),
  [PlayerRoles.POWER_ENGINEER]: Object.freeze({
    title: 'Power Engineer',
    subtitle: 'The electricity expert',
    desc: 'Manages solar power, monitors energy consumption, responds to power failures, and helps decide when to conserve energy.',
    responsibilities: [
      'Manages solar power.',
      'Monitors energy consumption.',
      'Responds to power failures.',
      'Helps decide when to conserve energy.',
    ],
    why: "Directly connects to one of the challenge's major resource trade-offs.",
  }),
  [PlayerRoles.BOTANIST]: Object.freeze({
    title: 'Botanist',
    subtitle: 'The space gardener',
    desc: 'Manages the Mars greenhouse, monitors food production, takes care of crops, and makes decisions about water and growing resources.',
    responsibilities: [
      'Manages the Mars greenhouse.',
      'Monitors food production.',
      'Takes care of crops.',
      'Makes decisions about water and growing resources.',
    ],
    why: 'Food production is specifically mentioned in the challenge. This role makes the game more interesting.',
  }),
  [PlayerRoles.LIFE_SUPPORT_OFFICER]: Object.freeze({
    title: 'Life Support Officer',
    subtitle: 'The survival expert',
    desc: 'Monitors oxygen levels, checks habitat conditions, manages life-support resources, and responds to equipment failures.',
    responsibilities: [
      'Monitors oxygen levels.',
      'Checks habitat conditions.',
      'Manages life-support resources.',
      'Responds to equipment failures.',
    ],
    why: 'Focuses directly on habitat survival and oxygen life-support systems.',
  }),
  [PlayerRoles.SCIENCE_SAFETY_OFFICER]: Object.freeze({
    title: 'Science & Safety Officer',
    subtitle: 'The Mars environment expert',
    desc: 'Monitors radiation alerts, studies solar activity, evaluates environmental hazards, and helps the crew decide when shielding is necessary.',
    responsibilities: [
      'Monitors radiation alerts.',
      'Studies solar activity.',
      'Evaluates environmental hazards.',
      'Helps the crew decide when shielding is necessary.',
    ],
    why: 'Connects NASA space-weather information to actual gameplay decisions.',
  }),
});

/**
 * Default initial resource levels for a new outpost mission.
 * @type {Resources}
 */
export const INITIAL_RESOURCES = Object.freeze({
  oxygen: 100,
  power: 100,
  food: 100,
  radiation: 0,
});

/**
 * Default template for a new player.
 * @type {Player}
 */
export const INITIAL_PLAYER = Object.freeze({
  id: '',
  name: '',
  role: PlayerRoles.UNASSIGNED,
  ready: false,
  playerState: 'active',
  rescueDeadline: null,
});

/**
 * Default template for a new mission outpost session.
 * @type {Mission}
 */
export const INITIAL_MISSION = Object.freeze({
  roomCode: '',
  players: [],
  resources: { ...INITIAL_RESOURCES },
  round: 1,
  status: MissionStatus.LOBBY,
  votes: {},
  history: [],
  emergencyPenalties:    { oxygen: 0, power: 0, food: 0, radiation: 0 },
  currentSolAssignments: {},
  completedSolTaskIds:   [],
});

/**
 * Factory to create a new Player instance with default values.
 * @param {Partial<Player>} [overrides]
 * @returns {Player}
 */
export function createPlayer(overrides = {}) {
  return {
    id: overrides.id || '',
    name: overrides.name || 'Astronaut',
    role: overrides.role || PlayerRoles.UNASSIGNED,
    ready: overrides.ready ?? false,
    playerState: overrides.playerState || 'active',
    rescueDeadline: overrides.rescueDeadline ?? null,
  };
}

/**
 * Factory to create a new Resources instance with default values.
 * @param {Partial<Resources>} [overrides]
 * @returns {Resources}
 */
export function createResources(overrides = {}) {
  return {
    oxygen: overrides.oxygen ?? INITIAL_RESOURCES.oxygen,
    power: overrides.power ?? INITIAL_RESOURCES.power,
    food: overrides.food ?? INITIAL_RESOURCES.food,
    radiation: overrides.radiation ?? INITIAL_RESOURCES.radiation,
  };
}

/**
 * Factory to create a new Mission instance with default values.
 * @param {Partial<Mission>} [overrides]
 * @returns {Mission}
 */
export function createMission(overrides = {}) {
  return {
    ...overrides,
    roomCode: overrides.roomCode || '',
    players: overrides.players ? overrides.players.map(p => createPlayer(p)) : [],
    resources: createResources(overrides.resources),
    round: overrides.round ?? 1,
    status: overrides.status || MissionStatus.LOBBY,
    votes: overrides.votes ? { ...overrides.votes } : {},
    history: overrides.history ? [...overrides.history] : [],
    emergencyPenalties: overrides.emergencyPenalties
      ? { ...overrides.emergencyPenalties }
      : { oxygen: 0, power: 0, food: 0, radiation: 0 },
    currentSolAssignments: overrides.currentSolAssignments
      ? { ...overrides.currentSolAssignments }
      : {},
    completedSolTaskIds: overrides.completedSolTaskIds
      ? [...overrides.completedSolTaskIds]
      : [],
  };
}
