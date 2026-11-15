import { useEffect, useMemo, useRef, useState } from 'react'
import Phaser from 'phaser'
import MarsExplorationScene from '../../game/scenes/MarsExplorationScene'
import { MARS_WORLD } from '../../game/maps/marsWorldLayout'
import GameHud from './GameHud'
import TaskMinigame from './TaskMinigame'
import { getTaskForStation } from '../../game/tasks/taskDefinitions'
import { getMissionTaskAssignment } from '../../game/tasks/taskAssignment'
import { mockCrew } from '../dashboard/mockDashboardData'
import { InGameEventManager, createScenarioFromEvent, EVENTS_CATALOG, getEventsBySeverity, resolveEvent } from '../events'
import './MarsGameView.css'
import './TaskSidebar.css'

let pendingGameTeardown = Promise.resolve()

const CREW_ROLES = [
  { label: 'Mission Commander', keys: ['Mission Commander', 'Commander'] },
  { label: 'Power Engineer', keys: ['Power Engineer', 'Engineer'] },
  { label: 'Botanist', keys: ['Botanist'] },
  { label: 'Life Support Officer', keys: ['Life Support Officer', 'Medic'] },
  { label: 'Science & Safety Officer', keys: ['Science & Safety Officer', 'Scientist'] },
]

function displayRole(role) {
  return ({
    Commander: 'Mission Commander',
    Engineer: 'Power Engineer',
    Medic: 'Life Support Officer',
    Scientist: 'Science & Safety Officer',
  })[role] || role
}

function MarsGameView({ resources, mission, players, currentPlayer, alerts, solClockState, spaceWeather, onApplyResourceDelta, onExit, onTaskComplete = () => {}, onTaskProgress = () => {}, onAdvanceSol = () => {}, onViewReport = () => {} }) {
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

  const [nearbyFacility, setNearbyFacility] = useState(null)
  const [location, setLocation] = useState({ kind: 'surface', facilityId: null })
  const [worldState, setWorldState] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [taskSidebarOpen, setTaskSidebarOpen] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [mapSelection, setMapSelection] = useState(null)
  const [previewRole, setPreviewRole] = useState('Mission Commander')
  const gameConfigRef = useRef(null)
  const previewPlayers = useMemo(() => {
    const incoming = Array.isArray(players) ? players : []
    return CREW_ROLES.map(({ label, keys }, index) => {
      const player = incoming.find((candidate) => keys.includes(candidate?.role))
      return player
        ? { ...player, role: label }
        : { ...mockCrew[index], role: label, isSimulated: true }
    })
  }, [players])
  const activePlayer = currentPlayer || previewPlayers.find((player) => player.role === previewRole) || previewPlayers[0]
  const activeRole = displayRole(activePlayer?.role)
  const assignmentInput = useMemo(() => ({
    taskAssignment: mission?.taskAssignment,
    missionId: mission?.missionId,
    taskSeed: mission?.taskSeed,
    roomCode: mission?.roomCode,
  }), [
    mission?.taskAssignment,
    mission?.missionId,
    mission?.taskSeed,
    mission?.roomCode,
  ])
  const taskAssignment = useMemo(() => getMissionTaskAssignment(assignmentInput, previewPlayers), [
    assignmentInput,
    previewPlayers,
  ])
  const assignedTasks = taskAssignment.tasks
  const activeTask = activeStation ? getTaskForStation(activeStation.id, assignedTasks) : null
  const personalTasks = assignedTasks.filter((task) => task.assignedTo?.playerId === activePlayer?.id)
  const visiblePersonalTasks = personalTasks.length ? personalTasks : assignedTasks.filter((task) => task.assignedTo?.role === activeRole)
  const activeSelectedTaskId = visiblePersonalTasks.some((task) => task.id === selectedTaskId)
    ? selectedTaskId
    : visiblePersonalTasks[0]?.id || ''
  const completedTaskIds = new Set((mission?.completedTasks || []).map((task) => typeof task === 'string' ? task : task?.taskId || task?.id).filter(Boolean))
  const taskProgress = mission?.taskProgress || {}


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

      const config = gameConfigRef.current
      if (!config) return
      const scene = new MarsExplorationScene({
        players: config.players,
        localPlayerId: config.localPlayerId,
        tasks: config.tasks,

        onNearbyStationChange: setNearbyStation,
        onNearbyFacilityChange: setNearbyFacility,
        onStationChange: setActiveStation,
        onLocationChange: setLocation,
        onWorldStateChange: setWorldState,

      })
      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        width: MARS_WORLD.width,
        height: MARS_WORLD.height,
        backgroundColor: '#241411',
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
      setNearbyFacility(null)
    }
  }, [])

  useEffect(() => {
    gameConfigRef.current = {
      players: previewPlayers,
      localPlayerId: activePlayer?.id || mission?.hostId || '',
      tasks: assignedTasks,
    }
    const scene = sceneRef.current
    if (!scene) return
    scene.setTasks(assignedTasks)
    scene.setCrew(previewPlayers, activePlayer?.id || mission?.hostId || '')
  }, [assignedTasks, previewPlayers, activePlayer?.id, mission?.hostId])

  useEffect(() => {
    sceneRef.current?.setMissionEnded(['completed', 'failed'].includes(mission?.status))
  }, [mission?.status])


  return (
    <section className="mars-game-view" aria-label="MISSION: OUTPOST Mars exploration game">
      <div className="mars-game-world">
        <div
          className="mars-game-canvas"
          ref={mountRef}
          aria-label="Explorable Martian surface and research facilities"
        />
        <GameHud
          resources={resources}
          mission={mission}
          solClockState={solClockState}
          players={previewPlayers}
          alerts={alerts}
          taskCount={visiblePersonalTasks.filter((task) => completedTaskIds.has(task.id)).length}
          taskTotal={visiblePersonalTasks.length}
          currentRole={activeRole}
          allowRoleSwitch={!currentPlayer}
          onRoleChange={setPreviewRole}
          onAdvanceSol={onAdvanceSol}
          nearbyStation={nearbyStation}
          nearbyClue={nearbyClue}
          nearbyFacility={nearbyFacility}
          location={location}
          onToggleMap={() => setShowMap((visible) => !visible)}
          mapOpen={showMap}
          onExit={onExit}
        />
        <TaskSidebar
          tasks={visiblePersonalTasks}
          completedTaskIds={completedTaskIds}
          progress={taskProgress}
          selectedTaskId={activeSelectedTaskId}
          expanded={taskSidebarOpen}
          onToggle={() => setTaskSidebarOpen((open) => !open)}
          onSelect={(taskId) => { setSelectedTaskId(taskId); setMapSelection({ type: 'task', id: taskId }) }}
          teamCompleted={completedTaskIds.size}
          teamTotal={assignedTasks.length}
          missionEnded={['completed', 'failed'].includes(mission?.status)}
        />
        <MarsMapPanel
          worldState={worldState}
          location={location}
          tasks={assignedTasks}
          completedTaskIds={completedTaskIds}
          selectedTaskId={activeSelectedTaskId}
          events={mission?.events || []}
          expanded={showMap}
          selection={mapSelection}
          onToggle={() => setShowMap((open) => !open)}
          onSelectTask={(taskId) => { setSelectedTaskId(taskId); setMapSelection({ type: 'task', id: taskId }) }}
          onSelectFacility={(facilityId) => setMapSelection({ type: 'facility', id: facilityId })}
        />
        {['completed', 'failed'].includes(mission?.status) && (
          <div className="mission-outcome-backdrop">
            <section className="mission-outcome-card" role="dialog" aria-modal="true" aria-labelledby="mission-outcome-title">
              <span>MISSION DEBRIEF</span>
              <h2 id="mission-outcome-title">{mission.status === 'completed' ? 'Mission survived' : 'Mission ended'}</h2>
              <p>{mission.status === 'completed' ? `The crew reached Sol ${mission.round} in this simulation.` : `The crew's shared resource simulation reached a failure threshold on Sol ${mission.round}.`}</p>
              <p className="mission-outcome-id">Local record: {mission.missionId || 'Preview session'}</p>
              <button type="button" onClick={onViewReport}>Open Mission Report</button>
              <button type="button" className="secondary" onClick={onExit}>Return to dashboard</button>
            </section>
          </div>
        )}

        {/* In-Game Crisis & Decision Event Manager Overlay */}
        <InGameEventManager
          event={activeEvent}
          scenario={eventScenario}
          players={previewPlayers}
          activePlayerId={activePlayer?.id || 'p1'}
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

        {activeStation && activeTask && (
          <TaskMinigame
            key={activeTask.id}
            task={activeTask}
            playerRole={activeRole}
            completed={completedTaskIds.has(activeTask.id)}
            progress={taskProgress[activeTask.id] || {}}
            onProgress={onTaskProgress}
            onComplete={(task) => {
              if (completedTaskIds.has(task.id)) return
              onTaskComplete({ ...task, playerId: activePlayer?.id || 'local-commander' })
            }}
            onClose={() => sceneRef.current?.closeStation()}
          />
        )}
      </div>
    </section>
  )
}

function TaskSidebar({ tasks, completedTaskIds, progress, selectedTaskId, expanded, onToggle, onSelect, teamCompleted, teamTotal, missionEnded }) {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)
  return (
    <aside className={`task-sidebar ${expanded ? 'is-expanded' : 'is-collapsed'}`} aria-label="Personal mission tasks">
      <header>
        <div><small>PERSONAL OBJECTIVES · TEAM {teamCompleted}/{teamTotal}</small><strong>Mission Tasks</strong></div>
        <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Collapse task list' : 'Expand task list'}>{expanded ? '−' : '+'}</button>
      </header>
      {expanded && <>
        {selectedTask && <div className="task-sidebar-objective"><small>ACTIVE OBJECTIVE</small><strong>{selectedTask.title}</strong><span>{taskLocationName(selectedTask.facilityId)} · {selectedTask.category}</span></div>}
        <ul>
          {tasks.map((task) => {
            const done = completedTaskIds.has(task.id)
            const unavailable = missionEnded && !done
            const status = done ? 'completed' : unavailable ? 'unavailable' : task.status === 'in_progress' ? 'in_progress' : 'not_started'
            const percent = done ? 100 : Number(progress[task.id]?.percent ?? task.progress ?? 0)
            return <li key={task.id} className={`${status} ${selectedTaskId === task.id ? 'is-selected' : ''}`}>
              <button type="button" onClick={() => onSelect(task.id)} aria-pressed={selectedTaskId === task.id}>
                <span className="task-sidebar-status" aria-hidden="true">{done ? '✓' : unavailable ? '!' : status === 'in_progress' ? '◷' : '○'}</span>
                <span className="task-sidebar-copy"><strong>{task.title}</strong><small>{taskLocationName(task.facilityId)} · {status.replaceAll('_', ' ')}</small><i><b style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></i></span>
              </button>
            </li>
          })}
        </ul>
      </>}
    </aside>
  )
}

function MarsMapPanel({ worldState, location, tasks = [], completedTaskIds, selectedTaskId, events = [], expanded, selection, onToggle, onSelectTask, onSelectFacility }) {
  const facilities = worldState?.facilities || MARS_WORLD.facilities
  const crew = worldState?.crew || []
  const paths = worldState?.paths || MARS_WORLD.paths
  const selectedTask = selection?.type === 'task'
    ? tasks.find((task) => task.id === selection.id)
    : tasks.find((task) => task.id === selectedTaskId)
  // Show the facility floor plan when it contains the selected objective. If
  // the objective is elsewhere, keep the surface map visible so its facility
  // marker can point to the correct destination.
  const indoor = location?.kind === 'facility' && (!selectedTask || selectedTask.facilityId === location.facilityId)
  const interior = worldState?.interior
  const selectedFacility = selection?.type === 'facility' ? facilities.find((facility) => facility.id === selection.id) : null
  const svgView = indoor && interior ? `0 0 ${interior.width} ${interior.height}` : `0 0 ${MARS_WORLD.width} ${MARS_WORLD.height}`
  const eventFacilityId = (event) => event.facilityId || (event.id === 'power-fluctuation' ? 'power' : event.id === 'pressure-leak' ? 'life-support' : null)

  return (
    <aside className={`mars-map-panel ${expanded ? 'is-expanded' : 'is-compact'} ${indoor ? 'is-interior' : ''}`} aria-label={expanded ? 'Interactive mission map' : 'Interactive minimap'}>
      <header>
        <div><small>{indoor ? 'INDOOR FLOOR PLAN' : 'LIVE MARS MAP'}</small><h2>{indoor ? facilities.find((item) => item.id === location.facilityId)?.name || 'Facility interior' : 'Outpost map'}</h2></div>
        <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Shrink map' : 'Expand map'}>{expanded ? '−' : '＋'}</button>
      </header>
      <svg viewBox={svgView} role="img" aria-label={indoor ? 'Facility interior with astronaut, crew, and task locations' : 'Live Martian surface map with astronaut, crew, facilities, and tasks'}>
        {indoor && interior ? <>
          <rect width={interior.width} height={interior.height} fill="#211714" />
          <rect x={interior.room.x} y={interior.room.y} width={interior.room.width} height={interior.room.height} rx="18" fill="#66564b" stroke="#d6ad7e" strokeWidth="7" />
          <rect x={interior.room.x + 14} y={interior.room.y + 14} width={interior.room.width - 28} height={interior.room.height - 28} rx="11" fill="#37413b" />
          <text x={interior.room.x + interior.room.width / 2} y={interior.room.y + 31} fill="#f3dec2" fontSize="14" textAnchor="middle">{facilities.find((item) => item.id === location.facilityId)?.name}</text>
          {worldState?.taskStations?.map((station) => <g key={station.taskId || station.id} className={`map-task-marker ${station.taskId === selectedTaskId ? 'is-highlighted' : ''}`} role="button" tabIndex="0" aria-label={`Select task ${station.name}`} onClick={() => station.taskId && onSelectTask(station.taskId)}><circle cx={station.x} cy={station.y} r="13" fill={station.taskId === selectedTaskId ? '#fff47d' : '#eeb65f'} stroke="#261710" strokeWidth="4"/><text x={station.x} y={station.y + 5} fill="#251811" textAnchor="middle" fontSize="14">T</text></g>)}
          {crew.filter((member) => member.location === 'facility' && member.facilityId === location.facilityId && member.interiorPosition).map((member) => <circle key={member.id} cx={member.interiorPosition.x} cy={member.interiorPosition.y} r={member.local ? 10 : 7} fill={member.local ? '#fff27e' : '#80d5e1'} stroke="#261710" strokeWidth="3"><title>{member.role}</title></circle>)}
          <path d={`M ${interior.room.x + interior.room.width / 2 - 28} ${interior.room.y + interior.room.height} h 56`} stroke="#f0bd72" strokeWidth="8" />
        </> : <>
          <rect width={MARS_WORLD.width} height={MARS_WORLD.height} fill="#341b16" />
          {paths.map((points, index) => <polyline key={index} points={points.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#bd7650" strokeOpacity=".45" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />)}
          {facilities.map((facility) => <g key={facility.id} className="map-facility-marker" role="button" tabIndex="0" aria-label={`View ${facility.shortName || facility.name}`} onClick={() => onSelectFacility(facility.id)} onKeyDown={(event) => event.key === 'Enter' && onSelectFacility(facility.id)}>
            <rect x={facility.x} y={facility.y} width={facility.width} height={facility.height} rx="24" fill={facility.id === location.facilityId ? '#f0ae63' : '#766158'} stroke={selection?.id === facility.id ? '#fff47d' : '#d7b493'} strokeWidth={selection?.id === facility.id ? 20 : 12} />
            <text x={facility.x + facility.width / 2} y={facility.y + facility.height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff1dc" fontSize="45">⌂</text>
            <title>{facility.shortName || facility.name}</title>
          </g>)}
          {tasks.map((task) => {
            const facility = facilities.find((item) => item.id === task.facilityId)
            if (!facility) return null
            const cx = facility.x + facility.width / 2
            const cy = facility.y + facility.height + 22
            const complete = completedTaskIds.has(task.id)
            return <g key={task.id} className={`map-task-marker ${task.id === selectedTaskId ? 'is-highlighted' : ''}`} role="button" tabIndex="0" aria-label={`Select task ${task.title} at ${facility.shortName}`} onClick={() => onSelectTask(task.id)} onKeyDown={(event) => event.key === 'Enter' && onSelectTask(task.id)}><circle cx={cx} cy={cy} r={task.id === selectedTaskId ? 52 : 36} fill={task.id === selectedTaskId ? '#fff47d' : complete ? '#8fbd78' : '#eab85e'} stroke="#2a1711" strokeWidth="9"/><text x={cx} y={cy + 12} textAnchor="middle" fill="#261910" fontSize="36" fontWeight="bold">{complete ? '✓' : 'T'}</text><title>{task.title} · {facility.shortName}</title></g>
          })}
          {events.map((event) => {
            const facility = facilities.find((item) => item.id === eventFacilityId(event))
            if (!facility) return null
            return <g key={`${event.id}-${event.sol}`}><circle cx={facility.x + facility.width / 2} cy={facility.y - 20} r="29" fill="#d76251" stroke="#2a1711" strokeWidth="7"><title>{event.title || 'Emergency event'}</title></circle><text x={facility.x + facility.width / 2} y={facility.y - 10} textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">!</text></g>
          })}
          {crew.filter((member) => member.location === 'surface').map((member) => <circle key={member.id} cx={member.x} cy={member.y} r={member.local ? 38 : 25} fill={member.local ? '#f6d36e' : '#71bbcb'} stroke="#241411" strokeWidth="8"><title>{member.role}</title></circle>)}
          {crew.filter((member) => member.location === 'facility').map((member) => {
            const facility = facilities.find((item) => item.id === member.facilityId)
            return facility ? <circle key={member.id} cx={facility.x + facility.width / 2} cy={facility.y + facility.height / 2} r={member.local ? 38 : 25} fill={member.local ? '#f6d36e' : '#71bbcb'} stroke="#241411" strokeWidth="8"><title>{member.role} · indoors</title></circle> : null
          })}
          {worldState?.player?.location === 'surface' && <circle className="map-local-player" cx={worldState.player.x} cy={worldState.player.y} r="55" fill="none" stroke="#fff47d" strokeWidth="12" />}
        </>}
      </svg>
      {(selectedTask || selectedFacility) && <div className="mars-map-selection"><strong>{selectedTask?.title || selectedFacility?.shortName || selectedFacility?.name}</strong><span>{selectedTask ? `${selectedTask.role} · ${taskLocationName(selectedTask.facilityId)}` : `Status: ${selectedFacility.id === location.facilityId ? 'occupied' : 'available'}`}</span></div>}
      {expanded && <>
        <div className="mars-map-legend"><span><i className="task-dot" /> Task</span><span><i className="crew-dot" /> Crew</span><span><i className="event-dot" /> Alert</span></div>
        <ul className="mars-map-task-list">{tasks.map((task) => <li key={task.id} className={`${completedTaskIds.has(task.id) ? 'is-complete' : ''} ${task.id === selectedTaskId ? 'is-selected' : ''}`}><button type="button" onClick={() => onSelectTask(task.id)}><span>{completedTaskIds.has(task.id) ? '✓' : '○'}</span><div><strong>{task.title}</strong><small>{task.role} · {taskLocationName(task.facilityId)}</small></div></button></li>)}</ul>
        {events.length > 0 && <ul className="mars-map-events">{events.map((event) => <li key={`${event.id}-${event.sol}`}><strong>Sol {event.sol} · {event.title}</strong><span>{event.message}</span></li>)}</ul>}
      </>}
    </aside>
  )
}

function taskLocationName(taskId) {
  const byFacility = MARS_WORLD.facilities.find((facility) => facility.id === taskId)
  if (byFacility) return byFacility.shortName
  return ({
    'mission-console-check': 'Command Centre',
    'restore-generator': 'Power Station',
    'balance-hydroponics': 'Greenhouse',
    'service-filter': 'Life Support Facility',
    'analyse-sample': 'Science Lab',
    'rover-diagnostics': 'Rover Garage',
    'restore-comms-signal': 'Communications Tower',
    observatory: 'Observatory', 'satellite-monitoring': 'Satellite Monitoring', 'medical-bay': 'Medical Bay',
    'geological-storage': 'Sample Storage', 'research-archive': 'Research Archive',
  })[taskId] || 'Facility'
}

export default MarsGameView
