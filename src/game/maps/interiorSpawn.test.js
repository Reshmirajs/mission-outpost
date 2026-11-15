import test from 'node:test'
import assert from 'node:assert/strict'
import { HABITAT_LAYOUT } from './habitatLayout.js'
import { FACILITIES } from './marsWorldLayout.js'
import { findNearestSafeSpawn, resolveInteriorSpawn } from './interiorSpawn.js'
import { getFacilityInteriorColliders, getFacilityInteriorEquipment } from './facilityInteriorDetails.js'
import { INTERACTIVE_STATIONS } from './stationDefinitions.js'
import { MISSION_TASKS } from '../tasks/taskDefinitions.js'

function bodyAt(position) {
  return { x: position.x - 12, y: position.y - 7, width: 24, height: 24 }
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y
}

const FURNITURE_BOUNDS = {
  console: [118, 64, 0, 7], chair: [38, 37, 0, -1], table: [192, 68, 0, -8],
  generator: [90, 88], battery: [78, 76], 'plant-bed': [138, 66],
  tank: [120, 98, 17, -3], scrubber: [100, 80], microscope: [45, 58],
  'sample-rack': [74, 53], 'lab-table': [122, 84, 0, -3], vent: [84, 54],
}

function roomCollisionGeometry(room, sourceRoom, facility) {
  const roomBottom = room.y + room.height
  const doorStart = room.x + room.width / 2 - 48
  const colliders = [
    { x: room.x, y: room.y, width: room.width, height: 15 },
    { x: room.x, y: room.y, width: 15, height: room.height },
    { x: room.x + room.width - 15, y: room.y, width: 15, height: room.height },
    { x: room.x, y: roomBottom - 15, width: doorStart - room.x, height: 15 },
    { x: doorStart + 96, y: roomBottom - 15, width: room.x + room.width - doorStart - 96, height: 15 },
  ]

  for (const item of getFacilityInteriorEquipment(sourceRoom.equipment, facility.id)) {
    const bounds = FURNITURE_BOUNDS[item.type]
    if (!bounds) continue
    const [width, height, offsetX = 0, offsetY = 0] = bounds
    const x = room.x + item.x - sourceRoom.x
    const y = room.y + item.y - sourceRoom.y
    colliders.push({ x: x + offsetX - width / 2, y: y + offsetY - height / 2, width, height })
  }
  colliders.push(...getFacilityInteriorColliders(room, facility.id))
  return colliders
}

function findReachablePoint(room, sourceRoom, facility, start, target, radius = 88) {
  const colliders = roomCollisionGeometry(room, sourceRoom, facility)
  const step = 6
  const queue = [start]
  const visited = new Set()

  while (queue.length) {
    const point = queue.shift()
    const key = `${Math.round(point.x)}:${Math.round(point.y)}`
    if (visited.has(key)) continue
    visited.add(key)
    const targetDistance = Math.hypot(point.x - target.x, point.y - target.y)
    if (targetDistance <= radius) return point

    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = { x: point.x + dx, y: point.y + dy }
      const body = bodyAt(next)
      const insideWalkableArea = next.x >= room.x + 14 && next.x <= room.x + room.width - 14
        && next.y >= room.y + 14 && next.y <= room.y + room.height + 70
      if (insideWalkableArea && !colliders.some((collider) => overlaps(body, collider))) queue.push(next)
    }
  }
  return null
}

function canReachTarget(room, sourceRoom, facility, start, target, radius = 88) {
  return Boolean(findReachablePoint(room, sourceRoom, facility, start, target, radius))
}

function canReachStation(room, sourceRoom, facility, start) {
  const station = INTERACTIVE_STATIONS.find((item) => item.id === facility.stationId)
  const target = station
    ? { x: room.x + station.x - sourceRoom.x, y: room.y + station.y - sourceRoom.y }
    : { x: room.x + room.width / 2, y: room.y + room.height / 2 }
  return canReachTarget(room, sourceRoom, facility, start, target, station?.interactionRadius || 88)
}

for (const facility of FACILITIES) {
  test(`${facility.shortName} interior entrance is clear of added solid fixtures`, () => {
    const source = HABITAT_LAYOUT.rooms.find((room) => room.id === facility.sourceRoomId)
    const room = { x: 90, y: 82, width: source.width, height: source.height }
    const spawn = resolveInteriorSpawn(room, facility.interiorSpawn)
    const fixtureColliders = getFacilityInteriorColliders(room, facility.id)
    const walkable = (position) => position.x >= room.x + 14
      && position.x <= room.x + room.width - 14
      && position.y >= room.y + 14
      && position.y <= room.y + room.height + 70
      && !fixtureColliders.some((collider) => overlaps(bodyAt(position), collider))

    assert.equal(walkable(spawn), true, 'the entrance marker must be immediately walkable')
    const safe = findNearestSafeSpawn(spawn, [resolveInteriorSpawn(room, facility.fallbackInteriorSpawn)], walkable)
    assert.deepEqual(safe, spawn)
    assert.equal(canReachStation(room, source, facility, spawn), true, 'the station must remain reachable around furniture')
  })
}

test('Observatory equipment leaves an unblocked route from its airlock to every assigned station and back', () => {
  const facility = FACILITIES.find((item) => item.id === 'observatory')
  const source = HABITAT_LAYOUT.rooms.find((room) => room.id === facility.sourceRoomId)
  const room = { x: 90, y: 82, width: source.width, height: source.height }
  const start = resolveInteriorSpawn(room, facility.interiorSpawn)
  const assignedTasks = MISSION_TASKS.filter((task) => task.facilityId === facility.id)
  const stationSpots = [
    [0.23, 0.38], [0.77, 0.38], [0.23, 0.66], [0.77, 0.66], [0.5, 0.25], [0.5, 0.55],
  ]

  assert.equal(getFacilityInteriorEquipment(source.equipment, facility.id).length, 0)
  assert.equal(assignedTasks.length > 0, true)
  for (let index = 0; index < stationSpots.length; index += 1) {
    const [xRatio, yRatio] = stationSpots[index]
    const target = { x: room.x + room.width * xRatio, y: room.y + room.height * yRatio }
    const approach = findReachablePoint(room, source, facility, start, target)
    assert.ok(approach, `task station position ${index + 1} must be reachable from the entrance`)
    assert.equal(
      canReachTarget(room, source, facility, approach, start, 0),
      true,
      `task station position ${index + 1} must have a return route to the entrance`,
    )
  }

  const aiWorkPosition = { x: room.x + room.width / 2, y: room.y + room.height / 2 }
  assert.equal(canReachTarget(room, source, facility, start, aiWorkPosition, 0), true, 'AI work position must be reachable')
})

test('a blocked preferred entrance resolves to the nearest safe fallback position', () => {
  const preferred = { x: 200, y: 300 }
  const obstacle = { x: 185, y: 290, width: 30, height: 35 }
  const safe = findNearestSafeSpawn(preferred, [{ x: 240, y: 300 }], (position) => (
    !overlaps(bodyAt(position), obstacle)
  ))

  assert.ok(safe)
  assert.equal(overlaps(bodyAt(safe), obstacle), false)
  assert.ok(Math.hypot(safe.x - preferred.x, safe.y - preferred.y) > 0)
})
