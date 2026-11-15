import { useState, useRef, useEffect } from 'react'
import './CreateJoinScreens.css'

/**
 * JoinExpeditionScreen Component
 *
 * Implements Screen 2 — Join Expedition matching reference screenshot 2:
 * - Small "< Back" button at top-left
 * - Progress label: "STEP 1 OF 2 · SCANNING THE MARS NETWORK"
 * - Main heading: "Find your crew" (centered)
 * - 6 individual character boxes with auto-focus, backspace, and paste support
 * - Dynamic status message pill: "No signal yet. Codes have 6 letters."
 * - CALLSIGN input field
 * - "Join crew" button (disabled dark state when incomplete, active orange when ready)
 * - Clear validation messages for invalid or incomplete codes
 */
export default function JoinExpeditionScreen({
  onJoinLobby,
  onBack,
  isLoading = false,
  errorMessage = '',
}) {
  const [codeBoxes, setCodeBoxes] = useState(['', '', '', '', '', ''])
  const [callsign, setCallsign] = useState('')
  const [validationError, setValidationError] = useState('')
  const inputRefs = useRef([])

  // Focus first code box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const fullCode = codeBoxes.join('').toUpperCase()
  const isCodeComplete = fullCode.length === 6
  const isFormValid = isCodeComplete && callsign.trim().length >= 2

  // Handle typing inside individual code boxes
  const handleBoxChange = (index, value) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')

    // Handle single character typed
    if (cleaned.length <= 1) {
      const nextBoxes = [...codeBoxes]
      nextBoxes[index] = cleaned
      setCodeBoxes(nextBoxes)
      if (validationError) setValidationError('')

      // Auto-focus next input box if a character was entered
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  // Handle backspace navigation between boxes
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!codeBoxes[index] && index > 0) {
        // Move back to previous box and clear it
        const nextBoxes = [...codeBoxes]
        nextBoxes[index - 1] = ''
        setCodeBoxes(nextBoxes)
        inputRefs.current[index - 1]?.focus()
      } else {
        const nextBoxes = [...codeBoxes]
        nextBoxes[index] = ''
        setCodeBoxes(nextBoxes)
      }
      if (validationError) setValidationError('')
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle pasting full 6-character code into any box
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (!pasted) return

    const nextBoxes = [...codeBoxes]
    for (let i = 0; i < 6; i++) {
      nextBoxes[i] = pasted[i] || ''
    }
    setCodeBoxes(nextBoxes)
    if (validationError) setValidationError('')

    // Focus the box following the pasted characters
    const targetIdx = Math.min(5, pasted.length)
    inputRefs.current[targetIdx]?.focus()
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (!isCodeComplete) {
      setValidationError('No signal yet. Codes have 6 letters.')
      return
    }
    const cleanName = callsign.trim()
    if (!cleanName) {
      setValidationError('Please enter your astronaut callsign.')
      return
    }
    if (cleanName.length < 2) {
      setValidationError('Callsign must be at least 2 characters.')
      return
    }
    if (cleanName.length > 20) {
      setValidationError('Callsign must be 20 characters or fewer.')
      return
    }

    setValidationError('')
    onJoinLobby(fullCode, cleanName)
  }

  // Determine which status pill to display below the 6 code boxes
  const getStatusMessage = () => {
    if (validationError) return { text: validationError, isError: true }
    if (errorMessage) return { text: errorMessage, isError: true }
    if (!isCodeComplete) return { text: 'No signal yet. Codes have 6 letters.', isError: true }
    return { text: 'Signal locked! Enter callsign to join.', isError: false }
  }

  const status = getStatusMessage()

  return (
    <div className="create-outpost-screen-wrapper">
      <div className="create-outpost-enclosed-panel" role="main" aria-label="Join Expedition Screen">
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

        <div className="join-expedition-content">
          {/* Step Indicator & Main Heading */}
          <div className="join-header-group">
            <span className="screen-step-label">
              STEP 1 OF 2 &middot; SCANNING THE MARS NETWORK
            </span>
            <h1 className="screen-heading centered">Find your crew</h1>
          </div>

          {/* 6 Individual Code Character Boxes */}
          <div className="join-code-boxes-container">
            <div className="join-code-boxes-row" onPaste={handlePaste} aria-label="Enter 6-character mission code">
              {codeBoxes.map((char, index) => {
                const isFirstEmpty = !char && (index === 0 || Boolean(codeBoxes[index - 1]))
                return (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    className={`join-char-input-box ${char ? 'has-char' : ''} ${isFirstEmpty ? 'is-target' : ''}`}
                    value={char}
                    onChange={(e) => handleBoxChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    aria-label={`Code character ${index + 1}`}
                    disabled={isLoading}
                  />
                )
              })}
            </div>

            {/* Status Message Pill */}
            {status && (
              <div
                className={`code-status-pill ${status.isError ? 'status-error' : 'status-success'}`}
                role="status"
              >
                {status.text}
              </div>
            )}
          </div>

          {/* Bottom Form Area: Callsign Input & Join Button */}
          <form onSubmit={handleSubmit} className="join-bottom-form-row">
            <div className="join-callsign-group">
              <label htmlFor="join-callsign-input" className="field-label">
                CALLSIGN
              </label>
              <input
                id="join-callsign-input"
                type="text"
                className="callsign-input join-callsign-field"
                placeholder="e.g. Kabir"
                value={callsign}
                onChange={(e) => {
                  setCallsign(e.target.value)
                  if (validationError) setValidationError('')
                }}
                maxLength={20}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={`btn-join-crew ${isFormValid && !isLoading ? 'is-ready' : 'is-disabled'}`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Connecting...' : 'Join crew'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

