import Phaser from 'phaser'
import { HABITAT_LAYOUT } from '../maps/habitatLayout.js'
import { INTERACTIVE_STATIONS } from '../maps/stationDefinitions.js'
import { FACILITIES, MARS_WORLD, SURFACE_ENTRY_RADIUS } from '../maps/marsWorldLayout.js'
import { findNearestSafeSpawn, resolveExteriorSpawn, resolveInteriorSpawn } from '../maps/interiorSpawn.js'
import { getFacilityInteriorColliders, getFacilityInteriorEquipment } from '../maps/facilityInteriorDetails.js'
import {
  createAstronaut,
  drawRoomShell,
  drawStation,
  SOLID_FURNITURE_BOUNDS,
} from './HabitatScene.js'
import { drawFacilityDetails, drawInteriorAtmosphere } from './facilityDetailRenderer.js'

const ROLE_LABELS = {
  Commander: 'Mission Commander',
  Engineer: 'Power Engineer',
  Botanist: 'Botanist',
  Medic: 'Life Support Officer',
  Scientist: 'Science & Safety Officer',
}

const ROLE_DESTINATIONS = {
  'Mission Commander': 'command',
  'Power Engineer': 'power',
  Botanist: 'greenhouse',
  'Life Support Officer': 'life-support',
  'Science & Safety Officer': 'science',
}

function rect(x, y, width, height) {
  return { x, y, width, height }
}

function overlaps(left, right) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
}

function translatedRoom(facility) {
  const original = HABITAT_LAYOUT.rooms.find((room) => room.id === facility.sourceRoomId)
  const roomX = 90
  const roomY = 82
  return {
    original,
    room: {
      ...original,
      x: roomX,
      y: roomY,
      name: facility.name,
      color: facility.interiorColor || (facility.id === 'greenhouse' ? 0x354235 : facility.id === 'life-support' ? 0x35484a : 0x443934),
      accent: facility.lightColor,
      openings: { bottom: [{ offset: original.width / 2 - 48, width: 96 }] },
      // Keep the greenhouse airlock aisle open; its central legacy plant bed
      // blocked the only route between the entrance and the hydroponics station.
      equipment: getFacilityInteriorEquipment(original.equipment, facility.id)
        .map((item) => ({
        ...item,
        x: roomX + item.x - original.x,
        y: roomY + item.y - original.y,
        })),
    },
  }
}

/**
 * Phaser scene for a continuous Martian surface with separate facility interiors.
 * Coordinates are kept in world space; the follow camera owns viewport movement.
 */
export default class MarsExplorationScene extends Phaser.Scene {
  constructor({
    players = [],
    localPlayerId = '',
    tasks = [],
    onNearbyStationChange = () => {},
    onNearbyFacilityChange = () => {},
    onStationChange = () => {},
    onLocationChange = () => {},
    onWorldStateChange = () => {},
  } = {}) {
    super('MarsExplorationScene')
    this.players = players
    this.localPlayerId = localPlayerId
    this.tasks = tasks
    this.onNearbyStationChange = onNearbyStationChange
    this.onNearbyFacilityChange = onNearbyFacilityChange
    this.onStationChange = onStationChange
    this.onLocationChange = onLocationChange
    this.onWorldStateChange = onWorldStateChange
    this.location = { kind: 'surface', facilityId: null }
    this.nearbyStation = null
    this.nearbyFacility = null
    this.activeStation = null
    this.transitioning = false
    this.missionEnded = false
    this.surfacePositions = new Map()
    this.crewStates = new Map()
    this.positionUpdateTimer = 0
    this.aiPlanTimer = 0
    this.fitCamera = this.fitCamera.bind(this)
  }

  create() {
    this.cameras.main.setBackgroundColor('#241411')
    this.renderSurface()
    this.setupMovementInput()
    this.scale.on('resize', this.fitCamera, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.fitCamera, this)
    })
    this.fitCamera(this.scale.gameSize)
  }

  clearDisplay() {
    this.cameras.main.stopFollow()
    this.tweens.killAll()
    this.children.removeAll(true)
    this.astronauts = []
    this.controlledAstronaut = null
  }

  fitCamera(gameSize) {
    const width = gameSize?.width || this.scale.width
    const height = gameSize?.height || this.scale.height
    const camera = this.cameras.main
    const local = this.controlledAstronaut
    if (this.location.kind === 'surface') {
      camera.setBounds(0, 0, MARS_WORLD.width, MARS_WORLD.height)
      camera.setZoom(Phaser.Math.Clamp(Math.min(width / 1120, height / 660), 0.76, 1.08))
    } else if (this.interiorBounds) {
      camera.setBounds(0, 0, this.interiorBounds.width, this.interiorBounds.height)
      const zoom = Math.max(width / (this.interiorBounds.width + 120), height / (this.interiorBounds.height + 120))
      camera.setZoom(Phaser.Math.Clamp(zoom, 1.15, 2.35))
    }
    if (local) camera.centerOn(local.container.x, local.container.y)
    if (local) camera.startFollow(local.container, true, 0.085, 0.085)
  }

  setupMovementInput() {
    const keyboard = this.input.keyboard
    if (!keyboard) return
    this.cursors = keyboard.createCursorKeys()
    this.wasd = keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }, false)
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, false)
    keyboard.clearCaptures()
    if (this.game.canvas) {
      this.game.canvas.tabIndex = 0
      this.game.canvas.focus()
    }
  }

  setMissionEnded(isEnded) {
    this.missionEnded = Boolean(isEnded)
    if (this.missionEnded && this.controlledAstronaut) this.controlledAstronaut.walking = false
  }

  setTasks(tasks) {
    this.tasks = Array.isArray(tasks) ? tasks : []
  }

  setCrew(players, localPlayerId) {
    this.players = Array.isArray(players) ? players : []
    if (!localPlayerId || localPlayerId === this.localPlayerId) return

    const nextControlled = this.astronauts?.find((astronaut) => (
      astronaut.id === localPlayerId && astronaut.container.visible
    ))
    if (!nextControlled) return

    this.localPlayerId = localPlayerId
    for (const astronaut of this.astronauts) {
      astronaut.controlled = astronaut === nextControlled
      astronaut.simulated = astronaut !== nextControlled
    }
    this.controlledAstronaut = nextControlled
    this.fitCamera(this.scale.gameSize)
    this.updateNearbyFacility()
    this.updateNearbyStation()
  }

  normalizePlayers() {
    const incoming = Array.isArray(this.players) ? this.players.slice(0, 5) : []
    const fallbackRoles = ['Mission Commander', 'Power Engineer', 'Botanist', 'Life Support Officer', 'Science & Safety Officer']
    const fallback = incoming.length ? incoming : fallbackRoles.map((role, index) => ({
      id: `preview-crew-${index}`,
      name: role,
      role,
    }))
    const localId = this.localPlayerId || fallback.find((player) => ROLE_LABELS[player.role] === 'Mission Commander' || player.role === 'Mission Commander')?.id || fallback[0]?.id
    return fallback.map((player, index) => ({
      ...player,
      id: player.id || `local-crew-${index}`,
      role: ROLE_LABELS[player.role] || player.role || fallbackRoles[index],
      controlled: player.id === localId,
      isSimulated: player.id !== localId,
    }))
  }

  getCrewState(player, index) {
    const id = player.id || `local-crew-${index}`
    let state = this.crewStates.get(id)
    if (!state) {
      const offsets = [[-74, 24], [72, 52], [-38, 112], [60, -88], [108, 10]]
      const [offsetX, offsetY] = player.controlled ? [0, 0] : offsets[index % offsets.length]
      state = {
        location: 'surface',
        facilityId: null,
        surface: { x: MARS_WORLD.spawn.x + offsetX, y: MARS_WORLD.spawn.y + offsetY },
        interiors: {},
        destinationId: ROLE_DESTINATIONS[player.role] || 'command',
        routeIndex: 1,
        idleUntil: 0,
      }
      this.crewStates.set(id, state)
    }
    return state
  }

  spawnCrew(localPosition, interior = false) {
    const crew = this.normalizePlayers().sort((left, right) => Number(left.controlled) - Number(right.controlled))
    const astronauts = []
    for (const [index, player] of crew.entries()) {
      const state = this.getCrewState(player, index)
      if (player.controlled) {
        if (interior && state.location !== 'facility') {
          state.location = 'facility'
          state.facilityId = this.location.facilityId
          state.interiors[state.facilityId] = { ...localPosition }
        } else if (!interior && state.location === 'surface' && localPosition) {
          state.surface = { ...localPosition }
        }
      }
      const isCurrentLocation = interior
        ? state.location === 'facility' && state.facilityId === this.location.facilityId
        : state.location === 'surface'
      if (!isCurrentLocation) continue

      const facility = interior ? this.currentFacility : null
      const preferred = interior
        ? state.interiors[this.location.facilityId] || localPosition
        : state.surface || localPosition
      const fallbacks = interior
        ? [resolveInteriorSpawn(this.currentInteriorRoom, facility.fallbackInteriorSpawn)]
        : this.lastTransitionFacility
          ? [resolveExteriorSpawn(this.lastTransitionFacility, this.lastTransitionFacility.fallbackExteriorSpawnOffset)]
          : [{ x: preferred.x + 32, y: preferred.y + 32 }]
      const safePosition = findNearestSafeSpawn(
        preferred,
        fallbacks,
        (position) => this.isSafeCrewSpawn(position, player.id),
      )
      if (!safePosition) {
        throw new Error(`No collision-free spawn found for ${player.name || player.role}.`)
      }

      const astronaut = createAstronaut(this, player, index, this.localPlayerId || crew.find((member) => member.controlled)?.id)
      astronaut.crewIndex = index
      astronaut.container.setPosition(safePosition.x, safePosition.y)
      if (interior) astronaut.container.setScale(0.8)
      astronaut.simulated = player.isSimulated
      astronaut.crewState = state
      astronaut.aiTargetId = state.destinationId
      if (interior) state.interiors[this.location.facilityId] = { ...safePosition }
      else state.surface = { ...safePosition }
      astronauts.push(astronaut)
    }
    this.astronauts = astronauts
    this.controlledAstronaut = this.astronauts.find((astronaut) => astronaut.controlled) || this.astronauts[0]
  }

  isSafeCrewSpawn(position, playerId) {
    if (!this.canOccupy(null, position.x, position.y)) return false
    const body = rect(position.x - 12, position.y - 7, 24, 24)
    return !this.astronauts.some((astronaut) => {
      if (astronaut.id === playerId || !astronaut.container.visible) return false
      const otherBody = rect(astronaut.container.x - 12, astronaut.container.y - 7, 24, 24)
      return overlaps(body, otherBody)
    })
  }

  renderSurface() {
    this.clearDisplay()
    this.location = { kind: 'surface', facilityId: null }
    this.interiorBounds = { width: MARS_WORLD.width, height: MARS_WORLD.height }
    this.drawMartianTerrain()
    for (const path of MARS_WORLD.paths) this.drawSurfacePath(path)
    for (const facility of FACILITIES) this.drawFacilityExterior(facility)
    const position = this.surfacePositions.get(this.localPlayerId) || MARS_WORLD.spawn
    this.solidColliders = FACILITIES.map((facility) => rect(facility.x, facility.y, facility.width, facility.height))
    this.walkableRegions = [rect(0, 0, MARS_WORLD.width, MARS_WORLD.height)]
    this.spawnCrew(position)
    this.lastTransitionFacility = null
    this.activeStations = []
    this.currentFacility = null
    this.nearbyStation = null
    this.nearbyFacility = null
    this.onNearbyStationChange(null)
    this.onNearbyFacilityChange(null)
    this.onLocationChange(this.location)
    this.fitCamera(this.scale.gameSize)
    this.game.canvas?.focus()
  }

  drawMartianTerrain() {
    const graphics = this.add.graphics().setDepth(-20)
    graphics.fillStyle(0x35201c, 1)
    graphics.fillRect(0, 0, MARS_WORLD.width, MARS_WORLD.height)
    graphics.fillStyle(0x713820, 0.46)
    graphics.fillTriangle(0, 520, 430, 150, 890, 520)
    graphics.fillTriangle(690, 470, 1210, 90, 1700, 470)
    graphics.fillTriangle(1530, 510, 2200, 175, 2780, 510)
    graphics.fillTriangle(2500, 520, 3020, 120, 3600, 520)
    graphics.fillStyle(0x241512, 0.56)
    graphics.fillTriangle(0, 590, 430, 275, 940, 590)
    graphics.fillTriangle(1240, 590, 1940, 260, 2580, 590)
    graphics.fillTriangle(2350, 590, 3020, 235, 3600, 590)

    let seed = 4711
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let index = 0; index < 62; index += 1) {
      const x = 60 + random() * (MARS_WORLD.width - 120)
      const y = 470 + random() * (MARS_WORLD.height - 520)
      const radius = 28 + random() * 74
      graphics.fillStyle(0x170e0d, 0.28)
      graphics.fillEllipse(x + 8, y + 10, radius * 2.5, radius)
      graphics.fillStyle(index % 3 === 0 ? 0x582b20 : 0x48241e, 0.76)
      graphics.fillEllipse(x, y, radius * 2.1, radius * 0.78)
      graphics.lineStyle(3, 0x9b5133, 0.22)
      graphics.strokeEllipse(x - 3, y - 3, radius * 1.7, radius * 0.55)
    }
    for (let index = 0; index < 130; index += 1) {
      const x = 25 + random() * (MARS_WORLD.width - 50)
      const y = 540 + random() * (MARS_WORLD.height - 580)
      const size = 5 + random() * 14
      graphics.fillStyle(index % 2 ? 0x8a4932 : 0x291916, 0.64)
      graphics.fillTriangle(x, y - size, x + size, y + size / 2, x - size * 0.8, y + size)
    }
    this.drawDustField(random)
  }

  drawDustField(random) {
    for (let index = 0; index < 26; index += 1) {
      const mote = this.add.circle(
        random() * MARS_WORLD.width,
        500 + random() * (MARS_WORLD.height - 550),
        1.5 + random() * 2.5,
        0xe29a68,
        0.16,
      ).setDepth(18)
      this.tweens.add({
        targets: mote,
        x: mote.x + 140 + random() * 220,
        alpha: 0.04,
        duration: 8000 + random() * 9000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  drawSurfacePath(points) {
    const graphics = this.add.graphics().setDepth(-5)
    for (let index = 0; index < points.length - 1; index += 1) {
      const [x1, y1] = points[index]
      const [x2, y2] = points[index + 1]
      graphics.lineStyle(90, 0x713f2b, 0.4)
      graphics.lineBetween(x1, y1, x2, y2)
      graphics.lineStyle(4, 0xb56a45, 0.18)
      graphics.lineBetween(x1, y1, x2, y2)
    }
  }

  drawFacilityExterior(facility) {
    const { x, y, width, height, lightColor } = facility
    const structure = this.add.graphics().setDepth(y + height)
    structure.fillStyle(0x180e0c, 0.48)
    structure.fillRect(x + 15, y + 18, width, height)
    structure.fillStyle(0x3f3834, 1)
    structure.fillRect(x, y, width, height)
    structure.lineStyle(4, 0x8a7262, 0.9)
    structure.strokeRect(x, y, width, height)
    structure.fillStyle(0x62544c, 1)
    structure.fillRect(x + 12, y + 12, width - 24, height - 24)
    structure.fillStyle(0x292422, 1)
    structure.fillRect(x + 26, y + 25, width - 52, height - 50)
    structure.lineStyle(3, 0x9a826c, 0.9)
    structure.strokeRect(x + 26, y + 25, width - 52, height - 50)
    structure.fillStyle(0x1a1716, 1)
    structure.fillRect(x + width / 2 - 43, y + height - 14, 86, 24)
    structure.fillStyle(lightColor, 0.8)
    structure.fillRect(x + width / 2 - 43, y + height - 8, 86, 5)
    structure.lineStyle(5, 0x8c786a, 0.9)
    structure.lineBetween(x + 20, y + 20, x + width - 20, y + 20)
    structure.lineBetween(x + 20, y + height - 20, x + width / 2 - 48, y + height - 20)
    structure.lineBetween(x + width / 2 + 48, y + height - 20, x + width - 20, y + height - 20)
    for (const px of [x + 18, x + width - 18]) {
      structure.fillStyle(0xf2b561, 0.9)
      structure.fillCircle(px, y + 24, 5)
    }
    const panelCount = Math.max(2, Math.floor(width / 150))
    for (let panel = 0; panel < panelCount; panel += 1) {
      const panelX = x + 28 + panel * ((width - 80) / panelCount)
      structure.fillStyle(0x24333a, 1)
      structure.fillRect(panelX, y - 21, 45, 18)
      structure.lineStyle(1, 0x83a2a7, 0.8)
      structure.strokeRect(panelX, y - 21, 45, 18)
      structure.lineBetween(panelX + 14, y - 21, panelX + 14, y - 3)
      structure.lineBetween(panelX + 30, y - 21, panelX + 30, y - 3)
    }
    this.add.text(x + width / 2, y + 43, facility.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: width < 280 ? '11px' : '14px',
      fontStyle: 'bold',
      color: '#e8cfb4',
      backgroundColor: '#241b18',
      padding: { x: 7, y: 4 },
      align: 'center',
    }).setOrigin(0.5).setDepth(y + height + 2)

    const glow = this.add.circle(x + width / 2, y + height + 16, 22, lightColor, 0.15).setDepth(y + height + 3)
    this.tweens.add({ targets: glow, alpha: 0.38, scale: 1.35, duration: 850, yoyo: true, repeat: -1 })
  }

  renderInterior(facility) {
    this.clearDisplay()
    this.location = { kind: 'facility', facilityId: facility.id }
    this.currentFacility = facility
    const { original, room } = translatedRoom(facility)
    this.currentInteriorRoom = room
    this.interiorBounds = {
      width: room.width + 180,
      height: room.height + 225,
    }
    this.cameras.main.setBackgroundColor('#120f0e')
    const backdrop = this.add.graphics().setDepth(-10)
    backdrop.fillStyle(0x171210, 1)
    backdrop.fillRect(0, 0, this.interiorBounds.width, this.interiorBounds.height)
    backdrop.fillStyle(0x30231d, 0.75)
    backdrop.fillRect(0, this.interiorBounds.height - 140, this.interiorBounds.width, 140)
    drawRoomShell(this, room)
    drawInteriorAtmosphere(this, room, facility)
    for (const item of room.equipment) {
      const furniture = this.add.graphics().setDepth(item.y)
      drawStation(furniture, this, item)
    }
    drawFacilityDetails(this, room, facility)

    const facilityTasks = this.tasks.filter((task) => task.facilityId === facility.id)
    const taskStations = facilityTasks.map((task, index) => {
      const spots = [
        [0.23, 0.38], [0.77, 0.38], [0.23, 0.66], [0.77, 0.66], [0.5, 0.25], [0.5, 0.55],
      ]
      const [xRatio, yRatio] = spots[index % spots.length]
      return {
        ...task,
        id: task.stationId,
        taskId: task.id,
        name: task.title,
        roomId: facility.id,
        roomName: facility.shortName,
        x: room.x + room.width * xRatio,
        y: room.y + room.height * yRatio,
        interactionRadius: 88,
        explanation: task.description,
        task: task.instructions,
      }
    })
    const matchingStations = taskStations.length ? taskStations : INTERACTIVE_STATIONS.filter((station) => station.roomId === facility.sourceRoomId)
      .map((station) => ({
        ...station,
        x: room.x + station.x - original.x,
        y: room.y + station.y - original.y,
      }))
    const defaultStation = {
      id: facility.stationId,
      roomId: facility.id,
      roomName: facility.shortName,
      name: facility.id === 'communications' ? 'Communications Console' : facility.id === 'rover-garage' ? 'Rover Diagnostics' : facility.shortName,
      x: room.x + room.width / 2,
      y: room.y + room.height / 2,
      interactionRadius: 88,
      explanation: `Use this station to carry out ${facility.shortName.toLowerCase()} operations.`,
      task: `Complete the assigned ${facility.shortName.toLowerCase()} procedure.`,
    }
    this.activeStations = matchingStations.length ? matchingStations : [defaultStation]
    if (!facilityTasks.length && !this.activeStations.some((station) => station.id === facility.stationId)) {
      this.activeStations.push(defaultStation)
    }
    this.drawTaskStationMarkers(this.activeStations, facility.lightColor)
    this.drawInteriorAirlock(room)
    this.solidColliders = this.createInteriorColliders(room, facility)
    this.walkableRegions = [
      rect(room.x + 14, room.y + 14, room.width - 28, room.height + 70),
      rect(room.x + room.width / 2 - 48, room.y + room.height - 3, 96, 66),
    ]
    const spawn = resolveInteriorSpawn(room, facility.interiorSpawn)
    this.spawnCrew(spawn, true)
    this.nearbyFacility = facility
    this.onNearbyFacilityChange({ ...facility, action: 'exit' })
    this.onNearbyStationChange(null)
    this.onLocationChange(this.location)
    this.fitCamera(this.scale.gameSize)
    this.game.canvas?.focus()
  }

  drawTaskStationMarkers(stations, color) {
    for (const station of stations) {
      const marker = this.add.circle(station.x, station.y, 13, color, 0.24).setDepth(station.y + 1)
      this.add.circle(station.x, station.y, 5, color, 0.92).setDepth(station.y + 2)
      this.tweens.add({ targets: marker, scale: 1.35, alpha: 0.08, duration: 950, yoyo: true, repeat: -1 })
    }
  }

  drawInteriorAirlock(room) {
    const doorX = room.x + room.width / 2
    const doorY = room.y + room.height + 3
    const airlock = this.add.graphics().setDepth(doorY + 5)
    airlock.fillStyle(0x241c18, 1)
    airlock.fillRect(doorX - 47, doorY - 4, 94, 18)
    airlock.lineStyle(4, 0xd8a55c, 0.9)
    airlock.lineBetween(doorX - 47, doorY + 9, doorX + 47, doorY + 9)
    airlock.fillStyle(0xf0b55c, 0.85)
    airlock.fillCircle(doorX, doorY + 18, 5)
    this.exitPoint = { x: doorX, y: doorY + 28 }
  }

  createInteriorColliders(room, facility) {
    const thickness = 15
    const doorWidth = 96
    const doorStart = room.x + room.width / 2 - doorWidth / 2
    const floor = []
    floor.push(rect(room.x, room.y, room.width, thickness))
    floor.push(rect(room.x, room.y, thickness, room.height))
    floor.push(rect(room.x + room.width - thickness, room.y, thickness, room.height))
    floor.push(rect(room.x, room.y + room.height - thickness, doorStart - room.x, thickness))
    floor.push(rect(doorStart + doorWidth, room.y + room.height - thickness, room.x + room.width - doorStart - doorWidth, thickness))
    for (const item of room.equipment) {
      const bounds = SOLID_FURNITURE_BOUNDS[item.type]
      if (!bounds) continue
      floor.push(rect(
        item.x + (bounds.offsetX || 0) - bounds.width / 2,
        item.y + (bounds.offsetY || 0) - bounds.height / 2,
        bounds.width,
        bounds.height,
      ))
    }
    floor.push(...getFacilityInteriorColliders(room, facility.id))
    return floor
  }

  setupSurfaceCollision() {
    this.walkableRegions = [rect(0, 0, MARS_WORLD.width, MARS_WORLD.height)]
    this.solidColliders = FACILITIES.map((facility) => rect(facility.x, facility.y, facility.width, facility.height))
  }

  canOccupy(astronaut, x, y) {
    const body = rect(x - 12, y - 7, 24, 24)
    const inBounds = x >= 16 && y >= 16
      && x <= this.interiorBounds.width - 16
      && y <= this.interiorBounds.height - 16
    return inBounds
      && this.walkableRegions.some((region) => (
        x >= region.x && x <= region.x + region.width
        && y >= region.y && y <= region.y + region.height
      ))
      && !this.solidColliders.some((collider) => overlaps(body, collider))
  }

  moveAstronaut(astronaut, dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 5))
    for (let step = 0; step < steps; step += 1) {
      const nextX = astronaut.container.x + dx / steps
      if (this.canOccupy(astronaut, nextX, astronaut.container.y)) astronaut.container.x = nextX
      const nextY = astronaut.container.y + dy / steps
      if (this.canOccupy(astronaut, astronaut.container.x, nextY)) astronaut.container.y = nextY
    }
    if (astronaut.crewState) {
      if (this.location.kind === 'surface') {
        astronaut.crewState.surface = { x: astronaut.container.x, y: astronaut.container.y }
      } else {
        astronaut.crewState.interiors[this.location.facilityId] = { x: astronaut.container.x, y: astronaut.container.y }
      }
    }
  }

  setFacing(astronaut, horizontal, vertical) {
    if (Math.abs(horizontal) > Math.abs(vertical)) astronaut.facing = horizontal < 0 ? 'left' : 'right'
    else if (vertical !== 0) astronaut.facing = vertical < 0 ? 'up' : 'down'
    const positions = {
      down: { x: 0, y: -36, angle: 0 },
      up: { x: 0, y: -50, angle: 0 },
      left: { x: -8, y: -43, angle: -90 },
      right: { x: 8, y: -43, angle: 90 },
    }
    const position = positions[astronaut.facing || 'down']
    astronaut.visor.setPosition(position.x, position.y).setAngle(position.angle)
    astronaut.visorGlint.setPosition(position.x - 4, position.y - 2)
  }

  animateAstronaut(astronaut, delta) {
    astronaut.animationTime += delta
    const cycle = astronaut.animationTime * (astronaut.walking ? 14 : 2.7)
    if (astronaut.walking) {
      const swing = Math.sin(cycle) * 0.38
      astronaut.leftLeg.rotation = swing
      astronaut.rightLeg.rotation = -swing
      astronaut.leftArm.rotation = -swing * 0.8
      astronaut.rightArm.rotation = swing * 0.8
      astronaut.visual.y = Math.abs(Math.sin(cycle)) * 1.4
    } else {
      astronaut.leftLeg.rotation = 0
      astronaut.rightLeg.rotation = 0
      astronaut.leftArm.rotation = 0
      astronaut.rightArm.rotation = 0
      astronaut.visual.y = Math.sin(cycle) * 0.7
    }
    astronaut.container.setDepth(astronaut.container.y + 2)
  }

  update(_time, frameDelta) {
    const delta = Math.min(frameDelta, 50) / 1000
    if (!this.controlledAstronaut || !this.cursors || !this.wasd) return
    if (this.transitioning) return
    if (this.missionEnded) return

    const isTyping = typeof document !== 'undefined' && document.activeElement && (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    )

    if (isTyping) {
      this.controlledAstronaut.walking = false
    } else if (this.activeStation) {
      this.controlledAstronaut.walking = false
      if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.closeStation()
    } else {
      const horizontal = Number(this.cursors.right.isDown || this.wasd.d.isDown)
        - Number(this.cursors.left.isDown || this.wasd.a.isDown)
      const vertical = Number(this.cursors.down.isDown || this.wasd.s.isDown)
        - Number(this.cursors.up.isDown || this.wasd.w.isDown)
      if (horizontal || vertical) {
        this.setFacing(this.controlledAstronaut, horizontal, vertical)
        const length = Math.hypot(horizontal, vertical)
        const startX = this.controlledAstronaut.container.x
        const startY = this.controlledAstronaut.container.y
        const speed = this.location.kind === 'surface' ? 235 : 170
        this.moveAstronaut(this.controlledAstronaut, horizontal / length * speed * delta, vertical / length * speed * delta)
        this.controlledAstronaut.walking = Math.abs(this.controlledAstronaut.container.x - startX) + Math.abs(this.controlledAstronaut.container.y - startY) > 0.2
      } else this.controlledAstronaut.walking = false

      this.updateNearbyFacility()
      this.updateNearbyStation()
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        if (this.nearbyStation) this.openStation(this.nearbyStation)
        else if (this.nearbyFacility) {
          if (this.location.kind === 'surface') this.enterFacility(this.nearbyFacility)
          else this.exitFacility()
        }
      }
    }

    if (!this.activeStation) this.updateSimulatedCrew(delta)
    for (const astronaut of this.astronauts) this.animateAstronaut(astronaut, delta)
    this.updateWorldState(delta)
  }

  updateNearbyFacility() {
    let nearest = null
    if (this.location.kind === 'surface') {
      const candidate = FACILITIES.map((facility) => ({
        facility,
        distance: Math.hypot(
          this.controlledAstronaut.container.x - (facility.x + facility.width / 2),
          this.controlledAstronaut.container.y - (facility.y + facility.height + 18),
        ),
      })).sort((a, b) => a.distance - b.distance)[0]
      if (candidate?.distance <= SURFACE_ENTRY_RADIUS) {
        nearest = { ...candidate.facility, action: 'enter' }
      }
    } else if (this.exitPoint) {
      const distance = Phaser.Math.Distance.Between(
        this.controlledAstronaut.container.x,
        this.controlledAstronaut.container.y,
        this.exitPoint.x,
        this.exitPoint.y,
      )
      if (distance <= SURFACE_ENTRY_RADIUS) nearest = { ...this.currentFacility, action: 'exit' }
    }
    if (nearest?.id !== this.nearbyFacility?.id || nearest?.action !== this.nearbyFacility?.action) {
      this.nearbyFacility = nearest
      this.onNearbyFacilityChange(nearest)
    }
  }

  updateNearbyStation() {
    if (this.location.kind !== 'facility') return
    const px = this.controlledAstronaut.container.x
    const py = this.controlledAstronaut.container.y
    const nearest = (this.activeStations || []).map((station) => ({
      station,
      distance: Phaser.Math.Distance.Between(px, py, station.x, station.y),
    })).filter(({ station, distance }) => distance <= station.interactionRadius)
      .sort((left, right) => left.distance - right.distance)[0]?.station || null
    if (nearest?.id !== this.nearbyStation?.id) {
      this.nearbyStation = nearest
      this.onNearbyStationChange(nearest)
    }
  }

  enterFacility(facility) {
    if (this.transitioning) return
    this.transitioning = true
    this.surfacePositions.set(this.localPlayerId, {
      x: this.controlledAstronaut.container.x,
      y: this.controlledAstronaut.container.y,
    })
    const state = this.controlledAstronaut.crewState
    const { room } = translatedRoom(facility)
    if (state) {
      state.surface = { ...this.surfacePositions.get(this.localPlayerId) }
      state.location = 'facility'
      state.facilityId = facility.id
      state.interiors[facility.id] = resolveInteriorSpawn(room, facility.interiorSpawn)
    }
    this.cameras.main.fadeOut(240, 5, 3, 2)
    this.time.delayedCall(250, () => {
      this.renderInterior(facility)
      this.cameras.main.fadeIn(260, 5, 3, 2)
      this.transitioning = false
    })
  }

  exitFacility() {
    if (this.transitioning) return
    this.transitioning = true
    const facility = this.currentFacility
    this.lastTransitionFacility = facility
    const surfacePosition = resolveExteriorSpawn(facility, facility.exteriorSpawnOffset)
    this.surfacePositions.set(this.localPlayerId, surfacePosition)
    const state = this.controlledAstronaut.crewState
    if (state) {
      state.location = 'surface'
      state.facilityId = null
      state.surface = { ...surfacePosition }
    }
    this.cameras.main.fadeOut(240, 5, 3, 2)
    this.time.delayedCall(250, () => {
      this.renderSurface()
      this.cameras.main.fadeIn(260, 5, 3, 2)
      this.transitioning = false
    })
  }

  openStation(station) {
    this.activeStation = station
    this.controlledAstronaut.walking = false
    this.onStationChange(station)
  }

  closeStation() {
    if (!this.activeStation) return
    this.activeStation = null
    this.onStationChange(null)
    this.game.canvas?.focus()
  }

  updateSimulatedCrew(delta) {
    if (this.transitioning) return
    if (this.location.kind === 'surface') this.updateOffscreenFacilityCrew(delta)
    for (const astronaut of this.astronauts) {
      if (!astronaut.simulated) continue
      const facility = FACILITIES.find((item) => item.id === astronaut.aiTargetId) || FACILITIES[0]
      const state = astronaut.crewState
      if (!state) continue

      if (this.location.kind === 'facility') {
        if (state.location !== 'facility' || state.facilityId !== this.location.facilityId) continue
        const station = this.getStationInteriorPosition(facility)
        const targetX = station.x
        const targetY = station.y
        const dx = targetX - astronaut.container.x
        const dy = targetY - astronaut.container.y
        const distance = Math.hypot(dx, dy)
        if (distance < 48) {
          astronaut.walking = false
          this.avoidCrew(astronaut, 0, 0, delta)
          continue
        }
        this.moveToward(astronaut, dx, dy, delta)
        continue
      }

      if (state.location !== 'surface') continue
      const route = MARS_WORLD.facilityRoutes[astronaut.aiTargetId] || []
      if (route.length < 2) continue
      while (state.routeIndex < route.length - 1) {
        const [waypointX, waypointY] = route[state.routeIndex]
        if (Math.hypot(waypointX - astronaut.container.x, waypointY - astronaut.container.y) > 42) break
        state.routeIndex += 1
      }
      const [targetX, targetY] = route[Math.min(state.routeIndex, route.length - 1)]
      const dx = targetX - astronaut.container.x
      const dy = targetY - astronaut.container.y
      const distance = Math.hypot(dx, dy)
      if (state.routeIndex >= route.length - 1 && distance < 44) {
        const interior = translatedRoom(facility).room
        state.location = 'facility'
        state.facilityId = facility.id
        state.interiors[facility.id] = {
          x: interior.x + interior.width / 2 + (astronaut.crewIndex % 2 ? 24 : -24),
          y: interior.y + interior.height + 28,
        }
        astronaut.container.setVisible(false)
        astronaut.walking = false
        continue
      }
      this.moveToward(astronaut, dx, dy, delta)
    }
  }

  getStationInteriorPosition(facility) {
    const { original, room } = translatedRoom(facility)
    const station = INTERACTIVE_STATIONS.find((item) => item.id === facility.stationId)
    return station
      ? { x: room.x + station.x - original.x, y: room.y + station.y - original.y }
      : { x: room.x + room.width / 2, y: room.y + room.height / 2 }
  }

  updateOffscreenFacilityCrew(delta) {
    for (const [index, player] of this.normalizePlayers().entries()) {
      if (player.controlled) continue
      const state = this.getCrewState(player, index)
      if (state.location !== 'facility' || !state.facilityId) continue
      const facility = FACILITIES.find((item) => item.id === state.facilityId)
      if (!facility) continue
      const target = this.getStationInteriorPosition(facility)
      const position = state.interiors[facility.id]
      if (!position) continue
      const dx = target.x - position.x
      const dy = target.y - position.y
      const distance = Math.hypot(dx, dy)
      if (distance <= 12) continue
      const step = Math.min(distance, 60 * delta)
      state.interiors[facility.id] = {
        x: position.x + dx / distance * step,
        y: position.y + dy / distance * step,
      }
    }
  }

  moveToward(astronaut, dx, dy, delta) {
    const distance = Math.hypot(dx, dy)
    if (distance < 1) return
    this.setFacing(astronaut, dx, dy)
    const separation = this.avoidCrew(astronaut, dx / distance, dy / distance, delta)
    const moveX = dx / distance + separation.x
    const moveY = dy / distance + separation.y
    const length = Math.hypot(moveX, moveY) || 1
    const beforeX = astronaut.container.x
    const beforeY = astronaut.container.y
    const speed = this.location.kind === 'surface' ? 82 : 60
    this.moveAstronaut(astronaut, moveX / length * speed * delta, moveY / length * speed * delta)
    astronaut.walking = Math.abs(astronaut.container.x - beforeX) + Math.abs(astronaut.container.y - beforeY) > 0.1
  }

  avoidCrew(astronaut, directionX, directionY) {
    let pushX = 0
    let pushY = 0
    for (const other of this.astronauts) {
      if (other === astronaut || !other.container.visible) continue
      const dx = astronaut.container.x - other.container.x
      const dy = astronaut.container.y - other.container.y
      const distance = Math.hypot(dx, dy)
      const minDistance = astronaut.controlled ? 60 : other.controlled ? 82 : 52
      if (distance > 0 && distance < minDistance) {
        const force = (minDistance - distance) / minDistance
        const priority = other.controlled ? 1.8 : 1
        pushX += dx / distance * force * priority
        pushY += dy / distance * force * priority
      }
    }
    if (directionX === 0 && directionY === 0 && Math.hypot(pushX, pushY) > 0) {
      const magnitude = Math.hypot(pushX, pushY)
      this.moveAstronaut(astronaut, pushX / magnitude * Math.min(16, magnitude * 14), pushY / magnitude * Math.min(16, magnitude * 14))
    }
    return { x: pushX * 0.8, y: pushY * 0.8 }
  }

  updateWorldState(delta) {
    this.positionUpdateTimer += delta
    if (this.positionUpdateTimer < 0.18) return
    this.positionUpdateTimer = 0
    const crew = this.normalizePlayers().map((player, index) => {
      const state = this.getCrewState(player, index)
      const facility = state.location === 'facility' ? FACILITIES.find((item) => item.id === state.facilityId) : null
      const surfacePosition = state.surface || MARS_WORLD.spawn
      const interiorPosition = facility ? state.interiors[facility.id] || null : null
      return {
        id: player.id,
        role: player.role,
        x: facility ? facility.x + facility.width / 2 : surfacePosition.x,
        y: facility ? facility.y + facility.height / 2 : surfacePosition.y,
        interiorPosition,
        walking: this.astronauts.find((astronaut) => astronaut.id === player.id)?.walking || false,
        local: player.controlled,
        location: state.location,
        facilityId: state.facilityId,
      }
    })
    this.onWorldStateChange({
      location: this.location,
      player: crew.find((astronaut) => astronaut.local) || null,
      crew,
      facilities: FACILITIES.map((facility) => ({
        id: facility.id,
        x: facility.x,
        y: facility.y,
        width: facility.width,
        height: facility.height,
        name: facility.name,
        shortName: facility.shortName,
      })),
      paths: MARS_WORLD.paths,
      interior: this.location.kind === 'facility' && this.currentInteriorRoom ? {
        width: this.interiorBounds.width,
        height: this.interiorBounds.height,
        room: {
          x: this.currentInteriorRoom.x,
          y: this.currentInteriorRoom.y,
          width: this.currentInteriorRoom.width,
          height: this.currentInteriorRoom.height,
        },
      } : null,
      taskStations: this.location.kind === 'facility' ? (this.activeStations || []).map((station) => ({
        id: station.id,
        taskId: station.taskId || this.tasks.find((task) => task.stationId === station.id)?.id,
        name: station.name,
        x: station.x,
        y: station.y,
      })) : [],
    })
  }
}
