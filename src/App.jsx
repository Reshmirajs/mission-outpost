import { lazy, Suspense, useState } from 'react'
import { INITIAL_RESOURCES } from './types/game'
import Dashboard from './components/dashboard'
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
import './App.css'

const MarsGameView = lazy(() => import('./components/game/MarsGameView'))

function App() {
  // Navigation view: 'dashboard' (default for inspection) or 'welcome'
  const [currentView, setCurrentView] = useState('dashboard')

  // Testing mock presets: 'default' | 'nominal' | 'caution' | 'critical' | 'missing_nasa'
  const [activePreset, setActivePreset] = useState('default')

  // Resource derivation based on preset
  let resources = mockResources
  let spaceWeather = mockNasaSpaceWeather
  let marsEnvironment = mockNasaMarsEnvironment
  let radLab = mockNasaRadLab

  if (activePreset === 'nominal') {
    resources = mockResourcePresets.nominal
  } else if (activePreset === 'caution') {
    resources = mockResourcePresets.caution
  } else if (activePreset === 'critical') {
    resources = mockResourcePresets.critical
  } else if (activePreset === 'missing_nasa') {
    resources = mockResources
    spaceWeather = null
    marsEnvironment = null
    radLab = null
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
    <div className={`app-container ${currentView === 'game' ? 'game-mode' : ''}`}>
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
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Mars Dashboard Preview
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'welcome' ? 'active' : ''}`}
            onClick={() => setCurrentView('welcome')}
          >
            🚀 Mission Welcome Screen
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'game' ? 'active' : ''}`}
            onClick={() => setCurrentView('game')}
          >
            Mars Habitat Game Preview
          </button>
        </nav>

        <div className="header-status">
          <span className="status-dot"></span>
          <span>OUTPOST TELEMETRY // ONLINE</span>
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
            mission={mockMission}
            players={mockCrew}
            objectives={mockObjectives}
            alerts={mockAlerts}
            spaceWeather={spaceWeather}
            marsEnvironment={marsEnvironment}
            radLab={radLab}
          />
        ) : currentView === 'game' ? (
          <Suspense fallback={<div className="game-loading-message">Preparing habitat map…</div>}>
            <MarsGameView
              resources={resources}
              mission={mockMission}
              players={mockCrew}
              alerts={mockAlerts}
              onExit={() => setCurrentView('dashboard')}
            />
          </Suspense>
        ) : (
          <div className="main-content">
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
              <div className="action-card">
                <h3>Establish Outpost Room</h3>
                <p>Generate a secure room code and invite your crew to join the Mars expedition.</p>
                <span className="action-badge">Multiplayer Sync: Pending Firebase Integration</span>
              </div>
              <div className="action-card">
                <h3>Join Existing Mission</h3>
                <p>Enter a 6-character outpost code to rendezvous with active Martian survivors.</p>
                <span className="action-badge">Lobby System: Initializing in Next Step</span>
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
