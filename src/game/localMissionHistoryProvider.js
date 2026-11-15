const STORAGE_PREFIX = 'mission-outpost:local-history:'

/** Save one locally played preview mission; this provider does not sync to Firebase. */
export function saveLocalMissionHistory(mission) {
  if (!mission?.missionId || !['completed', 'failed'].includes(mission.status)) return false
  const startedAt = mission.startedAt || null
  const endedAt = mission.endedAt || null
  const crew = (Array.isArray(mission.players) ? mission.players : []).map((player) => ({
    playerId: player.id,
    name: player.name,
    role: player.role,
    joinedAt: startedAt,
    leftAt: null,
    finalStatus: 'active',
  }))
  const completedTasks = (mission.completedTasks || []).map((task) => ({
    taskId: task.taskId || task.id,
    title: task.title,
    sol: task.sol,
    completedAt: task.completedAt,
    completedBy: [{ playerId: task.playerId, role: task.role }],
  }))
  const history = {
    schemaVersion: 1,
    historyStatus: 'incomplete',
    source: 'local-preview',
    mission: { missionId: mission.missionId, roomCode: mission.roomCode, startedAt, endedAt, status: mission.status },
    crew,
    solSnapshots: mission.solSnapshots || [],
    completedTasks,
    objectives: null,
    events: (mission.events || []).map((event) => ({
      eventId: `${event.id}-sol-${event.sol}`,
      type: 'emergency',
      sol: event.sol,
      occurredAt: event.occurredAt,
      resolvedAt: null,
      affectedPlayers: [],
      outcome: 'unresolved',
      summary: `${event.title}: ${event.message}`,
    })),
    decisions: null,
    completeness: {
      crew: crew.length ? 'complete' : 'missing',
      solSnapshots: mission.solSnapshots?.length ? 'complete' : 'missing',
      completedTasks: 'complete',
      objectives: 'missing',
      events: 'partial',
      decisions: 'missing',
    },
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${mission.missionId}`, JSON.stringify(history))
    return true
  } catch {
    return false
  }
}

/** Read only locally recorded preview history by mission ID. */
export async function getLocalMissionHistory(missionId) {
  const safeId = typeof missionId === 'string' ? missionId.trim() : ''
  if (!safeId) return { status: 'missing', history: null, message: 'Enter a local mission ID.' }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${safeId}`)
    if (!raw) return { status: 'missing', history: null, message: 'No locally saved mission was found for that ID.' }
    const history = JSON.parse(raw)
    return { status: 'partial', history, source: 'local-preview', message: 'Locally recorded preview history. It is not synchronized multiplayer history.' }
  } catch {
    return { status: 'error', history: null, message: 'Local mission history could not be read.' }
  }
}
