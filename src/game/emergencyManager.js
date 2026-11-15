/**
 * MISSION: OUTPOST - Emergency Manager
 * NASA Space Apps Challenge 2026
 *
 * Defines Martian emergency event types and applies their resource penalties
 * to mission state. Emergency penalties are kept strictly separate from natural
 * Sol consumption — they do not go through calculateConsumption().
 *
 * Independent of React, Firebase, task logic, and player state management.
 *
 * All penalty values are GAME SIMULATION values chosen for dramatic playability.
 * They are NOT real Martian environmental hazard measurements or NASA limits.
 */

import { applyConsumption } from './resourceManager.js';

// ─── GAME SIMULATION emergency definitions ────────────────────────────────────

/**
 * All available emergency event types.
 * Each event has a unique ID, a human-readable name, and a resource penalty delta.
 *
 * Penalty fields are partial Resources-shaped deltas:
 *   - Negative values drain a resource (oxygen, power, food go down).
 *   - Positive radiation means exposure increases (radiation goes up = worse).
 *
 * GAME SIMULATION penalty values — not real hazard measurements:
 *
 * | ID             | Name           | Penalty                        |
 * |----------------|----------------|-------------------------------|
 * | solar_flare    | Solar Flare    | +radiation: 15                |
 * | oxygen_leak    | Oxygen Leak    | −oxygen: 20                   |
 * | power_failure  | Power Failure  | −power: 25                    |
 * | food_spoilage  | Food Spoilage  | −food: 15                     |
 * | dust_storm     | Dust Storm     | −power: 10, +radiation: 5     |
 *
 * @type {ReadonlyArray<{ id: string, name: string, penalty: Object }>}
 */
export const EMERGENCY_EVENTS = Object.freeze([
  Object.freeze({
    id:      'solar_flare',
    name:    'Solar Flare',
    penalty: Object.freeze({ radiation: 15 }),
  }),
  Object.freeze({
    id:      'oxygen_leak',
    name:    'Oxygen Leak',
    penalty: Object.freeze({ oxygen: -20 }),
  }),
  Object.freeze({
    id:      'power_failure',
    name:    'Power Failure',
    penalty: Object.freeze({ power: -25 }),
  }),
  Object.freeze({
    id:      'food_spoilage',
    name:    'Food Spoilage',
    penalty: Object.freeze({ food: -15 }),
  }),
  Object.freeze({
    id:      'dust_storm',
    name:    'Dust Storm',
    penalty: Object.freeze({ power: -10, radiation: 5 }),
  }),
]);

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Looks up and returns an emergency event definition by its ID.
 * Returns `null` if no matching event is found.
 *
 * @param {string} eventId - The unique emergency event identifier.
 * @returns {{ id: string, name: string, penalty: Object } | null}
 */
export function getEmergencyById(eventId) {
  return EMERGENCY_EVENTS.find(e => e.id === eventId) || null;
}

/**
 * Applies an emergency event penalty to the mission's current resources.
 *
 * Key design rule: emergency penalties are applied via `applyConsumption()` from
 * resourceManager.js, reusing its NaN-safe arithmetic and [0, 100] clamping.
 * They are intentionally separate from `calculateConsumption()` (natural Sol drain)
 * so callers and the history log can distinguish the two causes.
 *
 * If `eventId` is not recognised, resources are returned unchanged and
 * `penaltyApplied` is `null`.
 *
 * @param {import('../types/game.js').Mission} mission  - Current mission state.
 * @param {string}                             eventId  - ID of the emergency event to apply.
 * @returns {{
 *   updatedResources: import('../types/game.js').Resources,
 *   penaltyApplied:   Object | null,
 *   eventName:        string | null
 * }}
 */
export function applyEmergency(mission, eventId) {
  const event = getEmergencyById(eventId);

  if (!event) {
    return {
      updatedResources: mission.resources,
      penaltyApplied:   null,
      eventName:        null,
    };
  }

  // Reuse applyConsumption() for safe, clamped arithmetic — separate from Sol drain
  const updatedResources = applyConsumption(mission.resources, event.penalty);

  return {
    updatedResources,
    penaltyApplied: { ...event.penalty },
    eventName:      event.name,
  };
}
