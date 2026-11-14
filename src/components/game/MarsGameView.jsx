import { useEffect, useMemo, useRef, useState } from 'react'
import Phaser from 'phaser'
import HabitatScene from '../../game/scenes/HabitatScene'
import { HABITAT_LAYOUT } from '../../game/maps/habitatLayout'
import GameHud from './GameHud'
import { mockCrew } from '../dashboard/mockDashboardData'
import './MarsGameView.css'

let pendingGameTeardown = Promise.resolve()

function MarsGameView({ resources, mission, players, alerts, onExit }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)
  const [nearbyStation, setNearbyStation] = useState(null)
  const [nearbyClue, setNearbyClue] = useState(null)
  const [activeStation, setActiveStation] = useState(null)
  const previewPlayers = useMemo(() => {
    const playersByRole = new Map(
      (Array.isArray(players) ? players : [])
        .filter((player) => player?.role)
        .map((player) => [player.role, player]),
    )

    // The habitat preview always shows the five sample roles. Supplied local
    // preview players replace their matching sample crew member when present.
    return mockCrew.map((samplePlayer) => playersByRole.get(samplePlayer.role) || samplePlayer)
  }, [players])

  useEffect(() => {
    let isActive = true
    let frameId

    frameId = requestAnimationFrame(async () => {
      await pendingGameTeardown
      if (!isActive || !mountRef.current || gameRef.current) return

      const scene = new HabitatScene({
        players: previewPlayers,
        onNearbyStationChange: setNearbyStation,
        onStationChange: setActiveStation,
        onNearbyClueChange: setNearbyClue,
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
  }, [previewPlayers])

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
      </div>
    </section>
  )
}

export default MarsGameView
