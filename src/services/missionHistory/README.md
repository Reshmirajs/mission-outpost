# Mission History Contract (Provisional)

This contract is a Person 6 report-side adapter proposal. It is **not evidence that Persons 3, 4, or 5 have adopted or implemented it**. The current shared mission engine and Firebase code do not provide persisted completed mission history.

## Read integration point

The report calls `getMissionHistory(missionId)` from `src/services/missionHistory/missionHistoryService.js`. Until a provider is connected it returns `status: "unavailable"`. When Person 5 exposes a read-only `getMissionHistory(missionId)` function, connect it once with `connectMissionHistoryProvider(person5GetMissionHistory)`. That provider should retrieve one fully persisted mission record and return the structure below; it must not return only current live game state as past history.

## Proposed response

```js
{
  schemaVersion: 1,
  historyStatus: "complete" | "incomplete",
  mission: {
    missionId, roomCode, startedAt, endedAt,
    status: "completed" | "failed" | "abandoned" | "unknown"
  },
  crew: [{ playerId, name, role, joinedAt, leftAt, finalStatus }],
  solSnapshots: [{ snapshotId, sol, recordedAt,
    resources: { oxygen, power, food, radiation } }],
  completedTasks: [{ taskId, title, sol, completedAt,
    completedBy: [{ playerId, role }] }],
  objectives: [{ objectiveId, title, category, status, updatedAt, completedAt }],
  events: [{ eventId, type, sol, occurredAt, resolvedAt,
    affectedPlayers: [{ playerId, name, role }], outcome, summary }],
  decisions: [{ decisionId, eventId, sol, prompt, openedAt, closedAt,
    votes: [{ playerId, role, optionId, submittedAt }], outcome }],
  completeness: {
    crew: "complete" | "partial" | "missing",
    solSnapshots: "complete" | "partial" | "missing",
    completedTasks: "complete" | "partial" | "missing",
    objectives: "complete" | "partial" | "missing",
    events: "complete" | "partial" | "missing",
    decisions: "complete" | "partial" | "missing"
  }
}
```

`complete` means the source confirms the whole section was recorded; a complete empty array means there were no records. `partial` means some records exist but the section may be incomplete. `missing` means the source cannot confirm the section. Do not replace absent values with zero or infer prior Sol values from current resources.

## Ownership proposal

- Person 3: emit and persist Sol resource snapshots, completed tasks, objectives, mission metadata, and final outcome.
- Person 4: emit and persist emergency/trap incidents, rescue attempts, successful rescues, eliminations, timestamps, affected players, and outcomes.
- Person 5: persist/synchronize the full history and expose the retrieval function used by the adapter.
- Person 6: normalize read results and render the report; no shared engine or Firebase writes.

This proposal requires agreement and implementation from the respective owners before it can be treated as a live contract.

## Demo fixtures and NASA boundary

`demoMissionHistory.js` contains labelled fictional test cases for complete, partial, missing, empty-complete, and actual-zero resources. The report shows a persistent demo warning when those fixtures are selected. NASA DONKI observations and Mars imagery are shown separately as NASA science context and never populate simulated mission history.
