const STORAGE_KEY = 'mission_outpost_active_mission_v1'

export function loadLocalMissionSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const mission = raw ? JSON.parse(raw) : null
    return mission && mission.status === 'in_progress' ? mission : null
  } catch {
    return null
  }
}

export function saveLocalMissionSession(mission) {
  if (typeof window === 'undefined' || !mission?.missionId) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mission))
    return true
  } catch {
    return false
  }
}

export function clearLocalMissionSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage may be disabled by the browser.
  }
}
