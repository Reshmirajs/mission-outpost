import { useState } from 'react'
import { generateRoomCode } from './mockLobbyService.js'
import './CreateJoinScreens.css'

/**
 * CreateOutpostScreen Component
 *
 * Implements Create Outpost screen:
 * - Room code appears immediately in the 6 character boxes when the screen opens
 * - The host can copy the code immediately
 * - Entering a callsign and clicking "Create Outpost" creates the lobby with that code
 *   and transitions straight into the squad assembly window
 * - Button text remains clean and consistent ("Create Outpost" / "Creating...")
 */
export default function CreateOutpostScreen({
  onCreateLobby,
  onContinueToAssemble,
  onBack,
  isLoading = false,
  errorMessage = '',
}) {
  const [roomCode] = useState(() => generateRoomCode())
  const [callsign, setCallsign] = useState('')
  const [validationError, setValidationError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreateOutpost = async (e) => {
    if (e) e.preventDefault()

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
    try {
      await onCreateLobby(clean, roomCode)
      // Navigate directly into squad window
      if (onContinueToAssemble) {
        onContinueToAssemble()
      }
    } catch {
      // errorMessage handled via prop
    }
  }

  const handleCopyCode = async () => {
    if (!roomCode) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = roomCode
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      console.warn('Failed to copy to clipboard', err)
    }
  }

  // Split the 6-character room code into an array of 6 characters
  const codeChars = Array.from({ length: 6 }, (_, i) => roomCode[i] || '')

  return (
    <div className="create-outpost-screen-wrapper">
      <div className="create-outpost-enclosed-panel" role="main" aria-label="Create Outpost Screen">
        {/* Top Left Back Button */}
        <div className="screen-nav-bar">
          <button
            type="button"
            className="btn-screen-back"
            onClick={onBack}
            title="Return to expedition choices"
          >
            &lt; Back
          </button>
        </div>

        <div className="create-outpost-content">
          {/* Left Column: Astronaut Name & Create Outpost */}
          <div className="create-outpost-form-col">
            <span className="screen-step-label">STEP 1 OF 2 &middot; BUILD</span>
            <h1 className="screen-heading">Name your astronaut</h1>

            <form onSubmit={handleCreateOutpost} className="create-form">
              <div className="callsign-input-group">
                <label htmlFor="create-callsign-input" className="field-label">
                  CALLSIGN
                </label>
                <input
                  id="create-callsign-input"
                  type="text"
                  className="callsign-input"
                  placeholder="e.g. Asha"
                  value={callsign}
                  onChange={(e) => {
                    setCallsign(e.target.value)
                    if (validationError) setValidationError('')
                  }}
                  maxLength={20}
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {(validationError || errorMessage) && (
                <div className="screen-error-pill" role="alert">
                  ⚠️ {validationError || errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="btn-create-outpost"
                disabled={isLoading}
              >
                <span className="lock-icon" aria-hidden="true">&#128274;</span>
                <span>{isLoading ? 'Creating...' : 'Create Outpost'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Outpost Code Display Card */}
          <div className="create-outpost-code-col">
            <div className="outpost-code-card">
              <span className="outpost-code-card-title">
                OUTPOST CODE, SHARE IT WITH YOUR CREW!
              </span>

              <div className="outpost-code-boxes-row" aria-label="Generated 6-character outpost code">
                {codeChars.map((char, index) => (
                  <div
                    key={index}
                    className={`code-char-box ${char ? 'has-char' : 'empty'}`}
                  >
                    {char || '·'}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`btn-copy-code-pill ${copied ? 'is-copied' : ''}`}
                onClick={handleCopyCode}
                disabled={!roomCode}
              >
                {copied ? '✓ Copied' : 'Copy code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
