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
 * @property {string} role - Specialization / assigned outpost role (e.g., 'Commander', 'Engineer', 'Botanist', 'Medic', 'Scientist').
 * @property {boolean} ready - Readiness status in lobby or preparation phase.
 */

/**
 * @typedef {Object} Mission
 * @property {string} roomCode - Unique 6-character room code used by players to join the outpost session.
 * @property {Player[]} players - List of active crew members connected to this mission outpost.
 * @property {Resources} resources - Shared base resources tracked throughout the mission.
 * @property {number} round - Current mission round or Sol (Mars solar day) count.
 * @property {'lobby'|'in_progress'|'completed'|'failed'} status - Current lifecycle status of the mission outpost.
 * @property {Record<string, any>} votes - Voting records for emergency events, expeditions, and resource distributions.
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
  COMMANDER: 'Commander',
  ENGINEER: 'Engineer',
  BOTANIST: 'Botanist',
  MEDIC: 'Medic',
  SCIENTIST: 'Scientist',
  UNASSIGNED: 'Unassigned',
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
    roomCode: overrides.roomCode || '',
    players: overrides.players ? [...overrides.players] : [],
    resources: createResources(overrides.resources),
    round: overrides.round ?? 1,
    status: overrides.status || MissionStatus.LOBBY,
    votes: overrides.votes ? { ...overrides.votes } : {},
  };
}
