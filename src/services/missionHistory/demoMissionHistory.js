import { HISTORY_SECTIONS } from './missionHistoryService.js'

const completeSections = Object.fromEntries(HISTORY_SECTIONS.map((section) => [section, 'complete']))
const emptyCollections = Object.fromEntries(HISTORY_SECTIONS.map((section) => [section, []]))
const emptyCompleteness = Object.fromEntries(HISTORY_SECTIONS.map((section) => [section, 'complete']))

const completeHistory = {
  schemaVersion: 1,
  historyStatus: 'complete',
  mission: {
    missionId: 'DEMO-COMPLETE-01',
    roomCode: 'DEMO01',
    startedAt: '2026-04-01T08:00:00.000Z',
    endedAt: '2026-04-03T08:00:00.000Z',
    status: 'completed',
  },
  crew: [
    { playerId: 'demo-p1', name: 'Ari Vega', role: 'Mission Commander', joinedAt: '2026-04-01T08:00:00.000Z', leftAt: null, finalStatus: 'active' },
    { playerId: 'demo-p2', name: 'Mina Okafor', role: 'Power Engineer', joinedAt: '2026-04-01T08:05:00.000Z', leftAt: null, finalStatus: 'active' },
    { playerId: 'demo-p3', name: 'Noah Kim', role: 'Botanist', joinedAt: '2026-04-01T08:06:00.000Z', leftAt: null, finalStatus: 'rescued' },
  ],
  solSnapshots: [
    { snapshotId: 'demo-sol-001', sol: 1, recordedAt: '2026-04-01T20:00:00.000Z', resources: { oxygen: 95, power: 92, food: 96, radiation: 2 } },
    { snapshotId: 'demo-sol-002', sol: 2, recordedAt: '2026-04-02T20:00:00.000Z', resources: { oxygen: 89, power: 84, food: 91, radiation: 5 } },
    { snapshotId: 'demo-sol-003', sol: 3, recordedAt: '2026-04-03T08:00:00.000Z', resources: { oxygen: 82, power: 77, food: 85, radiation: 8 } },
  ],
  completedTasks: [
    { taskId: 'demo-task-1', title: 'Inspect the generator', sol: 1, completedAt: '2026-04-01T13:00:00.000Z', completedBy: [{ playerId: 'demo-p2', role: 'Power Engineer' }] },
    { taskId: 'demo-task-2', title: 'Check the hydroponics beds', sol: 2, completedAt: '2026-04-02T12:00:00.000Z', completedBy: [{ playerId: 'demo-p3', role: 'Botanist' }] },
  ],
  objectives: [
    { objectiveId: 'demo-objective-1', title: 'Stabilize habitat power', category: 'Power', status: 'completed', updatedAt: '2026-04-01T13:00:00.000Z', completedAt: '2026-04-01T13:00:00.000Z', completedBy: [{ playerId: 'demo-p2', role: 'Power Engineer' }] },
    { objectiveId: 'demo-objective-2', title: 'Maintain crew provisions', category: 'Life support', status: 'active', updatedAt: '2026-04-03T08:00:00.000Z', completedAt: null, completedBy: [] },
  ],
  events: [
    { eventId: 'demo-event-1', type: 'emergency', sol: 2, occurredAt: '2026-04-02T09:15:00.000Z', resolvedAt: '2026-04-02T10:00:00.000Z', affectedPlayers: [{ playerId: 'demo-p1', role: 'Mission Commander' }], outcome: 'resolved', summary: 'A simulated habitat alert was resolved.' },
    { eventId: 'demo-event-2', type: 'trap_incident', sol: 2, occurredAt: '2026-04-02T11:00:00.000Z', resolvedAt: '2026-04-02T11:20:00.000Z', affectedPlayers: [{ playerId: 'demo-p3', role: 'Botanist' }], outcome: 'resolved', summary: 'A demo trap incident was cleared.' },
    { eventId: 'demo-event-3', type: 'rescue_attempt', sol: 2, occurredAt: '2026-04-02T11:05:00.000Z', resolvedAt: '2026-04-02T11:20:00.000Z', affectedPlayers: [{ playerId: 'demo-p3', role: 'Botanist' }], actorPlayers: [{ playerId: 'demo-p1', role: 'Mission Commander' }], outcome: 'succeeded', summary: 'A simulated rescue attempt succeeded.' },
    { eventId: 'demo-event-4', type: 'rescue', sol: 2, occurredAt: '2026-04-02T11:20:00.000Z', resolvedAt: '2026-04-02T11:20:00.000Z', affectedPlayers: [{ playerId: 'demo-p3', role: 'Botanist' }], actorPlayers: [{ playerId: 'demo-p1', role: 'Mission Commander' }], outcome: 'succeeded', summary: 'The crew member was rescued in the demo scenario.' },
  ],
  decisions: [
    { decisionId: 'demo-decision-1', eventId: 'demo-event-1', sol: 2, prompt: 'Prioritize a power check or a crop check?', openedAt: '2026-04-02T09:20:00.000Z', closedAt: '2026-04-02T09:30:00.000Z', votes: [{ playerId: 'demo-p1', role: 'Mission Commander', optionId: 'power', submittedAt: '2026-04-02T09:22:00.000Z' }, { playerId: 'demo-p2', role: 'Power Engineer', optionId: 'power', submittedAt: '2026-04-02T09:25:00.000Z' }], outcome: { selectedOptionId: 'power', summary: 'Power check selected in demo data.' } },
  ],
  completeness: completeSections,
}

const partialHistory = {
  schemaVersion: 1,
  historyStatus: 'incomplete',
  mission: { missionId: 'DEMO-PARTIAL-01', roomCode: 'DEMO02', startedAt: '2026-04-04T08:00:00.000Z', endedAt: '2026-04-05T08:00:00.000Z', status: 'failed' },
  crew: [{ playerId: 'demo-p4', name: 'Sol Reyes', role: 'Science & Safety Officer', joinedAt: '2026-04-04T08:00:00.000Z', leftAt: null, finalStatus: 'active' }],
  solSnapshots: [{ snapshotId: 'demo-partial-sol-001', sol: 1, recordedAt: '2026-04-04T20:00:00.000Z', resources: { oxygen: 61, power: 43, food: 70, radiation: 12 } }],
  completedTasks: [],
  objectives: null,
  events: [{ eventId: 'demo-partial-event-1', type: 'emergency', sol: 2, occurredAt: '2026-04-05T07:00:00.000Z', resolvedAt: null, affectedPlayers: [], outcome: 'unresolved', summary: 'Partial demo event record.' }],
  decisions: null,
  completeness: { crew: 'complete', solSnapshots: 'partial', completedTasks: 'complete', objectives: 'missing', events: 'partial', decisions: 'missing' },
}

const emptyCompleteHistory = {
  schemaVersion: 1,
  historyStatus: 'complete',
  mission: { missionId: 'DEMO-EMPTY-01', roomCode: 'DEMO03', startedAt: '2026-04-06T08:00:00.000Z', endedAt: '2026-04-06T09:00:00.000Z', status: 'completed' },
  ...emptyCollections,
  completeness: emptyCompleteness,
}

const zeroResourceHistory = {
  schemaVersion: 1,
  historyStatus: 'complete',
  mission: { missionId: 'DEMO-ZERO-01', roomCode: 'DEMO04', startedAt: '2026-04-07T08:00:00.000Z', endedAt: '2026-04-07T20:00:00.000Z', status: 'failed' },
  crew: [{ playerId: 'demo-p5', name: 'Ivo Malik', role: 'Life Support Officer', joinedAt: '2026-04-07T08:00:00.000Z', leftAt: null, finalStatus: 'active' }],
  solSnapshots: [{ snapshotId: 'demo-zero-sol-001', sol: 1, recordedAt: '2026-04-07T20:00:00.000Z', resources: { oxygen: 0, power: 25, food: 40, radiation: 70 } }],
  completedTasks: [],
  objectives: [],
  events: [],
  decisions: [],
  completeness: completeSections,
}

export const demoMissionHistoryCases = [
  {
    id: 'complete',
    label: 'Complete history',
    result: { status: 'complete', history: completeHistory },
  },
  {
    id: 'partial',
    label: 'Partial history',
    result: { status: 'partial', history: partialHistory },
  },
  {
    id: 'missing',
    label: 'Missing history',
    result: { status: 'missing', history: null, message: 'The demo fixture has no mission history.' },
  },
  {
    id: 'empty-complete',
    label: 'Empty but complete task and event lists',
    result: { status: 'complete', history: emptyCompleteHistory },
  },
  {
    id: 'zero-resources',
    label: 'Recorded zero resource values',
    result: { status: 'complete', history: zeroResourceHistory },
  },
]

export function getDemoMissionHistoryCase(caseId) {
  return demoMissionHistoryCases.find((fixture) => fixture.id === caseId) || demoMissionHistoryCases[0]
}
