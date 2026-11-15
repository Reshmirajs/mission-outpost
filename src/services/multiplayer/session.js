/**
 * MISSION: OUTPOST - Session Storage Utilities for Reconnect Handling
 * NASA Space Apps Challenge 2026
 */

export const SESSION_KEY = 'mission_outpost_session';

/**
 * Saves the current room session to sessionStorage so the player can
 * silently reconnect after a page refresh or temporary disconnection.
 */
export function saveSession(roomCode, playerId) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId }));
  } catch {
    // sessionStorage unavailable (e.g. private browsing restriction) — ignore
  }
}

/**
 * Retrieves the saved session from sessionStorage, if any.
 * @returns {{ roomCode: string, playerId: string } | null}
 */
export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clears the saved session from sessionStorage.
 */
export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
