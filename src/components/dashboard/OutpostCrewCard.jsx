import { useState } from 'react'
import { getRoleBadge } from './dashboardUtils.js'
import './OutpostCrewCard.css'

/**
 * OutpostCrewCard Component
 *
 * Implements Left Column (approx 22%) of the Mission Dashboard:
 * 1. Outpost Designation & Location (Sector 4 · Jezero Crater)
 * 2. 6-Character Room Code with Copy Code action
 * 3. Actual Crew Manifest (X/5) with names, roles, host badges, and online indicators
 */
export default function OutpostCrewCard({
  mission = null,
  players = [],
  currentPlayer = null,
}) {
  const [copied, setCopied] = useState(false)
  const roomCode = mission?.roomCode || 'OUTP-7'
  const outpostLabel = `OUTPOST-${roomCode.slice(0, 3)}`
  const safePlayers = Array.isArray(players) ? players : []
  const hostId = mission?.hostId

  const handleCopyCode = async () => {
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
      console.warn('Failed to copy room code:', err)
    }
  }

  return (
    <div className="outpost-crew-card">
      {/* 1. Outpost Header Block */}
      <div className="outpost-info-block">
        <div className="outpost-title-row">
          <span className="outpost-icon" aria-hidden="true">🪐</span>
          <div>
            <h3 className="outpost-name-heading">{outpostLabel}</h3>
            <span className="outpost-location-text">Sector 4 &bull; Jezero Crater</span>
          </div>
        </div>

        {/* Room Code Badge & Copy Action */}
        <div className="outpost-code-badge-strip">
          <div className="code-display-left">
            <span className="code-label-caption">MISSION CODE</span>
            <span className="code-chars font-mono">{roomCode}</span>
          </div>
          <button
            type="button"
            className={`btn-copy-code-sm ${copied ? 'is-copied' : ''}`}
            onClick={handleCopyCode}
            title="Copy 6-character room code"
            aria-label="Copy mission code"
          >
            {copied ? '✓ COPIED' : '📋 COPY'}
          </button>
        </div>
      </div>

      {/* 2. Crew Manifest Block */}
      <div className="crew-manifest-block">
        <div className="crew-manifest-header">
          <div className="manifest-title-group">
            <span className="manifest-icon" aria-hidden="true">👥</span>
            <h4 className="manifest-title">CREW ({safePlayers.length}/5)</h4>
          </div>
          <span className="manifest-status-caption">ACTIVE SQUAD</span>
        </div>

        {/* Crew Rows List */}
        {safePlayers.length === 0 ? (
          <div className="empty-crew-manifest">
            <span className="empty-crew-icon" aria-hidden="true">🛰️</span>
            <p className="empty-crew-text">No crew registered.</p>
            <span className="empty-crew-subtext">Awaiting astronaut arrival via airlock.</span>
          </div>
        ) : (
          <div className="crew-rows-container">
            {safePlayers.map((member, index) => {
              const roleInfo = getRoleBadge(member.role)
              const isHost = member.isHost || member.id === hostId || index === 0
              const isMe = member.id === currentPlayer?.id || member.name === currentPlayer?.name

              return (
                <div
                  key={member.id || `crew-${index}`}
                  className={`crew-row-item ${isMe ? 'is-current-user' : ''}`}
                >
                  <div className="crew-avatar-col">
                    <span className="crew-avatar-glyph" aria-hidden="true">
                      {member.avatar || roleInfo.icon}
                    </span>
                    <span
                      className="crew-online-dot"
                      title="Connected / Operational"
                      aria-label="Online"
                    />
                  </div>

                  <div className="crew-info-col">
                    <div className="crew-name-header">
                      <span className="crew-astronaut-name" title={member.name}>
                        {member.name || 'Astronaut'}
                      </span>
                      {isHost && (
                        <span className="host-crown-badge" title="Expedition Lead">
                          HOST
                        </span>
                      )}
                    </div>

                    <div className="crew-role-badge-line">
                      <span className={`role-pill ${roleInfo.colorClass}`}>
                        <span className="role-mini-glyph" aria-hidden="true">
                          {roleInfo.icon}
                        </span>
                        <span className="role-pill-text">{roleInfo.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

