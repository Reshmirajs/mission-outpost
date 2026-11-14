/**
 * MISSION: OUTPOST - Multiplayer Errors
 * NASA Space Apps Challenge 2026
 *
 * Standardized error classes and error codes for multiplayer room operations.
 */

export const MultiplayerErrorCode = Object.freeze({
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  INVALID_ROOM_CODE: 'INVALID_ROOM_CODE',
  ROOM_ALREADY_EXISTS: 'ROOM_ALREADY_EXISTS',
  ROOM_FULL: 'ROOM_FULL',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FIREBASE_NOT_CONFIGURED: 'FIREBASE_NOT_CONFIGURED',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
});

export class MultiplayerError extends Error {
  /**
   * @param {string} code - One of MultiplayerErrorCode.
   * @param {string} message - Human-readable description.
   * @param {any} [details] - Optional contextual details.
   */
  constructor(code, message, details = null) {
    super(message);
    this.name = 'MultiplayerError';
    this.code = code;
    this.details = details;
  }
}
