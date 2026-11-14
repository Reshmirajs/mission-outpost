import { useState } from 'react'

/**
 * RoomCreatedModal Component
 * Room-created confirmation screen displaying the 6-character room code prominently,
 * with copy action, instructions, and navigation to ASSEMBLE YOUR CREW.
 */
export default function RoomCreatedModal({
  roomCode,
  hostPlayer,
  onContinueToAssemble,
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = roomCode
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      console.warn('Failed to copy to clipboard', err)
    }
  }

  return (
    <div className="lobby-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="room-created-title">
      <div className="lobby-confirmation-modal-card">
        <div className="confirmation-badge-success">
          <span className="success-icon">✓</span>
        </div>

        <div className="confirmation-header">
          <div className="confirmation-meta-tag">OUTPOST ESTABLISHED // SECURE FREQUENCY</div>
          <h2 id="room-created-title" className="confirmation-title">
            MISSION ROOM CREATED
          </h2>
          <p className="confirmation-desc">
            Your Mars outpost is online. Share the 6-character access code with your fellow squad members so they can rendezvous.
          </p>
        </div>

        {/* Prominent Room Code Display */}
        <div className="code-display-hero">
          <span className="code-hero-label">OUTPOST ACCESS CODE</span>
          <div className="code-hero-value font-mono">{roomCode}</div>
          <button
            type="button"
            className={`btn-hero-copy ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ COPIED TO CLIPBOARD!' : '📋 COPY ROOM CODE'}
          </button>
        </div>

        {/* Expedition Lead Info */}
        <div className="host-confirmation-box">
          <div className="host-badge-row">
            <span className="crown-icon">👑</span>
            <span className="host-role-title">EXPEDITION LEAD (HOST)</span>
          </div>
          <p className="host-note">
            Logged in as <strong>{hostPlayer?.name}</strong>. As Expedition Lead, you will initiate the mission launch once all squad specialists report ready.
          </p>
        </div>

        <div className="confirmation-actions">
          <button
            type="button"
            className="btn-primary btn-large btn-full-width"
            onClick={onContinueToAssemble}
          >
            CONTINUE TO ASSEMBLE YOUR CREW →
          </button>
        </div>
      </div>
    </div>
  )
}

