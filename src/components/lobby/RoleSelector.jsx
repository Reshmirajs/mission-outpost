import { ACTIVE_EDUCATIONAL_ROLES } from './educationalRoles.js'

/**
 * RoleSelector Component
 * Presents the 5 educational Mars astronaut roles with responsibilities,
 * real hardware systems, and survival significance.
 */
export default function RoleSelector({
  currentRole,
  onSelectRole,
  players = [],
  currentPlayerId,
  isReady = false,
}) {
  return (
    <div className="role-selector-container">
      <div className="role-selector-header">
        <h3 className="role-selector-title">Assign Your Expedition Station</h3>
        <p className="role-selector-subtitle">
          Every crew member on Mars operates a vital life-support or engineering system.
          Learn how each station keeps the outpost safe, and pick one to master!
        </p>
        {isReady && (
          <div className="role-selector-lock-notice">
            🔒 You are marked <strong>READY</strong>. To choose a different station, click "Change Role / Standby" below.
          </div>
        )}
      </div>

      <div className="role-cards-grid">
        {ACTIVE_EDUCATIONAL_ROLES.map((role) => {
          const isSelected = currentRole === role.roleKey
          const claimedByPlayer = players.find(
            (p) => p.id !== currentPlayerId && p.role === role.roleKey
          )
          const isClaimed = Boolean(claimedByPlayer)
          const isInteractive = !isReady && !isClaimed

          return (
            <div
              key={role.roleKey}
              className={`educational-role-card ${isSelected ? 'is-selected' : ''} ${
                isClaimed ? 'is-claimed' : ''
              }`}
            >
              {/* Card Top / Header */}
              <div className="role-card-top">
                <div className="role-icon-box">
                  <span className="role-icon">{role.icon}</span>
                </div>
                <div className="role-title-group">
                  <h4 className="role-display-title">{role.displayTitle}</h4>
                  <span className="role-system-tag">{role.systemBadge}</span>
                </div>
              </div>

              {/* Short duty summary */}
              <p className="role-short-duty">{role.shortDuty}</p>

              {/* Responsibilities list */}
              <div className="role-responsibilities-block">
                <div className="subhead-label">Mission Duties:</div>
                <ul className="role-duties-list">
                  {role.responsibilities.map((duty, idx) => (
                    <li key={idx}>{duty}</li>
                  ))}
                </ul>
              </div>

              {/* Real Mars Mission System */}
              <div className="role-system-block">
                <div className="subhead-label">Real Mars Hardware:</div>
                <div className="system-callout">
                  <span className="system-icon">🛠️</span>
                  <span className="system-text">{role.marsSystem}</span>
                </div>
              </div>

              {/* Why it matters educational callout */}
              <div className="role-why-block">
                <div className="subhead-label">Why It Matters for Survival:</div>
                <p className="why-text">{role.whyItMatters}</p>
              </div>

              {/* Action Button / Availability Footer */}
              <div className="role-card-action">
                {isSelected ? (
                  <button
                    type="button"
                    className="btn-role-action current-selected"
                    disabled
                  >
                    <span className="checkmark">✓</span> Station Assigned to You
                  </button>
                ) : isClaimed ? (
                  <button
                    type="button"
                    className="btn-role-action claimed"
                    disabled
                    title={`Claimed by ${claimedByPlayer.name}`}
                  >
                    Claimed by {claimedByPlayer.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-role-action select"
                    disabled={!isInteractive}
                    onClick={() => onSelectRole(role.roleKey)}
                  >
                    Select {role.displayTitle}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

