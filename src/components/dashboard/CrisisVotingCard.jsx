import { useState, useMemo } from 'react'
import { countVotes, castVote } from '../events/votingUtils.js'
import { EVENTS_CATALOG } from '../events/eventsCatalog.js'
import './CrisisVotingCard.css'

/**
 * CrisisVotingCard Component
 *
 * Implements the "ACTIVE CRISIS — VOTE NOW" panel for the Mission Dashboard.
 * Reuses the existing voting system and events catalog.
 * Displays:
 * - Crisis title and tactical description
 * - Decision options with radio selection
 * - Real-time voting progress bar & submitted vote count
 * - Submit Vote button with clear visual selection
 * - Compact empty state when no crisis is active
 */
export default function CrisisVotingCard({
  activeCrisis = null,
  players = [],
  currentPlayer = null,
  onVote = null,
}) {
  const [scenario, setScenario] = useState(() => {
    return activeCrisis || {
      id: 'scen-dashboard-active',
      status: 'voting',
      event: EVENTS_CATALOG[0],
      ballots: {},
      createdAt: 0,
    }
  })
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [hasVoted, setHasVoted] = useState(false)

  // Sync if activeCrisis prop changes
  const activeScenario = activeCrisis || scenario

  const totalCrew = Math.max(1, (Array.isArray(players) && players.length > 0) ? players.length : 5)
  const currentUserId = currentPlayer?.id || 'local_user'

  const voteCounts = useMemo(() => {
    return countVotes(activeScenario, players)
  }, [activeScenario, players])

  const totalVotesCast = Object.values(voteCounts).reduce((acc, c) => acc + c, 0)
  const votePercentage = Math.min(100, Math.round((totalVotesCast / totalCrew) * 100))

  const handleSelectOption = (optId) => {
    setSelectedOptionId(optId)
  }

  const handleSubmitVote = (e) => {
    if (e) e.preventDefault()
    if (!selectedOptionId) return

    const result = castVote(activeScenario, currentUserId, selectedOptionId, true, players)
    if (result.success) {
      setScenario(result.scenario)
      setHasVoted(true)
      if (onVote) {
        onVote(result.scenario, { playerId: currentUserId, optionId: selectedOptionId })
      }
    }
  }

  // If no crisis is active at all (null event)
  if (!activeScenario || !activeScenario.event) {
    return (
      <div className="crisis-voting-card empty-crisis">
        <div className="crisis-card-header">
          <span className="crisis-status-dot dot-nominal" aria-hidden="true" />
          <h3 className="crisis-panel-title">ACTIVE CRISIS — VOTE NOW</h3>
        </div>
        <div className="empty-crisis-body">
          <span className="empty-shield-icon" aria-hidden="true">🛡️</span>
          <p className="empty-crisis-text">ALL SYSTEMS NOMINAL</p>
          <span className="empty-crisis-subtext">
            No active hazard or emergency voting in progress. Life support telemetry is stable.
          </span>
        </div>
      </div>
    )
  }

  const event = activeScenario.event
  const options = event.options || []

  return (
    <div className="crisis-voting-card is-active-crisis">
      {/* Header */}
      <div className="crisis-card-header">
        <div className="crisis-title-left">
          <span className="crisis-status-dot dot-alert" aria-hidden="true" />
          <h3 className="crisis-panel-title">ACTIVE CRISIS — VOTE NOW</h3>
        </div>
        <span className="crisis-severity-badge">
          {event.severity ? event.severity.toUpperCase() : 'ALERT'}
        </span>
      </div>

      <div className="crisis-card-content">
        {/* Crisis Briefing */}
        <div className="crisis-brief-box">
          <h4 className="crisis-headline">{event.title}</h4>
          <p className="crisis-explanation">
            {event.description}
          </p>
        </div>

        {/* Voting Progress Strip */}
        <div className="crisis-voting-progress-row">
          <div className="progress-info-text">
            <span>VOTING PROGRESS: <strong>{totalVotesCast} / {totalCrew} VOTES</strong></span>
            <span className="voting-pct-text">{votePercentage}%</span>
          </div>
          <div className="crisis-progress-track" role="progressbar" aria-valuenow={votePercentage} aria-valuemin={0} aria-valuemax={100}>
            <div className="crisis-progress-fill" style={{ width: `${votePercentage}%` }} />
          </div>
        </div>

        {/* Decision Options (Radio Style) */}
        <form onSubmit={handleSubmitVote} className="crisis-options-list">
          {options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx)
            const isSelected = selectedOptionId === opt.id
            const count = voteCounts[opt.id] || 0

            return (
              <label
                key={opt.id}
                className={`crisis-option-label ${isSelected ? 'is-selected' : ''}`}
                htmlFor={`opt-${opt.id}`}
              >
                <div className="option-radio-col">
                  <input
                    type="radio"
                    id={`opt-${opt.id}`}
                    name="crisis_option"
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => handleSelectOption(opt.id)}
                  />
                  <span className="custom-radio-mark" aria-hidden="true" />
                </div>

                <div className="option-details-col">
                  <div className="option-title-line">
                    <span className="option-letter">{letter}.</span>
                    <span className="option-title-text">{opt.title}</span>
                  </div>
                  {opt.description && (
                    <p className="option-desc-text">{opt.description}</p>
                  )}
                  {count > 0 && (
                    <span className="option-tally-pill">
                      {count} {count === 1 ? 'vote' : 'votes'}
                    </span>
                  )}
                </div>
              </label>
            )
          })}

          {/* Action Row */}
          <div className="crisis-actions-footer">
            <button
              type="submit"
              className={`btn-submit-vote ${hasVoted ? 'has-voted' : ''}`}
              disabled={!selectedOptionId}
            >
              {hasVoted ? '✓ Vote Registered · Change' : 'Submit Vote'}
            </button>
            <span className="voting-status-indicator">
              {totalVotesCast >= totalCrew ? 'All ballots submitted' : 'Awaiting crew consensus'}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
