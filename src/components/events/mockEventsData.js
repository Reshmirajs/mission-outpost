/**
 * MISSION: OUTPOST - Mock Events & Voting Data
 * NASA Space Apps Challenge 2026 - Person 4: Events & Team Decisions
 *
 * Provides realistic Mars mission event states, voting scenarios, crew ballots,
 * and historical logs for standalone preview, unit testing, and UI integration.
 */

import { PlayerRoles } from '../../types/game.js';
import { EVENTS_CATALOG, getEventById } from './eventsCatalog.js';

/**
 * Standard 5-member astronaut crew matching canonical roles from src/types/game.js.
 */
export const mockCrewMembers = Object.freeze([
  {
    id: 'p1',
    name: 'Sarah Chen',
    role: PlayerRoles.COMMANDER,
    avatar: '👨‍🚀',
    ready: true,
  },
  {
    id: 'p2',
    name: 'Alex Rivera',
    role: PlayerRoles.ENGINEER,
    avatar: '👩‍🚀',
    ready: true,
  },
  {
    id: 'p3',
    name: 'Dr. Maya Patel',
    role: PlayerRoles.BOTANIST,
    avatar: '👨‍🔬',
    ready: true,
  },
  {
    id: 'p4',
    name: 'Liam Vance',
    role: PlayerRoles.MEDIC,
    avatar: '🧑‍⚕️',
    ready: true,
  },
  {
    id: 'p5',
    name: 'Elena Rostova',
    role: PlayerRoles.SCIENTIST,
    avatar: '👩‍🔬',
    ready: true,
  },
]);

/**
 * Default active event for standalone preview and immediate testing.
 */
export const mockActiveEvent = getEventById('evt-solar-particle') || EVENTS_CATALOG[2];

/**
 * Secondary active event (Dust Storm).
 */
export const mockSecondaryEvent = getEventById('evt-dust-storm') || EVENTS_CATALOG[0];

/**
 * Comprehensive set of mock voting scenarios covering all decision lifecycle stages.
 */
export const mockVotingScenarios = Object.freeze({
  /**
   * Scenario 1: Fresh event, only 1 ballot cast, countdown timer active.
   */
  pending: {
    id: 'scenario-pending',
    label: 'Voting Just Started',
    event: getEventById('evt-dust-storm') || EVENTS_CATALOG[0],
    status: 'voting',
    timeRemainingSeconds: 45,
    totalSeconds: 60,
    ballots: {
      p1: 'opt-dust-sweep', // Commander voted
    },
    resolvedOptionId: null,
    tieBrokenBy: null,
  },

  /**
   * Scenario 2: Active deliberation, 3 of 5 crew members have cast ballots.
   */
  inProgress: {
    id: 'scenario-in-progress',
    label: 'Deliberation In Progress (3/5 Voted)',
    event: getEventById('evt-solar-particle') || EVENTS_CATALOG[2],
    status: 'voting',
    timeRemainingSeconds: 24,
    totalSeconds: 60,
    ballots: {
      p1: 'opt-spe-shelter',   // Commander
      p2: 'opt-spe-magnetic',  // Engineer
      p5: 'opt-spe-shelter',   // Scientist
    },
    resolvedOptionId: null,
    tieBrokenBy: null,
  },

  /**
   * Scenario 3: Deadlock / Tie scenario!
   * 2 votes for opt-grid-reroute, 2 votes for opt-grid-curtail.
   * Sarah Chen (p1 Commander) voted for opt-grid-reroute, triggering the tie-breaker rule.
   */
  tied: {
    id: 'scenario-tied',
    label: 'Deadlocked Vote (Commander Tie-Breaker)',
    event: getEventById('evt-power-grid-failure') || EVENTS_CATALOG[4],
    status: 'voting',
    timeRemainingSeconds: 8,
    totalSeconds: 60,
    ballots: {
      p1: 'opt-grid-reroute', // Commander (tie-breaker weight)
      p2: 'opt-grid-reroute', // Engineer
      p3: 'opt-grid-curtail', // Botanist
      p4: 'opt-grid-curtail', // Medic
      // p5 has not voted or abstained
    },
    resolvedOptionId: null,
    tieBrokenBy: null,
  },

  /**
   * Scenario 4: Voting finalized, winner determined, delta calculated.
   */
  resolved: {
    id: 'scenario-resolved',
    label: 'Decision Resolved & Delta Ready',
    event: getEventById('evt-coronal-mass-ejection') || EVENTS_CATALOG[3],
    status: 'resolved',
    timeRemainingSeconds: 0,
    totalSeconds: 60,
    ballots: {
      p1: 'opt-cme-ground',
      p2: 'opt-cme-ground',
      p3: 'opt-cme-science',
      p4: 'opt-cme-ground',
      p5: 'opt-cme-science',
    },
    resolvedOptionId: 'opt-cme-ground',
    tieBrokenBy: null,
    appliedDelta: { oxygen: 0, power: -16, food: 0, radiation: +8 },
  },

  /**
   * Scenario 5: Emergency crisis event with urgent countdown.
   */
  emergency: {
    id: 'scenario-emergency',
    label: 'Critical Hull Breach (Urgent Countdown)',
    event: getEventById('evt-pressure-drop') || EVENTS_CATALOG[1],
    status: 'voting',
    timeRemainingSeconds: 12,
    totalSeconds: 30,
    ballots: {
      p2: 'opt-pressure-bulkhead', // Engineer
      p4: 'opt-pressure-scrubbers', // Medic
    },
    resolvedOptionId: null,
    tieBrokenBy: null,
  },
});

/**
 * Historical archive of past Sol decisions and outcomes.
 */
export const mockEventHistory = Object.freeze([
  {
    sol: 3,
    eventId: 'evt-crop-disease',
    title: 'Hydroponics Bacterial Blight Outbreak',
    selectedOptionTitle: 'Cull Infected Bays & Plant Fast-Growing Microgreens',
    votedBy: 'Majority (4 / 5)',
    appliedDelta: { oxygen: -4, power: -8, food: -10, radiation: 0 },
    summary: 'Botanist Dr. Patel isolated the blight, saving 60% of the greenhouse yield.',
  },
  {
    sol: 7,
    eventId: 'evt-distress-beacon',
    title: 'Automated Distress Beacon from Chryse Planitia',
    selectedOptionTitle: 'Deploy Autonomous Tethered Scout Drone',
    votedBy: 'Unanimous (5 / 5)',
    appliedDelta: { oxygen: 0, power: -12, food: +4, radiation: 0 },
    summary: 'The drone recovered sealed nutrient ration containers from a derelict surveyor lander.',
  },
]);
