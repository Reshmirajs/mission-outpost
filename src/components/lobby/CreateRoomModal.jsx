import { useState } from 'react'

/**
 * CreateRoomModal Component
 * Allows an astronaut to name their call sign and establish a new outpost mission room.
 */
export default function CreateRoomModal({
  onCreateRoom,
  onCancel,
  isLoading = false,
  errorMessage = '',
}) {
  const [playerName, setPlayerName] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const clean = playerName.trim()
    if (!clean) {
      setValidationError('Please enter your astronaut call sign or name!')
      return
    }
    if (clean.length < 2) {
      setValidationError('Astronaut name must be at least 2 characters.')
      return
    }
    if (clean.length > 20) {
      setValidationError('Astronaut name must be 20 characters or fewer.')
      return
    }

    setValidationError('')
    onCreateRoom(clean)
  }

  return (
    <div className="lobby-modal-backdrop" role="dialog" aria-modal="true">
      <div className="lobby-modal-card">
        <div className="modal-header">
          <div className="modal-icon-badge">🚀</div>
          <div>
            <h2 className="modal-title">Establish Outpost Mission</h2>
            <p className="modal-subtitle">
              Form a new expedition squad as the Outpost Expedition Lead (Host).
            </p>
          </div>
        </div>

        {/* Local Demo Mode Notice */}
        <div className="demo-notice-banner">
          <span className="notice-icon">📡</span>
          <div className="notice-content">
            <strong>Local Educational Simulation Mode:</strong>
            <p>
              Synchronized locally across browser windows. Full cloud sync with Firebase Realtime Database is being integrated in Step 5.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lobby-form">
          <div className="form-group">
            <label htmlFor="host-name-input" className="form-label">
              Astronaut Call Sign / Name
            </label>
            <input
              id="host-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Commander Sarah, Explorer Liam..."
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value)
                if (validationError) setValidationError('')
              }}
              maxLength={20}
              autoFocus
              disabled={isLoading}
            />
            <span className="input-hint">
              This name will be displayed to all astronauts joining your mission.
            </span>
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
              {isLoading ? 'Establishing...' : 'Create Outpost & Generate Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

