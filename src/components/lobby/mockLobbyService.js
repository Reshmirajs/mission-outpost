import {
  createMission,
  createPlayer,
  MissionStatus,
  PlayerRoles,
} from '../../types/game.js'
import { EDUCATIONAL_ROLE_DETAILS } from './educationalRoles.js'

/**
 * MISSION: OUTPOST - Mock Lobby & Room Synchronization Service
 *
 * NOTE FOR PERSON 5 (Firebase Integration):
 * This module fulfills all Person 1 requirements in offline/local mock mode.
 * It uses localStorage + BroadcastChannel so multiple browser tabs on the same machine
 * can create, join, select roles, and toggle ready in real time.
 *
 * When Firebase RTDB is integrated, this service can be seamlessly swapped or
 * bridged with the real Firebase Realtime Database room listeners.
 */

const STORAGE_PREFIX = 'mission_outpost_room_'
const BROADCAST_CHANNEL_NAME = 'mission_outpost_lobby_channel'

// Alphanumeric characters excluding ambiguous glyphs (I, O, 0, 1)
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Demo astronaut pool for single-player evaluation
const DEMO_ASTRONAUTS = [
  { name: 'Cadet Maya (AI)', role: PlayerRoles.ENGINEER },
  { name: 'Dr. Alex Vance (AI)', role: PlayerRoles.BOTANIST },
  { name: 'Specialist Tariq (AI)', role: PlayerRoles.MEDIC },
  { name: 'Officer Liam (AI)', role: PlayerRoles.SCIENTIST },
  { name: 'Commander Nova (AI)', role: PlayerRoles.COMMANDER },
]

/**
 * Safe BroadcastChannel initializer with fallback
 */
function getBroadcastChannel() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    } catch {
      return null
    }
  }
  return null
}

const broadcastChannel = getBroadcastChannel()

/**
 * Notifies all open tabs of room changes
 */
function notifyRoomUpdate(roomCode) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATED', roomCode, timestamp: Date.now() })
    } catch {
      // Fallback silently
    }
  }
}

/**
 * Broadcasts countdown start to all squad tabs in the same room.
 * @param {string} roomCode
 */
export function broadcastCountdown(roomCode) {
  if (broadcastChannel && roomCode) {
    try {
      broadcastChannel.postMessage({
        type: 'COUNTDOWN_STARTED',
        roomCode: roomCode.trim().toUpperCase(),
        timestamp: Date.now(),
      })
    } catch {
      // Fallback silently
    }
  }
}

/**
 * Generates a 6-character uppercase alphanumeric room code.
 * @returns {string}
 */
export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARSET.length)
    code += CODE_CHARSET[randomIndex]
  }
  return code
}

/**
 * Retrieves a room from local mock storage.
 * @param {string} roomCode
 * @returns {import('../../types/game.js').Mission | null}
 */
export function getRoomFromStorage(roomCode) {
  if (!roomCode || typeof window === 'undefined') return null
  const normalized = roomCode.trim().toUpperCase()
  try {
    const data = window.localStorage.getItem(`${STORAGE_PREFIX}${normalized}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/**
 * Saves a room to local mock storage and notifies listeners.
 * @param {import('../../types/game.js').Mission} mission
 */
export function saveRoomToStorage(mission) {
  if (!mission || !mission.roomCode || typeof window === 'undefined') return
  const normalized = mission.roomCode.trim().toUpperCase()
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${normalized}`, JSON.stringify(mission))
    notifyRoomUpdate(normalized)
  } catch (error) {
    console.error('Failed to save room to local storage:', error)
  }
}

/**
 * Removes a room from storage and notifies listeners.
 * @param {string} roomCode
 */
export function removeRoomFromStorage(roomCode) {
  if (!roomCode || typeof window === 'undefined') return
  const normalized = roomCode.trim().toUpperCase()
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${normalized}`)
    notifyRoomUpdate(normalized)
  } catch (error) {
    console.error('Failed to remove room from storage:', error)
  }
}

/**
 * Creates a new mock multiplayer mission room with the caller as Host.
 *
 * @param {string} hostPlayerName
 * @param {string|null} customRoomCode - Optional pre-generated room code
 * @returns {{ mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }}
 */
export function createMockRoom(hostPlayerName, customRoomCode = null) {
  const cleanName = (hostPlayerName || '').trim()
  if (!cleanName) {
    throw new Error('Please enter an astronaut name or call sign to establish an outpost.')
  }
  if (cleanName.length > 20) {
    throw new Error('Astronaut name must be 20 characters or fewer.')
  }

  // Use pregenerated room code or ensure unique new room code
  let roomCode = customRoomCode ? customRoomCode.trim().toUpperCase() : generateRoomCode()
  if (!customRoomCode) {
    let attempts = 0
    while (getRoomFromStorage(roomCode) && attempts < 10) {
      roomCode = generateRoomCode()
      attempts++
    }
  }

  const hostPlayerId = `astro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const hostPlayer = createPlayer({
    id: hostPlayerId,
    name: cleanName,
    role: PlayerRoles.UNASSIGNED,
    ready: false,
  })

  // Mark this player as host in room metadata
  const mission = createMission({
    roomCode,
    players: [hostPlayer],
    status: MissionStatus.LOBBY,
  })
  mission.hostId = hostPlayerId

  saveRoomToStorage(mission)

  return { mission, player: hostPlayer }
}

/**
 * Joins an existing mock multiplayer room.
 *
 * @param {string} roomCode
 * @param {string} playerName
 * @returns {{ mission: import('../../types/game.js').Mission, player: import('../../types/game.js').Player }}
 */
export function joinMockRoom(roomCode, playerName) {
  const cleanCode = (roomCode || '').trim().toUpperCase()
  const cleanName = (playerName || '').trim()

  if (!cleanCode) {
    throw new Error('Please enter a 6-character outpost access code.')
  }
  if (cleanCode.length !== 6) {
    throw new Error('Outpost access codes must be exactly 6 characters.')
  }
  if (!cleanName) {
    throw new Error('Please enter your astronaut name or call sign.')
  }
  if (cleanName.length > 20) {
    throw new Error('Astronaut name must be 20 characters or fewer.')
  }

  const mission = getRoomFromStorage(cleanCode)
  if (!mission) {
    throw new Error(`Outpost room "${cleanCode}" was not found. Please verify the code or establish a new outpost.`)
  }

  if (mission.status !== MissionStatus.LOBBY) {
    throw new Error(`Mission ${cleanCode} has already launched or completed. Access is closed.`)
  }

  if (mission.players.length >= 5) {
    throw new Error('Outpost habitat airlock is at maximum crew capacity (5/5 astronauts).')
  }

  const newPlayerId = `astro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newPlayer = createPlayer({
    id: newPlayerId,
    name: cleanName,
    role: PlayerRoles.UNASSIGNED,
    ready: false,
  })

  mission.players.push(newPlayer)
  saveRoomToStorage(mission)

  return { mission, player: newPlayer }
}

/**
 * Updates a player's assigned role in the room, checking for duplicate conflicts.
 *
 * @param {string} roomCode
 * @param {string} playerId
 * @param {string} targetRole
 * @returns {import('../../types/game.js').Mission}
 */
export function selectPlayerRole(roomCode, playerId, targetRole) {
  const mission = getRoomFromStorage(roomCode)
  if (!mission) throw new Error('Outpost session not found.')

  const player = mission.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Astronaut not found in this room.')

  // If selecting an assigned role, check if already claimed by someone else
  if (targetRole && targetRole !== PlayerRoles.UNASSIGNED) {
    const existing = mission.players.find((p) => p.id !== playerId && p.role === targetRole)
    if (existing) {
      const roleDetails = EDUCATIONAL_ROLE_DETAILS[targetRole]
      const title = roleDetails ? roleDetails.displayTitle : targetRole
      throw new Error(`The ${title} station has already been claimed by ${existing.name}.`)
    }
  }

  // Update role and reset ready status so the player re-confirms readiness
  player.role = targetRole
  player.ready = false

  saveRoomToStorage(mission)
  return mission
}

/**
 * Toggles a player's ready / standby status.
 *
 * @param {string} roomCode
 * @param {string} playerId
 * @returns {import('../../types/game.js').Mission}
 */
export function togglePlayerReady(roomCode, playerId) {
  const mission = getRoomFromStorage(roomCode)
  if (!mission) throw new Error('Outpost session not found.')

  const player = mission.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Astronaut not found in this room.')

  if (!player.ready && (!player.role || player.role === PlayerRoles.UNASSIGNED)) {
    throw new Error('You must choose an astronaut specialist role before marking yourself ready for launch!')
  }

  player.ready = !player.ready

  saveRoomToStorage(mission)
  return mission
}

/**
 * Allows an astronaut to depart the outpost room.
 *
 * @param {string} roomCode
 * @param {string} playerId
 * @returns {import('../../types/game.js').Mission | null}
 */
export function leaveMockRoom(roomCode, playerId) {
  const mission = getRoomFromStorage(roomCode)
  if (!mission) return null

  mission.players = mission.players.filter((p) => p.id !== playerId)

  if (mission.players.length === 0) {
    removeRoomFromStorage(roomCode)
    return null
  }

  // If host departed, transfer leadership to next available astronaut
  if (mission.hostId === playerId) {
    mission.hostId = mission.players[0].id
  }

  saveRoomToStorage(mission)
  return mission
}

/**
 * Validates whether all launch conditions are fulfilled.
 *
 * @param {import('../../types/game.js').Mission} mission
 * @param {string} requestingPlayerId
 * @returns {{ canStart: boolean, reasons: string[] }}
 */
export function checkStartMissionConditions(mission, requestingPlayerId) {
  const reasons = []

  if (!mission) {
    return { canStart: false, reasons: ['Mission data unavailable.'] }
  }

  const isHost = mission.hostId === requestingPlayerId
  if (!isHost) {
    reasons.push('Only the Outpost Expedition Lead (Host) can initiate launch.')
  }

  if (mission.players.length < 2) {
    reasons.push(`A minimum of 2 astronauts is required for Mars survival (Currently: ${mission.players.length}).`)
  }

  const unassignedPlayers = mission.players.filter(
    (p) => !p.role || p.role === PlayerRoles.UNASSIGNED
  )
  if (unassignedPlayers.length > 0) {
    const names = unassignedPlayers.map((p) => p.name).join(', ')
    reasons.push(`All astronauts must select a role. Unassigned: ${names}`)
  }

  const notReadyPlayers = mission.players.filter((p) => !p.ready)
  if (notReadyPlayers.length > 0) {
    const names = notReadyPlayers.map((p) => p.name).join(', ')
    reasons.push(`All crew members must report ready. Standby: ${names}`)
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  }
}

/**
 * Initiates mission launch when all conditions are fulfilled.
 *
 * @param {string} roomCode
 * @param {string} requestingPlayerId
 * @returns {import('../../types/game.js').Mission}
 */
export function startMission(roomCode, requestingPlayerId) {
  const mission = getRoomFromStorage(roomCode)
  if (!mission) throw new Error('Outpost session not found.')

  const { canStart, reasons } = checkStartMissionConditions(mission, requestingPlayerId)
  if (!canStart) {
    throw new Error(reasons[0] || 'Mission launch conditions are not yet met.')
  }

  mission.status = MissionStatus.IN_PROGRESS
  saveRoomToStorage(mission)
  return mission
}

/**
 * Adds a simulated automated crew member to help test 2+ player launch conditions
 * without requiring multiple browser windows.
 *
 * @param {string} roomCode
 * @returns {import('../../types/game.js').Mission}
 */
export function addDemoCrewMember(roomCode) {
  const mission = getRoomFromStorage(roomCode)
  if (!mission) throw new Error('Outpost session not found.')

  if (mission.players.length >= 5) {
    throw new Error('Outpost airlock is already full (5/5 crew).')
  }

  // Find an unassigned role
  const claimedRoles = new Set(mission.players.map((p) => p.role))
  const candidate = DEMO_ASTRONAUTS.find(
    (d) => !claimedRoles.has(d.role) && !mission.players.some((p) => p.name === d.name)
  )

  const roleToAssign = candidate
    ? candidate.role
    : [
        PlayerRoles.ENGINEER,
        PlayerRoles.BOTANIST,
        PlayerRoles.MEDIC,
        PlayerRoles.SCIENTIST,
        PlayerRoles.COMMANDER,
      ].find((r) => !claimedRoles.has(r)) || PlayerRoles.UNASSIGNED

  const name = candidate
    ? candidate.name
    : `Cadet Unit #${mission.players.length + 1} (AI)`

  const demoPlayer = createPlayer({
    id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name,
    role: roleToAssign,
    ready: true,
  })
  demoPlayer.isSimulated = true

  mission.players.push(demoPlayer)
  saveRoomToStorage(mission)
  return mission
}

/**
 * Removes a simulated demo crew member.
 *
 * @param {string} roomCode
 * @param {string} playerId
 * @returns {import('../../types/game.js').Mission}
 */
export function removeDemoCrewMember(roomCode, playerId) {
  return leaveMockRoom(roomCode, playerId)
}

/**
 * Subscribes to real-time room updates across browser tabs.
 *
 * @param {string} roomCode
 * @param {(mission: import('../../types/game.js').Mission | null) => void} onUpdate
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToRoom(roomCode, onUpdate) {
  const cleanCode = (roomCode || '').trim().toUpperCase()

  const handleStorageEvent = (event) => {
    if (event.key === `${STORAGE_PREFIX}${cleanCode}`) {
      try {
        const updated = event.newValue ? JSON.parse(event.newValue) : null
        onUpdate(updated)
      } catch {
        // Fallback silently
      }
    }
  }

  const handleBroadcastMessage = (event) => {
    if (event.data && event.data.roomCode === cleanCode) {
      const current = getRoomFromStorage(cleanCode)
      onUpdate(current)
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent)
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage)
    }
  }

  // Initial push
  onUpdate(getRoomFromStorage(cleanCode))

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent)
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage)
      }
    }
  }
}

