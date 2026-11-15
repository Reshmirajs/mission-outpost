const RESOURCE_DISPLAY = [
  { key: 'oxygen', label: 'OXYGEN', icon: 'O₂', color: '#63b9cf' },
  { key: 'water', label: 'WATER', icon: '💧', color: '#4fa8d1' },
  { key: 'power', label: 'POWER', icon: '⚡', color: '#e7ad50' },
  { key: 'food', label: 'FOOD', icon: '✿', color: '#72ae73' },
  { key: 'radiation', label: 'RADIATION', icon: '☼', color: '#d78391' },
]

function GameHud({
  resources,
  mission,
  players,
  alerts,
  activeCrisis,
  onOpenCrisisModal,
  nearbyStation,
  nearbyClue,
  onExit,
}) {
  const crewCount = Array.isArray(players) ? players.length : 0
  const activeAlert = activeCrisis || (Array.isArray(alerts) ? alerts[0] : null)
  const controlledPlayer = (Array.isArray(players) ? players : []).find((p) => p.controlled) || players?.[0]
  const controlledLabel = controlledPlayer?.name || controlledPlayer?.role || 'Astronaut'
  const currentSol = mission?.round ?? 1

  return (
    <div className="game-hud" aria-label="Mission outpost HUD">
      <section className="hud-resource-panel" aria-label="Habitat telemetry resources">
        <span className="hud-preview-ribbon">HABITAT LIFE-SUPPORT</span>
        <div className="hud-resource-grid">
          {RESOURCE_DISPLAY.map((resource) => {
            const value = typeof resources?.[resource.key] === 'number'
              ? Math.round(resources[resource.key])
              : null

            return (
              <div className="hud-resource" key={resource.key}>
                <div className="hud-resource-heading">
                  <span className="hud-resource-icon" style={{ color: resource.color }} aria-hidden="true">
                    {resource.icon}
                  </span>
                  <span>{resource.label}</span>
                  <strong>{value === null ? '—' : `${value}%`}</strong>
                </div>
                <div className="hud-meter-track" aria-hidden="true">
                  {value !== null && (
                    <span
                      className="hud-meter-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                        backgroundColor: resource.color,
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="hud-mission-panel">
        <div className="hud-mission-stat">
          <span className="hud-sun-icon" aria-hidden="true">☀</span>
          <span><small>SOL PROGRESS</small><strong>{currentSol} / 20</strong></span>
        </div>
        <div className="hud-mission-stat">
          <span className="hud-crew-icon" aria-hidden="true">✦</span>
          <span><small>ACTIVE CREW</small><strong>{crewCount} / 5</strong></span>
        </div>
        <button type="button" className="hud-exit-button" onClick={onExit}>
          Exit to Dashboard
        </button>
      </div>

      <section
        className={`hud-alert-panel ${activeCrisis ? 'is-critical is-active-crisis' : activeAlert?.type === 'critical' ? 'is-critical' : ''}`}
        aria-label="Mission emergency alert"
      >
        <span className="hud-alert-icon" aria-hidden="true">
          {activeCrisis ? '🚨' : activeAlert?.type === 'critical' ? '!' : '✦'}
        </span>
        <div style={{ flex: 1 }}>
          <small>{activeCrisis ? `${activeCrisis.severity?.toUpperCase()} INCIDENT` : 'BASE TELEMETRY'}</small>
          <strong>{activeAlert?.title || 'All Systems Nominal'}</strong>
          {activeAlert?.description || activeAlert?.message ? (
            <span>{activeAlert.description || activeAlert.message}</span>
          ) : null}
        </div>
        {activeCrisis && (
          <button
            type="button"
            className="hud-crisis-respond-btn"
            onClick={onOpenCrisisModal}
          >
            Deliberate &amp; Vote
          </button>
        )}
      </section>

      <div
        className="hud-interaction-prompt"
        data-station-nearby={Boolean(nearbyStation)}
        data-clue-nearby={Boolean(nearbyClue)}
        aria-live="polite"
      >
        {nearbyClue ? (
          <span className="hud-clue-prompt">🔍 {nearbyClue.tooltip}</span>
        ) : nearbyStation ? (
          <span className="hud-station-prompt"><strong>Press E to operate</strong> - {nearbyStation.name}</span>
        ) : (
          <span className="hud-guidance-prompt">Walk to any station console and press <strong>E</strong></span>
        )}
        <span className="hud-prompt-sparkle" aria-hidden="true">✧</span>
        <span><strong>WASD / Arrows</strong> move {controlledLabel}</span>
      </div>
    </div>
  )
}

export default GameHud
