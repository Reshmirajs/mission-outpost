import { useState, useEffect, useCallback, useRef } from 'react'
import LobbyEntryModal from './LobbyEntryModal.jsx'
import CreateOutpostScreen from './CreateOutpostScreen.jsx'
import JoinExpeditionScreen from './JoinExpeditionScreen.jsx'
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
} from './mockLobbyService.js'
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

  const currentPlayerRef = useRef(currentPlayer)
  useEffect(() => {
    currentPlayerRef.current = currentPlayer
  }, [currentPlayer])

  const onStartMissionRef = useRef(onStartMission)
  useEffect(() => {
    onStartMissionRef.current = onStartMission
  }, [onStartMission])

  // Real-time synchronization across browser tabs
  useEffect(() => {
    const roomCode = mission?.roomCode
    if (!roomCode) return

    const unsubscribe = subscribeToRoom(roomCode, (updatedMission) => {
      if (!updatedMission) {
        setMission(null)
        setCurrentPlayer(null)
        setActiveModal('entry')
        setErrorMessage('The outpost session has been closed.')
        return
      }

      setMission(updatedMission)

      // Keep currentPlayer reference up-to-date without triggering re-render cascades
      const activeId = currentPlayerRef.current?.id
      if (activeId) {
        const refreshed = updatedMission.players.find((p) => p.id === activeId)
        if (refreshed) {
          setCurrentPlayer((prev) => {
            if (
              prev &&
              prev.id === refreshed.id &&
              prev.name === refreshed.name &&
              prev.role === refreshed.role &&
              prev.ready === refreshed.ready
            ) {
              return prev
            }
            try {
              sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(refreshed))
            } catch {
              // ignore
            }
            return refreshed
          })
        } else {
          setCurrentPlayer(null)
        }
      }

      // If host launched the mission, auto-transition all squad members
      if (updatedMission.status === MissionStatus.IN_PROGRESS && onStartMissionRef.current) {
        const activeMe = updatedMission.players.find((p) => p.id === activeId) || currentPlayerRef.current
        onStartMissionRef.current(updatedMission, activeMe)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [mission?.roomCode])

  // --- ACTIONS ---

  // Handle Create Lobby Submission
  const handleCreateLobby = useCallback(async (callsign, customRoomCode = null) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { mission: newMission, player: hostPlayer } = createMockRoom(callsign, customRoomCode)
      setMission(newMission)
      setCurrentPlayer(hostPlayer)
      try {
        sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(hostPlayer))
      } catch {
        // ignore
      }
      return { mission: newMission, player: hostPlayer }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to establish outpost room.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle Continue from Outpost Creation to Assemble Your Crew
  const handleContinueToAssemble = useCallback(() => {
    setActiveModal(null) // Enter Assemble Your Crew
  }, [])

  // Handle Join Lobby Submission
  const handleJoinLobby = useCallback(async (code, callsign) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const { mission: joinedMission, player: joinedPlayer } = joinMockRoom(code, callsign)
      setMission(joinedMission)
      setCurrentPlayer(joinedPlayer)
      try {
        sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(joinedPlayer))
      } catch {
        // ignore
      }
      setActiveModal(null) // Directly enter Assemble Your Crew
    } catch (err) {
      setErrorMessage(err.message || 'Failed to rendezvous with outpost squad.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle Specialist Role Selection Confirmation
  const handleConfirmRole = useCallback((roleKey) => {
    if (!mission || !currentPlayer) return
    try {
      const updated = selectPlayerRole(mission.roomCode, currentPlayer.id, roleKey)
      setMission(updated)
      const refreshedMe = updated.players.find((p) => p.id === currentPlayer.id)
      if (refreshedMe) {
        setCurrentPlayer(refreshedMe)
        try {
          sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(refreshedMe))
        } catch {
          // ignore
        }
      }
      setIsRoleSelectorOpen(false) // Close role selector, return to Assemble Your Crew
    } catch (err) {
      alert(err.message || 'Could not select role.')
    }
  }, [mission, currentPlayer])

  // Handle Ready Toggle
  const handleToggleReady = useCallback(() => {
    if (!mission || !currentPlayer) return
    try {
      const updated = togglePlayerReady(mission.roomCode, currentPlayer.id)
      setMission(updated)
      const refreshedMe = updated.players.find((p) => p.id === currentPlayer.id)
      if (refreshedMe) {
        setCurrentPlayer(refreshedMe)
        try {
          sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(refreshedMe))
        } catch {
          // ignore
        }
      }
    } catch (err) {
      alert(err.message || 'Cannot change readiness state.')
    }
  }, [mission, currentPlayer])

  // Handle Mission Launch
  const handleLaunchMission = useCallback(() => {
    if (!mission || !currentPlayer) return
    try {
      const launchedMission = startMission(mission.roomCode, currentPlayer.id)
      setMission(launchedMission)
      try {
        sessionStorage.setItem('mission_outpost_current_player', JSON.stringify(currentPlayer))
      } catch {
        // ignore
      }
      if (onStartMission) {
        onStartMission(launchedMission, currentPlayer)
      }
    } catch (err) {
      alert(err.message || 'Cannot launch mission.')
    }
  }, [mission, currentPlayer, onStartMission])

  // Handle Leaving Outpost
  const handleLeaveLobby = useCallback(() => {
    if (mission && currentPlayer) {
      leaveMockRoom(mission.roomCode, currentPlayer.id)
    }
    setMission(null)
    setCurrentPlayer(null)
    setActiveModal(null)
    if (onExitLobby) {
      onExitLobby()
    }
  }, [mission, currentPlayer, onExitLobby])

  // Demo AI Crew Helpers for single-player evaluation
  const handleAddDemoCrew = useCallback(() => {
    if (!mission) return
    try {
      const updated = addDemoCrewMember(mission.roomCode)
      setMission(updated)
    } catch (err) {
      alert(err.message || 'Cannot add simulated astronaut.')
    }
  }, [mission])

  const handleRemoveDemoCrew = useCallback((demoId) => {
    if (!mission) return
    try {
      const updated = removeDemoCrewMember(mission.roomCode, demoId)
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

      {/* 2. SEPARATE SCREEN 1: CREATE OUTPOST (matching Screenshot 1) */}
      {activeModal === 'create' && (
        <CreateOutpostScreen
          onCreateLobby={handleCreateLobby}
          onContinueToAssemble={handleContinueToAssemble}
          onBack={handleCloseEntryModal}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* 3. SEPARATE SCREEN 2: JOIN EXPEDITION (matching Screenshot 2) */}
      {activeModal === 'join' && !mission && (
        <JoinExpeditionScreen
          onJoinLobby={handleJoinLobby}
          onBack={handleCloseEntryModal}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* 4. MAIN ASSEMBLE YOUR CREW SCREEN */}
      {mission && currentPlayer && activeModal === null && (
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
