import test from 'node:test'
import assert from 'node:assert/strict'
import { MISSION_TASKS } from './taskDefinitions.js'
import { assignMissionTasks } from './taskAssignment.js'

const crew = [
  { id: 'commander-1', role: 'Commander', name: 'Ari' },
  { id: 'engineer-1', role: 'Engineer', name: 'Bo' },
  { id: 'botanist-1', role: 'Botanist', name: 'Cy' },
  { id: 'medic-1', role: 'Medic', name: 'Dee' },
  { id: 'scientist-1', role: 'Scientist', name: 'Eli' },
]

test('task library has at least 20 complete task definitions', () => {
  assert.ok(MISSION_TASKS.length >= 20)
  for (const task of MISSION_TASKS) {
    assert.ok(task.id && task.title && task.description && task.role && task.facilityId && task.category)
    assert.ok(task.difficulty && task.completionCondition && task.type)
  }
})

test('mission task selections are seeded, role assigned and bounded per crew member', () => {
  const mission = { missionId: 'mission-seed-A' }
  const first = assignMissionTasks(mission, crew)
  const repeat = assignMissionTasks(mission, crew)
  assert.deepEqual(first, repeat)
  assert.ok(first.tasks.length >= crew.length * 2)
  assert.ok(first.tasks.length <= crew.length * 3)
  for (const player of crew) {
    const personal = first.tasks.filter((task) => task.assignedTo.playerId === player.id)
    assert.ok(personal.length >= 2 && personal.length <= 3)
    assert.ok(personal.every((task) => task.role === ({ Commander: 'Mission Commander', Engineer: 'Power Engineer', Medic: 'Life Support Officer', Scientist: 'Science & Safety Officer' }[player.role] || player.role)))
  }
})

test('different mission IDs produce different task combinations', () => {
  const first = assignMissionTasks({ missionId: 'seed-one' }, crew).tasks.map((task) => task.id).sort()
  const second = assignMissionTasks({ missionId: 'seed-two' }, crew).tasks.map((task) => task.id).sort()
  assert.notDeepEqual(first, second)
})
