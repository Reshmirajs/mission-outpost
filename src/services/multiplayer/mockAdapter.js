/**
 * MISSION: OUTPOST - Local Mock / Fallback Multiplayer Adapter
 * NASA Space Apps Challenge 2026
 *
 * Provides a local in-memory & BroadcastChannel-synced multiplayer adapter
 * for development and testing when live Firebase credentials are not yet configured.
 *
 * Real-time tab sync is powered by the browser's BroadcastChannel API,
 * allowing two or more browser tabs on localhost to interact as crew members.
 */

import {
  createMission,
  createPlayer,
  MissionStatus,
} from '../../types/game.js';
import { MultiplayerError, MultiplayerErrorCode } from './errors.js';
import { assertValidRoomCode, generateRoomCode } from './roomCode.js';

const STORAGE_PREFIX = 'mission_outpost_mock_room_';
const CHANNEL_NAME = 'mission_outpost_mock_sync';

// In-memory cache for fast access and non-browser test runners
const roomsMemoryStore = new Map();

// Active subscription listeners: roomCode -> Set of callbacks
const roomListeners = new Map();

// Setup BroadcastChannel for cross-tab communication if supported in environment
let broadcastChannel = null;
if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
  try {
    broadcastChannel = new window.BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      const { type, roomCode, mission } = event.data || {};
      if (type === 'ROOM_UPDATED' && roomCode && mission) {
        roomsMemoryStore.set(roomCode, mission);
        notifyListeners(roomCode, mission);
      } else if (type === 'ROOM_DELETED' && roomCode) {
        roomsMemoryStore.delete(roomCode);
        notifyListeners(roomCode, null);
      }
    };
  } catch (err) {
    console.warn('[Multiplayer:Mock] BroadcastChannel not supported; falling back to memory-only sync.', err);
  }
}

function notifyListeners(roomCode, mission) {
  const callbacks = roomListeners.get(roomCode);
  if (callbacks) {
    callbacks.forEach((cb) => {
      try {
        cb(mission ? JSON.parse(JSON.stringify(mission)) : null);
      } catch (err) {
        console.error('[Multiplayer:Mock] Error in subscriber callback:', err);
      }
    });
  }
}

function broadcastUpdate(roomCode, mission) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: mission ? 'ROOM_UPDATED' : 'ROOM_DELETED',
        roomCode,
        mission,
      });
    } catch {
      // Ignore serialization issues
    }
  }
}

function persistRoom(roomCode, mission) {
  if (mission) {
    roomsMemoryStore.set(roomCode, mission);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`${STORAGE_PREFIX}${roomCode}`, JSON.stringify(mission));
      } catch {
        // Ignore quota limits
      }
    }
  } else {
    roomsMemoryStore.delete(roomCode);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(`${STORAGE_PREFIX}${roomCode}`);
      } catch {
        // Ignore
      }
    }
  }
  notifyListeners(roomCode, mission);
  broadcastUpdate(roomCode, mission);
}

function loadRoom(roomCode) {
  if (roomsMemoryStore.has(roomCode)) {
    return roomsMemoryStore.get(roomCode);
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${roomCode}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        roomsMemoryStore.set(roomCode, parsed);
        return parsed;
      }
    } catch {
      // Corrupt storage
    }
  }
  return null;
}

/**
 * Creates a unique mock player ID if none provided.
 */
function ensurePlayerId(player) {
  if (player?.id) return player.id;
  return `mock_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Mock Multiplayer Adapter implementation.
 */
export const mockAdapter = {
  mode: 'mock',

  /**
   * Creates a new multiplayer room.
   *
   * @param {Partial<import('../../types/game.js').Player>} hostPlayer
   * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
   */
  async createRoom(hostPlayer = {}) {
    console.info('[Multiplayer:Mock] Creating room in MOCK mode (local storage + tab sync).');

    // Generate unique 6-character room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (loadRoom(roomCode) && attempts < 10) {
      roomCode = generateRoomCode();
      attempts++;
    }

    const playerId = ensurePlayerId(hostPlayer);
    const player = createPlayer({
      ...hostPlayer,
      id: playerId,
      name: hostPlayer.name || 'Mission Commander',
      ready: hostPlayer.ready ?? false,
    });

    const mission = createMission({
      roomCode,
      players: [player],
      status: MissionStatus.LOBBY,
      round: 1,
      votes: {},
    });

    persistRoom(roomCode, mission);
    return { roomCode, mission, player };
  },

  /**
   * Joins an existing room by its 6-character room code.
   *
   * @param {string} roomCodeInput
   * @param {Partial<import('../../types/game.js').Player>} playerInput
   * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
   */
  async joinRoom(roomCodeInput, playerInput = {}) {
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = loadRoom(roomCode);

    if (!mission) {
      throw new MultiplayerError(
        MultiplayerErrorCode.ROOM_NOT_FOUND,
        `Outpost mission with room code "${roomCode}" was not found.`
      );
    }

    if (mission.status !== MissionStatus.LOBBY) {
      throw new MultiplayerError(
        MultiplayerErrorCode.GAME_ALREADY_STARTED,
        `Cannot join Outpost "${roomCode}" because the mission is already ${mission.status}.`
      );
    }

    const playerId = ensurePlayerId(playerInput);
    const existingIndex = mission.players.findIndex((p) => p.id === playerId);

    let player;
    if (existingIndex >= 0) {
      // Re-joining with existing ID: update details
      mission.players[existingIndex] = createPlayer({
        ...mission.players[existingIndex],
        ...playerInput,
        id: playerId,
      });
      player = mission.players[existingIndex];
    } else {
      player = createPlayer({
        ...playerInput,
        id: playerId,
        name: playerInput.name || `Astronaut #${mission.players.length + 1}`,
      });
      mission.players.push(player);
    }

    persistRoom(roomCode, mission);
    return { roomCode, mission, player };
  },

  /**
   * Fetches the current state of a room once.
   *
   * @param {string} roomCodeInput
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async getRoom(roomCodeInput) {
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = loadRoom(roomCode);
    if (!mission) {
      throw new MultiplayerError(
        MultiplayerErrorCode.ROOM_NOT_FOUND,
        `Outpost mission with room code "${roomCode}" was not found.`
      );
    }
    return JSON.parse(JSON.stringify(mission));
  },

  /**
   * Subscribes to real-time mission updates.
   *
   * @param {string} roomCodeInput - 6-character room code.
   * @param {(mission: import('../../types/game.js').Mission) => void} onUpdate - Callback on change.
   * @param {(error: MultiplayerError) => void} [onError] - Callback on error.
   * @returns {() => void} Unsubscribe cleanup function.
   */
  subscribeToRoom(roomCodeInput, onUpdate, onError) {
    let roomCode;
    try {
      roomCode = assertValidRoomCode(roomCodeInput);
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }

    if (!roomListeners.has(roomCode)) {
      roomListeners.set(roomCode, new Set());
    }
    const listeners = roomListeners.get(roomCode);

    const wrappedCallback = (mission) => {
      if (!mission) {
        if (onError) {
          onError(
            new MultiplayerError(
              MultiplayerErrorCode.ROOM_NOT_FOUND,
              `Room "${roomCode}" has been closed or removed.`
            )
          );
        }
      } else {
        onUpdate(mission);
      }
    };

    listeners.add(wrappedCallback);

    // Initial dispatch of current state (asynchronously to simulate real network)
    setTimeout(() => {
      const current = loadRoom(roomCode);
      if (current) {
        wrappedCallback(current);
      } else if (onError) {
        onError(
          new MultiplayerError(
            MultiplayerErrorCode.ROOM_NOT_FOUND,
            `Outpost mission with room code "${roomCode}" was not found.`
          )
        );
      }
    }, 10);

    // Return cleanup function
    return () => {
      const set = roomListeners.get(roomCode);
      if (set) {
        set.delete(wrappedCallback);
        if (set.size === 0) {
          roomListeners.delete(roomCode);
        }
      }
    };
  },

  /**
   * Updates player details (e.g. role, readiness, display name).
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @param {Partial<import('../../types/game.js').Player>} updates
   * @returns {Promise<import('../../types/game.js').Mission>} Updated mission.
   */
  async updatePlayer(roomCodeInput, playerId, updates = {}) {
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = loadRoom(roomCode);

    if (!mission) {
      throw new MultiplayerError(
        MultiplayerErrorCode.ROOM_NOT_FOUND,
        `Outpost mission with room code "${roomCode}" was not found.`
      );
    }

    const playerIndex = mission.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      throw new MultiplayerError(
        MultiplayerErrorCode.PLAYER_NOT_FOUND,
        `Player "${playerId}" not found in Outpost mission "${roomCode}".`
      );
    }

    mission.players[playerIndex] = {
      ...mission.players[playerIndex],
      ...updates,
      id: playerId, // prevent id overwrite
    };

    persistRoom(roomCode, mission);
    return JSON.parse(JSON.stringify(mission));
  },

  /**
   * Submits a vote for a decision or emergency event.
   *
   * @param {string} roomCodeInput - 6-character room code.
   * @param {{ voteId: string, playerId: string, choice: any, [key: string]: any }} voteData
   * @returns {Promise<import('../../types/game.js').Mission>} Updated mission.
   */
  async submitVote(roomCodeInput, voteData = {}) {
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = loadRoom(roomCode);

    if (!mission) {
      throw new MultiplayerError(
        MultiplayerErrorCode.ROOM_NOT_FOUND,
        `Outpost mission with room code "${roomCode}" was not found.`
      );
    }

    const { voteId, playerId, choice } = voteData;
    if (!voteId || !playerId) {
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        'submitVote requires both "voteId" and "playerId".'
      );
    }

    if (!mission.votes) {
      mission.votes = {};
    }
    if (!mission.votes[voteId]) {
      mission.votes[voteId] = {};
    }

    mission.votes[voteId][playerId] = {
      choice,
      timestamp: Date.now(),
      ...voteData,
    };

    persistRoom(roomCode, mission);
    return JSON.parse(JSON.stringify(mission));
  },

  /**
   * Removes a player from the room.
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @returns {Promise<{ remainingPlayers: number }>}
   */
  async leaveRoom(roomCodeInput, playerId) {
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = loadRoom(roomCode);

    if (!mission) {
      return { remainingPlayers: 0 };
    }

    mission.players = mission.players.filter((p) => p.id !== playerId);

    if (mission.players.length === 0) {
      // Room is empty, clean it up
      persistRoom(roomCode, null);
      return { remainingPlayers: 0 };
    }

    persistRoom(roomCode, mission);
    return { remainingPlayers: mission.players.length };
  },

  /**
   * Clears all mock rooms in memory/storage (useful for unit tests).
   */
  resetStore() {
    roomsMemoryStore.clear();
    roomListeners.clear();
  },
};
