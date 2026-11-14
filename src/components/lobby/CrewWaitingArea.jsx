import { useState } from 'react'
import PlayerCard from './PlayerCard.jsx'
import RoleSelector from './RoleSelector.jsx'
import { checkStartMissionConditions } from './mockLobbyService.js'
import { PlayerRoles } from '../../types/game.js'

/**
 * CrewWaitingArea Component
 * The central mission briefing room where squad members coordinate, pick stations,
 * verify readiness, and prepare for launch.
 */
export default function CrewWaitingArea({
  mission,
  currentPlayer,
  onSelectRole,
  onToggleReady,
  onStartMission,
  onLeaveRoom,
  onAddDemoCrew,
  onRemoveDemoCrew,
}) {
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [actionError, setActionError] = useState('')

  if (!mission || !currentPlayer) {
    return null
  }

  const isHost = mission.hostId === currentPlayer.id
  const totalPlayers = mission.players.length
  const readyPlayersCount = mission.players.filter((p) => p.ready).length
  const readinessPercent = totalPlayers > 0 ? Math.round((readyPlayersCount / totalPlayers) * 100) : 0

  const { canStart, reasons } = checkStartMissionConditions(mission, currentPlayer.id)

  const handleCopyCode = async () => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(mission.roomCode)
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = mission.roomCode
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (err) {
      console.warn('Failed to copy to clipboard', err)
    }
  }

  const handleRoleSelection = (roleKey) => {
    try {
      setActionError('')
      onSelectRole(roleKey)
    } catch (err) {
      setActionError(err.message || 'Could not assign role.')
    }
  }

  const handleReadyToggle = () => {
    try {
      setActionError('')
      onToggleReady()
    } catch (err) {
      setActionError(err.message || 'Cannot toggle readiness.')
    }
  }

  const handleStartMissionClick = () => {
    try {
      setActionError('')
      onStartMission()
    } catch (err) {
      setActionError(err.message || 'Cannot start mission.')
    }
  }

  // Checklist validation flags
  const hasMinPlayers = totalPlayers >= 2
  const allRolesAssigned = mission.players.every(
    (p) => p.role && p.role !== PlayerRoles.UNASSIGNED
  )
  const allReady = readyPlayersCount === totalPlayers && totalPlayers > 0
  const isCurrentPlayerAssigned = currentPlayer.role && currentPlayer.role !== PlayerRoles.UNASSIGNED

  return (
    <div className="crew-waiting-area">
      {/* Top Outpost Command Banner */}
      <section className="waiting-header-card">
        <div className="waiting-header-main">
          <div className="outpost-code-box">
            <span className="code-label">OUTPOST ACCESS CODE</span>
            <div className="code-display-row">
              <span className="code-text font-mono">{mission.roomCode}</span>
              <button
                type="button"
                className="btn-copy-code"
                onClick={handleCopyCode}
                title="Copy code to share with crew"
              >
                {copyFeedback ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>
            <span className="code-subtext">
              Share this 6-character code with your classmates or crew members!
            </span>
          </div>

          <div className="outpost-meta-box">
            <div className="outpost-status-pill">
              <span className="status-indicator-dot"></span>
              <span>OUTPOST AIRLOCK // CREW ASSEMBLY</span>
            </div>
            <div className="host-info-pill">
              <span>Expedition Lead: </span>
              <strong>
                {mission.players.find((p) => p.id === mission.hostId)?.name || 'Lead Officer'}
              </strong>
              {isHost && <span className="host-you-tag"> (You)</span>}
            </div>
          </div>
        </div>

        {/* Local Simulation Helper Banner */}
        <div className="local-sync-banner">
          <div className="sync-banner-text">
            <strong>Educational Demo Mode:</strong> Open a second browser tab or window to join this room code, or add a simulated crew member to test the 2-player launch flow.
          </div>
          {totalPlayers < 5 && (
            <button
              type="button"
              className="btn-add-demo"
              onClick={onAddDemoCrew}
              title="Add a simulated crew member to test multi-astronaut launch"
            >
              + Add Simulated Astronaut (AI)
            </button>
          )}
        </div>
      </section>

      {/* Action Error Callout */}
      {actionError && (
        <div className="lobby-error-banner" role="alert">
          <span>⚠️ {actionError}</span>
          <button
            type="button"
            className="btn-close-error"
            onClick={() => setActionError('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Readiness Progress & Launch Checklist */}
      <section className="readiness-progress-section">
        <div className="readiness-header-row">
          <div>
            <h3 className="readiness-title">Crew Pre-Flight Readiness</h3>
            <span className="readiness-subtitle">
              {readyPlayersCount} of {totalPlayers} Astronauts Prepared ({readinessPercent}%)
            </span>
          </div>
          <div className="readiness-meter-box">
            <div className="readiness-meter-track">
              <div
                className="readiness-meter-fill"
                style={{ width: `${readinessPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Launch Checklist */}
        <div className="launch-checklist-grid">
          <div className={`checklist-item ${hasMinPlayers ? 'passed' : 'pending'}`}>
            <span className="check-icon">{hasMinPlayers ? '✓' : '○'}</span>
            <span className="check-label">
              Crew Size: Min 2 Astronauts ({totalPlayers}/2)
            </span>
          </div>

          <div className={`checklist-item ${allRolesAssigned ? 'passed' : 'pending'}`}>
            <span className="check-icon">{allRolesAssigned ? '✓' : '○'}</span>
            <span className="check-label">
              Specialist Stations: {allRolesAssigned ? 'All Claimed' : 'Unassigned Present'}
            </span>
          </div>

          <div className={`checklist-item ${allReady ? 'passed' : 'pending'}`}>
            <span className="check-icon">{allReady ? '✓' : '○'}</span>
            <span className="check-label">
              Crew Status: {allReady ? 'All Ready for Launch' : `${readyPlayersCount}/${totalPlayers} Ready`}
            </span>
          </div>

          <div className={`checklist-item ${isHost ? 'passed' : 'info'}`}>
            <span className="check-icon">{isHost ? '★' : 'ℹ'}</span>
            <span className="check-label">
              {isHost ? 'You are Authorized to Launch' : 'Awaiting Expedition Lead Launch Command'}
            </span>
          </div>
        </div>
      </section>

      {/* Crew Roster Grid */}
      <section className="crew-roster-section">
        <div className="section-label-row">
          <span className="section-title-label">Outpost Manifest ({totalPlayers}/5 Astronauts)</span>
          <span className="section-hint-label">Max 5 Crew Specialists</span>
        </div>

        <div className="roster-grid">
          {mission.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayer.id}
              isHost={player.id === mission.hostId}
              canRemoveDemo={isHost}
              onRemoveDemo={onRemoveDemoCrew}
            />
          ))}
        </div>
      </section>

      {/* Role Selector Section */}
      <section className="role-selection-section">
        <RoleSelector
          currentRole={currentPlayer.role}
          onSelectRole={handleRoleSelection}
          players={mission.players}
          currentPlayerId={currentPlayer.id}
          isReady={currentPlayer.ready}
        />
      </section>

      {/* Bottom Sticky Action Bar */}
      <footer className="waiting-action-bar">
        <div className="action-bar-left">
          <button
            type="button"
            className="btn-leave-mission"
            onClick={onLeaveRoom}
          >
            Leave Outpost
          </button>
        </div>

        <div className="action-bar-right">
          {/* Ready / Unready Toggle */}
          <button
            type="button"
            className={`btn-ready-toggle ${currentPlayer.ready ? 'is-ready' : 'is-not-ready'}`}
            onClick={handleReadyToggle}
            title={
              !isCurrentPlayerAssigned
                ? 'Please select a station before marking yourself ready!'
                : ''
            }
          >
            {currentPlayer.ready ? (
              <>
                <span className="btn-icon">↩</span> Change Station / Stand Down
              </>
            ) : (
              <>
                <span className="btn-icon">✓</span> Mark Ready for Launch
              </>
            )}
          </button>

          {/* Launch Mission Button (Host Only) */}
          {isHost ? (
            <button
              type="button"
              className={`btn-launch-mission ${canStart ? 'active-launch' : 'disabled-launch'}`}
              disabled={!canStart}
              onClick={handleStartMissionClick}
              title={
                !canStart
                  ? reasons[0] || 'All readiness checklist items must pass before launch.'
                  : 'All systems go! Initiate Sol 1 expedition.'
              }
            >
              🚀 Launch Outpost Mission
            </button>
          ) : (
            <div className="guest-waiting-indicator">
              <span className="pulse-dot"></span>
              <span>Awaiting Expedition Lead to initiate launch...</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

