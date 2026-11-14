export const HISTORY_SECTIONS = Object.freeze([
  'crew',
  'solSnapshots',
  'completedTasks',
  'objectives',
  'events',
  'decisions',
])

const COMPLETENESS_VALUES = new Set(['complete', 'partial', 'missing'])

function sectionCompleteness(value) {
  return COMPLETENESS_VALUES.has(value) ? value : 'missing'
}

/**
 * Normalize the provisional Person 3/4/5 payload without filling in records.
 * Missing lists stay null; only an explicitly complete empty array means none.
 */
export function normalizeMissionHistoryResponse(response) {
  if (!response || typeof response !== 'object') {
    return { status: 'missing', history: null, message: 'No mission history was returned.' }
  }

  if (response.status === 'unavailable' || response.status === 'error') {
    return { status: response.status, history: null, message: response.message || '' }
  }

  if (response.history === null && response.status === 'missing') {
    return {
      status: 'missing',
      history: null,
      message: response.message || 'No history was found for this mission ID.',
      completeness: response.completeness || Object.fromEntries(HISTORY_SECTIONS.map((key) => [key, 'missing'])),
    }
  }

  const rawHistory = response.history && typeof response.history === 'object'
    ? response.history
    : response
  const completeness = {}
  const history = { ...rawHistory }

  for (const section of HISTORY_SECTIONS) {
    const records = rawHistory[section]
    let sectionStatus = sectionCompleteness(rawHistory.completeness?.[section])

    if (!Array.isArray(records)) {
      if (sectionStatus === 'complete') sectionStatus = 'missing'
      history[section] = null
    } else {
      history[section] = records
      if (records.length > 0 && sectionStatus === 'missing') sectionStatus = 'partial'
    }

    completeness[section] = sectionStatus
  }

  history.completeness = completeness
  const allSectionsComplete = HISTORY_SECTIONS.every((section) => completeness[section] === 'complete')
  const anySectionKnown = HISTORY_SECTIONS.some((section) => completeness[section] !== 'missing')
  const hasMissionMetadata = Boolean(history.mission && typeof history.mission === 'object')
  const sourceMarksComplete = rawHistory.historyStatus === 'complete' || response.status === 'complete'
  const status = sourceMarksComplete && allSectionsComplete
    ? 'complete'
    : anySectionKnown || hasMissionMetadata
      ? 'partial'
      : 'missing'

  return {
    status,
    history,
    message: response.message || '',
    completeness,
  }
}

/** Create a read-only adapter around a future Person 5 history reader. */
export function createMissionHistoryAdapter(person5GetMissionHistory) {
  return async function readMissionHistory(missionId) {
    const safeMissionId = typeof missionId === 'string' ? missionId.trim() : ''
    if (!safeMissionId) {
      return { status: 'missing', history: null, message: 'Enter a mission ID to load its history.' }
    }

    if (typeof person5GetMissionHistory !== 'function') {
      return {
        status: 'unavailable',
        history: null,
        message: 'A live mission-history provider is not connected in this build.',
      }
    }

    try {
      const response = await person5GetMissionHistory(safeMissionId)
      return normalizeMissionHistoryResponse(response)
    } catch (error) {
      return {
        status: 'error',
        history: null,
        message: error instanceof Error ? error.message : 'Mission history could not be loaded.',
      }
    }
  }
}

let activeHistoryReader = createMissionHistoryAdapter()

/** Connect Person 5's read-only getMissionHistory(missionId) implementation. */
export function connectMissionHistoryProvider(person5GetMissionHistory) {
  if (typeof person5GetMissionHistory !== 'function') {
    throw new TypeError('The mission-history provider must be a function.')
  }
  activeHistoryReader = createMissionHistoryAdapter(person5GetMissionHistory)
}

/** Read one mission history through the currently connected provider. */
export function getMissionHistory(missionId) {
  return activeHistoryReader(missionId)
}
