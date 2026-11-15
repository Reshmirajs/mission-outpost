import { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react'
import Dashboard from './components/dashboard'
import { EventsContainer } from './components/events'
import { applyConsumption } from './game/resourceManager'
import { advanceMission, completeMissionTask } from './game/missionEngine'
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

const MarsGameView = lazy(() => import('./components/game/MarsGameView'))
const PLAYABLE_MISSION_TARGET_SOL = 8

function App() {
  const showDeveloperNavigation = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('dev') === '1'
  // Navigation view: 'dashboard' (default for inspection), 'welcome', or 'events'
  const [currentView, setCurrentView] = useState('welcome')

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
  const [mission, setMission] = useState(mockMission)
  const [resources, setResources] = useState(mockResources)
  const [prevPreset, setPrevPreset] = useState('default')

  // Lobby states
  const [lobbyMode, setLobbyMode] = useState(null)
  const [activeMission, setActiveMission] = useState(null)
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
        missionId: `LOCAL-${launchedMission.roomCode}-${Date.now()}`,
        targetSols: PLAYABLE_MISSION_TARGET_SOL,
        startedAt: new Date().toISOString(),
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
   */
  const handleApplyResourceDelta = (appliedDelta) => {
    const newResources = applyConsumption(resources, appliedDelta)
    const targetRound = mission?.targetSols || 20
    const newStatus = evaluateMissionStatus(
      { ...mission, resources: newResources },
      targetRound
    )

    setResources(newResources)
    setMission((prev) => ({
      ...prev,
      resources: newResources,
      status: newStatus,
    }))
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
    }, { targetRound: currentMission?.targetSols || PLAYABLE_MISSION_TARGET_SOL })
    if (!result.applied) return
    setResources(result.mission.resources)
    setMission(result.mission)
    if (activeMission) setActiveMission(result.mission)
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
    if (activeMission) setActiveMission(updated)
  }

  const handleAdvanceSol = () => {
    const currentMission = activeMission || { ...mission, resources, players: mockCrew }
    const targetRound = currentMission.targetSols || PLAYABLE_MISSION_TARGET_SOL
    if (['completed', 'failed'].includes(currentMission.status)) return

    const occurredAt = new Date().toISOString()
    const event = { ...getSimulatedSolEvent(currentMission.round + 1), sol: currentMission.round, occurredAt }
    const afterEvent = applyConsumption(resources, event.delta)
    const eventStatus = evaluateMissionStatus({ ...currentMission, resources: afterEvent }, targetRound)
    const eventRecords = [...(currentMission.events || []), event]
    const solSnapshots = [...(currentMission.solSnapshots || []), {
      sol: currentMission.round,
      resources: afterEvent,
      recordedAt: occurredAt,
    }]

    if (eventStatus !== 'in_progress') {
      const ended = { ...currentMission, resources: afterEvent, status: eventStatus, endedAt: occurredAt, events: eventRecords, solSnapshots }
      setResources(afterEvent)
      setMission(ended)
      if (activeMission) setActiveMission(ended)
      saveLocalMissionHistory(ended)
      setReportMissionId(ended.missionId)
    } else {
      const advancedEngineState = advanceMission({ ...currentMission, resources: afterEvent }, { targetRound })
      // The shared factory intentionally returns its core schema; retain this local
      // preview's timestamps and history metadata at the app integration boundary.
      const advanced = { ...currentMission, ...advancedEngineState }
      if (advanced.status !== 'in_progress') {
        const endedAt = new Date().toISOString()
        const ended = {
          ...advanced,
          endedAt,
          events: eventRecords,
          solSnapshots: [...solSnapshots, { sol: advanced.round, resources: advanced.resources, recordedAt: endedAt }],
        }
        setResources(ended.resources)
        setMission(ended)
        if (activeMission) setActiveMission(ended)
        saveLocalMissionHistory(ended)
        setReportMissionId(ended.missionId)
      } else {
        const updated = { ...advanced, events: eventRecords, solSnapshots }
        setResources(advanced.resources)
        setMission(updated)
        if (activeMission) setActiveMission(updated)
      }
    }
    setGameAlerts([event])
  }

  const handleOpenGamePreview = () => {
    if (!activeMission) {
      const startedAt = new Date().toISOString()
      const previewMission = {
        ...mockMission,
        missionId: `LOCAL-PREVIEW-${Date.now()}`,
        roomCode: 'PREVIEW',
        status: 'in_progress',
        round: 1,
        targetSols: PLAYABLE_MISSION_TARGET_SOL,
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
          />
        ) : currentView === 'events' ? (
          <EventsContainer
            resources={resources}
            mission={activeMission || mission}
            players={activeMission?.players || mockCrew}
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
              players={activeMission?.players || mockCrew}
              currentPlayer={activePlayer}
              alerts={gameAlerts.length ? gameAlerts : mockAlerts}
              onTaskComplete={handleTaskComplete}
              onTaskProgress={handleTaskProgress}
              onAdvanceSol={handleAdvanceSol}
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
                  Outpost Code: <strong>{activeMission.roomCode}</strong> &bull; Crew: {activeMission.players.map((p) => `${p.name} (${p.role})`).join(', ')}
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
