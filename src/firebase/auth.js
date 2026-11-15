
/**
 * MISSION: OUTPOST - Anonymous Player Authentication
 *
 * signInGuest()        — signs the player in anonymously with Firebase Auth.
 *                        Returns the Firebase User object (with a stable uid).
 * listenToAuthState()  — fires a callback whenever the user's auth status
 *                        changes. Returns an unsubscribe function.
 *
 * Both functions return safely (without throwing) when Firebase is not
 * configured, so the app can still run in local/mock mode.
 */

import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { app } from './index.js';

// auth is null when Firebase credentials are not yet set up in .env.local
export const auth = app ? getAuth(app) : null;

/**
 * Signs the current player in anonymously.
 * Firebase gives each anonymous user a unique, stable uid for the session.
 *
 * @returns {Promise<import('firebase/auth').User | null>}
 *   The Firebase User, or null if Firebase is not configured.
 */
export async function signInGuest() {
  // If Firebase isn't set up yet, return null instead of crashing the app.
  // The lobby will continue working in local mock mode.
  if (!auth) {
    console.warn('[Firebase Auth] Skipping guest sign-in — Firebase is not configured.');
    return null;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Listens for changes to the player's Firebase authentication state.
 * Fires immediately with the current user, then again on any change.
 *
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} Call this function to stop listening (cleanup).
 */
export function listenToAuthState(callback) {
  if (!auth) {
    // Not configured — call back once with null and return a no-op unsubscribe
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
