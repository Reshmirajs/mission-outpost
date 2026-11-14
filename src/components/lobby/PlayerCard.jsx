import { getEducationalRole } from './educationalRoles.js'

/**
 * PlayerCard Component
 * Displays individual crew member card in the Waiting Area roster.
 */
export default function PlayerCard({
  player,
  isCurrentPlayer = false,
  isHost = false,
  canRemoveDemo = false,
  onRemoveDemo,
}) {
  const educationalRole = getEducationalRole(player.role)

  return (
    <div
      className={`crew-player-card ${isCurrentPlayer ? 'is-self' : ''} ${
        player.ready ? 'is-ready' : 'is-standby'
      }`}
    >
      <div className="player-card-header">
        <div className="player-avatar-container">
          <span className="player-avatar-icon">
            {educationalRole ? educationalRole.icon : '🧑‍🚀'}
          </span>
          {isHost && (
            <span
              className="player-host-crown"
              title="Expedition Lead (Host)"
              aria-label="Host"
            >
              👑
            </span>
          )}
        </div>

        <div className="player-identity">
          <div className="player-name-row">
            <span className="player-name">{player.name}</span>
            {isCurrentPlayer && <span className="player-tag-self">YOU</span>}
            {player.isSimulated && <span className="player-tag-demo">SIMULATED</span>}
          </div>

          <div className="player-role-label">
            {educationalRole ? (
              <span className="role-assigned-text">
                {educationalRole.displayTitle}
              </span>
            ) : (
              <span className="role-unassigned-text">
                ⚠️ Station Unassigned
              </span>
            )}
          </div>
        </div>

        <div className="player-status-badge-container">
          {player.ready ? (
            <span className="readiness-badge ready">
              <span className="badge-pulse green"></span> READY FOR LAUNCH
            </span>
          ) : (
            <span className="readiness-badge standby">
              <span className="badge-pulse yellow"></span> PREPARING
            </span>
          )}
        </div>
      </div>

      <div className="player-card-footer">
        <span className="player-system-badge">
          {educationalRole ? educationalRole.systemBadge : 'Awaiting specialist selection'}
        </span>

        {player.isSimulated && canRemoveDemo && (
          <button
            type="button"
            className="btn-remove-demo"
            onClick={() => onRemoveDemo && onRemoveDemo(player.id)}
            title="Remove simulated astronaut"
          >
            Remove AI
          </button>
        )}
      </div>
    </div>
  )
}
