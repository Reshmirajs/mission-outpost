import { useState } from 'react'

/**
 * JoinRoomModal Component
 * Allows an astronaut to enter a 6-character outpost code and their call sign to rendezvous with a crew.
 */
export default function JoinRoomModal({
  onJoinRoom,
  onCancel,
  isLoading = false,
  errorMessage = '',
}) {
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleCodeChange = (e) => {
    // Force uppercase and remove whitespace / non-alphanumeric chars
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setRoomCode(cleaned)
    if (validationError) setValidationError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanCode = roomCode.trim().toUpperCase()
    const cleanName = playerName.trim()

    if (!cleanCode) {
      setValidationError('Please enter the 6-character outpost access code.')
      return
    }
    if (cleanCode.length !== 6) {
      setValidationError(`Outpost codes are exactly 6 characters. (You entered ${cleanCode.length})`)
      return
    }
    if (!cleanName) {
      setValidationError('Please enter your astronaut call sign or name!')
      return
    }
    if (cleanName.length < 2) {
      setValidationError('Astronaut name must be at least 2 characters.')
      return
    }
    if (cleanName.length > 20) {
      setValidationError('Astronaut name must be 20 characters or fewer.')
      return
    }

    setValidationError('')
    onJoinRoom(cleanCode, cleanName)
  }

  return (
    <div className="lobby-modal-backdrop" role="dialog" aria-modal="true">
      <div className="lobby-modal-card">
        <div className="modal-header">
          <div className="modal-icon-badge">📡</div>
          <div>
            <h2 className="modal-title">Join Outpost Mission</h2>
            <p className="modal-subtitle">
              Enter your crew's 6-character code to rendezvous with the Martian squad.
            </p>
          </div>
        </div>

        {/* Local Demo Mode Notice */}
        <div className="demo-notice-banner">
          <span className="notice-icon">ℹ️</span>
          <div className="notice-content">
            <strong>Local Educational Simulation Mode:</strong>
            <p>
              Join a room created in another tab or window on this machine. Full cloud sync will be powered by Firebase Realtime Database in Step 5.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lobby-form">
          <div className="form-group">
            <label htmlFor="join-code-input" className="form-label">
              6-Character Outpost Code
            </label>
            <input
              id="join-code-input"
              type="text"
              className="form-input code-input font-mono"
              placeholder="e.g. 7X9K2M"
              value={roomCode}
              onChange={handleCodeChange}
              maxLength={6}
              autoFocus
              disabled={isLoading}
            />
            <span className="input-hint">
              Ask your Expedition Lead for the 6-character room access code.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="join-name-input" className="form-label">
              Your Astronaut Call Sign / Name
            </label>
            <input
              id="join-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Engineer Alex, Specialist Maya..."
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value)
                if (validationError) setValidationError('')
              }}
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          {(validationError || errorMessage) && (
            <div className="form-error-callout" role="alert">
              ⚠️ {validationError || errorMessage}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Rendezvous With Crew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

