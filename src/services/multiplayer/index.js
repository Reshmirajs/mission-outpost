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
 *   Host player attributes (name, role, etc.). Defaults to role 'Commander'.
 * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
 *
 * @example
 * const { roomCode, mission, player } = await createRoom({ name: 'Alex', role: 'Commander' });
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
 * const { mission, player } = await joinRoom('OUTPST', { name: 'Sam', role: 'Engineer' });
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
