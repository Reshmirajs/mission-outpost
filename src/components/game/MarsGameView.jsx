import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import HabitatScene from '../../game/scenes/HabitatScene'
import { HABITAT_LAYOUT } from '../../game/maps/habitatLayout'
import GameHud from './GameHud'
import StationDialog from './stations/StationDialog'
import CrisisDecisionModal from './stations/CrisisDecisionModal'
import SolSummaryModal from './stations/SolSummaryModal'
import { HABITAT_TASKS } from '../../game/taskSystem'
import { getEventById } from '../events/eventsCatalog'
import { advanceMission } from '../../game/missionEngine'
import { mockCrew } from '../dashboard/mockDashboardData'
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

// Scheduled Sol-based environmental challenges (one realistic Mars hazard per cycle)
const SOL_SCHEDULED_CRISES = {
  2: 'evt-dust-storm',
  4: 'evt-solar-particle',
  7: 'evt-pressure-drop',
  10: 'evt-hydro-blight',
  13: 'evt-battery-thermal',
  16: 'evt-coronal-mass-ejection',
  18: 'evt-power-grid-failure',
}

function MarsGameView({
  resources,
  mission,
  players,
  currentPlayer,
  alerts,
  onApplyResourceDelta,
  onAdvanceMission,
  onViewReport,
  onExit,
}) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)

  const [nearbyStation, setNearbyStation] = useState(null)
  const [nearbyClue, setNearbyClue] = useState(null)
  const [activeStation, setActiveStation] = useState(null)

  // Interactive Gameplay State
  const [tasks, setTasks] = useState(() => HABITAT_TASKS)
  const [activeCrisis, setActiveCrisis] = useState(null)
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false)
  const [solSummary, setSolSummary] = useState(null)
  const [powerGrid, setPowerGrid] = useState({
    lifeSupport: 35,
    greenhouse: 25,
    science: 20,
    aux: 20,
  })
  const [cropIrrigationPolicy, setCropIrrigationPolicy] = useState('standard')

  // Tracking daily accomplishments for the Sol summary
  const [completedToday, setCompletedToday] = useState([])
  const [resolvedToday, setResolvedToday] = useState([])

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

    if (validPlayers.length > 0) {
      return validPlayers.map((player, index) => {
        const canonicalRole = ROLE_TO_DISPLAY_TITLE[player.role] || player.role || 'Mission Commander'

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

    return mockCrew
  }, [players, resolvedCurrentPlayer])

  // --- CROSS-TAB MULTIPLAYER MOVEMENT SYNCHRONIZATION ---
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const moveChannel = new BroadcastChannel('mission_outpost_habitat_movement')

    const handleMessage = (event) => {
      const data = event.data
      if (!data || data.type !== 'ASTRO_MOVE') return
      if (mission?.roomCode && data.roomCode && data.roomCode !== mission.roomCode) return
      sceneRef.current?.updateRemotePlayerPosition(data)
    }

    moveChannel.addEventListener('message', handleMessage)

    return () => {
      moveChannel.removeEventListener('message', handleMessage)
      moveChannel.close()
    }
  }, [mission?.roomCode])

  // --- CROSS-TAB GAMEPLAY STATE SYNCHRONIZATION ---
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return

    const syncChannel = new BroadcastChannel('mission_outpost_habitat_sync')

    const handleSync = (event) => {
      const data = event.data
      if (!data) return
      if (mission?.roomCode && data.roomCode && data.roomCode !== mission.roomCode) return

      if (data.type === 'SYNC_TASK_COMPLETED') {
        setTasks((prev) =>
          prev.map((t) => (t.id === data.taskId ? { ...t, status: 'completed' } : t))
        )
      } else if (data.type === 'SYNC_POWER_GRID') {
        setPowerGrid(data.powerGrid)
      } else if (data.type === 'SYNC_IRRIGATION') {
        setCropIrrigationPolicy(data.policy)
      } else if (data.type === 'SYNC_ACTIVE_CRISIS') {
        setActiveCrisis(data.crisis)
      } else if (data.type === 'SYNC_CRISIS_RESOLVED') {
        setActiveCrisis(null)
      } else if (data.type === 'SYNC_ADVANCE_SOL') {
        setSolSummary(data.summary)
        setTasks((prev) =>
          prev.map((t) => ({ ...t, status: 'available' }))
        )
      }
    }

    syncChannel.addEventListener('message', handleSync)

    return () => {
      syncChannel.removeEventListener('message', handleSync)
      syncChannel.close()
    }
  }, [mission?.roomCode])

  const broadcastSync = useCallback((message) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('mission_outpost_habitat_sync')
        channel.postMessage({
          roomCode: mission?.roomCode,
          ...message,
        })
        channel.close()
      }
    } catch {
      // ignore
    }
  }, [mission])

  // --- PHASER INITIALIZATION ---
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

  // --- ACTIONS & GAME ENGINE INTEGRATION ---

  const handleApplyDelta = useCallback((delta) => {
    if (onApplyResourceDelta) {
      onApplyResourceDelta(delta)
    }
  }, [onApplyResourceDelta])

  const handleCompleteTask = useCallback((taskId, resourceEffect) => {
    const targetTask = tasks.find((t) => t.id === taskId)
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    )
    if (targetTask) {
      setCompletedToday((prev) => [...prev, targetTask])
    }
    broadcastSync({
      type: 'SYNC_TASK_COMPLETED',
      taskId,
      resourceEffect,
    })
  }, [tasks, broadcastSync])

  const handleUpdatePowerGrid = useCallback((newGrid) => {
    setPowerGrid(newGrid)
    broadcastSync({
      type: 'SYNC_POWER_GRID',
      powerGrid: newGrid,
    })
  }, [broadcastSync])

  const handleUpdateIrrigationPolicy = useCallback((newPolicy) => {
    setCropIrrigationPolicy(newPolicy)
    broadcastSync({
      type: 'SYNC_IRRIGATION',
      policy: newPolicy,
    })
  }, [broadcastSync])

  const handleResolveCrisis = useCallback((eventId, appliedDelta, _winningOption) => {
    const resolvedEvent = activeCrisis || getEventById(eventId)
    if (appliedDelta && onApplyResourceDelta) {
      onApplyResourceDelta(appliedDelta)
    }
    if (resolvedEvent) {
      setResolvedToday((prev) => [...prev, resolvedEvent])
    }
    setActiveCrisis(null)
    setIsCrisisModalOpen(false)
    broadcastSync({
      type: 'SYNC_CRISIS_RESOLVED',
      eventId,
      appliedDelta,
    })
  }, [activeCrisis, onApplyResourceDelta, broadcastSync])

  const handleAdvanceSol = useCallback(() => {
    const previousResources = { ...resources }
    const nextMission = advanceMission(mission || { round: 1, status: 'in_progress', players })

    if (onAdvanceMission) {
      onAdvanceMission(nextMission)
    } else if (onApplyResourceDelta) {
      // Fallback: calculate consumption delta
      const delta = {
        oxygen: (nextMission.resources?.oxygen ?? 0) - (previousResources.oxygen ?? 0),
        water: (nextMission.resources?.water ?? 0) - (previousResources.water ?? 0),
        power: (nextMission.resources?.power ?? 0) - (previousResources.power ?? 0),
        food: (nextMission.resources?.food ?? 0) - (previousResources.food ?? 0),
        radiation: (nextMission.resources?.radiation ?? 0) - (previousResources.radiation ?? 0),
      }
      onApplyResourceDelta(delta)
    }

    const summary = {
      solNumber: mission?.round ?? 1,
      previousResources,
      currentResources: nextMission.resources,
      tasksCompletedToday: completedToday,
      eventsResolvedToday: resolvedToday,
      missionStatus: nextMission.status,
    }

    setSolSummary(summary)

    // Reset daily logs and refresh task availability for the new Sol
    setCompletedToday([])
    setResolvedToday([])
    setTasks((prev) => prev.map((t) => ({ ...t, status: 'available' })))

    // Check if next Sol has a scheduled crisis
    const nextSolNumber = (mission?.round ?? 1) + 1
    const nextCrisisId = SOL_SCHEDULED_CRISES[nextSolNumber]
    if (nextCrisisId && nextMission.status === 'in_progress') {
      const scheduledEvent = getEventById(nextCrisisId)
      if (scheduledEvent) {
        setActiveCrisis(scheduledEvent)
        broadcastSync({
          type: 'SYNC_ACTIVE_CRISIS',
          crisis: scheduledEvent,
        })
      }
    }

    broadcastSync({
      type: 'SYNC_ADVANCE_SOL',
      newMission: nextMission,
      newResources: nextMission.resources,
      summary,
    })

    // Close station modal to show summary
    setActiveStation(null)
    sceneRef.current?.closeStationInteraction()
  }, [mission, resources, players, completedToday, resolvedToday, onAdvanceMission, onApplyResourceDelta, broadcastSync])

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
          activeCrisis={activeCrisis}
          onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
          nearbyStation={nearbyStation}
          nearbyClue={nearbyClue}
          onExit={onExit}
        />

        {/* 5 Operational Station Dialogs */}
        {activeStation && (
          <StationDialog
            station={activeStation}
            mission={mission}
            resources={resources}
            players={previewPlayers}
            currentPlayer={resolvedCurrentPlayer}
            tasks={tasks}
            activeEvent={activeCrisis}
            onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
            onCompleteTask={handleCompleteTask}
            onApplyResourceDelta={handleApplyDelta}
            onAdvanceSol={handleAdvanceSol}
            powerGrid={powerGrid}
            onUpdatePowerGrid={handleUpdatePowerGrid}
            cropIrrigationPolicy={cropIrrigationPolicy}
            onUpdateIrrigationPolicy={handleUpdateIrrigationPolicy}
            onClose={() => {
              setActiveStation(null)
              sceneRef.current?.closeStationInteraction()
            }}
          />
        )}

        {/* In-Map Crisis Emergency Deliberation Modal */}
        {isCrisisModalOpen && activeCrisis && (
          <CrisisDecisionModal
            event={activeCrisis}
            players={previewPlayers}
            currentPlayer={resolvedCurrentPlayer}
            resources={resources}
            onResolveCrisis={handleResolveCrisis}
            onClose={() => setIsCrisisModalOpen(false)}
          />
        )}

        {/* Daily End-of-Sol Summary Modal */}
        {solSummary && (
          <SolSummaryModal
            solNumber={solSummary.solNumber}
            previousResources={solSummary.previousResources}
            currentResources={solSummary.currentResources}
            tasksCompletedToday={solSummary.tasksCompletedToday}
            eventsResolvedToday={solSummary.eventsResolvedToday}
            missionStatus={solSummary.missionStatus}
            onContinue={() => setSolSummary(null)}
            onViewReport={() => {
              setSolSummary(null)
              if (onViewReport) onViewReport()
              else if (onExit) onExit()
            }}
          />
        )}
      </div>
    </section>
  )
}

export default MarsGameView
