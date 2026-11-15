import { useEffect, useMemo, useRef, useState } from 'react'
import Phaser from 'phaser'
import HabitatScene from '../../game/scenes/HabitatScene'
import { HABITAT_LAYOUT } from '../../game/maps/habitatLayout'
import GameHud from './GameHud'
import { mockCrew } from '../dashboard/mockDashboardData'
import { InGameEventManager, createScenarioFromEvent, EVENTS_CATALOG, getEventsBySeverity, resolveEvent } from '../events'
import './MarsGameView.css'

let pendingGameTeardown = Promise.resolve()

const ROLE_TO_DISPLAY_TITLE = {
  Commander: 'Mission Commander',
  'Mission Commander': 'Mission Commander',
  Engineer: 'Power Engineer',
  'Power Engineer': 'Power Engineer',
  Botanist: 'Botanist',
  Medic: 'Life Support Officer',
  'Life Support Officer': 'Life Support Officer',
  Scientist: 'Science & Safety Officer',
  'Science & Safety Officer': 'Science & Safety Officer',
}

function MarsGameView({ resources, mission, players, currentPlayer, alerts, spaceWeather, onApplyResourceDelta, onExit }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)
  const [nearbyStation, setNearbyStation] = useState(null)
  const [nearbyClue, setNearbyClue] = useState(null)
  const [activeStation, setActiveStation] = useState(null)

  // In-Game Events & Crisis Deliberation State
  const [activeEvent, setActiveEvent] = useState(null)
  const [eventScenario, setEventScenario] = useState(null)

  // Temporary test warning event selected from catalog via exported retrieval helper
  const testWarningEvent = useMemo(() => {
    const warningList = getEventsBySeverity('warning')
    return (warningList && warningList.length > 0) ? warningList[0] : (EVENTS_CATALOG[0] || null)
  }, [])

  const handleTriggerEvent = (eventToTrigger) => {
    if (!eventToTrigger) return
    setActiveEvent(eventToTrigger)
    setEventScenario(createScenarioFromEvent(eventToTrigger))
  }

  const handleDismissEvent = () => {
    setActiveEvent(null)
    setEventScenario(null)
  }

  const handleVoteEvent = (updatedScenario) => {
    setEventScenario((prev) => {
      if (!prev) return updatedScenario
      return {
        ...updatedScenario,
        timeRemainingSeconds: typeof prev.timeRemainingSeconds === 'number'
          ? Math.max(0, prev.timeRemainingSeconds)
          : updatedScenario.timeRemainingSeconds,
      }
    })
  }

  const handleResolveEvent = (resolvedScenario) => {
    setEventScenario(resolvedScenario)
  }

  // Resolve current logged-in player from prop or per-tab sessionStorage
  const resolvedCurrentPlayer = useMemo(() => {
    if (currentPlayer) return currentPlayer
    try {
      const saved = sessionStorage.getItem('mission_outpost_current_player')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }, [currentPlayer])

  const previewPlayers = useMemo(() => {
    const validPlayers = (Array.isArray(players) ? players : []).filter(
      (player) => player?.role && player.role !== 'Unassigned'
    )

    // When actual lobby astronauts are present, show ONLY the actual crew from the lobby!
    if (validPlayers.length > 0) {
      return validPlayers.map((player, index) => {
        const canonicalRole = ROLE_TO_DISPLAY_TITLE[player.role] || player.role || 'Mission Commander'

        // Each browser tab controls its OWN logged-in astronaut
        const isControlled = resolvedCurrentPlayer?.id
          ? player.id === resolvedCurrentPlayer.id
          : resolvedCurrentPlayer?.name
            ? player.name === resolvedCurrentPlayer.name
            : (player.isHost || index === 0)

        return {
          ...player,
          role: canonicalRole,
          controlled: Boolean(isControlled),
        }
      })
    }

    // Default sample crew fallback when previewing without an active lobby squad
    return mockCrew
  }, [players, resolvedCurrentPlayer])

  // Voting countdown timer: decrements timeRemainingSeconds every second while voting
  // and auto-resolves using resolveEvent when the timer expires.
  useEffect(() => {
    if (!eventScenario || eventScenario.status !== 'voting') {
      return
    }

    const timer = setInterval(() => {
      setEventScenario((prevScenario) => {
        // Prevent duplicate resolution or updates if scenario changed or already resolved
        if (!prevScenario || prevScenario.status !== 'voting') {
          return prevScenario
        }

        const currentSeconds = typeof prevScenario.timeRemainingSeconds === 'number'
          ? prevScenario.timeRemainingSeconds
          : 0

        const nextSeconds = Math.max(0, currentSeconds - 1)

        // When timer reaches zero, resolve the scenario using existing votingUtils
        if (nextSeconds <= 0) {
          const expiredScenario = {
            ...prevScenario,
            timeRemainingSeconds: 0,
          }
          const resolutionResult = resolveEvent(expiredScenario, previewPlayers, { force: true })
          if (resolutionResult.success && resolutionResult.scenario) {
            return resolutionResult.scenario
          }
          return {
            ...prevScenario,
            status: 'resolved',
            timeRemainingSeconds: 0,
          }
        }

        return {
          ...prevScenario,
          timeRemainingSeconds: nextSeconds,
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [eventScenario?.status, previewPlayers])

  // Real-time cross-tab movement synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel('mission_outpost_habitat_movement')

    const handleMessage = (event) => {
      const data = event.data
      if (!data || data.type !== 'ASTRO_MOVE') return
      if (mission?.roomCode && data.roomCode && data.roomCode !== mission.roomCode) return
      sceneRef.current?.updateRemotePlayerPosition(data)
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [mission?.roomCode])

  useEffect(() => {
    let isActive = true
    let frameId

    frameId = requestAnimationFrame(async () => {
      await pendingGameTeardown
      if (!isActive || !mountRef.current || gameRef.current) return

      let lastMoveSent = 0
      const handlePlayerMove = (moveData) => {
        const now = Date.now()
        if (!moveData.walking || now - lastMoveSent > 40) {
          lastMoveSent = now
          try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
              const channel = new BroadcastChannel('mission_outpost_habitat_movement')
              channel.postMessage({
                type: 'ASTRO_MOVE',
                roomCode: mission?.roomCode,
                ...moveData,
              })
              channel.close()
            }
          } catch {
            // ignore
          }
        }
      }

      const scene = new HabitatScene({
        players: previewPlayers,
        onNearbyStationChange: setNearbyStation,
        onStationChange: setActiveStation,
        onNearbyClueChange: setNearbyClue,
        onPlayerMove: handlePlayerMove,
      })
      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        width: HABITAT_LAYOUT.width,
        height: HABITAT_LAYOUT.height,
        backgroundColor: '#efd3bd',
        scene: [scene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          antialias: true,
          pixelArt: false,
        },
      })

      sceneRef.current = scene
      gameRef.current = game
    })

    return () => {
      isActive = false
      cancelAnimationFrame(frameId)

      const game = gameRef.current
      if (game) {
        pendingGameTeardown = new Promise((resolve) => {
          game.events.once(Phaser.Core.Events.DESTROY, resolve)
          game.destroy(true)
        })
      }

      gameRef.current = null
      sceneRef.current = null
      setNearbyStation(null)
      setNearbyClue(null)
      setActiveStation(null)
    }
  }, [previewPlayers, mission?.roomCode])

  return (
    <section className="mars-game-view" aria-label="MISSION: OUTPOST habitat game preview">
      <div className="mars-game-world">
        <div
          className="mars-game-canvas"
          ref={mountRef}
          aria-label="Top-down illustrated map of the five connected Mars habitat rooms"
        />
        <GameHud
          resources={resources}
          mission={mission}
          players={previewPlayers}
          alerts={alerts}
          nearbyStation={nearbyStation}
          nearbyClue={nearbyClue}
          onExit={onExit}
        />
        {activeStation && (
          <div className="station-panel-backdrop">
            <section
              className="station-interaction-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="station-panel-title"
              aria-describedby="station-panel-description"
            >
              <span className="station-panel-ribbon">HABITAT STATION</span>
              <p className="station-room-name">{activeStation.roomName}</p>
              <h2 id="station-panel-title">{activeStation.name}</h2>
              <p id="station-panel-description">{activeStation.explanation}</p>
              <div className="station-task-card">
                <span>PREVIEW TASK</span>
                <p>{activeStation.task}</p>
              </div>
              <button
                type="button"
                className="station-close-button"
                onClick={() => sceneRef.current?.closeStationInteraction()}
              >
                Close <kbd>Esc</kbd>
              </button>
            </section>
          </div>
        )}

        {/* In-Game Crisis & Decision Event Manager Overlay */}
        <InGameEventManager
          event={activeEvent}
          scenario={eventScenario}
          players={previewPlayers}
          activePlayerId={resolvedCurrentPlayer?.id || 'p1'}
          resources={resources}
          mission={mission}
          onVote={handleVoteEvent}
          onResolve={handleResolveEvent}
          onApplyResourceDelta={onApplyResourceDelta}
          onDismiss={handleDismissEvent}
        />

        {/* Temporary Test Trigger: Remove after testing */}
        <button
          type="button"
          className="test-warning-event-btn"
          style={{
            position: 'absolute',
            bottom: '70px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => handleTriggerEvent(testWarningEvent)}
        >
          Test Warning Event
        </button>
      </div>
    </section>
  )
}

export default MarsGameView
