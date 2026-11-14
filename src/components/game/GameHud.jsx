const RESOURCE_DISPLAY = [
  { key: 'oxygen', label: 'OXYGEN', icon: 'O₂', color: '#63b9cf' },
  { key: 'power', label: 'POWER', icon: '⚡', color: '#e7ad50' },
  { key: 'food', label: 'FOOD', icon: '✿', color: '#72ae73' },
  { key: 'radiation', label: 'RADIATION', icon: '☼', color: '#d78391' },
]

function GameHud({ resources, mission, players, alerts, nearbyStation, nearbyClue, onExit }) {
  const crewCount = Array.isArray(players) ? players.length : 0
  const activeAlert = Array.isArray(alerts) ? alerts[0] : null

  return (
    <div className="game-hud" aria-label="Mission preview HUD">
      <section className="hud-resource-panel" aria-label="Simulated mission resources">
        <span className="hud-preview-ribbon">SIM PREVIEW</span>
        <div className="hud-resource-grid">
          {RESOURCE_DISPLAY.map((resource) => {
            const value = typeof resources?.[resource.key] === 'number'
              ? resources[resource.key]
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
                      style={{ width: `${value}%`, backgroundColor: resource.color }}
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
          <span><small>CURRENT SOL</small><strong>{mission?.round ?? '—'}</strong></span>
        </div>
        <div className="hud-mission-stat">
          <span className="hud-crew-icon" aria-hidden="true">✦</span>
          <span><small>CREW</small><strong>{crewCount} / 5</strong></span>
        </div>
        <button type="button" className="hud-exit-button" onClick={onExit}>
          Exit Preview
        </button>
      </div>

      <section className={`hud-alert-panel ${activeAlert?.type === 'critical' ? 'is-critical' : ''}`} aria-label="Preview emergency alert">
        <span className="hud-alert-icon" aria-hidden="true">{activeAlert?.type === 'critical' ? '!' : '✦'}</span>
        <div>
          <small>PREVIEW ALERT</small>
          <strong>{activeAlert?.title || 'No preview alert'}</strong>
          {activeAlert?.message && <span>{activeAlert.message}</span>}
        </div>
      </section>

      <div
        className="hud-interaction-prompt"
        data-station-nearby={Boolean(nearbyStation)}
        data-clue-nearby={Boolean(nearbyClue)}
        aria-live="polite"
      >
        {nearbyClue ? (
          <span className="hud-clue-prompt">{nearbyClue.tooltip}</span>
        ) : nearbyStation && (
          <span className="hud-station-prompt"><strong>Press E to interact</strong> - {nearbyStation.name}</span>
        )}
        <span className="hud-prompt-sparkle" aria-hidden="true">✧</span>
        <span><strong>WASD / Arrows</strong> move Commander - Find a station</span>
      </div>
    </div>
  )
}

export default GameHud
