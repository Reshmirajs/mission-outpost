import test from 'node:test'
import assert from 'node:assert/strict'
import { getSolClockState, normalizeMissionConfiguration, startSolClock } from './missionConfiguration.js'

test('configuration normalizes invalid values and retains supported choices', () => {
  const config = normalizeMissionConfiguration({
    difficulty: 'challenging', duration: { totalSols: 7, solDurationMinutes: 5, acceleratedMode: true },
    tasks: { tasksPerAstronaut: 4, teamTasksEnabled: false },
    events: { solarFlareFrequency: 'high' },
  })
  assert.equal(config.difficulty, 'challenging')
  assert.deepEqual(config.duration, { totalSols: 7, solDurationMinutes: 5, acceleratedMode: true })
  assert.equal(config.tasks.tasksPerAstronaut, 4)
  assert.equal(config.tasks.teamTasksEnabled, false)
  assert.equal(config.events.solarFlareFrequency, 'high')
  assert.equal(normalizeMissionConfiguration({ duration: { totalSols: -4 } }).duration.totalSols, 1)
})

test('Sol clock uses the configured duration and persists as absolute time', () => {
  const config = normalizeMissionConfiguration({ duration: { totalSols: 3, solDurationMinutes: 10 } })
  const clock = startSolClock(config, 1000)
  assert.equal(clock.startedAt, 1000)
  assert.equal(clock.endsAt, 601000)
  assert.deepEqual(getSolClockState({ round: 1, missionConfiguration: config, solClock: clock }, 301000), {
    currentSol: 1, totalSols: 3, durationSeconds: 600, remainingSeconds: 300, progress: 0.5, rateMultiplier: 1,
  })
})

test('accelerated Sol clock is ten times faster and reports expiry cleanly', () => {
  const config = normalizeMissionConfiguration({ duration: { totalSols: 1, solDurationMinutes: 10, acceleratedMode: true } })
  const clock = startSolClock(config, 5000)
  assert.equal(clock.endsAt - clock.startedAt, 60000)
  assert.equal(getSolClockState({ round: 1, missionConfiguration: config, solClock: clock }, clock.endsAt).remainingSeconds, 0)
  assert.equal(getSolClockState({ round: 1, missionConfiguration: config, solClock: clock }, clock.endsAt).progress, 1)
})
