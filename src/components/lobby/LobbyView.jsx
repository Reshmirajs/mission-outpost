import { useState, useEffect, useCallback } from 'react'
import CreateRoomModal from './CreateRoomModal.jsx'
import JoinRoomModal from './JoinRoomModal.jsx'
import CrewWaitingArea from './CrewWaitingArea.jsx'
import {
  createMockRoom,
  joinMockRoom,
  selectPlayerRole,
  togglePlayerReady,
  leaveMockRoom,
  startMission,
  addDemoCrewMember,
  removeDemoCrewMember,
  subscribeToRoom,
} from './mockLobbyService.js'
import { MissionStatus } from '../../types/game.js'
import './Lobby.css'

/**
 * LobbyView Component
 *
 * Coordinates the full Multiplayer Lobby lifecycle:
 * 1. Room Creation (Host)
 * 2. Room Joining (Crew Member)
 * 3. Real-time Crew Waiting Area
 * 4. Mission Launch Hand-off
 *
 * CONTRACT FOR PERSON 5 (Firebase Integration):
 * @param {Object} props
 * @param {'create'|'join'|null} [props.initialMode] - Opens create or join modal on mount.
 * @param {(mission: import('../../types/game.js').Mission) => void} props.onStartMission - Callback when mission starts.
 * @param {() => void} props.onExitLobby - Callback when returning to outpost main menu.
 */
export default function LobbyView({
  initialMode = null,
  onStartMission,
  onExitLobby,
}) {
  const [modalMode, setModalMode] = useState(initialMode)
  const [mission, setMission] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Sync real-time updates when inside an active room
  useEffect(() => {
    if (!mission?.roomCode) return

    const unsubscribe = subscribeToRoom(mission.roomCode, (updatedMission) => {
      if (!updatedMission) {
        // Room was closed or deleted
        setMission(null)
        setCurrentPlayer(null)
        setErrorMessage('The outpost session has been closed.')
        return
      }

      setMission(updatedMission)

      // Keep currentPlayer state synchronized
      if (currentPlayer?.id) {
        const refreshedCurrentPlayer = updatedMission.players.find(
          (p) => p.id === currentPlayer.id
        )
        if (refreshedCurrentPlayer) {
          setCurrentPlayer(refreshedCurrentPlayer)
        } else {
          // Player was removed or left
          setCurrentPlayer(null)
        }
      }

      // If host launched the mission, auto-transition all connected crew members
      if (
        updatedMission.status === MissionStatus.IN_PROGRESS &&
        onStartMission
      ) {
        onStartMission(updatedMission)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [mission?.roomCode, currentPlayer?.id, onStartMission])

  // Handle Room Creation
  const handleCreateRoom = useCallback(async (hostName) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { mission: newMission, player: hostPlayer } = createMockRoom(hostName)
      setMission(newMission)
      setCurrentPlayer(hostPlayer)
      setModalMode(null)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to establish outpost room.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle Room Joining
  const handleJoinRoom = useCallback(async (code, name) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { mission: joinedMission, player: joinedPlayer } = joinMockRoom(code, name)
      setMission(joinedMission)
      setCurrentPlayer(joinedPlayer)
      setModalMode(null)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to join outpost room.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle Station / Role Selection
  const handleSelectRole = useCallback((roleKey) => {
    if (!mission || !currentPlayer) return
    const updated = selectPlayerRole(mission.roomCode, currentPlayer.id, roleKey)
    setMission(updated)
    const me = updated.players.find((p) => p.id === currentPlayer.id)
    if (me) setCurrentPlayer(me)
  }, [mission, currentPlayer])

  // Handle Ready Toggle
  const handleToggleReady = useCallback(() => {
    if (!mission || !currentPlayer) return
    const updated = togglePlayerReady(mission.roomCode, currentPlayer.id)
    setMission(updated)
    const me = updated.players.find((p) => p.id === currentPlayer.id)
    if (me) setCurrentPlayer(me)
  }, [mission, currentPlayer])

  // Handle Mission Start (Host only)
  const handleStartMission = useCallback(() => {
    if (!mission || !currentPlayer) return
    const launchedMission = startMission(mission.roomCode, currentPlayer.id)
    setMission(launchedMission)
    if (onStartMission) {
      onStartMission(launchedMission)
    }
  }, [mission, currentPlayer, onStartMission])

  // Handle Leaving Outpost
  const handleLeaveRoom = useCallback(() => {
    if (mission && currentPlayer) {
      leaveMockRoom(mission.roomCode, currentPlayer.id)
    }
    setMission(null)
    setCurrentPlayer(null)
    if (onExitLobby) {
      onExitLobby()
    }
  }, [mission, currentPlayer, onExitLobby])

  // Helpers for Single-Window / AI Demo Testing
  const handleAddDemoCrew = useCallback(() => {
    if (!mission) return
    try {
      const updated = addDemoCrewMember(mission.roomCode)
      setMission(updated)
    } catch (err) {
      setErrorMessage(err.message || 'Cannot add simulated astronaut.')
    }
  }, [mission])

  const handleRemoveDemoCrew = useCallback((demoId) => {
    if (!mission) return
    try {
      const updated = removeDemoCrewMember(mission.roomCode, demoId)
      if (updated) setMission(updated)
    } catch (err) {
      setErrorMessage(err.message || 'Cannot remove simulated astronaut.')
    }
  }, [mission])

  const handleCancelModal = () => {
    setModalMode(null)
    setErrorMessage('')
    if (!mission && onExitLobby) {
      onExitLobby()
    }
  }

  return (
    <div className="lobby-container">
      {/* Create Room Modal */}
      {modalMode === 'create' && (
        <CreateRoomModal
          onCreateRoom={handleCreateRoom}
          onCancel={handleCancelModal}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* Join Room Modal */}
      {modalMode === 'join' && (
        <JoinRoomModal
          onJoinRoom={handleJoinRoom}
          onCancel={handleCancelModal}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* Active Crew Waiting Area */}
      {mission && currentPlayer && (
        <CrewWaitingArea
          mission={mission}
          currentPlayer={currentPlayer}
          onSelectRole={handleSelectRole}
          onToggleReady={handleToggleReady}
          onStartMission={handleStartMission}
          onLeaveRoom={handleLeaveRoom}
          onAddDemoCrew={handleAddDemoCrew}
          onRemoveDemoCrew={handleRemoveDemoCrew}
        />
      )}
    </div>
  )
}
