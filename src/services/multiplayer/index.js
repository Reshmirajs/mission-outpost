/**
 * MISSION: OUTPOST - Multiplayer Service (Person 5 Module)
 * NASA Space Apps Challenge 2026
 *
 * Unified multiplayer service interface connecting the application (Lobby, Voting,
 * Dashboard) to real-time room state. Automatically chooses between Firebase
 * Realtime Database and the local Mock Adapter based on environment configuration.
 *
 * @module services/multiplayer
 */

import { isFirebaseConfigured, getFirebaseStatus } from '../../firebase/index.js';
import { PlayerRoles } from '../../types/game.js';
import { normalizeMissionConfiguration } from '../../game/missionConfiguration.js';
import { firebaseAdapter } from './firebaseAdapter.js';
import { mockAdapter } from './mockAdapter.js';
import { MultiplayerError, MultiplayerErrorCode } from './errors.js';
import {
  generateRoomCode,
  normalizeRoomCode,
  isValidRoomCode,
  assertValidRoomCode,
  ROOM_CODE_LENGTH,
} from './roomCode.js';

export {
  MultiplayerError,
  MultiplayerErrorCode,
  generateRoomCode,
  normalizeRoomCode,
  isValidRoomCode,
  assertValidRoomCode,
  ROOM_CODE_LENGTH,
};

export {
  SESSION_KEY,
  saveSession,
  loadSession,
  clearSession,
} from './session.js';

let manualAdapterOverride = null; // 'firebase' | 'mock' | null

/**
 * Determines and returns the active multiplayer adapter.
 *
 * @returns {typeof firebaseAdapter | typeof mockAdapter}
 */
export function getActiveAdapter() {
  if (manualAdapterOverride === 'firebase') {
    return firebaseAdapter;
  }
  if (manualAdapterOverride === 'mock') {
    return mockAdapter;
  }

  if (isFirebaseConfigured()) {
    return firebaseAdapter;
  }

  return mockAdapter;
}

/**
 * Returns the active adapter mode ('firebase' or 'mock').
 *
 * @returns {'firebase'|'mock'}
 */
export function getActiveAdapterMode() {
  return getActiveAdapter().mode;
}

/**
 * Explicitly sets the multiplayer adapter mode. Useful for testing or toggling.
 *
 * @param {'auto'|'firebase'|'mock'} mode
 */
export function setAdapterMode(mode) {
  if (mode === 'auto') {
    manualAdapterOverride = null;
  } else if (mode === 'firebase' || mode === 'mock') {
    manualAdapterOverride = mode;
  } else {
    throw new MultiplayerError(
      MultiplayerErrorCode.INVALID_PAYLOAD,
      `Invalid adapter mode "${mode}". Must be "auto", "firebase", or "mock".`
    );
  }
}

/**
 * Returns complete multiplayer connection and adapter status.
 *
 * @returns {{ mode: 'firebase'|'mock', isLive: boolean, firebaseConfigured: boolean, details: any }}
 */
export function getMultiplayerStatus() {
  const adapter = getActiveAdapter();
  const fbStatus = getFirebaseStatus();
  return {
    mode: adapter.mode,
    isLive: adapter.mode === 'firebase' && fbStatus.configured,
    firebaseConfigured: fbStatus.configured,
    details: fbStatus,
  };
}

// Log status on module load
const currentStatus = getMultiplayerStatus();
if (!currentStatus.isLive) {
  console.info(
    '[Multiplayer Service] Running in MOCK / LOCAL FALLBACK mode. Real-time updates use BroadcastChannel across local tabs. Set up .env.local with VITE_FIREBASE_* variables to enable live Firebase Realtime Database sync.'
  );
} else {
  console.info('[Multiplayer Service] Running in LIVE FIREBASE Realtime Database mode.');
}

// ============================================================================
// PUBLIC SERVICE API
// ============================================================================

/**
 * Creates a new Outpost room with a 6-character room code and registers the host player.
 *
 * @param {Partial<import('../../types/game.js').Player>} [hostPlayer={}]
 *   Host player attributes (name, role, etc.). Defaults to role 'Mission Commander'.
 * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
 *
 * @example
 * const { roomCode, mission, player } = await createRoom({ name: 'Alex', role: 'Mission Commander' });
 * console.log('Created room:', roomCode);
 */
export async function createRoom(hostPlayer = {}) {
  const adapter = getActiveAdapter();
  return adapter.createRoom(hostPlayer);
}

/**
 * Joins an existing Outpost room using its 6-character room code.
 *
 * @param {string} roomCode - 6-character room code (case-insensitive).
 * @param {Partial<import('../../types/game.js').Player>} [player={}] - Joining player info.
 * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
 *
 * @example
 * const { mission, player } = await joinRoom('OUTPST', { name: 'Sam', role: 'Power Engineer' });
 */
export async function joinRoom(roomCode, player = {}) {
  const adapter = getActiveAdapter();
  return adapter.joinRoom(roomCode, player);
}

/**
 * Fetches the current state of a room once.
 *
 * @param {string} roomCode - 6-character room code.
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function getRoom(roomCode) {
  const adapter = getActiveAdapter();
  return adapter.getRoom(roomCode);
}

/**
 * Subscribes to real-time room and mission updates.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {(mission: import('../../types/game.js').Mission) => void} onUpdate - Callback fired on mission state update.
 * @param {(error: MultiplayerError) => void} [onError] - Callback fired on connection/parsing errors.
 * @returns {() => void} Unsubscribe cleanup function. Call this in useEffect cleanup or on component unmount.
 *
 * @example
 * useEffect(() => {
 *   const unsubscribe = subscribeToRoom(roomCode, (mission) => {
 *     setMissionState(mission);
 *   }, (err) => {
 *     console.error('Subscription error:', err);
 *   });
 *   return () => unsubscribe();
 * }, [roomCode]);
 */
export function subscribeToRoom(roomCode, onUpdate, onError) {
  const adapter = getActiveAdapter();
  return adapter.subscribeToRoom(roomCode, onUpdate, onError);
}

/**
 * Updates player details (e.g. role specialization, display name, readiness).
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Player unique ID.
 * @param {Partial<import('../../types/game.js').Player>} updates - Properties to update.
 * @returns {Promise<import('../../types/game.js').Mission>} Updated mission.
 *
 * @example
 * await updatePlayer('OUTPST', 'crew_123', { role: 'Botanist', ready: true });
 */
export async function updatePlayer(roomCode, playerId, updates = {}) {
  const adapter = getActiveAdapter();
  return adapter.updatePlayer(roomCode, playerId, updates);
}

/**
 * Convenience helper to update a player's readiness in the lobby.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Player unique ID.
 * @param {boolean} ready - Readiness boolean.
 * @returns {Promise<import('../../types/game.js').Mission>} Updated mission.
 */
export async function setPlayerReady(roomCode, playerId, ready) {
  return updatePlayer(roomCode, playerId, { ready: Boolean(ready) });
}

/**
 * Submits a vote for an emergency event, expedition, or crew decision.
 * Supports both object payload and positional arguments.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string|{ voteId: string, playerId: string, choice: any, [key: string]: any }} voteDataOrId
 * @param {string} [playerId] - Optional if passed in payload object.
 * @param {any} [choice] - Optional if passed in payload object.
 * @returns {Promise<import('../../types/game.js').Mission>} Updated mission.
 *
 * @example
 * // Object syntax:
 * await submitVote('OUTPST', { voteId: 'solar_flare_event_1', playerId: 'crew_123', choice: 'SHIELD' });
 *
 * // Positional syntax:
 * await submitVote('OUTPST', 'solar_flare_event_1', 'crew_123', 'SHIELD');
 */
export async function submitVote(roomCode, voteDataOrId, playerId, choice) {
  let payload;
  if (typeof voteDataOrId === 'object' && voteDataOrId !== null) {
    payload = voteDataOrId;
  } else {
    payload = {
      voteId: voteDataOrId,
      playerId,
      choice,
    };
  }

  const adapter = getActiveAdapter();
  return adapter.submitVote(roomCode, payload);
}

/**
 * Leaves a room, removing the player from the active crew list.
 * Cleans up the room automatically if no players remain.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Player unique ID.
 * @returns {Promise<{ remainingPlayers: number }>}
 *
 * @example
 * await leaveRoom('OUTPST', 'crew_123');
 */
export async function leaveRoom(roomCode, playerId) {
  const adapter = getActiveAdapter();
  return adapter.leaveRoom(roomCode, playerId);
}

/**
 * Attempts to reconnect a player to their existing room after an unexpected disconnection.
 * Looks up the room and verifies the player is still in the roster by their unique ID.
 * If the player is found, re-registers their presence and returns the current mission state.
 * If the room or player is not found, throws an error so the UI can prompt manual re-join.
 *
 * @param {string} roomCode - 6-character room code saved before disconnection.
 * @param {string} playerId - Player's Firebase UID (stable across browser sessions).
 * @returns {Promise<{ mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player, wasReconnected: boolean }>}
 *
 * @example
 * const { mission, player } = await reconnectToRoom('OUTPST', 'uid_xyz');
 */
export async function reconnectToRoom(roomCode, playerId) {
  const adapter = getActiveAdapter();
  return adapter.reconnectToRoom(roomCode, playerId);
}

/**
 * Selects or changes an astronaut's specialist role in an Outpost room.
 * Ensures the target role has not already been claimed by another crew member.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Player unique ID.
 * @param {string} targetRole - One of PlayerRoles.
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function selectPlayerRole(roomCode, playerId, targetRole) {
  const adapter = getActiveAdapter();
  return adapter.selectPlayerRole(roomCode, playerId, targetRole);
}

/**
 * Toggles a player's readiness state (ready / standby).
 * Requires an assigned specialist role before becoming ready.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Player unique ID.
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function togglePlayerReady(roomCode, playerId) {
  const adapter = getActiveAdapter();
  return adapter.togglePlayerReady(roomCode, playerId);
}

/**
 * Launches the mission into progress when launch requirements are fulfilled.
 * Only the Expedition Lead (Host) can initiate launch.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} [requestingPlayerId] - Host player ID.
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function startMission(roomCode, requestingPlayerId) {
  const adapter = getActiveAdapter();
  return adapter.startMission(roomCode, requestingPlayerId);
}

/**
 * Updates partial mission state fields in real-time.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {Partial<import('../../types/game.js').Mission>} partialMission
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function updateMission(roomCode, partialMission = {}) {
  const adapter = getActiveAdapter();
  return adapter.updateMission(roomCode, partialMission);
}

/** Save validated mission settings in the shared room before launch. */
export async function updateMissionConfiguration(roomCode, requestingPlayerId, configuration) {
  const mission = await getRoom(roomCode);
  if (!mission) {
    throw new MultiplayerError(
      MultiplayerErrorCode.ROOM_NOT_FOUND,
      `Outpost mission with room code "${roomCode}" was not found.`
    );
  }
  if (requestingPlayerId && mission.hostId && mission.hostId !== requestingPlayerId) {
    throw new MultiplayerError(
      MultiplayerErrorCode.PERMISSION_DENIED,
      'Only the Outpost Expedition Lead (Host) can change mission settings.'
    );
  }

  return updateMission(roomCode, {
    missionConfiguration: normalizeMissionConfiguration(configuration),
  });
}

/**
 * Updates live habitat resources (Oxygen, Power, Food, Radiation) in the shared mission.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {Partial<import('../../types/game.js').Resources>} resources
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function updateMissionResources(roomCode, resources) {
  return updateMission(roomCode, { resources });
}

/**
 * Updates the current Sol round count in the shared mission.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {number} round - Sol cycle count.
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function updateMissionRound(roomCode, round) {
  return updateMission(roomCode, { round });
}

/**
 * Updates the mission operational lifecycle status.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {'lobby'|'in_progress'|'completed'|'failed'} status
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function updateMissionStatus(roomCode, status) {
  return updateMission(roomCode, { status });
}

/**
 * Advances the mission Sol cycle atomically across all connected crew members.
 * Enforces authorization (Host or Commander) and calculates consumption/status transitions.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Requesting astronaut's player ID.
 * @param {{ targetRound?: number }} [options={}] - Optional advancement parameters.
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function advanceSol(roomCode, playerId, options = {}) {
  const adapter = getActiveAdapter();
  return adapter.advanceSol(roomCode, playerId, options);
}

/**
 * Pure helper function to validate launch readiness conditions.
 *
 * @param {import('../../types/game.js').Mission} mission
 * @param {string} [requestingPlayerId]
 * @returns {{ canStart: boolean, reasons: string[] }}
 */
export function checkStartMissionConditions(mission, requestingPlayerId) {
  const reasons = [];

  if (!mission) {
    return { canStart: false, reasons: ['Mission data unavailable.'] };
  }

  if (requestingPlayerId && mission.hostId && mission.hostId !== requestingPlayerId) {
    reasons.push('Only the Outpost Expedition Lead (Host) can initiate launch.');
  }

  if (mission.players.length < 2) {
    reasons.push(`A minimum of 2 astronauts is required for Mars survival (Currently: ${mission.players.length}).`);
  }

  const unassigned = mission.players.filter((p) => !p.role || p.role === PlayerRoles.UNASSIGNED);
  if (unassigned.length > 0) {
    const names = unassigned.map((p) => p.name).join(', ');
    reasons.push(`All astronauts must select a role. Unassigned: ${names}`);
  }

  const notReady = mission.players.filter((p) => !p.ready);
  if (notReady.length > 0) {
    const names = notReady.map((p) => p.name).join(', ');
    reasons.push(`All crew members must report ready. Standby: ${names}`);
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  };
}

// ─── Teammate Compatibility Wrappers (Person 1 Lobby Bridge) ─────────────────

export async function createMockRoom(hostPlayerName) {
  return createRoom({ name: hostPlayerName });
}

export async function joinMockRoom(roomCode, playerName) {
  return joinRoom(roomCode, { name: playerName });
}

export async function leaveMockRoom(roomCode, playerId) {
  const res = await leaveRoom(roomCode, playerId);
  if (res.remainingPlayers === 0) return null;
  return getRoom(roomCode).catch(() => null);
}

const DEMO_ASTRONAUTS = [
  { name: 'Cadet Maya (AI)', role: PlayerRoles.POWER_ENGINEER },
  { name: 'Dr. Alex Vance (AI)', role: PlayerRoles.BOTANIST },
  { name: 'Specialist Tariq (AI)', role: PlayerRoles.LIFE_SUPPORT_OFFICER },
  { name: 'Officer Liam (AI)', role: PlayerRoles.SCIENCE_SAFETY_OFFICER },
  { name: 'Commander Nova (AI)', role: PlayerRoles.MISSION_COMMANDER },
];

/**
 * Adds an automated simulated crew member for single-player testing.
 *
 * @param {string} roomCode
 * @returns {Promise<import('../../types/game.js').Mission>}
 */
export async function addDemoCrewMember(roomCode) {
  const current = await getRoom(roomCode);
  if (current.players.length >= 5) {
    throw new MultiplayerError(
      MultiplayerErrorCode.ROOM_FULL,
      'Outpost airlock is already full (5/5 crew).'
    );
  }

  const claimedRoles = new Set(current.players.map((p) => p.role));
  const candidate = DEMO_ASTRONAUTS.find(
    (d) => !claimedRoles.has(d.role) && !current.players.some((p) => p.name === d.name)
  );

  const roleToAssign = candidate
    ? candidate.role
    : [
        PlayerRoles.POWER_ENGINEER,
        PlayerRoles.BOTANIST,
        PlayerRoles.LIFE_SUPPORT_OFFICER,
        PlayerRoles.SCIENCE_SAFETY_OFFICER,
        PlayerRoles.MISSION_COMMANDER,
      ].find((r) => !claimedRoles.has(r)) || PlayerRoles.UNASSIGNED;

  const name = candidate
    ? candidate.name
    : `Cadet Unit #${current.players.length + 1} (AI)`;

  const { mission } = await joinRoom(roomCode, {
    name,
    role: roleToAssign,
    ready: true,
    isSimulated: true,
  });

  return mission;
}

/**
 * Removes an automated simulated crew member.
 *
 * @param {string} roomCode
 * @param {string} playerId
 * @returns {Promise<import('../../types/game.js').Mission | null>}
 */
export async function removeDemoCrewMember(roomCode, playerId) {
  await leaveRoom(roomCode, playerId);
  return getRoom(roomCode).catch(() => null);
}
