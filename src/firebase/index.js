/**
 * MISSION: OUTPOST - Firebase Initialization Entry Point
 * NASA Space Apps Challenge 2026
 *
 * Centralizes Firebase configuration and connection diagnostics.
 * When Firebase credentials are provided via VITE_FIREBASE_* variables,
 * live database connection endpoints are active. Otherwise, the app
 * cleanly falls back to the local multiplayer mock adapter.
 */


/**
 * MISSION: OUTPOST - Firebase Initialization Entry Point
 * NASA Space Apps Challenge 2026
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

import {
  firebaseConfig,
  isFirebaseConfigured,
  getFirebaseStatus
} from './config.js';

// Export configuration helpers
export { firebaseConfig, isFirebaseConfigured, getFirebaseStatus };

// Initialize Firebase only when configuration is available
export const app = isFirebaseConfigured()
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

// Obtain Realtime Database instance
export const database = app
  ? getDatabase(app)
  : null;

/**
 * Returns normalized database root URL.
 */
export function getDatabaseURL() {
  if (!firebaseConfig.databaseURL) return '';

  return firebaseConfig.databaseURL.replace(/\/+$/, '');
}

/**
 * Formats a Firebase Realtime Database REST URL.
 */
export function getDatabasePathURL(path) {
  const base = getDatabaseURL();

  if (!base) return '';

  const cleanPath = path.replace(/^\/+|\/+$/g, '');

  return `${base}/${cleanPath}.json`;
}
