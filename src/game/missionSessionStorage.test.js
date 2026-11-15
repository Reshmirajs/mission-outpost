import test from 'node:test'
import assert from 'node:assert/strict'
import { clearLocalMissionSession, loadLocalMissionSession, saveLocalMissionSession } from './missionSessionStorage.js'

const data = new Map()
globalThis.window = {
  localStorage: {
    getItem(key) { return data.get(key) || null },
    setItem(key, value) { data.set(key, value) },
    removeItem(key) { data.delete(key) },
  },
}

test('active mission configuration and absolute Sol deadline survive reload reads', () => {
  const mission = {
    missionId: 'local-test-1',
    status: 'in_progress',
    round: 2,
    missionConfiguration: { duration: { totalSols: 5, solDurationMinutes: 4, acceleratedMode: true } },
    solClock: { startedAt: 10, endsAt: 25000, durationSeconds: 240, rateMultiplier: 10 },
  }
  assert.equal(saveLocalMissionSession(mission), true)
  assert.deepEqual(loadLocalMissionSession(), mission)
})

test('terminal missions are not restored as active sessions', () => {
  saveLocalMissionSession({ missionId: 'finished', status: 'completed' })
  assert.equal(loadLocalMissionSession(), null)
  clearLocalMissionSession()
  assert.equal(data.size, 0)
})
