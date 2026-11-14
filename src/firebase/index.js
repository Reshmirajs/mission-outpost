/**
 * MISSION: OUTPOST - Firebase Initialization Entry Point
 * NASA Space Apps Challenge 2026
 *
 * Centralizes Firebase configuration and connection diagnostics.
 * When Firebase credentials are provided via VITE_FIREBASE_* variables,
 * live database connection endpoints are active. Otherwise, the app
 * cleanly falls back to the local multiplayer mock adapter.
 */

import { firebaseConfig, isFirebaseConfigured, getFirebaseStatus } from './config.js';

export { firebaseConfig, isFirebaseConfigured, getFirebaseStatus };

/**
 * Returns normalized database root URL (without trailing slashes).
 *
 * @returns {string} Database base URL or empty string if not configured.
 */
export function getDatabaseURL() {
  if (!firebaseConfig.databaseURL) return '';
  return firebaseConfig.databaseURL.replace(/\/+$/, '');
}

/**
 * Formats a Firebase Realtime Database reference path.
 *
 * @param {string} path - Database subpath (e.g., 'rooms/ABC123').
 * @returns {string} Full URL to REST/SSE endpoint.
 */
export function getDatabasePathURL(path) {
  const base = getDatabaseURL();
  if (!base) return '';
  const cleanPath = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${base}/${cleanPath}.json`;
}
