import { MISSION_TASKS } from './taskDefinitions.js'

export const DEFAULT_TASK_COUNTS = Object.freeze({ minPerPlayer: 2, maxPerPlayer: 3 })

const FALLBACK_ROLES = [
  'Mission Commander',
  'Power Engineer',
  'Botanist',
  'Life Support Officer',
  'Science & Safety Officer',
]

const ROLE_ALIASES = {
  Commander: 'Mission Commander',
  Engineer: 'Power Engineer',
  Medic: 'Life Support Officer',
  Scientist: 'Science & Safety Officer',
}

function hashSeed(value) {
  const text = String(value || 'mission-outpost')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 1
}

function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function shuffle(items, random) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[output[index], output[other]] = [output[other], output[index]]
  }
  return output
}

function normalizePlayers(players = []) {
  const crew = Array.isArray(players) ? players.slice(0, 5) : []
  if (crew.length) return crew
  return FALLBACK_ROLES.map((role, index) => ({ id: `preview-crew-${index + 1}`, name: role, role }))
}

/** Create reproducible, role-specific task assignments once for a mission. */
export function assignMissionTasks(mission, players, options = {}) {
  const minPerPlayer = Math.max(1, Math.floor(options.minPerPlayer ?? DEFAULT_TASK_COUNTS.minPerPlayer))
  const maxPerPlayer = Math.max(minPerPlayer, Math.floor(options.maxPerPlayer ?? DEFAULT_TASK_COUNTS.maxPerPlayer))
  const seed = hashSeed(options.seed ?? mission?.taskSeed ?? mission?.missionId ?? mission?.roomCode ?? 'mission-outpost')
  const random = createRandom(seed)
  const crew = normalizePlayers(players || mission?.players)
  const claimedTaskIds = new Set()
  const assignments = []

  for (const [playerIndex, player] of crew.entries()) {
    const role = ROLE_ALIASES[player.role] || player.role || FALLBACK_ROLES[playerIndex]
    const candidates = shuffle(MISSION_TASKS.filter((task) => task.role === role), random)
    const requestedCount = minPerPlayer + Math.floor(random() * (maxPerPlayer - minPerPlayer + 1))
    const selected = candidates.filter((task) => !claimedTaskIds.has(task.id)).slice(0, requestedCount)

    for (const task of selected) {
      claimedTaskIds.add(task.id)
      assignments.push({
        ...task,
        target: Array.isArray(task.target) ? [...task.target] : task.target,
        assignedTo: { playerId: player.id || `preview-crew-${playerIndex + 1}`, role, name: player.name || role },
        status: 'not_started',
        progress: 0,
      })
    }
  }

  return { seed, minPerPlayer, maxPerPlayer, tasks: assignments }
}

export function getMissionTaskAssignment(mission, players, options) {
  if (mission?.taskAssignment?.tasks?.length) return mission.taskAssignment
  return assignMissionTasks(mission, players, options)
}

export function getAssignedTasksForPlayer(assignment, playerId, role) {
  return (assignment?.tasks || []).filter((task) => (
    task.assignedTo?.playerId === playerId || (!playerId && task.assignedTo?.role === role)
  ))
}
