import { INITIAL_RESOURCES, PlayerRoles } from './types/game'
import './App.css'

function App() {
  const telemetry = [
    { key: 'oxygen', label: 'Oxygen Reserves', icon: '🫧', value: `${INITIAL_RESOURCES.oxygen}%`, fillClass: 'fill-oxygen', width: `${INITIAL_RESOURCES.oxygen}%` },
    { key: 'power', label: 'Power Grid', icon: '⚡', value: `${INITIAL_RESOURCES.power}%`, fillClass: 'fill-power', width: `${INITIAL_RESOURCES.power}%` },
    { key: 'food', label: 'Food Rations', icon: '🌱', value: `${INITIAL_RESOURCES.food}%`, fillClass: 'fill-food', width: `${INITIAL_RESOURCES.food}%` },
    { key: 'radiation', label: 'Radiation Level', icon: '☢️', value: `${INITIAL_RESOURCES.radiation}%`, fillClass: 'fill-radiation', width: '6%' },
  ]

  const roles = [
    { title: PlayerRoles.COMMANDER, desc: 'Expedition lead & mission decisions' },
    { title: PlayerRoles.ENGINEER, desc: 'Power grids & habitat maintenance' },
    { title: PlayerRoles.BOTANIST, desc: 'Hydroponics & food production' },
    { title: PlayerRoles.MEDIC, desc: 'Crew health & radiation treatment' },
    { title: PlayerRoles.SCIENTIST, desc: 'NASA telemetry & environmental analysis' },
  ]

  return (
    <div className="app-container">
      <div className="stars-overlay" aria-hidden="true"></div>

      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <span className="mars-icon"></span>
          <span className="brand-text">Mission: Outpost</span>
        </div>
        <div className="header-status">
          <span className="status-dot"></span>
          <span>OUTPOST TELEMETRY // ONLINE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
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
