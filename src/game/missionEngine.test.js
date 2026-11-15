import test from 'node:test'
import assert from 'node:assert/strict'
import { completeMissionTask, endMissionSol, initMission } from './missionEngine.js'
import { MissionStatus } from '../types/game.js'

const crew = [{ id: 'p-1', name: 'Rin', role: 'Commander' }]

test('a verified task applies its simulated resource delta and records the contributor', () => {
  const mission = { ...initMission({ players: crew, targetSols: 8 }), resources: { oxygen: 100, power: 40, food: 100, radiation: 0 } }
  const result = completeMissionTask(mission, {
    taskId: 'repair-power',
    title: 'Repair power',
    playerId: 'p-1',
    role: 'Power Engineer',
    resourceDelta: { power: 12 },
    completedAt: '2026-11-15T00:00:00.000Z',
  })

  assert.equal(result.applied, true)
  assert.equal(result.mission.resources.power, 52)
  assert.equal(result.mission.completedTasks[0].taskId, 'repair-power')
  assert.deepEqual(result.mission.completedTasks[0].completedBy, [{ playerId: 'p-1', role: 'Power Engineer' }])
  assert.equal(mission.completedTasks, undefined)
})

test('a task cannot grant its resource delta more than once', () => {
  const mission = initMission({ players: crew })
  const task = { taskId: 'restore-food', playerId: 'p-1', role: 'Botanist', resourceDelta: { food: 15 } }
  const first = completeMissionTask(mission, task)
  const second = completeMissionTask(first.mission, task)

  assert.equal(first.applied, true)
  assert.equal(second.applied, false)
  assert.equal(second.mission.resources.food, first.mission.resources.food)
  assert.equal(second.mission.completedTasks.length, 1)
})

test('terminal missions reject task rewards', () => {
  const mission = { ...initMission({ players: crew }), status: MissionStatus.FAILED }
  const result = completeMissionTask(mission, { taskId: 'late-task', resourceDelta: { oxygen: 20 } })
  assert.equal(result.applied, false)
  assert.equal(result.mission.resources.oxygen, mission.resources.oxygen)
})


test('ending a Sol records the Sol that just ended and completes after configured total', () => {
  const mission = initMission({ players: crew, targetSols: 2, round: 1 })
  const first = endMissionSol(mission, { totalSols: 2, randomFn: () => 0 })
  assert.equal(first.round, 2)
  assert.equal(first.status, MissionStatus.IN_PROGRESS)
  assert.equal(first.history.at(-1).sol, 1)

  const final = endMissionSol(first, { totalSols: 2, randomFn: () => 0 })
  assert.equal(final.round, 2)
  assert.equal(final.status, MissionStatus.COMPLETED)
  assert.equal(final.history.at(-1).sol, 2)
  assert.equal(final.history.length, 2)
})

test('ending a mission Sol preserves configuration and timer metadata through engine factories', () => {
  const mission = initMission({
    players: crew,
    targetSols: 2,
    missionConfiguration: { duration: { totalSols: 2 } },
    solClock: { startedAt: 10, endsAt: 20, durationSeconds: 10, rateMultiplier: 1 },
  })
  const next = endMissionSol(mission, { totalSols: 2, randomFn: () => 0 })
  assert.deepEqual(next.missionConfiguration, mission.missionConfiguration)
  assert.deepEqual(next.solClock, mission.solClock)
})
