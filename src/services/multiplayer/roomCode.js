/**
 * MISSION: OUTPOST - Room Code Utilities
 * NASA Space Apps Challenge 2026
 *
 * Consistently handles 6-character alphanumeric room codes for Outpost missions.
 */

import { MultiplayerError, MultiplayerErrorCode } from './errors.js';

// Clean character set: uppercase letters and numbers, excluding ambiguous O, 0, I, 1
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

/**
 * Generates a random 6-character room code.
 *
 * @returns {string} 6-character uppercase alphanumeric code.
 */
export function generateRoomCode() {
  let result = '';
  const alphabetLength = ROOM_CODE_ALPHABET.length;
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * alphabetLength);
    result += ROOM_CODE_ALPHABET[randomIndex];
  }
  return result;
}

/**
 * Normalizes a user-entered room code: trims whitespace and converts to uppercase.
 *
 * @param {string} code - User input room code.
 * @returns {string} Normalized 6-character room code.
 */
export function normalizeRoomCode(code) {
  if (typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

/**
 * Validates whether the code is a valid 6-character alphanumeric room code.
 *
 * @param {string} code - Room code to test.
 * @returns {boolean} True if exactly 6 uppercase alphanumeric characters.
 */
export function isValidRoomCode(code) {
  const normalized = normalizeRoomCode(code);
  return ROOM_CODE_REGEX.test(normalized);
}

/**
 * Asserts that a room code is valid, throwing a standardized MultiplayerError if not.
 *
 * @param {string} code - Room code to assert.
 * @returns {string} Normalized valid room code.
 * @throws {MultiplayerError} If code is invalid.
 */
export function assertValidRoomCode(code) {
  const normalized = normalizeRoomCode(code);
  if (!isValidRoomCode(normalized)) {
    throw new MultiplayerError(
      MultiplayerErrorCode.INVALID_ROOM_CODE,
      `Invalid room code "${code}". Outpost room codes must be exactly ${ROOM_CODE_LENGTH} alphanumeric characters.`
    );
  }
  return normalized;
}
