const DIFFICULTIES = new Set(['casual', 'standard', 'challenging', 'custom'])
const FREQUENCIES = new Set(['none', 'low', 'medium', 'high'])

export const DEFAULT_MISSION_CONFIGURATION = Object.freeze({
  difficulty: 'standard',
  duration: Object.freeze({
    totalSols: 3,
    solDurationMinutes: 10,
    acceleratedMode: false,
  }),
  tasks: Object.freeze({
    shortDifficulty: 'standard',
    longDifficulty: 'standard',
    tasksPerAstronaut: 3,
    optionalTasksEnabled: true,
    mandatoryTasksEnabled: true,
    teamTasksEnabled: true,
  }),
  events: Object.freeze({
    solarFlareFrequency: 'medium',
    dustStormFrequency: 'medium',
    equipmentFailureFrequency: 'medium',
    difficulty: 'standard',
  }),
})

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(maximum, Math.max(minimum, Math.floor(number)))
}

function oneOf(value, choices, fallback) {
  return choices.has(value) ? value : fallback
}

/** Return a complete, serializable configuration while retaining valid user choices. */
export function normalizeMissionConfiguration(configuration = {}) {
  const source = configuration && typeof configuration === 'object' ? configuration : {}
  const duration = source.duration && typeof source.duration === 'object' ? source.duration : {}
  const tasks = source.tasks && typeof source.tasks === 'object' ? source.tasks : {}
  const events = source.events && typeof source.events === 'object' ? source.events : {}

  return {
    difficulty: oneOf(source.difficulty, DIFFICULTIES, DEFAULT_MISSION_CONFIGURATION.difficulty),
    duration: {
      totalSols: boundedInteger(duration.totalSols, DEFAULT_MISSION_CONFIGURATION.duration.totalSols, 1, 100),
      solDurationMinutes: boundedInteger(duration.solDurationMinutes, DEFAULT_MISSION_CONFIGURATION.duration.solDurationMinutes, 1, 1440),
      acceleratedMode: duration.acceleratedMode === true,
    },
    tasks: {
      shortDifficulty: oneOf(tasks.shortDifficulty, DIFFICULTIES, DEFAULT_MISSION_CONFIGURATION.tasks.shortDifficulty),
      longDifficulty: oneOf(tasks.longDifficulty, DIFFICULTIES, DEFAULT_MISSION_CONFIGURATION.tasks.longDifficulty),
      tasksPerAstronaut: boundedInteger(tasks.tasksPerAstronaut, DEFAULT_MISSION_CONFIGURATION.tasks.tasksPerAstronaut, 1, 6),
      optionalTasksEnabled: tasks.optionalTasksEnabled !== false,
      mandatoryTasksEnabled: tasks.mandatoryTasksEnabled !== false,
      teamTasksEnabled: tasks.teamTasksEnabled !== false,
    },
    events: {
      solarFlareFrequency: oneOf(events.solarFlareFrequency, FREQUENCIES, DEFAULT_MISSION_CONFIGURATION.events.solarFlareFrequency),
      dustStormFrequency: oneOf(events.dustStormFrequency, FREQUENCIES, DEFAULT_MISSION_CONFIGURATION.events.dustStormFrequency),
      equipmentFailureFrequency: oneOf(events.equipmentFailureFrequency, FREQUENCIES, DEFAULT_MISSION_CONFIGURATION.events.equipmentFailureFrequency),
      difficulty: oneOf(events.difficulty, DIFFICULTIES, DEFAULT_MISSION_CONFIGURATION.events.difficulty),
    },
  }
}

/** Create the single mission-owned clock for a Sol. Accelerated mode runs at 10x. */
export function startSolClock(configuration, now = Date.now()) {
  const settings = normalizeMissionConfiguration(configuration)
  const durationSeconds = settings.duration.solDurationMinutes * 60
  const rateMultiplier = settings.duration.acceleratedMode ? 10 : 1
  const wallDurationMs = (durationSeconds * 1000) / rateMultiplier

  return {
    startedAt: now,
    endsAt: now + wallDurationMs,
    durationSeconds,
    rateMultiplier,
  }
}

/** Read the clock for display or expiry checks without starting a second timer. */
export function getSolClockState(mission, now = Date.now()) {
  const clock = mission?.solClock
  if (!clock || !Number.isFinite(clock.endsAt) || !Number.isFinite(clock.durationSeconds)) return null

  const rateMultiplier = Number.isFinite(clock.rateMultiplier) && clock.rateMultiplier > 0
    ? clock.rateMultiplier
    : 1
  const remainingSeconds = Math.max(0, Math.ceil(((clock.endsAt - now) / 1000) * rateMultiplier))
  const elapsedSeconds = Math.max(0, clock.durationSeconds - remainingSeconds)

  return {
    currentSol: mission.round,
    totalSols: normalizeMissionConfiguration(mission.missionConfiguration).duration.totalSols,
    durationSeconds: clock.durationSeconds,
    remainingSeconds,
    progress: Math.min(1, elapsedSeconds / clock.durationSeconds),
    rateMultiplier,
  }
}
