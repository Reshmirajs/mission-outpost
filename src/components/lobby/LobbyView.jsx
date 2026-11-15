import { useState, useEffect, useCallback } from 'react'
import LobbyEntryModal from './LobbyEntryModal.jsx'
import CreateLobbyModal from './CreateLobbyModal.jsx'
import RoomCreatedModal from './RoomCreatedModal.jsx'
import JoinLobbyModal from './JoinLobbyModal.jsx'
import AssembleCrewScreen from './AssembleCrewScreen.jsx'
import SpecialistRoleSelector from './SpecialistRoleSelector.jsx'
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
} from '../../services/multiplayer/index.js'
import { MissionStatus } from '../../types/game.js'
import './Lobby.css'

/**
 * LobbyView Component
 *
 * Coordinates the redesigned Multiplayer Lobby experience:
 * 1. Entry Modal (Create vs Join)
 * 2. Create Lobby Flow & Room-Created Confirmation
 * 3. Join Lobby Flow with Validation
 * 4. Assemble Your Crew Screen (5 distinct positions)
 * 5. Sequential Specialist Role Selection (One role at a time, standing astronaut)
 * 6. Mission Launch Countdown & Callback
 */
export default function LobbyView({
  initialMode = 'entry', // 'entry' | 'create' | 'join'
  onStartMission,
  onExitLobby,
}) {
  // Modal / Flow State
  const [activeModal, setActiveModal] = useState(initialMode || 'entry')
  const [mission, setMission] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Real-time synchronization across browser tabs
  useEffect(() => {
    if (!mission?.roomCode) return

    const unsubscribe = subscribeToRoom(mission.roomCode, (updatedMission) => {
      if (!updatedMission) {
        setMission(null)
        setCurrentPlayer(null)
        setActiveModal('entry')
        setErrorMessage('The outpost session has been closed.')
        return
      }

      setMission(updatedMission)

      // Keep currentPlayer reference up-to-date
      if (currentPlayer?.id) {
        const refreshed = updatedMission.players.find((p) => p.id === currentPlayer.id)
        if (refreshed) {
          setCurrentPlayer(refreshed)
        } else {
          setCurrentPlayer(null)
        }
      }

      // If host launched the mission, auto-transition all squad members
      if (updatedMission.status === MissionStatus.IN_PROGRESS && onStartMission) {
        onStartMission(updatedMission)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [mission?.roomCode, currentPlayer?.id, onStartMission])

  // Handle window unload / tab close to ensure player leaves the room cleanly
  useEffect(() => {
    if (!mission?.roomCode || !currentPlayer?.id) return

    const handleBeforeUnload = () => {
      leaveMockRoom(mission.roomCode, currentPlayer.id)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [mission?.roomCode, currentPlayer?.id])

  // --- ACTIONS ---

  // Handle Create Lobby Submission
  const handleCreateLobby = useCallback(async (callsign) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { mission: newMission, player: hostPlayer } = await createMockRoom(callsign)
      setMission(newMission)
      setCurrentPlayer(hostPlayer)
      // Display Room-Created Confirmation
      setActiveModal('roomCreated')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to establish outpost room.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle Continue from Room-Created Confirmation to Assemble Your Crew
  const handleContinueToAssemble = useCallback(() => {
    setActiveModal(null) // Close modal, enter Assemble Your Crew
  }, [])

  // Handle Join Lobby Submission
  const handleJoinLobby = useCallback(async (code, callsign) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { mission: joinedMission, player: joinedPlayer } = await joinMockRoom(code, callsign)
      setMission(joinedMission)
      setCurrentPlayer(joinedPlayer)
      setActiveModal(null) // Directly enter Assemble Your Crew
    } catch (err) {
      setErrorMessage(err.message || 'Failed to rendezvous with outpost squad.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle Specialist Role Selection Confirmation
  const handleConfirmRole = useCallback(async (roleKey) => {
    if (!mission || !currentPlayer) return
    try {
      const updated = await selectPlayerRole(mission.roomCode, currentPlayer.id, roleKey)
      setMission(updated)
      const refreshedMe = updated.players.find((p) => p.id === currentPlayer.id)
      if (refreshedMe) setCurrentPlayer(refreshedMe)
      setIsRoleSelectorOpen(false) // Close role selector, return to Assemble Your Crew
    } catch (err) {
      alert(err.message || 'Could not select role.')
    }
  }, [mission, currentPlayer])

  // Handle Ready Toggle
  const handleToggleReady = useCallback(async () => {
    if (!mission || !currentPlayer) return
    try {
      const updated = await togglePlayerReady(mission.roomCode, currentPlayer.id)
      setMission(updated)
      const refreshedMe = updated.players.find((p) => p.id === currentPlayer.id)
      if (refreshedMe) setCurrentPlayer(refreshedMe)
    } catch (err) {
      alert(err.message || 'Cannot change readiness state.')
    }
  }, [mission, currentPlayer])

  // Handle Mission Launch
  const handleLaunchMission = useCallback(async () => {
    if (!mission || !currentPlayer) return
    try {
      const launchedMission = await startMission(mission.roomCode, currentPlayer.id)
      setMission(launchedMission)
      if (onStartMission) {
        onStartMission(launchedMission)
      }
    } catch (err) {
      alert(err.message || 'Cannot launch mission.')
    }
  }, [mission, currentPlayer, onStartMission])

  // Handle Leaving Outpost
  const handleLeaveLobby = useCallback(async () => {
    if (mission && currentPlayer) {
      await leaveMockRoom(mission.roomCode, currentPlayer.id)
    }
    setMission(null)
    setCurrentPlayer(null)
    setActiveModal(null)
    if (onExitLobby) {
      onExitLobby()
    }
  }, [mission, currentPlayer, onExitLobby])

  // Demo AI Crew Helpers for single-player evaluation
  const handleAddDemoCrew = useCallback(async () => {
    if (!mission) return
    try {
      const updated = await addDemoCrewMember(mission.roomCode)
      setMission(updated)
    } catch (err) {
      alert(err.message || 'Cannot add simulated astronaut.')
    }
  }, [mission])

  const handleRemoveDemoCrew = useCallback(async (demoId) => {
    if (!mission) return
    try {
      const updated = await removeDemoCrewMember(mission.roomCode, demoId)
      if (updated) setMission(updated)
    } catch (err) {
      alert(err.message || 'Cannot remove simulated astronaut.')
    }
  }, [mission])

  // Modal Cancel / Back Helpers
  const handleCloseEntryModal = () => {
    setActiveModal(null)
    if (!mission && onExitLobby) {
      onExitLobby()
    }
  }

  return (
    <div className="lobby-redesign-container">
      {/* 1. ENTRY MODAL (Create vs Join) */}
      {activeModal === 'entry' && !mission && (
        <LobbyEntryModal
          onSelectCreate={() => {
            setErrorMessage('')
            setActiveModal('create')
          }}
          onSelectJoin={() => {
            setErrorMessage('')
            setActiveModal('join')
          }}
          onClose={handleCloseEntryModal}
        />
      )}

      {/* 2. CREATE LOBBY MODAL */}
      {activeModal === 'create' && !mission && (
        <CreateLobbyModal
          onCreateLobby={handleCreateLobby}
          onBack={handleCloseEntryModal}
          onClose={handleCloseEntryModal}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* 3. ROOM CREATED CONFIRMATION MODAL */}
      {activeModal === 'roomCreated' && mission && currentPlayer && (
        <RoomCreatedModal
          roomCode={mission.roomCode}
          hostPlayer={currentPlayer}
          onContinueToAssemble={handleContinueToAssemble}
        />
      )}

      {/* 4. JOIN LOBBY MODAL */}
      {activeModal === 'join' && !mission && (
        <JoinLobbyModal
          onJoinLobby={handleJoinLobby}
          onBack={handleCloseEntryModal}
          onClose={handleCloseEntryModal}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* 5. MAIN ASSEMBLE YOUR CREW SCREEN */}
      {mission && currentPlayer && activeModal !== 'roomCreated' && (
        <AssembleCrewScreen
          mission={mission}
          currentPlayer={currentPlayer}
          onOpenRoleSelector={() => setIsRoleSelectorOpen(true)}
          onToggleReady={handleToggleReady}
          onLaunchMission={handleLaunchMission}
          onLeaveLobby={handleLeaveLobby}
          onAddDemoCrew={handleAddDemoCrew}
          onRemoveDemoCrew={handleRemoveDemoCrew}
        />
      )}

      {/* 6. DEDICATED SPECIALIST ROLE SELECTION OVERLAY */}
      {isRoleSelectorOpen && mission && currentPlayer && (
        <SpecialistRoleSelector
          currentRoleKey={currentPlayer.role}
          players={mission.players}
          currentPlayerId={currentPlayer.id}
          onConfirmRole={handleConfirmRole}
          onClose={() => setIsRoleSelectorOpen(false)}
        />
      )}
    </div>
  )
}
