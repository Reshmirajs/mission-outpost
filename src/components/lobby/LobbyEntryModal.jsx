/**
 * LobbyEntryModal Component
 * Compact modal opened from the header or landing action buttons.
 * Presents two clear choices: CREATE LOBBY or JOIN LOBBY.
 */
export default function LobbyEntryModal({
  onSelectCreate,
  onSelectJoin,
  onClose,
}) {
  return (
    <div className="lobby-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lobby-entry-title">
      <div className="lobby-entry-modal-card">
        <button
          type="button"
          className="btn-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="entry-modal-header">
          <div className="entry-brand-badge">
            <span className="entry-mars-icon"></span>
            <span className="entry-brand-subtitle">EXPEDITION SQUAD SYSTEM</span>
          </div>
          <h2 id="lobby-entry-title" className="entry-modal-title">
            MULTIPLAYER OUTPOST LOBBY
          </h2>
          <p className="entry-modal-desc">
            Coordinate with your crew to balance critical resources, endure Martian hazards, and survive the Sol cycle.
          </p>
        </div>

        <div className="entry-options-grid">
          {/* Option 1: Create Lobby */}
          <button
            type="button"
            className="entry-option-card create-card"
            onClick={onSelectCreate}
          >
            <div className="entry-card-glow"></div>
            <div className="entry-card-icon-box">
              <span className="entry-icon">🚀</span>
            </div>
            <div className="entry-card-content">
              <div className="entry-card-badge">EXPEDITION LEAD</div>
              <h3 className="entry-card-title">CREATE LOBBY</h3>
              <p className="entry-card-desc">
                Establish a new Mars outpost session, generate a 6-character room code, and assemble your crew.
              </p>
            </div>
            <div className="entry-card-arrow">→</div>
          </button>

          {/* Option 2: Join Lobby */}
          <button
            type="button"
            className="entry-option-card join-card"
            onClick={onSelectJoin}
          >
            <div className="entry-card-glow"></div>
            <div className="entry-card-icon-box">
              <span className="entry-icon">📡</span>
            </div>
            <div className="entry-card-content">
              <div className="entry-card-badge">ASTRONAUT RENDEZVOUS</div>
              <h3 className="entry-card-title">JOIN LOBBY</h3>
              <p className="entry-card-desc">
                Enter an existing 6-character outpost access code to join your squad on the Martian surface.
              </p>
            </div>
            <div className="entry-card-arrow">→</div>
          </button>
        </div>

        <div className="entry-modal-footer">
          <span className="simulation-tag">SIMULATION MODE // LOCAL &amp; CROSS-TAB SYNC</span>
        </div>
      </div>
    </div>
  )
}

