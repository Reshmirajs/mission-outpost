/**
 * MISSION: OUTPOST - Firebase Realtime Database Multiplayer Adapter
 * NASA Space Apps Challenge 2026
 *
 * Implements real-time room synchronization using Firebase Realtime Database.
 * Communicates via standard Realtime Database REST API and Server-Sent Events (SSE)
 * EventSource streaming, providing zero-dependency real-time push synchronization.
 */

import { isFirebaseConfigured, getDatabasePathURL, database } from '../../firebase/index.js';
import { ref, runTransaction } from 'firebase/database';
import { auth } from '../../firebase/auth.js';
import { registerPresence } from '../../firebase/presence.js';
import {
  createMission,
  createPlayer,
  MissionStatus,
  PlayerRoles,
} from '../../types/game.js';
import { advanceMission } from '../../game/missionEngine.js';
import { MultiplayerError, MultiplayerErrorCode } from './errors.js';
import { assertValidRoomCode, generateRoomCode } from './roomCode.js';

/**
 * Per-session presence cleanup registry.
 * Maps `${roomCode}:${playerId}` → async cleanup function returned by registerPresence().
 * Called on intentional leave; automatically fires on the server on unexpected disconnect.
 */
const presenceCleanupRegistry = new Map();

function checkConfigured() {
  if (!isFirebaseConfigured()) {
    throw new MultiplayerError(
      MultiplayerErrorCode.FIREBASE_NOT_CONFIGURED,
      'Firebase credentials are not configured. Populate .env.local with valid VITE_FIREBASE_* variables or use the mock adapter.'
    );
  }
}

/**
 * Gets the current Firebase Auth ID token for the signed-in anonymous player.
 * This token is appended to every REST request so Firebase knows who is calling.
 * Returns null if no user is signed in yet.
 */
async function getAuthToken() {
  if (!auth) return null;

  // If currentUser is not yet loaded, wait briefly for auth to initialize or sign in
  if (!auth.currentUser) {
    try {
      await auth.authStateReady?.();
    } catch {
      // Ignore if authStateReady not supported
    }
  }

  if (!auth.currentUser) return null;

  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Builds a fully authenticated Firebase REST URL.
 * Appends ?auth=<idToken> so the database rules allow the request.
 *
 * @param {string} path - e.g. 'rooms/ABCD12'
 * @returns {Promise<string>} Full URL with auth token
 */
async function buildUrl(path) {
  const base = getDatabasePathURL(path);
  const token = await getAuthToken();
  return token ? `${base}?auth=${token}` : base;
}

/**
 * Normalizes Firebase RTDB mission data into the standard Mission structure.
 * Handles cases where Firebase stores array indices as object properties.
 */
function normalizeMission(raw) {
  if (!raw) return null;

  let players = [];
  if (Array.isArray(raw.players)) {
    players = raw.players.filter(Boolean).map((p) => ({
      ...createPlayer(p),
      ...(p.isSimulated !== undefined ? { isSimulated: p.isSimulated } : {}),
    }));
  } else if (raw.players && typeof raw.players === 'object') {
    players = Object.values(raw.players).filter(Boolean).map((p) => ({
      ...createPlayer(p),
      ...(p.isSimulated !== undefined ? { isSimulated: p.isSimulated } : {}),
    }));
  }

  const mission = createMission({
    ...raw,
    players,
    votes: raw.votes || {},
  });
  if (raw.hostId) {
    mission.hostId = raw.hostId;
  } else if (players.length > 0) {
    mission.hostId = players[0].id;
  }
  return mission;
}

function ensurePlayerId(player) {
  if (player?.id) return player.id;
  if (auth?.currentUser?.uid) return auth.currentUser.uid;
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
      name: hostPlayer.name || 'Commander',
      role: hostPlayer.role || PlayerRoles.UNASSIGNED,
      ready: hostPlayer.ready ?? false,
    });

    const mission = createMission({
      roomCode,
      players: [player],
      status: MissionStatus.LOBBY,
      round: 1,
      votes: {},
    });
    mission.hostId = playerId;

    const url = await buildUrl(`rooms/${roomCode}`);

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
      const normalizedMission = normalizeMission(created);

      // Register onDisconnect presence so Firebase automatically marks this player
      // offline if the browser closes or the network drops unexpectedly.
      registerPresence(roomCode, playerId).then((cleanup) => {
        presenceCleanupRegistry.set(`${roomCode}:${playerId}`, cleanup);
      }).catch(() => {});

      return { roomCode, mission: normalizedMission, player };
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

    const playerId = ensurePlayerId(playerInput);
    const existingIndex = mission.players.findIndex((p) => p.id === playerId);

    // Allow reconnection if the player was already in the room (by playerId),
    // regardless of mission status. This handles browser refresh and network drops.
    const isReconnect = existingIndex >= 0;

    if (!isReconnect && mission.status !== MissionStatus.LOBBY) {
      throw new MultiplayerError(
        MultiplayerErrorCode.GAME_ALREADY_STARTED,
        `Cannot join Outpost "${roomCode}" because the mission is already ${mission.status}.`
      );
    }

    if (mission.players.length >= 5 && !isReconnect) {
      throw new MultiplayerError(
        MultiplayerErrorCode.ROOM_FULL,
        'Outpost habitat airlock is at maximum crew capacity (5/5 astronauts).'
      );
    }

    let player;
    if (isReconnect) {
      // Reconnect: preserve the player's existing role and ready state.
      // Only update mutable fields like name if explicitly provided.
      mission.players[existingIndex] = createPlayer({
        ...mission.players[existingIndex],
        ...(playerInput.name ? { name: playerInput.name } : {}),
        id: playerId,
      });
      player = mission.players[existingIndex];
    } else {
      player = createPlayer({
        ...playerInput,
        id: playerId,
        name: playerInput.name || `Astronaut #${mission.players.length + 1}`,
      });
      if (playerInput.isSimulated !== undefined) {
        player.isSimulated = playerInput.isSimulated;
      }
      mission.players.push(player);
    }

    const url = await buildUrl(`rooms/${roomCode}`);
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

    // Register onDisconnect presence so Firebase automatically marks this player
    // offline if the browser closes or the network drops unexpectedly.
    registerPresence(roomCode, playerId).then((cleanup) => {
      presenceCleanupRegistry.set(`${roomCode}:${playerId}`, cleanup);
    }).catch(() => {});

    return { roomCode, mission, player, isReconnect };
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
    const url = await buildUrl(`rooms/${roomCode}`);

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

    // Build the authenticated URL asynchronously, then open the SSE connection
    let eventSource = null;
    let isCleanedUp = false;
    let currentMissionCache = null;

    buildUrl(`rooms/${roomCode}`).then((url) => {
      if (isCleanedUp) return;

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
    }).catch((err) => {
      if (!isCleanedUp && onError) {
        onError(
          new MultiplayerError(
            MultiplayerErrorCode.NETWORK_ERROR,
            `Failed to build authenticated URL for room "${roomCode}": ${err.message}`,
            err
          )
        );
      }
    });

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

    const url = await buildUrl(`rooms/${roomCode}`);
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
   * @param {{ voteId: string, playerId: string, choice?: any, optionId?: any, [key: string]: any }} voteData
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async submitVote(roomCodeInput, voteData = {}) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);
    const { voteId, playerId } = voteData;
    const choice = voteData.choice ?? voteData.optionId;

    if (!voteId || !playerId) {
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        'submitVote requires both "voteId" and "playerId".'
      );
    }

    const voteRecord = {
      choice,
      optionId: voteData.optionId ?? choice,
      timestamp: Date.now(),
      ...voteData,
    };

    const url = await buildUrl(`rooms/${roomCode}/votes/${voteId}/${playerId}`);
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
   * Updates a player's assigned role in Firebase RTDB with conflict detection.
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @param {string} targetRole
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async selectPlayerRole(roomCodeInput, playerId, targetRole) {
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

    if (targetRole && targetRole !== PlayerRoles.UNASSIGNED) {
      const existing = mission.players.find((p) => p.id !== playerId && p.role === targetRole);
      if (existing) {
        throw new MultiplayerError(
          MultiplayerErrorCode.INVALID_PAYLOAD,
          `The ${targetRole} station has already been claimed by ${existing.name}.`
        );
      }
    }

    mission.players[playerIndex].role = targetRole;
    mission.players[playerIndex].ready = false;

    const url = await buildUrl(`rooms/${roomCode}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to update role in Firebase (${response.status}).`
      );
    }

    return mission;
  },

  /**
   * Toggles a player's readiness state in Firebase RTDB.
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async togglePlayerReady(roomCodeInput, playerId) {
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

    const player = mission.players[playerIndex];
    if (!player.ready && (!player.role || player.role === PlayerRoles.UNASSIGNED)) {
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        'You must choose an astronaut specialist role before marking yourself ready!'
      );
    }

    player.ready = !player.ready;

    const url = await buildUrl(`rooms/${roomCode}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to update readiness in Firebase (${response.status}).`
      );
    }

    return mission;
  },

  /**
   * Sets mission to in_progress in Firebase RTDB when launch conditions are met.
   *
   * @param {string} roomCodeInput
   * @param {string} [requestingPlayerId]
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async startMission(roomCodeInput, requestingPlayerId) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);
    const mission = await this.getRoom(roomCode);

    if (requestingPlayerId && mission.hostId && mission.hostId !== requestingPlayerId) {
      throw new MultiplayerError(
        MultiplayerErrorCode.PERMISSION_DENIED,
        'Only the Outpost Expedition Lead (Host) can initiate launch.'
      );
    }

    if (mission.players.length < 2) {
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        `A minimum of 2 astronauts is required for Mars survival (Currently: ${mission.players.length}).`
      );
    }

    const unassigned = mission.players.filter((p) => !p.role || p.role === PlayerRoles.UNASSIGNED);
    if (unassigned.length > 0) {
      const names = unassigned.map((p) => p.name).join(', ');
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        `All astronauts must choose a specialist role before launch. Standby: ${names}`
      );
    }

    const notReady = mission.players.filter((p) => !p.ready);
    if (notReady.length > 0) {
      const names = notReady.map((p) => p.name).join(', ');
      throw new MultiplayerError(
        MultiplayerErrorCode.INVALID_PAYLOAD,
        `All crew members must report ready before launch. Waiting on: ${names}`
      );
    }

    mission.status = MissionStatus.IN_PROGRESS;

    const url = await buildUrl(`rooms/${roomCode}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to update mission status in Firebase (${response.status}).`
      );
    }

    return mission;
  },

  /**
   * Updates partial mission fields (resources, round, status) in Firebase RTDB safely via PATCH.
   *
   * @param {string} roomCodeInput
   * @param {Partial<import('../../types/game.js').Mission>} partialMission
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async updateMission(roomCodeInput, partialMission = {}) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);

    const payload = {};
    if (partialMission.status !== undefined) payload.status = partialMission.status;
    if (partialMission.round !== undefined) payload.round = partialMission.round;
    if (partialMission.targetSols !== undefined) payload.targetSols = partialMission.targetSols;
    if (partialMission.missionConfiguration !== undefined) payload.missionConfiguration = partialMission.missionConfiguration;
    if (partialMission.resources !== undefined) payload.resources = partialMission.resources;
    if (partialMission.votes !== undefined) payload.votes = partialMission.votes;

    const url = await buildUrl(`rooms/${roomCode}`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new MultiplayerError(
        MultiplayerErrorCode.NETWORK_ERROR,
        `Failed to update mission in Firebase (${response.status}).`
      );
    }

    return this.getRoom(roomCode);
  },

  /**
   * Removes a player from the room in Firebase.
   * Also cancels the onDisconnect presence hook so it doesn't fire after intentional leave.
   *
   * @param {string} roomCodeInput
   * @param {string} playerId
   * @returns {Promise<{ remainingPlayers: number }>}
   */
  async leaveRoom(roomCodeInput, playerId) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);

    // Cancel presence onDisconnect hook and write offline status (intentional leave)
    const presenceKey = `${roomCode}:${playerId}`;
    const presenceCleanup = presenceCleanupRegistry.get(presenceKey);
    if (presenceCleanup) {
      await presenceCleanup().catch(() => {});
      presenceCleanupRegistry.delete(presenceKey);
    }

    const mission = await this.getRoom(roomCode).catch(() => null);

    if (!mission) {
      return { remainingPlayers: 0 };
    }

    mission.players = mission.players.filter((p) => p.id !== playerId);

    if (mission.players.length === 0) {
      const url = await buildUrl(`rooms/${roomCode}`);
      await fetch(url, { method: 'DELETE' });
      return { remainingPlayers: 0 };
    }

    if (mission.hostId === playerId && mission.players.length > 0) {
      mission.hostId = mission.players[0].id;
    }

    const url = await buildUrl(`rooms/${roomCode}`);
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });

    return { remainingPlayers: mission.players.length };
  },

  /**
   * Attempts to reconnect a player to their existing room after a disconnection.
   * Looks up the room by code and checks if the player (by ID) is still in the roster.
   * If found, re-registers presence and returns the current mission state.
   * If not found, the caller should prompt the player to re-join manually.
   *
   * @param {string} roomCodeInput - Room code stored in session before disconnect.
   * @param {string} playerId - Player's Firebase UID (stable across reconnects).
   * @returns {Promise<{ mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player, wasReconnected: boolean }>}
   */
  async reconnectToRoom(roomCodeInput, playerId) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);

    const mission = await this.getRoom(roomCode).catch(() => null);

    if (!mission) {
      throw new MultiplayerError(
        MultiplayerErrorCode.ROOM_NOT_FOUND,
        `Outpost session "${roomCode}" no longer exists. It may have been closed.`
      );
    }

    const player = mission.players.find((p) => p.id === playerId);

    if (!player) {
      throw new MultiplayerError(
        MultiplayerErrorCode.PLAYER_NOT_FOUND,
        `Your crew slot in outpost "${roomCode}" was not found. The session may have timed out.`
      );
    }

    // Re-register presence so the onDisconnect hook is active again
    registerPresence(roomCode, playerId).then((cleanup) => {
      presenceCleanupRegistry.set(`${roomCode}:${playerId}`, cleanup);
    }).catch(() => {});

    return { mission, player, wasReconnected: true };
  },

  /**
   * Advances the mission to the next Sol atomically using a Firebase Realtime Database transaction.
   * Prevents simultaneous round advancements and verifies caller authorization.
   *
   * @param {string} roomCodeInput
   * @param {string} requestingPlayerId
   * @param {{ targetRound?: number }} [options={}]
   * @returns {Promise<import('../../types/game.js').Mission>}
   */
  async advanceSol(roomCodeInput, requestingPlayerId, options = {}) {
    checkConfigured();
    const roomCode = assertValidRoomCode(roomCodeInput);

    if (!database) {
      throw new MultiplayerError(
        MultiplayerErrorCode.FIREBASE_NOT_CONFIGURED,
        'Firebase database reference is not available.'
      );
    }

    const roomRef = ref(database, `rooms/${roomCode}`);

    let abortReason = null;

    const result = await runTransaction(roomRef, (currentData) => {
      if (!currentData) {
        abortReason = 'Room not found.';
        return; // aborts transaction
      }

      // Authorization check: only Expedition Lead (Host) or Mission Commander can advance Sol
      const hostId = currentData.hostId;
      const isHost = hostId && hostId === requestingPlayerId;

      let playersList = [];
      if (Array.isArray(currentData.players)) {
        playersList = currentData.players.filter(Boolean);
      } else if (currentData.players && typeof currentData.players === 'object') {
        playersList = Object.values(currentData.players).filter(Boolean);
      }

      const player = playersList.find((p) => p.id === requestingPlayerId);
      const isCommander = player?.role === PlayerRoles.MISSION_COMMANDER;

      if (!isHost && !isCommander) {
        abortReason = 'Only the Expedition Lead (Host) or Mission Commander can advance the Sol.';
        return; // aborts transaction
      }

      // Guard: only advance active missions
      if (currentData.status !== MissionStatus.IN_PROGRESS) {
        abortReason = `Cannot advance Sol when mission status is "${currentData.status}".`;
        return;
      }

      // Normalize into proper Mission object and execute pure advanceMission engine
      const normalized = normalizeMission(currentData);
      const targetRound = options.targetRound || currentData.targetSols || 20;
      const advanced = advanceMission(normalized, { targetRound });

      // Update state in transaction atomically
      return {
        ...currentData,
        round: advanced.round,
        resources: advanced.resources,
        status: advanced.status,
      };
    });

    if (!result.committed) {
      throw new MultiplayerError(
        MultiplayerErrorCode.PERMISSION_DENIED,
        abortReason || 'Sol advancement was rejected or superseded.'
      );
    }

    return this.getRoom(roomCode);
  },
};
