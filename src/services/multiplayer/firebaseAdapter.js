/**
 * MISSION: OUTPOST - Firebase Realtime Database Multiplayer Adapter
 * NASA Space Apps Challenge 2026
 *
 * Implements real-time room synchronization using Firebase Realtime Database.
 * Communicates via standard Realtime Database REST API and Server-Sent Events (SSE)
 * EventSource streaming, providing zero-dependency real-time push synchronization.
 */

import { isFirebaseConfigured, getDatabasePathURL } from '../../firebase/index.js';
import {
  createMission,
  createPlayer,
  MissionStatus,
} from '../../types/game.js';
import { MultiplayerError, MultiplayerErrorCode } from './errors.js';
import { assertValidRoomCode, generateRoomCode } from './roomCode.js';

function checkConfigured() {
  if (!isFirebaseConfigured()) {
    throw new MultiplayerError(
      MultiplayerErrorCode.FIREBASE_NOT_CONFIGURED,
      'Firebase credentials are not configured. Populate .env.local with valid VITE_FIREBASE_* variables or use the mock adapter.'
    );
  }
}

/**
 * Normalizes Firebase RTDB mission data into the standard Mission structure.
 * Handles cases where Firebase stores array indices as object properties.
 */
function normalizeMission(raw) {
  if (!raw) return null;

  let players = [];
  if (Array.isArray(raw.players)) {
    players = raw.players.filter(Boolean).map(createPlayer);
  } else if (raw.players && typeof raw.players === 'object') {
    players = Object.values(raw.players).filter(Boolean).map(createPlayer);
  }

  return createMission({
    ...raw,
    players,
    votes: raw.votes || {},
  });
}

function ensurePlayerId(player) {
  if (player?.id) return player.id;
  return `crew_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Live Firebase Realtime Database Adapter.
 */
export const firebaseAdapter = {
  mode: 'firebase',

  /**
   * Creates a new multiplayer room in Firebase Realtime Database.
   *
   * @param {Partial<import('../../types/game.js').Player>} hostPlayer
   * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
   */
  async createRoom(hostPlayer = {}) {
    checkConfigured();

    const roomCode = generateRoomCode();
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

    const url = getDatabasePathURL(`rooms/${roomCode}`);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mission),
      });

      if (!response.ok) {
        throw new MultiplayerError(
          MultiplayerErrorCode.NETWORK_ERROR,
          `Failed to create room in Firebase Realtime Database (${response.status} ${response.statusText}).`
        );
      }

      const created = await response.json();
      return { roomCode, mission: normalizeMission(created), player };
    } catch (err) {
      if (err instanceof MultiplayerError) throw err;
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Network error while creating Outpost room: ${err.message}`,
        err
      );
    }
  },

  /**
   * Joins an existing room in Firebase Realtime Database.
   *
   * @param {string} roomCodeInput
   * @param {Partial<import('../../types/game.js').Player>} playerInput
   * @returns {Promise<{ roomCode: string, mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }>}
   */
  async joinRoom(roomCodeInput, playerInput = {}) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);

    const mission = await this.getRoom(roomCode);

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

    const url = getDatabasePathURL(`rooms/${roomCode}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to update room in Firebase (${response.status}).`
      );
    }

    return { roomCode, mission, player };
  },

  /**
   * Reads the current room state once from Firebase Realtime Database.
   *
   * @param {string} roomCodeInput
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async getRoom(roomCodeInput) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);
    const url = getDatabasePathURL(`rooms/${roomCode}`);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new MultiplayerError(
          MultiplayerErrorCode.NETWORK_ERROR,
          `Failed to fetch room from Firebase (${response.status} ${response.statusText}).`
        );
      }

      const data = await response.json();
      if (!data) {
        throw new MultiplayerError(
          MultiplayerErrorCode.ROOM_NOT_FOUND,
          `Outpost mission with room code "${roomCode}" was not found.`
        );
      }

      return normalizeMission(data);
    } catch (err) {
      if (err instanceof MultiplayerError) throw err;
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Network error fetching room "${roomCode}": ${err.message}`,
        err
      );
    }
  },

  /**
   * Subscribes to real-time mission updates via Firebase SSE EventSource streaming.
   *
   * @param {string} roomCodeInput - 6-character room code.
   * @param {(mission: import('../../types/game.js').Mission) => void} onUpdate - Callback on change.
   * @param {(error: MultiplayerError) => void} [onError] - Callback on error.
   * @returns {() => void} Unsubscribe cleanup function.
   */
  subscribeToRoom(roomCodeInput, onUpdate, onError) {
    let roomCode;
    try {
      checkConfigured();
      roomCode = assertValidRoomCode(roomCodeInput);
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }

    const url = getDatabasePathURL(`rooms/${roomCode}`);
    let eventSource = null;
    let isCleanedUp = false;
    let currentMissionCache = null;

    try {
      eventSource = new EventSource(url);

      eventSource.addEventListener('put', (event) => {
        if (isCleanedUp) return;
        try {
          const parsed = JSON.parse(event.data);
          // Firebase SSE put payload structure: { path: '/', data: ... }
          if (parsed && parsed.path === '/') {
            if (!parsed.data) {
              if (onError) {
                onError(
                  new MultiplayerError(
                    MultiplayerErrorCode.ROOM_NOT_FOUND,
                    `Outpost mission with room code "${roomCode}" was closed.`
                  )
                );
              }
              return;
            }
            currentMissionCache = normalizeMission(parsed.data);
            onUpdate(currentMissionCache);
          } else if (parsed && parsed.data !== undefined && currentMissionCache) {
            // Nested path update: re-fetch or apply patch
            firebaseAdapter.getRoom(roomCode).then((fresh) => {
              if (!isCleanedUp && fresh) {
                currentMissionCache = fresh;
                onUpdate(fresh);
              }
            }).catch(() => {});
          }
        } catch (e) {
          console.error('[Multiplayer:Firebase] Failed to parse SSE event data:', e);
        }
      });

      eventSource.addEventListener('patch', () => {
        if (isCleanedUp) return;
        try {
          // Re-fetch entire room to ensure clean sync on partial patch
          firebaseAdapter.getRoom(roomCode).then((fresh) => {
            if (!isCleanedUp && fresh) {
              currentMissionCache = fresh;
              onUpdate(fresh);
            }
          }).catch(() => {});
        } catch (e) {
          console.error('[Multiplayer:Firebase] Patch handling error:', e);
        }
      });

      eventSource.onerror = (err) => {
        if (isCleanedUp) return;
        if (onError) {
          onError(
            new MultiplayerError(
              MultiplayerErrorCode.NETWORK_ERROR,
              `Firebase Realtime Database connection error for room "${roomCode}".`,
              err
            )
          );
        }
      };
    } catch (err) {
      if (onError) {
        onError(
          new MultiplayerError(
            MultiplayerErrorCode.NETWORK_ERROR,
            `Could not open EventSource connection to Firebase: ${err.message}`,
            err
          )
        );
      }
    }

    // Return cleanup function to close connection
    return () => {
      isCleanedUp = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },

  /**
   * Updates player details in Firebase.
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @param {Partial<import('../../types/game.js').Player>} updates
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async updatePlayer(roomCodeInput, playerId, updates = {}) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = await this.getRoom(roomCode);

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
      id: playerId,
    };

    const url = getDatabasePathURL(`rooms/${roomCode}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to update player details in Firebase (${response.status}).`
      );
    }

    return mission;
  },

  /**
   * Submits a vote to Firebase Realtime Database.
   *
   * @param {string} roomCodeInput
   * @param {{ voteId: string, playerId: string, choice: any, [key: string]: any }} voteData
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async submitVote(roomCodeInput, voteData = {}) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);
    const { voteId, playerId, choice } = voteData;

    if (!voteId || !playerId) {
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        'submitVote requires both "voteId" and "playerId".'
      );
    }

    const voteRecord = {
      choice,
      timestamp: Date.now(),
      ...voteData,
    };

    const url = getDatabasePathURL(`rooms/${roomCode}/votes/${voteId}/${playerId}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteRecord),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to submit vote to Firebase (${response.status}).`
      );
    }

    return this.getRoom(roomCode);
  },

  /**
   * Removes a player from the room in Firebase.
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @returns {Promise<{ remainingPlayers: number }>}
   */
  async leaveRoom(roomCodeInput, playerId) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = await this.getRoom(roomCode).catch(() => null);

    if (!mission) {
      return { remainingPlayers: 0 };
    }

    mission.players = mission.players.filter((p) => p.id !== playerId);

    if (mission.players.length === 0) {
      const url = getDatabasePathURL(`rooms/${roomCode}`);
      await fetch(url, { method: 'DELETE' });
      return { remainingPlayers: 0 };
    }

    const url = getDatabasePathURL(`rooms/${roomCode}`);
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    return { remainingPlayers: mission.players.length };
  },
};
