import { useState } from 'react'

/**
 * CreateLobbyModal Component
 * Collects host astronaut callsign and initiates room creation.
 */
export default function CreateLobbyModal({
  onCreateLobby,
  onBack,
  onClose,
  isLoading = false,
  errorMessage = '',
}) {
  const [callsign, setCallsign] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const clean = callsign.trim()
    if (!clean) {
      setValidationError('Please enter your astronaut callsign.')
      return
    }
    if (clean.length < 2) {
      setValidationError('Callsign must be at least 2 characters.')
      return
    }
    if (clean.length > 20) {
      setValidationError('Callsign must be 20 characters or fewer.')
      return
    }

    setValidationError('')
    onCreateLobby(clean)
  }

  return (
    <div className="lobby-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-lobby-title">
      <div className="lobby-form-modal-card">
        <button
          type="button"
          className="btn-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="form-modal-header">
          <div className="form-header-badge">
            <span className="badge-icon">🚀</span>
            <span>EXPEDITION LEAD SETUP</span>
          </div>
          <h2 id="create-lobby-title" className="form-modal-title">
            ESTABLISH NEW OUTPOST
          </h2>
          <p className="form-modal-subtitle">
            Enter your astronaut callsign to initialize the habitat life-support hub and receive your mission access code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="lobby-form">
          <div className="form-group">
            <label htmlFor="host-callsign-input" className="form-label">
              Astronaut Callsign / Name
            </label>
            <input
              id="host-callsign-input"
              type="text"
              className="form-input"
              placeholder="e.g. Commander Sarah, Astro Vance..."
              value={callsign}
              onChange={(e) => {
                setCallsign(e.target.value)
                if (validationError) setValidationError('')
              }}
              maxLength={20}
              autoFocus
              disabled={isLoading}
            />
            <span className="input-hint">
              This name will identify you as the Expedition Lead in the squad roster.
            </span>
          </div>

          {(validationError || errorMessage) && (
            <div className="form-error-callout" role="alert">
              ⚠️ {validationError || errorMessage}
            </div>
          )}

          <div className="form-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onBack}
              disabled={isLoading}
            >
              ← Back
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

