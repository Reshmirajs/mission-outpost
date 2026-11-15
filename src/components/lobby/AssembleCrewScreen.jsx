import { useState, useEffect, useRef, useCallback } from 'react'
import AstronautIllustration from './AstronautIllustration.jsx'
import { getSpecialistRole } from './educationalRoles.js'
import { checkStartMissionConditions, broadcastCountdown } from './mockLobbyService.js'
import { PlayerRoles } from '../../types/game.js'

/**
 * AssembleCrewScreen Component
 * Main immersive squad assembly screen featuring 5 distinct astronaut positions,
 * formation stage, readiness checklist, and action controls.
 */
export default function AssembleCrewScreen({
  mission,
  currentPlayer,
  onOpenRoleSelector,
  onToggleReady,
  onLaunchMission,
  onLeaveLobby,
  onAddDemoCrew,
  onRemoveDemoCrew,
}) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(null) // null or number (3, 2, 1, 0)
  const countdownEndTimeRef = useRef(null)
  const onLaunchMissionRef = useRef(onLaunchMission)
  const isHost = mission?.hostId === currentPlayer?.id
  const isHostRef = useRef(isHost)

  // Keep callback and host refs updated
  useEffect(() => {
    onLaunchMissionRef.current = onLaunchMission
  })
  useEffect(() => {
    isHostRef.current = isHost
  }, [isHost])

  // Single reliable function to initiate wall-clock countdown (never resets once started)
  const startCountdown = useCallback(() => {
    if (countdownEndTimeRef.current !== null) return
    countdownEndTimeRef.current = Date.now() + 3000
    setCountdown(3)
  }, [])

  // Listen for countdown broadcast across tabs
  useEffect(() => {
    if (!mission?.roomCode || typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    let channel = null
    try {
      channel = new BroadcastChannel('mission_outpost_lobby_channel')
      channel.onmessage = (event) => {
        if (
          event?.data?.type === 'COUNTDOWN_STARTED' &&
          event?.data?.roomCode === mission.roomCode.trim().toUpperCase()
        ) {
          startCountdown()
        }
      }
    } catch {
      // Fallback silently
    }
    return () => {
      if (channel) {
        channel.close()
      }
    }
  }, [mission?.roomCode, startCountdown])

  // Countdown timer effect: driven by real wall-clock time so re-renders cannot pause or freeze it
  const isCountingDown = countdown !== null
  useEffect(() => {
    if (!isCountingDown) return

    const interval = setInterval(() => {
      if (!countdownEndTimeRef.current) return
      const remainingMs = countdownEndTimeRef.current - Date.now()
      const secondsLeft = Math.min(3, Math.max(0, Math.ceil(remainingMs / 1000)))

      if (remainingMs <= 0) {
        clearInterval(interval)
        countdownEndTimeRef.current = null
        setCountdown(0) // Displays 'LIFTOFF!'

        // Trigger mission launch after brief liftoff animation
        setTimeout(() => {
          if (isHostRef.current && onLaunchMissionRef.current) {
            onLaunchMissionRef.current()
          }
        }, 500)
      } else {
        setCountdown(secondsLeft)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isCountingDown])

  if (!mission || !currentPlayer) return null

  const totalPlayers = mission.players.length
  const readyPlayers = mission.players.filter((p) => p.ready).length

  // Check launch requirements
  const { canStart, reasons } = checkStartMissionConditions(mission, currentPlayer.id)

  // Checklist items
  const hasMinPlayers = totalPlayers >= 2
  const allRolesAssigned = mission.players.every(
    (p) => p.role && p.role !== PlayerRoles.UNASSIGNED
  )
  const allReady = readyPlayers === totalPlayers && totalPlayers > 0
  const isCurrentPlayerAssigned = currentPlayer.role && currentPlayer.role !== PlayerRoles.UNASSIGNED

  // Copy code handler
  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(mission.roomCode)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = mission.roomCode
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

  // Handle Launch with Countdown
  const handleLaunchClick = () => {
    if (!canStart || !isHost || countdown !== null) return
    broadcastCountdown(mission.roomCode)
    startCountdown()
  }

  // Build 5 distinct formation slots
  const formationSlots = Array.from({ length: 5 }, (_, index) => {
    const player = mission.players[index] || null
    return {
      slotNumber: index + 1,
      player,
      isOccupied: Boolean(player),
    }
  })

  return (
    <div className="assemble-crew-screen">
      {/* Launch Countdown Overlay */}
      {countdown !== null && (
        <div className="launch-countdown-overlay" role="dialog" aria-modal="true">
          <div className="countdown-card">
            <div className="countdown-hud-ring"></div>
            <span className="countdown-subtitle">INITIATING SOL 1 EXPEDITION</span>
            <div className="countdown-number font-mono">
              {countdown > 0 ? countdown : 'LIFTOFF!'}
            </div>
            <span className="countdown-tip">Life support pressurized. All systems operational.</span>
          </div>
        </div>
      )}

      {/* TOP HEADER AREA */}
      <header className="assemble-header">
        <div className="assemble-header-left">
          <div className="assemble-title-group">
            <span className="assemble-meta-tag">EXPEDITION STAGING // HABITAT AIRLOCK</span>
            <h1 className="assemble-heading">ASSEMBLE YOUR CREW</h1>
          </div>
        </div>

        <div className="assemble-header-center">
          <div className="room-code-badge-box">
            <span className="code-badge-label">OUTPOST CODE</span>
            <div className="code-badge-row">
              <span className="code-badge-value font-mono">{mission.roomCode}</span>
              <button
                type="button"
                className={`btn-code-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopyCode}
                title="Copy access code"
              >
                {copied ? '✓ COPIED' : '📋 COPY'}
              </button>
            </div>
          </div>
        </div>

        <div className="assemble-header-right">
          <div className="capacity-pill">
            <span className="capacity-dot"></span>
            <span className="capacity-text">CREW CAPACITY: {totalPlayers} / 5</span>
          </div>

          <button
            type="button"
            className="btn-leave-lobby"
            onClick={onLeaveLobby}
            title="Leave this outpost mission"
          >
            Leave Outpost
          </button>
        </div>
      </header>

      {/* LOCAL DEMO UTILITY BAR */}
      <div className="demo-utility-ribbon">
        <div className="demo-ribbon-text">
          <span className="demo-indicator">LOCAL SIMULATION</span>
          <span>Open a second browser tab to join with code <strong>{mission.roomCode}</strong>, or test squad launch using simulated crew:</span>
        </div>
        {totalPlayers < 5 && (
          <button
            type="button"
            className="btn-add-demo-crew"
            onClick={onAddDemoCrew}
            title="Add simulated astronaut to test multi-player readiness"
          >
            + Add Simulated Astronaut (AI)
          </button>
        )}
      </div>

      {/* MAIN CREW AREA: FIVE DISTINCT FORMATION POSITIONS */}
      <section className="crew-formation-stage" aria-label="Astronaut Crew Formation">
        <div className="formation-deck-glow"></div>
        <div className="formation-grid">
          {formationSlots.map((slot) => {
            const { slotNumber, player, isOccupied } = slot

            if (isOccupied && player) {
              const isCurrent = player.id === currentPlayer.id
              const isPlayerHost = player.id === mission.hostId
              const specialist = getSpecialistRole(player.role)

              return (
                <div
                  key={player.id}
                  className={`crew-bay-slot occupied ${isCurrent ? 'is-self' : ''} ${
                    player.ready ? 'is-ready' : 'is-standby'
                  }`}
                >
                  <div className="bay-slot-number font-mono">0{slotNumber}</div>

                  {/* Standing Astronaut Character */}
                  <div className="bay-character-wrap">
                    <AstronautIllustration
                      roleKey={player.role}
                      size="medium"
                      isAnimated={true}
                    />
                  </div>

                  {/* Player Pod Info */}
                  <div className="bay-info-plate">
                    <div className="bay-callsign-row">
                      <span className="bay-callsign" title={player.name}>
                        {player.name}
                      </span>
                      {isCurrent && <span className="tag-self">YOU</span>}
                      {player.isSimulated && <span className="tag-simulated">AI</span>}
                    </div>

                    <div className="bay-role-row">
                      {specialist ? (
                        <span
                          className="bay-role-badge"
                          style={{
                            borderColor: specialist.accentColor,
                            color: specialist.suitTrim,
                          }}
                        >
                          <span className="bay-role-icon">{specialist.icon}</span>
                          <span>{specialist.title}</span>
                        </span>
                      ) : (
                        <span className="bay-role-unassigned">
                          ⚠️ Station Unassigned
                        </span>
                      )}
                    </div>

                    {/* Status & Host Row */}
                    <div className="bay-status-row">
                      {player.ready ? (
                        <span className="bay-readiness ready">
                          <span className="pulse-dot green"></span> READY FOR LAUNCH
                        </span>
                      ) : (
                        <span className="bay-readiness standby">
                          <span className="pulse-dot yellow"></span> PREPARING
                        </span>
                      )}

                      {isPlayerHost && (
                        <span className="bay-host-badge" title="Expedition Lead">
                          👑 LEAD
                        </span>
                      )}
                    </div>

                    {/* Remove Simulated AI button */}
                    {player.isSimulated && isHost && (
                      <button
                        type="button"
                        className="btn-remove-simulated"
                        onClick={() => onRemoveDemoCrew && onRemoveDemoCrew(player.id)}
                        title="Remove simulated astronaut"
                      >
                        Remove AI
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            // Empty Bay Position
            return (
              <div key={`empty-slot-${slotNumber}`} className="crew-bay-slot empty">
                <div className="bay-slot-number font-mono">0{slotNumber}</div>

                <div className="bay-character-wrap empty-wrap">
                  <AstronautIllustration isSilhouette={true} size="medium" />
                </div>

                <div className="bay-info-plate empty-plate">
                  <div className="empty-title">AWAITING ASTRONAUT</div>
                  <div className="empty-subtitle">Station Available</div>
                  <span className="empty-indicator-dot"></span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* LAUNCH READINESS CHECKLIST */}
      <section className="launch-checklist-banner">
        <div className="checklist-heading-row">
          <span className="checklist-title">MISSION PRE-FLIGHT CHECKLIST</span>
          <span className="checklist-status-tally font-mono">
            {readyPlayers} OF {totalPlayers} CREW READY
          </span>
        </div>

        <div className="checklist-items-grid">
          <div className={`checklist-chip ${hasMinPlayers ? 'passed' : 'pending'}`}>
            <span className="chip-icon">{hasMinPlayers ? '✓' : '○'}</span>
            <span>Squad Size (Min 2): {totalPlayers}/2</span>
          </div>

          <div className={`checklist-chip ${allRolesAssigned ? 'passed' : 'pending'}`}>
            <span className="chip-icon">{allRolesAssigned ? '✓' : '○'}</span>
            <span>Specialist Roles: {allRolesAssigned ? 'All Assigned' : 'Unassigned Present'}</span>
          </div>

          <div className={`checklist-chip ${allReady ? 'passed' : 'pending'}`}>
            <span className="chip-icon">{allReady ? '✓' : '○'}</span>
            <span>Readiness: {allReady ? 'All Crew Ready' : `${readyPlayers}/${totalPlayers} Ready`}</span>
          </div>

          <div className={`checklist-chip ${isHost ? 'passed' : 'info'}`}>
            <span className="chip-icon">{isHost ? '★' : 'ℹ'}</span>
            <span>{isHost ? 'Authorized as Lead' : 'Awaiting Lead Command'}</span>
          </div>
        </div>
      </section>

      {/* BOTTOM ACTION AREA: THREE VISUALLY DISTINCT ACTIONS */}
      <footer className="assemble-action-bar">
        {/* Action 1: Pick My Role */}
        <div className="action-slot-left">
          <button
            type="button"
            className="btn-action-role"
            onClick={onOpenRoleSelector}
          >
            <span className="action-icon">🧑‍🚀</span>
            <div className="action-label-stack">
              <span className="action-label-primary">PICK MY ROLE</span>
              <span className="action-label-secondary">
                {isCurrentPlayerAssigned
                  ? `Current: ${getSpecialistRole(currentPlayer.role)?.title}`
                  : 'No station selected'}
              </span>
            </div>
          </button>
        </div>

        {/* Action 2: Ready / Not Ready */}
        <div className="action-slot-center">
          <button
            type="button"
            className={`btn-action-ready ${currentPlayer.ready ? 'is-ready' : 'is-standby'}`}
            onClick={onToggleReady}
            title={
              !isCurrentPlayerAssigned
                ? 'Please select a specialist station before marking ready!'
                : ''
            }
          >
            <span className="action-icon">{currentPlayer.ready ? '↩' : '✓'}</span>
            <div className="action-label-stack">
              <span className="action-label-primary">
                {currentPlayer.ready ? 'STAND DOWN / UNREADY' : 'MARK READY FOR LAUNCH'}
              </span>
              <span className="action-label-secondary">
                {currentPlayer.ready ? 'Status: Ready for Sol 1' : 'Status: Preparing systems'}
              </span>
            </div>
          </button>
        </div>

        {/* Action 3: Launch Mission (Host Only) */}
        <div className="action-slot-right">
          {isHost ? (
            <button
              type="button"
              className={`btn-action-launch ${canStart && countdown === null ? 'active-launch' : 'disabled-launch'}`}
              disabled={!canStart || countdown !== null}
              onClick={handleLaunchClick}
              title={!canStart ? reasons[0] : countdown !== null ? 'Launch countdown in progress...' : 'All checklist items verified. Launch Sol 1!'}
            >
              <span className="action-icon">🚀</span>
              <div className="action-label-stack">
                <span className="action-label-primary">LAUNCH MISSION</span>
                <span className="action-label-secondary">
                  {canStart ? 'All systems go // Initiate' : reasons[0] || 'Awaiting conditions'}
                </span>
              </div>
            </button>
          ) : (
            <div className="guest-waiting-box">
              <span className="pulse-indicator"></span>
              <div className="guest-label-stack">
                <span className="guest-primary">AWAITING EXPEDITION LEAD</span>
                <span className="guest-secondary">Host will launch once squad is ready</span>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
