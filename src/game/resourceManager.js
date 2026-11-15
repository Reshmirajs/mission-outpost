/**
 * MISSION: OUTPOST - Resource Manager
 * NASA Space Apps Challenge 2026
 *
 * Pure functions for calculating and applying resource changes each Sol.
 * Independent of React, Firebase, and mission lifecycle logic.
 *
 * All consumption rates are GAME SIMULATION values chosen for playability.
 * They are NOT real astronaut life-support or NASA safety limits.
 */

import { createResources, INITIAL_RESOURCES } from '../types/game.js';

// ─── GAME SIMULATION constants ────────────────────────────────────────────────

/**
 * Base resource drain applied every Sol with a single crew member.
 * GAME SIMULATION values — not real life-support figures.
 *
 * @type {Readonly<{ oxygen: number, water: number, power: number, food: number }>}
 */
const BASE_DRAIN = Object.freeze({
  oxygen: 5,  // % per Sol — crew breathes constantly
  water:  4,  // % per Sol — hydration & hygiene
  power:  4,  // % per Sol — life support draws energy
  food:   3,  // % per Sol — crew consumes rations
});

/**
 * Additional drain per *extra* crew member beyond the first.
 * Power is intentionally fractional; no rounding is applied.
 * GAME SIMULATION values — not real life-support figures.
 *
 * @type {Readonly<{ oxygen: number, water: number, power: number, food: number }>}
 */
const PER_EXTRA_PLAYER_DRAIN = Object.freeze({
  oxygen: 1,    // % per Sol per extra crew member
  water:  1,    // % per Sol per extra crew member
  power:  0.5,  // % per Sol per extra crew member (fractional, preserved)
  food:   1,    // % per Sol per extra crew member
});

/**
 * Passive radiation exposure increase per Sol, regardless of crew size.
 * Higher radiation is worse; 100 triggers mission failure.
 * GAME SIMULATION value — not a real radiation safety limit.
 *
 * @type {number}
 */
const RADIATION_RISE_PER_SOL = 2; // % per Sol

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Returns `value` if it is a finite number; otherwise returns `fallback`.
 * Protects all arithmetic operations from NaN, Infinity, null, or undefined.
 *
 * @param {*} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
function safeNum(value, fallback = 0) {
  return typeof value === 'number' && isFinite(value) ? value : fallback;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Calculates the resource delta (change) for a single Sol.
 *
 * Returns a plain delta object where:
 *   - Negative values represent resource drain (oxygen, power, food go down).
 *   - Positive values represent resource increase (radiation goes up).
 *
 * Player count is clamped to a minimum of 1 and floored to an integer.
 * If `resources` is provided but unused fields are invalid, `safeNum` handles them
 * downstream in `applyConsumption`.
 *
 * @param {import('../types/game.js').Resources} resources - Current resource levels (unused
 *   directly here but accepted for future rate-modifying logic).
 * @param {number} [playerCount=1] - Number of active crew members (minimum 1).
 * @returns {{ oxygen: number, power: number, food: number, radiation: number }}
 */
export function calculateConsumption(resources, playerCount) {
  // Sanitize: must be a finite number >= 1; floor to integer
  const count = (typeof playerCount === 'number' && isFinite(playerCount) && playerCount >= 1)
    ? Math.floor(playerCount)
    : 1;

  const extra = Math.max(0, count - 1);

  return {
    oxygen:    -(BASE_DRAIN.oxygen + extra * PER_EXTRA_PLAYER_DRAIN.oxygen),
    water:     -(BASE_DRAIN.water  + extra * PER_EXTRA_PLAYER_DRAIN.water),
    power:     -(BASE_DRAIN.power  + extra * PER_EXTRA_PLAYER_DRAIN.power),  // may be fractional
    food:      -(BASE_DRAIN.food   + extra * PER_EXTRA_PLAYER_DRAIN.food),
    radiation:   RADIATION_RISE_PER_SOL, // positive: exposure accumulates each Sol
  };
}

/**
 * Clamps all fields of a Resources object to their valid ranges.
 * Returns a new Resources object created via `createResources()`.
 * Never mutates the input. Treats NaN or non-numeric values as 0.
 *
 * Valid ranges:
 *   - oxygen, water, power, food : [0, 100]
 *   - radiation                  : [0, 100]
 *
 * @param {import('../types/game.js').Resources} resources - Possibly out-of-range resource values.
 * @returns {import('../types/game.js').Resources}
 */
export function clampResources(resources) {
  const src = (resources !== null && typeof resources === 'object') ? resources : {};
  return createResources({
    oxygen:    Math.min(100, Math.max(0, safeNum(src.oxygen,    0))),
    water:     Math.min(100, Math.max(0, safeNum(src.water,     0))),
    power:     Math.min(100, Math.max(0, safeNum(src.power,     0))),
    food:      Math.min(100, Math.max(0, safeNum(src.food,      0))),
    radiation: Math.min(100, Math.max(0, safeNum(src.radiation, 0))),
  });
}

/**
 * Applies a consumption delta to a Resources object and returns a new, clamped copy.
 *
 * Missing or invalid fields in `resources` fall back to `INITIAL_RESOURCES` values.
 * Missing or invalid delta fields are treated as 0 (no change).
 * Never mutates either input.
 *
 * @param {import('../types/game.js').Resources} resources - Current resource levels.
 * @param {{ oxygen?: number, water?: number, power?: number, food?: number, radiation?: number }} delta
 *   - The per-Sol change values, typically from `calculateConsumption()`.
 * @returns {import('../types/game.js').Resources} A new clamped Resources object.
 */
export function applyConsumption(resources, delta) {
  const src = (resources !== null && typeof resources === 'object') ? resources : {};
  const d   = (delta     !== null && typeof delta     === 'object') ? delta     : {};

  return clampResources({
    oxygen:    safeNum(src.oxygen,    INITIAL_RESOURCES.oxygen)    + safeNum(d.oxygen,    0),
    water:     safeNum(src.water,     INITIAL_RESOURCES.water)     + safeNum(d.water,     0),
    power:     safeNum(src.power,     INITIAL_RESOURCES.power)     + safeNum(d.power,     0),
    food:      safeNum(src.food,      INITIAL_RESOURCES.food)      + safeNum(d.food,      0),
    radiation: safeNum(src.radiation, INITIAL_RESOURCES.radiation) + safeNum(d.radiation, 0),
  });
}

/**
 * Validates a power distribution proposal across habitat subsystems.
 *
 * @param {{ lifeSupport: number, greenhouse: number, science: number, aux: number }} allocation
 * @param {number} availablePower - Total power capacity available (0 - 100).
 * @returns {{ valid: boolean, total: number, remaining: number, error: string | null }}
 */
export function validatePowerAllocation(allocation, availablePower = 100) {
  const ls = Math.max(0, safeNum(allocation?.lifeSupport, 0));
  const gh = Math.max(0, safeNum(allocation?.greenhouse, 0));
  const sc = Math.max(0, safeNum(allocation?.science, 0));
  const ax = Math.max(0, safeNum(allocation?.aux, 0));

  const total = ls + gh + sc + ax;
  const maxAvailable = Math.max(0, Math.min(100, safeNum(availablePower, 100)));

  if (total > maxAvailable) {
    return {
      valid: false,
      total,
      remaining: maxAvailable - total,
      error: `Total power allocation (${total} kW) exceeds available generation capacity (${maxAvailable} kW).`,
    };
  }

  if (ls < 20) {
    return {
      valid: false,
      total,
      remaining: maxAvailable - total,
      error: 'Life Support requires at least 20 kW to maintain emergency scrubbers and thermal circulation.',
    };
  }

  return {
    valid: true,
    total,
    remaining: maxAvailable - total,
    error: null,
  };
}

/**
 * Validates water allocation for the greenhouse.
 *
 * @param {number} requestedLitres
 * @param {number} availableWaterLevel
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateWaterAllocation(requestedLitres, availableWaterLevel = 100) {
  const req = safeNum(requestedLitres, 0);
  if (req < 0) {
    return { valid: false, error: 'Water allocation cannot be negative.' };
  }
  if (availableWaterLevel <= 15 && req > 15) {
    return {
      valid: false,
      error: 'Water reserves are critically low! Habitat cannot spare more than 15 L/Sol to crops.',
    };
  }
  return { valid: true, error: null };
}
