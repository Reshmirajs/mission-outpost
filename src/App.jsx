import { useState } from 'react'
import { INITIAL_RESOURCES } from './types/game'
import Dashboard from './components/dashboard'
import { EventsContainer } from './components/events'
import { applyConsumption } from './game/resourceManager'
import { evaluateMissionStatus } from './game/missionRules'
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

function App() {
  // Navigation view: 'dashboard' (default for inspection), 'welcome', or 'events'
  const [currentView, setCurrentView] = useState('welcome')

  // Testing mock presets: 'default' | 'nominal' | 'caution' | 'critical' | 'missing_nasa'
  const [activePreset, setActivePreset] = useState('default')

  // Synchronized mission state & live habitat resources across views
  const [mission, setMission] = useState(mockMission)
  const [resources, setResources] = useState(mockResources)
  const [prevPreset, setPrevPreset] = useState('default')

  // Lobby states
  const [lobbyMode, setLobbyMode] = useState(null)
  const [activeMission, setActiveMission] = useState(null)

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

  // NASA astronomical data derivation based on preset
  let spaceWeather = mockNasaSpaceWeather
  let marsEnvironment = mockNasaMarsEnvironment
  let radLab = mockNasaRadLab

  if (activePreset === 'missing_nasa') {
    spaceWeather = null
    marsEnvironment = null
    radLab = null
  }

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

  const telemetry = [
    { key: 'oxygen', label: 'Oxygen Reserves', icon: '🫧', value: `${INITIAL_RESOURCES.oxygen}%`, fillClass: 'fill-oxygen', width: `${INITIAL_RESOURCES.oxygen}%` },
    { key: 'power', label: 'Power Grid', icon: '⚡', value: `${INITIAL_RESOURCES.power}%`, fillClass: 'fill-power', width: `${INITIAL_RESOURCES.power}%` },
    { key: 'food', label: 'Food Rations', icon: '🌱', value: `${INITIAL_RESOURCES.food}%`, fillClass: 'fill-food', width: `${INITIAL_RESOURCES.food}%` },
    { key: 'radiation', label: 'Radiation Level', icon: '☢️', value: `${INITIAL_RESOURCES.radiation}%`, fillClass: 'fill-radiation', width: '6%' },
  ]

  const roles = [
    { title: 'Mission Commander', desc: 'The team leader & expedition decisions' },
    { title: 'Power Engineer', desc: 'The electricity expert & habitat grid maintenance' },
    { title: 'Botanist', desc: 'The space gardener & hydroponics food production' },
    { title: 'Life Support Officer', desc: 'The survival expert & atmosphere systems' },
    { title: 'Science & Safety Officer', desc: 'The Mars environment expert & radiation monitoring' },
  ]

  return (
    <div className="app-container">
      <div className="stars-overlay" aria-hidden="true"></div>

      {/* Navigation Header */}
      <header className="app-header">
        <div className="brand">
          <span className="mars-icon"></span>
          <span className="brand-text">Mission: Outpost</span>
        </div>

        <nav className="nav-controls" aria-label="Module Preview Navigation">
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
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="btn-header-lobby"
            onClick={() => {
              setCurrentView('welcome')
              setLobbyMode('entry')
            }}
          >
            <span className="btn-icon"></span> Create / Join Outpost
          </button>
        </div>
      </header>

      {/* Preset Testing Control Toolbar (visible during Dashboard Preview) */}
      {currentView === 'dashboard' && (
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
            onStartMission={(launchedMission) => {
              setActiveMission(launchedMission)
              setMission(launchedMission)
              setLobbyMode(null)
              setCurrentView('dashboard')
            }}
            onExitLobby={() => setLobbyMode(null)}
          />
        ) : (
          <div className="main-content">
            {activeMission && (
              <section className="mission-active-banner">
                <h2>🚀 Sol 1 Mission Underway!</h2>
                <p>
                  Outpost Code: <strong>{activeMission.roomCode}</strong> &bull; Crew: {activeMission.players.map((p) => `${p.name} (${p.role})`).join(', ')}
                </p>
                <p className="banner-subtext">
                  Multiplayer squad briefing complete. Telemetry simulation and hazard loops are live on the dashboard.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setCurrentView('dashboard')}
                  >
                    Open Live Dashboard →
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

            {/* Hero Welcome */}
            <section className="hero-section">
              <div className="mission-tag">NASA Space Apps Challenge 2026</div>
              <h1 className="hero-title">MISSION: OUTPOST</h1>
              <p className="hero-description">
                A cooperative multiplayer Mars survival simulation. Work together with your crew
                to manage critical life-support systems, balance resources, endure extreme Martian weather events,
                and keep the habitat operational.
              </p>
            </section>

            {/* Telemetry / Resource Preview */}
            <section className="telemetry-section">
              <div className="section-label">Habitation Life Support Status</div>
              <div className="resource-grid">
                {telemetry.map((item) => (
                  <div key={item.key} className="resource-card">
                    <div className="resource-header">
                      <span className="resource-name">{item.label}</span>
                      <span className="resource-icon">{item.icon}</span>
                    </div>
                    <div className="resource-value">{item.value}</div>
                    <div className="resource-bar-track">
                      <div
                        className={`resource-bar-fill ${item.fillClass}`}
                        style={{ width: item.width }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Roles Preview */}
            <section className="roles-section">
              <div className="section-label">Specialist Crew Roles</div>
              <div className="roles-grid">
                {roles.map((role) => (
                  <div key={role.title} className="role-chip">
                    <div className="role-title">{role.title}</div>
                    <div className="role-desc">{role.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Multiplayer Modules / Action Preview */}
            <section className="action-section">
              <div
                className="action-card interactive"
                onClick={() => setLobbyMode('create')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setLobbyMode('create')
                }}
              >
                <h3>Establish Outpost Room</h3>
                <p>Generate a secure room code and invite your crew to join the Mars expedition.</p>
                <button type="button" className="action-button">
                  Create Outpost
                </button>
                <span className="action-badge">Multiplayer Sync: Local &amp; Demo Active</span>
              </div>
              <div
                className="action-card interactive"
                onClick={() => setLobbyMode('join')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setLobbyMode('join')
                }}
              >
                <h3>Join Existing Mission</h3>
                <p>Enter a 6-character outpost code to rendezvous with active Martian survivors.</p>
                <button type="button" className="action-button">
                  Join With Code
                </button>
                <span className="action-badge">Multiplayer Sync: Local &amp; Demo Active</span>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          MISSION: OUTPOST &bull; Mars Survival Simulation &bull; Built with <span>React</span> &amp; <span>Vite</span>
        </p>
      </footer>
    </div>
  )
}

export default App
