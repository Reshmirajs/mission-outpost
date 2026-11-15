import { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react'
import Dashboard from './components/dashboard'
import { EventsContainer } from './components/events'
import { applyConsumption } from './game/resourceManager'
import { endMissionSol, completeMissionTask } from './game/missionEngine'
import { DEFAULT_MISSION_CONFIGURATION, getSolClockState, normalizeMissionConfiguration, startSolClock } from './game/missionConfiguration.js'
import { loadLocalMissionSession, saveLocalMissionSession } from './game/missionSessionStorage.js'
import { getSimulatedSolEvent } from './game/environmentEvents'
import { getLocalMissionHistory, saveLocalMissionHistory } from './game/localMissionHistoryProvider'
import { evaluateMissionStatus } from './game/missionRules'
import { assignMissionTasks } from './game/tasks/taskAssignment'
import NasaScienceTerminal from './components/science/NasaScienceTerminal'
import FinalMissionReport from './components/report/FinalMissionReport'
import { fetchDonkiSpaceWeather } from './services/nasa/donkiService'
import { fetchMarsRoverImage } from './services/nasa/marsImageryService'
import {
  mockResources,
  mockResourcePresets,
  mockMission,
  mockCrew,
  mockObjectives,
  mockAlerts,
  mockNasaSpaceWeather,
  mockNasaMarsEnvironment,
  mockNasaRadLab,
} from './components/dashboard/mockDashboardData'
import LobbyView from './components/lobby'
import './App.css'
import { signInGuest, listenToAuthState } from './firebase/auth.js'
import {
  subscribeToRoom,
  updateMission,
  advanceSol,
  reconnectToRoom,
  loadSession,
  clearSession,
} from './services/multiplayer/index.js'
import { PlayerRoles, MissionStatus } from './types/game.js'

const MarsGameView = lazy(() => import('./components/game/MarsGameView'))
const PLAYABLE_MISSION_TARGET_SOL = 8

function App() {
  const showDeveloperNavigation = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('dev') === '1'
  const [restoredMission] = useState(() => loadLocalMissionSession())
  // Navigation view: 'dashboard' (default for inspection), 'welcome', or 'events'
  const [currentView, setCurrentView] = useState(() => restoredMission ? 'game' : 'welcome')

  // Testing mock presets: 'default' | 'nominal' | 'caution' | 'critical' | 'missing_nasa'
  const [activePreset, setActivePreset] = useState('default')
  const [spaceWeatherData, setSpaceWeatherData] = useState({ status: 'loading', events: [] })
  const [marsImageryData, setMarsImageryData] = useState({ status: 'loading' })

  useEffect(() => {
    let isCurrentEffect = true

    fetchDonkiSpaceWeather()
      .then((data) => {
        if (!isCurrentEffect) return

        if (data.status === 'fallback') {
          setSpaceWeatherData({
            ...mockNasaSpaceWeather,
            ...data,
            events: mockNasaSpaceWeather.events,
            observationSource: mockNasaSpaceWeather.observationSource,
            error: data.failures.map((failure) => `${failure.eventType}: ${failure.message}`).join(' '),
          })
          return
        }

        setSpaceWeatherData(data)
      })
      .catch((error) => {
        if (isCurrentEffect) {
          setSpaceWeatherData({
            status: 'error',
            events: [],
            error: error instanceof Error ? error.message : 'NASA DONKI data could not be loaded.',
          })
        }
      })

    return () => {
      isCurrentEffect = false
    }
  }, [])

  useEffect(() => {
    let isCurrentEffect = true

    fetchMarsRoverImage()
      .then((data) => {
        if (isCurrentEffect) setMarsImageryData(data)
      })
      .catch((error) => {
        if (isCurrentEffect) {
          setMarsImageryData({
            ...mockNasaMarsEnvironment,
            status: 'fallback',
            error: error instanceof Error ? error.message : 'NASA Mars imagery could not be loaded.',
          })
        }
      })

    return () => {
      isCurrentEffect = false
    }
  }, [])

  // Synchronized mission state & live habitat resources across views
  const [mission, setMission] = useState(() => restoredMission || mockMission)
  const [resources, setResources] = useState(() => restoredMission?.resources || mockResources)
  const [prevPreset, setPrevPreset] = useState('default')

  // Lobby states
  const [lobbyMode, setLobbyMode] = useState(null)
  const [activeMission, setActiveMission] = useState(() => restoredMission)
  const [activePlayer, setActivePlayer] = useState(() => {
    try {
      const saved = sessionStorage.getItem('mission_outpost_current_player')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const activeMissionRef = useRef(null)
  const [gameAlerts, setGameAlerts] = useState([])
  const [reportMissionId, setReportMissionId] = useState('')

  useEffect(() => {
    activeMissionRef.current = activeMission
  }, [activeMission])

  useEffect(() => {
    if (activeMission) saveLocalMissionSession(activeMission)
  }, [activeMission])

  const [clockNow, setClockNow] = useState(() => Date.now())
  const autoSolEndKeyRef = useRef('')
  const advanceSolHandlerRef = useRef(null)

  useEffect(() => {
    if (activeMission?.status !== 'in_progress' || !activeMission.solClock?.endsAt) return undefined
    const interval = window.setInterval(() => setClockNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [activeMission?.missionId, activeMission?.round, activeMission?.solClock?.endsAt, activeMission?.status])

  // ── Firebase Anonymous Authentication ───────────────────────────────────────
  // firebaseUser holds the Firebase User object once the player signs in.
  // authError is a readable message shown if sign-in fails.
  // Prefixed with _ to indicate these will be wired to the lobby in Step 2.
  // firebaseUser.uid will become the player's permanent ID in Firebase.
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [_authError, setAuthError] = useState('')

  useEffect(() => {
    // We only run auth when Firebase is actually configured.
    // If .env.local is missing or incomplete, we skip quietly.
    let unsubscribeAuth

    async function initializeGuest() {
      try {
        // signInAnonymously() gives every player a unique Firebase uid.
        // This uid is stable for the duration of the browser session.
        const user = await signInGuest()
        setFirebaseUser(user)

        // listenToAuthState fires every time the auth status changes
        // (e.g. user signs out or token refreshes). We store the unsubscribe
        // so we can clean up when the component unmounts.
        unsubscribeAuth = listenToAuthState((currentUser) => {
          setFirebaseUser(currentUser)
        })
      } catch (error) {
        console.error('[Firebase Auth] Guest sign-in failed:', error)
        setAuthError(error.message)
      }
    }

    initializeGuest()

    // Cleanup: stop listening when the app unmounts
    return () => {
      if (unsubscribeAuth) unsubscribeAuth()
    }
  }, []) // [] means this runs once when the app first loads

  // ── Session Auto-Restore on Page Refresh / Reconnect ───────────────────────
  // If the user refreshes while in an active game or lobby, restore activeMission
  useEffect(() => {
    const saved = loadSession()
    if (!saved?.roomCode || !saved?.playerId) return

    let isCancelled = false
    async function restoreSession() {
      try {
        const { mission: restoredMission } = await reconnectToRoom(saved.roomCode, saved.playerId)
        if (isCancelled || !restoredMission) return
        setActiveMission(restoredMission)
        setMission(restoredMission)
        if (restoredMission.resources) setResources(restoredMission.resources)
        if (restoredMission.status === MissionStatus.IN_PROGRESS) {
          setCurrentView('dashboard')
        }
      } catch (err) {
        console.warn('[Session:App] Stale session could not be restored:', err.message)
        clearSession()
      }
    }
    restoreSession()
    return () => {
      isCancelled = true
    }
  }, [])

  // ── Firebase Shared Mission State & Resource Subscription ──────────────────
  // When an active room is running (activeMission has a roomCode), we subscribe
  // to real-time room updates from Firebase Realtime Database. Any changes made
  // by any astronaut (resources, round, status, crew updates) immediately update
  // the shared local state across the Dashboard and Events Chamber.
  useEffect(() => {
    const roomCode = activeMission?.roomCode
    if (!roomCode) return

    const unsubscribe = subscribeToRoom(
      roomCode,
      (updatedMission) => {
        if (!updatedMission) return
        setActiveMission(updatedMission)
        setMission(updatedMission)
        if (updatedMission.resources) {
          setResources(updatedMission.resources)
        }
      },
      (error) => {
        console.warn('[Multiplayer:App] Subscription notification:', error?.message || error)
      }
    )

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [activeMission?.roomCode])

  // Synchronize resource levels when test preset buttons are clicked
  if (activePreset !== prevPreset) {
    setPrevPreset(activePreset)
    if (activePreset === 'nominal') {
      setResources(mockResourcePresets.nominal)
    } else if (activePreset === 'caution') {
      setResources(mockResourcePresets.caution)
    } else if (activePreset === 'critical') {
      setResources(mockResourcePresets.critical)
    } else {
      setResources(mockResources)
    }
  }

  // NASA feeds load independently from simulated game state.
  let spaceWeather = spaceWeatherData
  let marsEnvironment = marsImageryData
  let radLab = mockNasaRadLab

  if (activePreset === 'missing_nasa') {
    spaceWeather = {
      ...mockNasaSpaceWeather,
      status: 'fallback',
      error: 'Fallback preview selected.',
    }
    marsEnvironment = null
    radLab = null
  }

  const handleStartMissionFromLobby = useCallback((launchedMission, astronaut) => {
    const existingSession = activeMissionRef.current
    const missionSession = existingSession?.roomCode === launchedMission.roomCode
      && existingSession.status === 'in_progress'
      ? existingSession
      : {
        ...launchedMission,
        missionConfiguration: normalizeMissionConfiguration(launchedMission.missionConfiguration || DEFAULT_MISSION_CONFIGURATION),
        missionId: launchedMission.missionId || `LOCAL-${launchedMission.roomCode}-${Date.now()}`,
        targetSols: launchedMission.targetSols || normalizeMissionConfiguration(launchedMission.missionConfiguration || DEFAULT_MISSION_CONFIGURATION).duration.totalSols,
        startedAt: launchedMission.startedAt || new Date().toISOString(),
        solClock: launchedMission.solClock || startSolClock(launchedMission.missionConfiguration || DEFAULT_MISSION_CONFIGURATION),
        completedTasks: [],
        events: [],
        solSnapshots: [],
        taskAssignment: launchedMission.taskAssignment || assignMissionTasks(launchedMission, launchedMission.players),
      }
    activeMissionRef.current = missionSession
    setActiveMission(missionSession)
    setMission(missionSession)
    setResources(missionSession.resources)
    setActivePlayer(astronaut || null)
    if (astronaut) {
      try {
        sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(astronaut))
      } catch {
        // ignore
      }
    }
    setGameAlerts([])
    setLobbyMode(null)
    setCurrentView('game')
  }, [])

  /**
   * Applies an event decision's resource delta to the shared application state
   * using Person 3's game engine functions (applyConsumption and evaluateMissionStatus).
   * Synchronizes telemetry across both the Events Chamber and Mars Dashboard.
   * In multiplayer mode, synchronizes the updated resources and status to Firebase RTDB.
   */
  const handleApplyResourceDelta = (appliedDelta) => {
    const currentMission = activeMission || mission
    const newResources = applyConsumption(currentMission?.resources || resources, appliedDelta)
    const targetRound = (currentMission?.targetSols || 20) + 1
    const updatedMission = {
      ...currentMission,
      resources: newResources,
      status: evaluateMissionStatus({ ...currentMission, resources: newResources }, targetRound),
    }

    // Instant optimistic update for smooth UI
    setResources(newResources)
    // Instant optimistic update for smooth UI
    setResources(newResources)
    setMission(updatedMission)
    if (activeMission) {
      activeMissionRef.current = updatedMission
      setActiveMission(updatedMission)
    }

    // If connected to a multiplayer room, sync to Firebase RTDB
    if (activeMission?.roomCode && activeMission.roomCode !== 'PREVIEW') {
      updateMission(activeMission.roomCode, {
        resources: newResources,
        status: updatedMission.status,
      }).catch((err) => {
        console.error('[Multiplayer:App] Failed to sync resource delta to Firebase:', err)
      })
    }
  }

  const handleTaskComplete = (task) => {
    const currentMission = activeMission || mission
    const result = completeMissionTask(currentMission, {
      taskId: task.id,
      title: task.title,
      playerId: task.playerId,
      role: task.role,
      resourceDelta: task.reward,
      completedAt: new Date().toISOString(),
    }, { targetRound: (currentMission?.targetSols || PLAYABLE_MISSION_TARGET_SOL) + 1 })
    if (!result.applied) return
    setResources(result.mission.resources)
    setMission(result.mission)
    if (activeMission) {
      activeMissionRef.current = result.mission
      setActiveMission(result.mission)
    }
  }

  const handleTaskProgress = (taskId, progressState) => {
    const currentMission = activeMission || mission
    const updated = {
      ...currentMission,
      taskProgress: { ...(currentMission.taskProgress || {}), [taskId]: progressState },
      taskAssignment: currentMission.taskAssignment ? {
        ...currentMission.taskAssignment,
        tasks: currentMission.taskAssignment.tasks.map((task) => task.id === taskId
          ? { ...task, status: task.status === 'completed' ? task.status : 'in_progress', progress: progressState?.percent || 0 }
          : task),
      } : currentMission.taskAssignment,
    }
    setMission(updated)
    if (activeMission) {
      activeMissionRef.current = updated
      setActiveMission(updated)
    }
  }

  // ── Unified Advance Sol: Handles both Firebase Multiplayer and Local Sol Clock ──
  const [isAdvancingSol, setIsAdvancingSol] = useState(false)

  const handleAdvanceSol = useCallback(async () => {
    const currentMission = activeMissionRef.current || activeMission || { ...mission, resources, players: mockCrew }
    if (['completed', 'failed'].includes(currentMission.status)) return

    // If connected to a live multiplayer room, use atomic Firebase advanceSol
    if (currentMission?.roomCode && currentMission.roomCode !== 'PREVIEW') {
      if (isAdvancingSol) return
      setIsAdvancingSol(true)
      try {
        const playerId = firebaseUser?.uid || currentMission.players?.[0]?.id
        const advanced = await advanceSol(
          currentMission.roomCode,
          playerId,
          { targetRound: currentMission.targetSols || 20 }
        )
        activeMissionRef.current = advanced
        setActiveMission(advanced)
        setMission(advanced)
        if (advanced.resources) setResources(advanced.resources)
      } catch (err) {
        console.error('[Lifecycle:App] advanceSol failed:', err.message)
        alert(err.message)
      } finally {
        setIsAdvancingSol(false)
      }
      return
    }

    // Local / Single-player fallback from main:
    const configuration = normalizeMissionConfiguration(currentMission.missionConfiguration || DEFAULT_MISSION_CONFIGURATION)
    const totalSols = currentMission.targetSols || configuration.duration.totalSols
    const currentSol = currentMission.round || 1
    const clockKey = String(currentMission.missionId || currentMission.roomCode) + ':' + currentSol + ':' + String(currentMission.solClock?.endsAt || 'manual')
    autoSolEndKeyRef.current = clockKey
    const occurredAt = new Date().toISOString()
    const event = { ...getSimulatedSolEvent(currentSol + 1), sol: currentSol, occurredAt }
    const startingResources = currentMission.resources || resources
    const afterEvent = applyConsumption(startingResources, event.delta)
    const eventRecords = [...(currentMission.events || []), event]
    const tasksThisSol = (currentMission.completedTasks || []).filter((task) => task.sol === currentSol)
    const advanced = endMissionSol({ ...currentMission, resources: afterEvent }, {
      totalSols,
      tasksCompleted: tasksThisSol,
      emergenciesApplied: [event.id].filter(Boolean),
    })
    const solSnapshots = [...(currentMission.solSnapshots || []), {
      sol: currentSol,
      resources: advanced.resources,
      recordedAt: occurredAt,
    }]
    const ended = ['completed', 'failed'].includes(advanced.status)
    const nextMission = {
      ...currentMission,
      ...advanced,
      targetSols: totalSols,
      missionConfiguration: configuration,
      events: eventRecords,
      solSnapshots,
      ...(ended ? { endedAt: occurredAt } : { solClock: startSolClock(configuration) }),
    }

    activeMissionRef.current = activeMission ? nextMission : null
    setResources(nextMission.resources)
    setMission(nextMission)
    if (activeMission) setActiveMission(nextMission)
    if (ended) {
      saveLocalMissionHistory(nextMission)
      setReportMissionId(nextMission.missionId)
    }
    setGameAlerts([event])
  }, [activeMission, mission, resources, isAdvancingSol, firebaseUser])

  useEffect(() => {
    advanceSolHandlerRef.current = handleAdvanceSol
  }, [handleAdvanceSol])

  useEffect(() => {
    const clockState = getSolClockState(activeMission, clockNow)
    if (!clockState || clockState.remainingSeconds > 0 || activeMission?.status !== 'in_progress') return
    const key = String(activeMission.missionId || activeMission.roomCode) + ':' + activeMission.round + ':' + activeMission.solClock?.endsAt
    if (autoSolEndKeyRef.current === key) return
    autoSolEndKeyRef.current = key
    advanceSolHandlerRef.current?.()
  }, [activeMission, clockNow])

  const handleOpenGamePreview = () => {
    if (!activeMission) {
      const startedAt = new Date().toISOString()
      const previewMission = {
        ...mockMission,
        missionId: `LOCAL-PREVIEW-${Date.now()}`,
        roomCode: 'PREVIEW',
        status: 'in_progress',
        round: 1,
        targetSols: DEFAULT_MISSION_CONFIGURATION.duration.totalSols,
        missionConfiguration: DEFAULT_MISSION_CONFIGURATION,
        solClock: startSolClock(DEFAULT_MISSION_CONFIGURATION),
        resources: { ...resources },
        players: mockCrew.map((player) => ({ ...player, ready: true })),
        startedAt,
        completedTasks: [],
        events: [],
        solSnapshots: [],
      }
      previewMission.taskAssignment = assignMissionTasks(previewMission, previewMission.players)
      setActiveMission(previewMission)
      setMission(previewMission)
      setGameAlerts([])
    }
    setLobbyMode(null)
    setCurrentView('game')
  }
  }

  // ── Mission Lifecycle: Advance Sol ──────────────────────────────────────────
  const [isAdvancingSol, setIsAdvancingSol] = useState(false)

  const handleAdvanceSol = async () => {
    if (!activeMission?.roomCode || isAdvancingSol) return
    setIsAdvancingSol(true)
    try {
      const playerId = firebaseUser?.uid || activeMission.players?.[0]?.id
      const advanced = await advanceSol(
        activeMission.roomCode,
        playerId,
        { targetRound: activeMission.targetSols || 20 }
      )
      setActiveMission(advanced)
      setMission(advanced)
      if (advanced.resources) setResources(advanced.resources)
    } catch (err) {
      console.error('[Lifecycle:App] advanceSol failed:', err.message)
      alert(err.message)
    } finally {
      setIsAdvancingSol(false)
    }
  }

  // Determine whether current player is authorized to advance Sol
  const currentCrewPlayer = activeMission?.players?.find((p) => p.id === (firebaseUser?.uid || null))
  const isCommanderOrHost = Boolean(
    activeMission &&
    (activeMission.hostId === firebaseUser?.uid ||
      currentCrewPlayer?.role === PlayerRoles.MISSION_COMMANDER ||
      !firebaseUser?.uid) // fallback for single-player/local testing
  )

  return (
    <div className={`app-container ${currentView === 'game' ? 'game-mode' : ''}`}>
      {/* Layer 1 & Layer 2: Mars Background Video & Translucent Overlay */}
      {currentView === 'welcome' && (
        <div className="landing-video-wrapper" aria-hidden="true">
          <video
            className="landing-bg-video"
            src="/videos/mars-background.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="landing-video-overlay" />
        </div>
      )}

      <div className="stars-overlay" aria-hidden="true"></div>

      {/* Layer 3: Navigation Header */}
      <header className="app-header">
        <div className="brand">
          <span className="mars-icon"></span>
          <span className="brand-text">Mission: Outpost</span>
        </div>

        {showDeveloperNavigation && <nav className="nav-controls" aria-label="Developer navigation">
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('dashboard')
              setLobbyMode(null)
            }}
          >
            📊 Mars Dashboard Preview
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'events' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('events')
              setLobbyMode(null)
            }}
          >
            🚨 Crisis &amp; Events Chamber
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'welcome' && !lobbyMode ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('welcome')
              setLobbyMode(null)
            }}
          >
            🚀 Mission Welcome Screen
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'game' ? 'active' : ''}`}
            onClick={handleOpenGamePreview}
          >
            Mars Habitat Game Preview
          </button>
          <button
            type="button"

            className={`nav-tab-btn ${currentView === 'science' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('science')
              setLobbyMode(null)
            }}
          >
            NASA Science Terminal
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'report' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('report')
              setLobbyMode(null)
            }}
          >
            Final Mission Report
          </button>
        </nav>}
      </header>

      {/* Preset Testing Control Toolbar (visible during Dashboard Preview) */}
      {showDeveloperNavigation && currentView === 'dashboard' && (
        <section className="preview-toolbar" aria-label="Dashboard Test Controls">
          <div className="toolbar-inner">
            <span className="toolbar-label">TEST DATA PRESETS:</span>
            <div className="preset-buttons-group">
              <button
                type="button"
                className={`preset-btn ${activePreset === 'default' ? 'active' : ''}`}
                onClick={() => setActivePreset('default')}
              >
                Standard (Default)
              </button>
              <button
                type="button"
                className={`preset-btn ${activePreset === 'nominal' ? 'active' : ''}`}
                onClick={() => setActivePreset('nominal')}
              >
                Nominal (All Safe)
              </button>
              <button
                type="button"
                className={`preset-btn ${activePreset === 'caution' ? 'active' : ''}`}
                onClick={() => setActivePreset('caution')}
              >
                Caution (Warnings)
              </button>
              <button
                type="button"
                className={`preset-btn ${activePreset === 'critical' ? 'active' : ''}`}
                onClick={() => setActivePreset('critical')}
              >
                Critical (Emergency)
              </button>
              <button
                type="button"
                className={`preset-btn ${activePreset === 'missing_nasa' ? 'active' : ''}`}
                onClick={() => setActivePreset('missing_nasa')}
              >
                Missing NASA Data (Standby)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="main-content-wrapper">
        {currentView === 'dashboard' ? (
          <Dashboard
            resources={resources}
            mission={activeMission || mission}
            players={activeMission?.players || mockCrew}
            objectives={mockObjectives}
            alerts={mockAlerts}
            spaceWeather={spaceWeather}
            marsEnvironment={marsEnvironment}
            radLab={radLab}
            canAdvance={isCommanderOrHost}
            onAdvanceSol={handleAdvanceSol}
            isAdvancing={isAdvancingSol}
          />
        ) : currentView === 'events' ? (
          <EventsContainer
            resources={resources}
            mission={activeMission || mission}
            players={activeMission?.players || mockCrew}
            currentPlayerId={firebaseUser?.uid || null}
            onApplyResourceDelta={handleApplyResourceDelta}
          />
        ) : lobbyMode ? (
          <LobbyView
            initialMode={lobbyMode}
            onStartMission={handleStartMissionFromLobby}
            onExitLobby={() => setLobbyMode(null)}
          />
        ) : currentView === 'game' ? (
          <Suspense fallback={<div className="game-loading-message">Preparing habitat map…</div>}>
            <MarsGameView
              resources={resources}
              mission={activeMission || mission || mockMission}
              players={activeMission?.players || (mission?.players && mission.players.length > 0 ? mission.players : mockCrew)}
              currentPlayer={activePlayer}
              alerts={gameAlerts.length ? gameAlerts : mockAlerts}
              spaceWeather={spaceWeather}
              onApplyResourceDelta={handleApplyResourceDelta}
              onTaskComplete={handleTaskComplete}
              onTaskProgress={handleTaskProgress}
              onAdvanceSol={handleAdvanceSol}
              solClockState={getSolClockState(activeMission || mission, clockNow)}
              onViewReport={() => {
                setReportMissionId((activeMission || mission)?.missionId || '')
                setCurrentView('report')
              }}
              onExit={() => setCurrentView('welcome')}
            />
          </Suspense>
        ) : currentView === 'science' ? (
          <NasaScienceTerminal spaceWeather={spaceWeather} marsEnvironment={marsEnvironment} />
        ) : currentView === 'report' ? (
          <FinalMissionReport key={reportMissionId} nasaData={{ spaceWeather, marsEnvironment }} historyLoader={getLocalMissionHistory} initialMissionId={reportMissionId} />
        ) : (
          <div className="landing-content-layer">
            {activeMission && (
              <section className="mission-active-banner">
                <h2>🚀 Mission in progress · Sol {activeMission.round}</h2>
                <p>
                  Outpost Code: <strong>{activeMission.roomCode}</strong> &bull; Status: <strong>{(activeMission.status || 'in_progress').toUpperCase()}</strong> &bull; Crew: {activeMission.players.map((p) => `${p.name} (${p.role})`).join(', ')}
                </p>
                <p className="banner-subtext">
                  Your crew is assembled. Continue exploring the outpost and complete your assigned work.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setCurrentView('game')}
                  >
                    Continue mission →

                  </button>
                  {isCommanderOrHost && activeMission.status === MissionStatus.IN_PROGRESS && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleAdvanceSol}
                      disabled={isAdvancingSol}
                      style={{ background: '#f59e0b', borderColor: '#d97706' }}
                    >
                      {isAdvancingSol ? 'Advancing Sol...' : 'Advance to Next Sol →'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveMission(null)}
                  >
                    Reset Mission Session
                  </button>
                </div>
              </section>
            )}

            {/* Layer 4: Hero Welcome & Heading */}
            <section className="landing-hero-section">
              <h1 className="landing-hero-title">
                <span className="landing-title-sub">MISSION</span>
                <span className="landing-title-main">OUTPOST</span>
              </h1>
              <p className="landing-hero-description">
                A cooperative multiplayer Mars survival simulation. Work together with your crew
                to manage critical life-support systems, balance resources, endure extreme Martian weather events,
                and keep the habitat operational.
              </p>
            </section>

            {/* Layer 4: Primary Action Buttons (Centered, Vertically Stacked) */}
            <div className="landing-hero-actions" aria-label="Expedition Choices">
              {/* Button 1: START AN OUTPOST (Large Orange Rounded Button) */}
              <button
                type="button"
                className="btn-hero-start"
                onClick={() => setLobbyMode('create')}
              >
                <span>Start an outpost</span>
              </button>

              {/* Button 2: JOIN A CREW (Smaller Purple Rounded Button) */}
              <button
                type="button"
                className="btn-hero-join"
                onClick={() => setLobbyMode('join')}
              >
                <span>Join a crew</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
