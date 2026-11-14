import assert from 'node:assert/strict'
import test from 'node:test'
import { demoMissionHistoryCases } from './demoMissionHistory.js'
import { createMissionHistoryAdapter, normalizeMissionHistoryResponse } from './missionHistoryService.js'

function fixture(id) {
  return demoMissionHistoryCases.find((item) => item.id === id)
}

test('complete history fixture normalizes as complete', () => {
  const result = normalizeMissionHistoryResponse(fixture('complete').result)
  assert.equal(result.status, 'complete')
  assert.equal(result.history.completeness.solSnapshots, 'complete')
  assert.equal(result.history.solSnapshots.length, 3)
})

test('partial fixture retains known records and marks unavailable sections', () => {
  const result = normalizeMissionHistoryResponse(fixture('partial').result)
  assert.equal(result.status, 'partial')
  assert.equal(result.history.events.length, 1)
  assert.equal(result.history.completeness.objectives, 'missing')
  assert.equal(result.history.objectives, null)
})

test('missing history stays missing instead of becoming empty complete history', () => {
  const result = normalizeMissionHistoryResponse(fixture('missing').result)
  assert.equal(result.status, 'missing')
  assert.equal(result.history, null)
})

test('empty arrays are confirmed empty only when their completeness is complete', () => {
  const result = normalizeMissionHistoryResponse(fixture('empty-complete').result)
  assert.equal(result.status, 'complete')
  assert.deepEqual(result.history.events, [])
  assert.equal(result.history.completeness.events, 'complete')
  const incompleteEmpty = normalizeMissionHistoryResponse({
    status: 'partial',
    history: {
      mission: { missionId: 'partial-empty' },
      historyStatus: 'incomplete',
      events: [],
      completeness: { events: 'missing' },
    },
  })
  assert.equal(incompleteEmpty.status, 'partial')
  assert.equal(incompleteEmpty.history.completeness.events, 'missing')
})

test('an actual zero resource value is preserved as zero', () => {
  const result = normalizeMissionHistoryResponse(fixture('zero-resources').result)
  assert.equal(result.status, 'complete')
  assert.equal(result.history.solSnapshots[0].resources.oxygen, 0)
})

test('adapter reports unavailable when no Person 5 reader is connected', async () => {
  const readHistory = createMissionHistoryAdapter()
  const result = await readHistory('mission-123')
  assert.equal(result.status, 'unavailable')
  assert.equal(result.history, null)
})
