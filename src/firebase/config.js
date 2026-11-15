/**
 * MISSION: OUTPOST - Firebase Configuration Module
 * NASA Space Apps Challenge 2026
 *
 * Reads Vite environment variables prefixed with VITE_FIREBASE_
 * and validates whether a live Firebase Realtime Database is configured.
 */

/**
 * Raw Firebase configuration object read from client environment variables.
 */
export const firebaseConfig = Object.freeze({
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '',
});

/**
 * Checks whether valid Firebase credentials have been configured.
 * Rejects empty values and default placeholders from .env.example.
 *
 * @returns {boolean} True if Firebase is properly configured with live credentials.
 */
export function isFirebaseConfigured() {
  const { apiKey, databaseURL, projectId } = firebaseConfig;

  if (!apiKey || !databaseURL || !projectId) {
    return false;
  }

  // Check for template/placeholder strings
  const isPlaceholder =
    apiKey.includes('your_firebase_api_key') ||
    databaseURL.includes('your_project_id') ||
    projectId.includes('your_project_id');

  return !isPlaceholder;
}

/**
 * Returns diagnostic details about the current Firebase configuration state.
 *
 * @returns {{ configured: boolean, mode: 'firebase'|'mock', databaseURL: string, projectId: string, missingFields: string[] }}
 */
export function getFirebaseStatus() {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.databaseURL) missing.push('VITE_FIREBASE_DATABASE_URL');
  if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');

  const configured = isFirebaseConfigured();

  return {
    configured,
    mode: configured ? 'firebase' : 'mock',
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId,
    missingFields: missing,
  };
}
