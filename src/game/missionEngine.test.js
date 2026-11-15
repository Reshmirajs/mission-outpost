import test from 'node:test'
import assert from 'node:assert/strict'
import { completeMissionTask, initMission } from './missionEngine.js'
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
