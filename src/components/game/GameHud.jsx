function formatRemainingTime(seconds) {
  if (!Number.isFinite(seconds)) return '—'
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0')
}

const RESOURCE_DISPLAY = [
  { key: 'oxygen', label: 'OXYGEN', icon: 'O₂', color: '#63b9cf' },
  { key: 'power', label: 'POWER', icon: '⚡', color: '#e7ad50' },
  { key: 'food', label: 'FOOD', icon: '✿', color: '#72ae73' },
  { key: 'radiation', label: 'RADIATION', icon: '☼', color: '#d78391' },
]

function GameHud({ resources, mission, solClockState, players, alerts, nearbyStation, nearbyClue, nearbyFacility, location, onToggleMap, mapOpen, onExit, taskCount = 0, taskTotal = 0, onAdvanceSol = () => {}, currentRole, allowRoleSwitch = false, onRoleChange = () => {} }) {
  const crewCount = Array.isArray(players) ? players.length : 0
  const activeAlert = Array.isArray(alerts) ? alerts[0] : null

  return (
    <div className="game-hud" aria-label="Mars exploration HUD">
      <section className="hud-resource-panel" aria-label="Simulated mission resources">
        <span className="hud-preview-ribbon">SIMULATED MISSION SYSTEMS</span>
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
        <div className="hud-mission-stat hud-sol-stat">
          <span className="hud-sun-icon" aria-hidden="true">☀</span>
          <span className="hud-sol-clock-copy">
            <small>SOL {mission?.round ?? '—'} / {solClockState?.totalSols ?? mission?.targetSols ?? '—'}</small>
            <strong>{formatRemainingTime(solClockState?.remainingSeconds)}</strong>
            <span className="hud-sol-progress" role="progressbar" aria-label="Current Sol progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round((solClockState?.progress || 0) * 100)}><span style={{ width: (Math.round((solClockState?.progress || 0) * 100)) + '%' }} /></span>
          </span>
        </div>
        <div className="hud-mission-stat">
          <span className="hud-crew-icon" aria-hidden="true">✦</span>
          <span><small>CREW</small><strong>{crewCount} / 5</strong></span>
        </div>
        <div className="hud-location-stat">
          <small>LOCATION</small>
          <strong>{location?.kind === 'facility' ? location.facilityId?.replaceAll('-', ' ') : 'Martian Surface'}</strong>
        </div>
        <div className="hud-location-stat"><small>CREW TASKS</small><strong>{taskCount} / {taskTotal}</strong></div>
        {allowRoleSwitch && <label className="hud-role-switch"><small>PLAYING AS</small><select value={currentRole} onChange={(event) => onRoleChange(event.target.value)} aria-label="Choose preview role">{['Mission Commander', 'Power Engineer', 'Botanist', 'Life Support Officer', 'Science & Safety Officer'].map((role) => <option key={role}>{role}</option>)}</select></label>}
        <button type="button" className="hud-map-button" onClick={onAdvanceSol} disabled={mission?.status === 'completed' || mission?.status === 'failed'}>End Sol</button>
        <button type="button" className="hud-map-button" onClick={onToggleMap} aria-expanded={mapOpen}>
          {mapOpen ? 'Close Map' : 'Map'}
        </button>
        <button type="button" className="hud-exit-button" onClick={onExit}>
          Exit Game
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
        {nearbyClue && <span className="hud-clue-prompt">{nearbyClue.tooltip}</span>}
        <span className="hud-prompt-sparkle" aria-hidden="true">✧</span>
        {nearbyFacility ? (
          <span><strong>Press E to {nearbyFacility.action}</strong> - {nearbyFacility.shortName || nearbyFacility.name}</span>
        ) : nearbyStation ? (
          <span><strong>Press E to use</strong> - {nearbyStation.name}</span>
        ) : (
          <span><strong>WASD / Arrows</strong> move - Explore the surface and find an airlock</span>
        )}

      </div>
    </div>
  )
}

export default GameHud
