/**
 * MISSION: OUTPOST - Voting & Team Decisions Engine
 * NASA Space Apps Challenge 2026 - Person 4: Events & Team Decisions
 *
 * Pure, reusable functions for managing team voting, ballot casting,
 * vote counting, Commander tie-breaking, conservative risk fallbacks,
 * and event resolution.
 *
 * Conforms strictly to:
 * - src/types/game.js (PlayerRoles canonical names)
 * - src/game/resourceManager.js (resource delta conventions:
 *     - oxygen, power, food: negative = drain, positive = gain.
 *     - radiation: positive = increased hazard, negative = reduced hazard.)
 *
 * Pure & safe: Never mutates incoming objects. All calculations use finite numbers.
 */

import { PlayerRoles } from '../../types/game.js';

// ─── Mathematical & Resource Helpers ──────────────────────────────────────────

/**
 * Ensures a value is a finite number, falling back to a default if not.
 *
 * @param {*} value - The value to check.
 * @param {number} [fallback=0] - Safe fallback value.
 * @returns {number} A safe finite number.
 */
function safeNum(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Checks whether a given role string corresponds to the Mission Commander.
 * Supports canonical 'Commander' from PlayerRoles and 'Mission Commander' for compatibility.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function isCommanderRole(role) {
  return role === PlayerRoles.COMMANDER || role === 'Mission Commander';
}

/**
 * Sanitizes a resource delta object, ensuring all four metrics exist and are finite numbers.
 *
 * Resource conventions:
 * - oxygen, power, food: negative indicates consumption/drain, positive indicates replenishment.
 * - radiation: positive indicates increased exposure/danger, negative indicates radiation shielding/reduction.
 *
 * @param {Object} [delta={}]
 * @returns {{ oxygen: number, power: number, food: number, radiation: number }}
 */
export function sanitizeDelta(delta) {
  const src = delta && typeof delta === 'object' ? delta : {};
  return {
    oxygen: safeNum(src.oxygen, 0),
    power: safeNum(src.power, 0),
    food: safeNum(src.food, 0),
    radiation: safeNum(src.radiation, 0),
  };
}

/**
 * Calculates a conservative composite resource risk score for an option's delta.
 *
 * How the fallback calculates resource risk:
 * - Depleting life-support reserves (oxygen, power, food) INCREASES hazard risk.
 *   (e.g., -15 power adds +15 to the risk score).
 * - Gaining life-support reserves REDUCES hazard risk.
 *   (e.g., +10 food subtracts -10 from the risk score).
 * - Increasing radiation exposure INCREASES hazard risk.
 *   (e.g., +12 radiation adds +12 to the risk score).
 * - Reducing radiation exposure REDUCES hazard risk.
 *   (e.g., -5 radiation subtracts -5 from the risk score).
 *
 * Mathematical Formula:
 *   riskScore = (-delta.oxygen) + (-delta.power) + (-delta.food) + (+delta.radiation)
 *
 * In a tie, the option with the LOWEST risk score represents the most conservative,
 * survival-first decision.
 *
 * @param {{ oxygen?: number, power?: number, food?: number, radiation?: number }} delta
 * @returns {number} The composite risk score (finite number).
 */
export function calculateResourceRisk(delta) {
  const d = sanitizeDelta(delta);
  return (-d.oxygen) + (-d.power) + (-d.food) + (+d.radiation);
}

/**
 * Previews the resulting resource state if a given delta is applied to current resources.
 * Clamps all values between 0 and 100 without mutating inputs.
 *
 * @param {Object} currentResources - { oxygen, power, food, radiation }
 * @param {Object} delta - { oxygen, power, food, radiation }
 * @returns {{ oxygen: number, power: number, food: number, radiation: number }}
 */
export function previewResourceOutcome(currentResources, delta) {
  const cur = currentResources && typeof currentResources === 'object' ? currentResources : {};
  const d = sanitizeDelta(delta);

  return {
    oxygen: Math.min(100, Math.max(0, safeNum(cur.oxygen, 100) + d.oxygen)),
    power: Math.min(100, Math.max(0, safeNum(cur.power, 100) + d.power)),
    food: Math.min(100, Math.max(0, safeNum(cur.food, 100) + d.food)),
    radiation: Math.min(100, Math.max(0, safeNum(cur.radiation, 0) + d.radiation)),
  };
}

// ─── Core Voting Functions ───────────────────────────────────────────────────

/**
 * Casts a vote for an option in a voting scenario.
 *
 * Pure function: does not mutate the input scenario.
 * Returns a new scenario object containing the updated ballots.
 *
 * Validation checks:
 * - Scenario must be in 'voting' status.
 * - Player ID must be non-empty and present in `players` (if provided).
 * - Option ID must be one of the valid options for the scenario's event.
 * - Prevents a player from voting more than once unless `options.allowChangeVote` is true.
 *
 * @param {Object} scenario - Current voting scenario.
 * @param {string} playerId - ID of the voting crew member.
 * @param {string} optionId - ID of the selected option.
 * @param {Array<Object>} [players=[]] - Optional crew list for ID verification.
 * @param {Object} [options={}] - Voting configuration options.
 * @param {boolean} [options.allowChangeVote=false] - Whether players can modify an existing ballot.
 * @returns {Object} Result object containing `{ success, error, scenario }` and mirroring scenario properties.
 */
export function castVote(scenario, playerId, optionId, players = [], options = {}) {
  const allowChangeVote = Boolean(options?.allowChangeVote);

  // 1. Guard against null or malformed scenario
  if (!scenario || typeof scenario !== 'object' || !scenario.event) {
    return {
      success: false,
      error: 'INVALID_SCENARIO',
      scenario: scenario || null,
    };
  }

  // 2. Voting must be currently active
  if (scenario.status !== 'voting') {
    return {
      success: false,
      error: `VOTING_NOT_ACTIVE: Scenario status is '${scenario.status}'`,
      scenario,
    };
  }

  // 3. Validate player ID
  if (!playerId || typeof playerId !== 'string') {
    return {
      success: false,
      error: 'INVALID_PLAYER_ID: Player ID must be a non-empty string',
      scenario,
    };
  }

  // If players list provided, player must exist in crew
  if (Array.isArray(players) && players.length > 0) {
    const playerExists = players.some((p) => p && p.id === playerId);
    if (!playerExists) {
      return {
        success: false,
        error: `UNREGISTERED_PLAYER: Player '${playerId}' is not in the active crew manifest`,
        scenario,
      };
    }
  }

  // 4. Validate option ID exists in the event
  const availableOptions = scenario.event.options || [];
  const isValidOption = availableOptions.some((opt) => opt && opt.id === optionId);
  if (!isValidOption) {
    return {
      success: false,
      error: `INVALID_OPTION_ID: '${optionId}' is not a valid option for this event`,
      scenario,
    };
  }

  // 5. Prevent duplicate voting unless explicitly permitted
  const currentBallots = scenario.ballots && typeof scenario.ballots === 'object' ? scenario.ballots : {};
  if (currentBallots[playerId] !== undefined && !allowChangeVote) {
    return {
      success: false,
      error: `ALREADY_VOTED: Player '${playerId}' has already cast a ballot for '${currentBallots[playerId]}'`,
      scenario,
    };
  }

  // 6. Return new scenario copy with updated ballot
  const updatedScenario = {
    ...scenario,
    ballots: {
      ...currentBallots,
      [playerId]: optionId,
    },
  };

  return {
    ...updatedScenario,
    success: true,
    error: null,
    scenario: updatedScenario,
  };
}

/**
 * Counts valid votes for each option in a voting scenario.
 *
 * Ensures:
 * - Every available option in the event is represented in the counts map (defaulting to 0).
 * - Ballots for nonexistent or removed options are ignored.
 * - Ballots from unregistered players are ignored if a `players` list is provided.
 *
 * @param {Object} scenario - Current voting scenario.
 * @param {Array<Object>} [players=[]] - Optional list of valid crew members.
 * @returns {Record<string, number>} Map of option ID to vote count.
 */
export function countVotes(scenario, players = []) {
  if (!scenario || !scenario.event || !Array.isArray(scenario.event.options)) {
    return {};
  }

  // Initialize all available option IDs to 0
  const counts = {};
  for (const option of scenario.event.options) {
    if (option && option.id) {
      counts[option.id] = 0;
    }
  }

  const ballots = scenario.ballots && typeof scenario.ballots === 'object' ? scenario.ballots : {};
  const validPlayerIds = Array.isArray(players) && players.length > 0
    ? new Set(players.map((p) => p.id))
    : null;

  for (const [playerId, optionId] of Object.entries(ballots)) {
    // Skip ballots from unregistered crew members if a crew manifest is supplied
    if (validPlayerIds && !validPlayerIds.has(playerId)) {
      continue;
    }
    // Only tally if the voted option ID exists in this event
    if (Object.prototype.hasOwnProperty.call(counts, optionId)) {
      counts[optionId] += 1;
    }
  }

  return counts;
}

/**
 * Determines the winning option from a voting scenario.
 *
 * Supported Decision Rules (configurable via `options.rule`):
 * 1. Plurality Rule ('plurality', default):
 *    The option receiving the single highest vote count wins outright.
 *    Does not require >50% of the total vote.
 * 2. Strict Majority Rule ('strict_majority' | 'majority'):
 *    An option must achieve a strict majority (>50% of valid votes cast).
 *    If no option exceeds 50%, the outcome is treated as a tie / lack of consensus.
 *
 * Tie-Breaker Hierarchy:
 * - Commander Tie-Breaker: If the Mission Commander voted for one of the tied options,
 *   their vote breaks the tie.
 * - Conservative Fallback: If the Commander has not voted, is absent, or voted for an untied option,
 *   the tied option with the LOWEST composite resource risk score is selected.
 * - Zero votes cast: Falls back to the Commander's vote or the safest conservative option.
 *
 * @param {Object} scenario - Current voting scenario.
 * @param {Array<Object>} [players=[]] - Crew members manifest.
 * @param {Object} [options={}] - Configuration options.
 * @param {'plurality'|'strict_majority'|'majority'} [options.rule='plurality'] - Voting decision rule.
 * @returns {{
 *   winningOptionId: string,
 *   winningOption: Object|null,
 *   isTie: boolean,
 *   tieBrokenBy: string|null,
 *   tiedOptionIds: string[],
 *   voteCounts: Record<string, number>,
 *   ruleUsed: string
 * }}
 */
export function determineWinningOption(scenario, players = [], options = {}) {
  const rule = options?.rule === 'strict_majority' || options?.rule === 'majority'
    ? 'strict_majority'
    : 'plurality';

  if (!scenario || !scenario.event || !Array.isArray(scenario.event.options) || scenario.event.options.length === 0) {
    return {
      winningOptionId: '',
      winningOption: null,
      isTie: false,
      tieBrokenBy: null,
      tiedOptionIds: [],
      voteCounts: {},
      ruleUsed: rule,
    };
  }

  const eventOptions = scenario.event.options;
  const voteCounts = countVotes(scenario, players);

  // Compute total votes cast
  let totalVotes = 0;
  let maxVotes = -1;
  for (const option of eventOptions) {
    const count = voteCounts[option.id] || 0;
    totalVotes += count;
    if (count > maxVotes) {
      maxVotes = count;
    }
  }

  // Find all option IDs that share the maximum vote count
  const topOptionIds = eventOptions
    .filter((opt) => (voteCounts[opt.id] || 0) === maxVotes)
    .map((opt) => opt.id);

  // Evaluate clear winner based on rule
  let hasClearWinner = false;
  if (topOptionIds.length === 1 && maxVotes > 0) {
    if (rule === 'strict_majority') {
      hasClearWinner = maxVotes > totalVotes / 2;
    } else {
      // Plurality: more votes than every other option
      hasClearWinner = true;
    }
  }

  // Case 1: Clear winner
  if (hasClearWinner) {
    const winnerId = topOptionIds[0];
    const winningOption = eventOptions.find((opt) => opt.id === winnerId) || null;
    return {
      winningOptionId: winnerId,
      winningOption,
      isTie: false,
      tieBrokenBy: null,
      tiedOptionIds: [],
      voteCounts,
      ruleUsed: rule,
    };
  }

  // Case 2: Deadlock / Tie (or lack of strict majority, or 0 votes cast)
  const tiedOptionIds = topOptionIds.length > 0 ? topOptionIds : eventOptions.map((opt) => opt.id);

  // Check for Mission Commander tie-breaker
  const commander = findCommander(players);
  const commanderVote = commander && scenario.ballots ? scenario.ballots[commander.id] : null;

  if (commanderVote && tiedOptionIds.includes(commanderVote)) {
    const winningOption = eventOptions.find((opt) => opt.id === commanderVote) || null;
    return {
      winningOptionId: commanderVote,
      winningOption,
      isTie: true,
      tieBrokenBy: `Commander (${commander.name || 'Mission Commander'})`,
      tiedOptionIds,
      voteCounts,
      ruleUsed: rule,
    };
  }

  // Fallback: Select the tied option with the lowest overall resource risk score
  let lowestRiskScore = Infinity;
  let safestOption = null;

  for (const optionId of tiedOptionIds) {
    const opt = eventOptions.find((o) => o.id === optionId);
    if (!opt) continue;

    const riskScore = calculateResourceRisk(opt.delta);
    if (riskScore < lowestRiskScore) {
      lowestRiskScore = riskScore;
      safestOption = opt;
    }
  }

  // Fallback default: if risk scores are identical, pick the first tied option
  const fallbackOption = safestOption || eventOptions.find((o) => o.id === tiedOptionIds[0]) || eventOptions[0];

  return {
    winningOptionId: fallbackOption.id,
    winningOption: fallbackOption,
    isTie: true,
    tieBrokenBy: 'Conservative Risk Fallback (Lowest Hazard Impact)',
    tiedOptionIds,
    voteCounts,
    ruleUsed: rule,
  };
}

/**
 * Resolves an active voting scenario into a final decision outcome.
 *
 * Pure function:
 * - Does not mutate the input scenario.
 * - Does not modify external mission state.
 * - Prevents an already resolved event from being resolved again.
 * - Prevents resolution while voting is active and incomplete unless:
 *   a) All connected crew members have voted (`hasAllCrewVoted`).
 *   b) The voting timer has expired (`hasVotingExpired`).
 *   c) An explicit override (`options.force: true`) is provided.
 *
 * @param {Object} scenario - The voting scenario to resolve.
 * @param {Array<Object>} [players=[]] - Active crew list.
 * @param {Object} [options={}] - Resolution options.
 * @param {boolean} [options.force=false] - Whether to force early resolution before all votes are in or timer expires.
 * @param {number} [options.currentTime] - Optional deterministic timestamp (defaults to Date.now()).
 * @param {'plurality'|'strict_majority'|'majority'} [options.rule='plurality'] - Voting decision rule.
 * @returns {Object} Result object containing:
 *   - success: boolean
 *   - scenario: new resolved scenario object
 *   - selectedOption: full option object that won
 *   - delta: sanitized resource delta to be applied
 *   - tieBrokenBy: string or null
 *   - error?: string if resolution failed
 */
export function resolveEvent(scenario, players = [], options = {}) {
  if (!scenario || typeof scenario !== 'object' || !scenario.event) {
    return {
      success: false,
      error: 'INVALID_SCENARIO: Missing scenario or event data',
      scenario: scenario || null,
      selectedOption: null,
      delta: sanitizeDelta(null),
      tieBrokenBy: null,
    };
  }

  // Prevent resolving an already resolved event
  if (scenario.status === 'resolved') {
    return {
      success: false,
      error: 'ALREADY_RESOLVED: This event has already been resolved',
      scenario,
      selectedOption: scenario.winningOption || null,
      delta: sanitizeDelta(scenario.appliedDelta),
      tieBrokenBy: scenario.tieBrokenBy || null,
    };
  }

  const currentTime = typeof options?.currentTime === 'number' ? options.currentTime : Date.now();
  const allowEarlyForce = Boolean(options?.force);

  // Prevent resolution while voting is still active and incomplete
  const allVoted = hasAllCrewVoted(scenario, players);
  const expired = hasVotingExpired(scenario, currentTime);

  if (!allVoted && !expired && !allowEarlyForce) {
    return {
      success: false,
      error: 'VOTING_INCOMPLETE: Cannot resolve event while voting is active and unexpired (pass { force: true } to override)',
      scenario,
      selectedOption: null,
      delta: sanitizeDelta(null),
      tieBrokenBy: null,
    };
  }

  const resolution = determineWinningOption(scenario, players, options);
  const selectedOption = resolution.winningOption;

  if (!selectedOption) {
    return {
      success: false,
      error: 'NO_WINNING_OPTION: Could not determine a winning option for this event',
      scenario,
      selectedOption: null,
      delta: sanitizeDelta(null),
      tieBrokenBy: null,
    };
  }

  const delta = sanitizeDelta(selectedOption.delta);

  const resolvedScenario = {
    ...scenario,
    status: 'resolved',
    resolvedOptionId: selectedOption.id,
    winningOption: selectedOption,
    appliedDelta: delta,
    tieBrokenBy: resolution.tieBrokenBy,
    timeRemainingSeconds: 0,
    resolvedAt: currentTime,
  };

  return {
    ...resolvedScenario,
    success: true,
    error: null,
    scenario: resolvedScenario,
    selectedOption,
    delta,
    tieBrokenBy: resolution.tieBrokenBy,
  };
}

// ─── Crew & Voting Status Helpers ────────────────────────────────────────────

/**
 * Finds the Mission Commander from a crew array.
 *
 * @param {Array<Object>} players - List of crew members.
 * @returns {Object|null} The Commander player object, or null if not found.
 */
export function findCommander(players) {
  if (!Array.isArray(players)) return null;
  return players.find((p) => p && isCommanderRole(p.role)) || null;
}

/**
 * Checks whether all connected crew members have submitted a ballot.
 *
 * @param {Object} scenario - Current voting scenario.
 * @param {Array<Object>} players - List of connected crew members.
 * @returns {boolean} True if every player has a recorded vote in `ballots`.
 */
export function hasAllCrewVoted(scenario, players) {
  if (!scenario || !Array.isArray(players) || players.length === 0) {
    return false;
  }
  const ballots = scenario.ballots && typeof scenario.ballots === 'object' ? scenario.ballots : {};
  return players.every((player) => player && player.id && ballots[player.id] !== undefined);
}

/**
 * Checks whether a voting scenario has expired.
 *
 * Pure when `currentTime` is supplied.
 * Checks:
 * - Scenario status is 'expired'.
 * - `timeRemainingSeconds` <= 0.
 * - `expiresAt` timestamp is in the past compared to `currentTime`.
 *
 * @param {Object} scenario - Voting scenario to check.
 * @param {number} [currentTime=Date.now()] - Timestamp used for comparison (allows pure deterministic testing).
 * @returns {boolean} True if the voting period has expired.
 */
export function hasVotingExpired(scenario, currentTime = Date.now()) {
  if (!scenario || typeof scenario !== 'object') {
    return false;
  }
  if (scenario.status === 'expired') {
    return true;
  }
  if (typeof scenario.timeRemainingSeconds === 'number' && scenario.timeRemainingSeconds <= 0) {
    return true;
  }
  if (typeof scenario.expiresAt === 'number' && currentTime >= scenario.expiresAt) {
    return true;
  }
  return false;
}

/**
 * Generates a detailed breakdown of the voting state, including voter rosters,
 * percentages, and remaining non-voters.
 *
 * @param {Object} scenario - Current voting scenario.
 * @param {Array<Object>} [players=[]] - Crew members list.
 * @returns {Object} Comprehensive vote analytics.
 */
export function getVoteBreakdown(scenario, players = []) {
  if (!scenario || !scenario.event || !Array.isArray(scenario.event.options)) {
    return {
      totalVotes: 0,
      counts: {},
      percentages: {},
      votersByOption: {},
      nonVoters: [],
      leadingOptionId: null,
      isTie: false,
    };
  }

  const counts = countVotes(scenario, players);
  const options = scenario.event.options;
  const ballots = scenario.ballots && typeof scenario.ballots === 'object' ? scenario.ballots : {};
  const safePlayers = Array.isArray(players) ? players : [];

  let totalVotes = 0;
  for (const count of Object.values(counts)) {
    totalVotes += count;
  }

  const percentages = {};
  const votersByOption = {};
  for (const option of options) {
    const count = counts[option.id] || 0;
    percentages[option.id] = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    votersByOption[option.id] = [];
  }

  // Populate voters by option
  for (const [playerId, optionId] of Object.entries(ballots)) {
    if (votersByOption[optionId]) {
      const player = safePlayers.find((p) => p.id === playerId);
      votersByOption[optionId].push(
        player || { id: playerId, name: 'Unknown Astronaut', role: PlayerRoles.UNASSIGNED }
      );
    }
  }

  // Identify crew members who have not voted
  const nonVoters = safePlayers.filter((p) => p && p.id && ballots[p.id] === undefined);

  // Find leading option
  let maxCount = -1;
  let leadingId = null;
  let isTie = false;

  for (const [optId, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      leadingId = optId;
      isTie = false;
    } else if (count === maxCount && count > 0) {
      isTie = true;
    }
  }

  return {
    totalVotes,
    counts,
    percentages,
    votersByOption,
    nonVoters,
    leadingOptionId: isTie ? null : leadingId,
    isTie,
  };
}

/**
 * Creates a fresh active voting scenario for a selected event.
 *
 * @param {Object} event - The crisis event from EVENTS_CATALOG.
 * @param {number} [durationSeconds=60] - Initial voting deliberation duration in seconds.
 * @returns {Object} A fresh voting scenario object in 'voting' status.
 */
export function createScenarioFromEvent(event, durationSeconds = 60) {
  return {
    id: `scenario-${event?.id || 'event'}-${Date.now()}`,
    label: event?.title || 'Martian Emergency Protocol',
    event,
    status: 'voting',
    timeRemainingSeconds: durationSeconds,
    totalSeconds: durationSeconds,
    ballots: {},
    resolvedOptionId: null,
    tieBrokenBy: null,
  };
}

