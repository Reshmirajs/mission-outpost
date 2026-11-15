/**
 * MISSION: OUTPOST - Firebase Realtime Presence System
 * NASA Space Apps Challenge 2026
 *
 * Uses the Firebase Realtime Database SDK's native `onDisconnect` trigger to
 * detect unexpected disconnections (browser close, network loss, tab crash)
 * and mark the player as offline automatically on Firebase servers.
 *
 * How it works:
 *   1. When a player joins or creates a room, `registerPresence()` is called.
 *   2. It writes `online: true` to `rooms/{roomCode}/presence/{playerId}`.
 *   3. It registers an `onDisconnect().update()` that fires ON THE SERVER the
 *      moment Firebase detects the client lost its WebSocket connection.
 *      That server-side trigger sets `online: false` and records a timestamp —
 *      even if the browser tab is force-closed or the internet drops.
 *   4. `clearPresence()` cancels the onDisconnect hook and writes `online: false`
 *      when the player intentionally leaves.
 *
 * Room isolation: every path is scoped to `rooms/{roomCode}/presence/{playerId}`.
 */

import { database } from './index.js';
import { ref, onDisconnect, set, serverTimestamp, get } from 'firebase/database';

/**
 * Registers live presence for a player in a room.
 * Sets `online: true` immediately and schedules a server-side `online: false`
 * update that fires automatically if the client disconnects unexpectedly.
 *
 * @param {string} roomCode  - 6-character room code.
 * @param {string} playerId  - Firebase UID or session ID of the player.
 * @returns {Promise<() => Promise<void>>}
 *   Returns an async cleanup function that cancels the onDisconnect hook
 *   and writes an offline status (call when player intentionally leaves).
 */
export async function registerPresence(roomCode, playerId) {
  if (!database || !roomCode || !playerId) {
    // Firebase not configured: return a no-op cleanup
    return async () => {};
  }

  const presenceRef = ref(database, `rooms/${roomCode}/presence/${playerId}`);

  // Write online status immediately
  await set(presenceRef, {
    online: true,
    lastSeen: serverTimestamp(),
  });

  // Schedule what Firebase should write if the client disconnects unexpectedly.
  // This runs on the Firebase server — it fires even if the tab is force-closed.
  const disconnectHandler = onDisconnect(presenceRef);
  await disconnectHandler.update({
    online: false,
    lastSeen: serverTimestamp(),
  });

  // Return a cleanup function for intentional departure (e.g. Leave Room button)
  return async () => {
    // Cancel the pending onDisconnect hook so Firebase doesn't fire it again
    await disconnectHandler.cancel().catch(() => {});
    // Write offline status manually
    await set(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
    }).catch(() => {});
  };
}

/**
 * Checks whether a player is marked online in a room's presence data.
 * Used to determine whether a disconnected player may still reconnect.
 *
 * @param {string} roomCode - 6-character room code.
 * @param {string} playerId - Player unique ID.
 * @returns {Promise<boolean>} True if the player has an online presence record.
 */
export async function isPlayerOnline(roomCode, playerId) {
  if (!database || !roomCode || !playerId) return false;

  const presenceRef = ref(database, `rooms/${roomCode}/presence/${playerId}`);
  const snapshot = await get(presenceRef).catch(() => null);
  if (!snapshot || !snapshot.exists()) return false;

  const data = snapshot.val();
  return Boolean(data?.online);
}
