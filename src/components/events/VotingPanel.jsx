import React, { useState } from 'react';
import {
  castVote,
  getVoteBreakdown,
  findCommander,
  hasAllCrewVoted,
  hasVotingExpired,
  resolveEvent,
} from './votingUtils.js';
import './Events.css';

/**
 * Returns role badge styling and icon for a given astronaut role.
 *
 * @param {string} role
 * @returns {{ icon: string, label: string, colorClass: string }}
 */
function getRoleBadgeMeta(role) {
  const r = String(role || '').toLowerCase();
  if (r.includes('commander')) {
    return { icon: '⭐', label: 'Commander', colorClass: 'role-commander' };
  }
  if (r.includes('engineer')) {
    return { icon: '⚡', label: 'Engineer', colorClass: 'role-engineer' };
  }
  if (r.includes('botanist')) {
    return { icon: '🌱', label: 'Botanist', colorClass: 'role-botanist' };
  }
  if (r.includes('medic') || r.includes('life support')) {
    return { icon: '🫧', label: 'Medic', colorClass: 'role-medic' };
  }
  if (r.includes('scientist')) {
    return { icon: '🔬', label: 'Scientist', colorClass: 'role-scientist' };
  }
  return { icon: '🧑‍🚀', label: role || 'Crew', colorClass: 'role-unassigned' };
}

/**
 * Formats a resource delta for display.
 *
 * @param {'oxygen'|'power'|'food'|'radiation'} key
 * @param {number} value
 */
function formatDeltaChip(key, value) {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const isRadiation = key === 'radiation';

  let icon = '📊';
  let label = 'Res';
  if (key === 'oxygen') { icon = '🫧'; label = 'O2'; }
  else if (key === 'power') { icon = '⚡'; label = 'Pwr'; }
  else if (key === 'food') { icon = '🌱'; label = 'Food'; }
  else if (key === 'radiation') { icon = '☢️'; label = 'Rad'; }

  if (num === 0) {
    return { text: '0%', statusClass: 'delta-neutral', icon, label };
  }

  const sign = num > 0 ? `+${num}%` : `${num}%`;
  const isPositive = isRadiation ? num < 0 : num > 0;

  return {
    text: sign,
    statusClass: isPositive ? 'delta-positive' : 'delta-negative',
    icon,
    label,
  };
}

/**
 * Formats seconds into MM:SS format.
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * VotingPanel Component
 *
 * Collaborative multiplayer decision chamber for MISSION: OUTPOST.
 * Displays all crisis options, live vote breakdown bars, crew member ballot status,
 * countdown timers, tie-breaker alerts, and handles ballot casting via castVote().
 *
 * @param {Object} props
 * @param {Object} [props.scenario] - Active voting scenario object.
 * @param {Array<Object>} [props.players=[]] - Connected crew members manifest.
 * @param {string} [props.activePlayerId] - ID of the local player casting a ballot.
 * @param {Function} [props.onVote] - Callback fired when a ballot is cast: (updatedScenario, ballot) => void.
 * @param {Function} [props.onResolve] - Callback fired when the event is resolved: (resolvedScenario) => void.
 * @param {boolean} [props.allowChangeVote=false] - Whether players can modify an existing ballot.
 * @param {boolean} [props.showTimer=true] - Whether to display the countdown timer.
 * @param {'plurality'|'strict_majority'|'majority'} [props.rule='plurality'] - Voting decision rule.
 */
export function VotingPanel({
  scenario = null,
  players = [],
  activePlayerId = '',
  onVote,
  onResolve,
  allowChangeVote = false,
  showTimer = true,
  rule = 'plurality',
}) {
  const ballots = scenario?.ballots || {};
  const existingVote = activePlayerId ? ballots[activePlayerId] : undefined;

  // Track the previous external vote to synchronize state when it changes
  const [prevExistingVote, setPrevExistingVote] = useState(existingVote);
  const [userSelectedOptionId, setUserSelectedOptionId] = useState(existingVote || '');
  const [feedbackError, setFeedbackError] = useState('');

  // Synchronize selection if existing vote changes externally without calling setState in an effect
  if (existingVote !== prevExistingVote) {
    setPrevExistingVote(existingVote);
    if (existingVote) {
      setUserSelectedOptionId(existingVote);
    }
  }

  const selectedOptionId = userSelectedOptionId;
  const setSelectedOptionId = setUserSelectedOptionId;

  if (!scenario || !scenario.event) {
    return (
      <div className="voting-panel-container">
        <p className="briefing-description-text">No active voting scenario initialized.</p>
      </div>
    );
  }

  const event = scenario.event;
  const options = Array.isArray(event.options) ? event.options : [];
  const safePlayers = Array.isArray(players) ? players : [];

  // Voting Analytics
  const breakdown = getVoteBreakdown(scenario, safePlayers);
  const isResolved = scenario.status === 'resolved';
  const hasVoted = existingVote !== undefined;
  const canCast = !hasVoted || allowChangeVote;

  // Status checks
  const allCrewVoted = hasAllCrewVoted(scenario, safePlayers);
  const expired = hasVotingExpired(scenario);
  const canResolve = (allCrewVoted || expired) && !isResolved;

  // Commander Info
  const commander = findCommander(safePlayers);
  const commanderVoted = commander ? ballots[commander.id] : null;

  // Local active astronaut
  const activeAstronaut = safePlayers.find((p) => p.id === activePlayerId) || {
    id: activePlayerId,
    name: 'Active Astronaut',
    role: 'Crew',
  };

  /**
   * Handles casting a vote.
   */
  const handleCastVote = () => {
    if (!selectedOptionId) {
      setFeedbackError('Please select a strategic protocol before casting your ballot.');
      return;
    }
    if (!activePlayerId) {
      setFeedbackError('No active astronaut ID specified.');
      return;
    }

    setFeedbackError('');
    const result = castVote(scenario, activePlayerId, selectedOptionId, safePlayers, {
      allowChangeVote,
    });

    if (result.success) {
      if (typeof onVote === 'function') {
        onVote(result.scenario, { playerId: activePlayerId, optionId: selectedOptionId });
      }
    } else {
      setFeedbackError(result.error || 'Failed to submit ballot.');
    }
  };

  /**
   * Handles resolving the event when voting criteria are satisfied.
   */
  const handleResolveEvent = () => {
    const result = resolveEvent(scenario, safePlayers, { rule });
    if (result.success && typeof onResolve === 'function') {
      onResolve(result.scenario);
    } else if (!result.success) {
      setFeedbackError(result.error || 'Cannot resolve event at this time.');
    }
  };

  const timeRemaining = scenario.timeRemainingSeconds ?? 0;
  const isUrgentTimer = timeRemaining <= 10 && timeRemaining > 0;

  return (
    <div className="voting-panel-container" role="region" aria-label="Team Voting Chamber">
      {/* Panel Header */}
      <div className="voting-panel-header">
        <div className="voting-header-title">
          <span className="modal-event-icon-badge" aria-hidden="true">🗳️</span>
          <div>
            <h3>Outpost Council // Voting Chamber</h3>
            <span className="modal-event-category">{event.title}</span>
          </div>
        </div>

        <div className="dashboard-header-badges">
          <span className={`voting-status-tag ${isResolved ? 'status-voting-resolved' : 'status-voting-active'}`}>
            {isResolved ? 'DECISION RESOLVED' : 'DELIBERATION ACTIVE'}
          </span>

          {/* Countdown Timer */}
          {showTimer && typeof scenario.timeRemainingSeconds === 'number' && !isResolved && (
            <div className="voting-countdown-widget" aria-label="Voting time remaining">
              <span className="countdown-icon" aria-hidden="true">⏳</span>
              <span className={`countdown-timer-value ${isUrgentTimer ? 'timer-urgent' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Deadlock / Commander Tie-Breaker Alert */}
      {breakdown.isTie && !isResolved && (
        <div className="commander-tie-alert" role="status">
          <span className="tie-alert-icon" aria-hidden="true">⭐</span>
          <p className="tie-alert-text">
            <strong>Vote Deadlock Detected:</strong> Equal votes among top protocols.
            {commander ? (
              <span>
                {' '}Mission Commander <strong>{commander.name}</strong> holds tie-breaker authority
                {commanderVoted ? ' (Ballot cast).' : ' (Awaiting Commander ballot).'}
              </span>
            ) : (
              <span> Conservative emergency risk fallback will take precedence.</span>
            )}
          </p>
        </div>
      )}

      {/* Options & Ballots Grid */}
      <div className="event-options-grid" role="radiogroup" aria-label="Voting protocol options">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const voteCount = breakdown.counts[option.id] || 0;
          const votePercent = breakdown.percentages[option.id] || 0;
          const voters = breakdown.votersByOption[option.id] || [];
          const roleMeta = getRoleBadgeMeta(option.recommendedRole);
          const delta = option.delta || {};

          return (
            <div
              key={option.id}
              className={`event-option-card ${isSelected ? 'is-selected' : ''}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => {
                if (canCast) {
                  setSelectedOptionId(option.id);
                  setFeedbackError('');
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && canCast) {
                  e.preventDefault();
                  setSelectedOptionId(option.id);
                  setFeedbackError('');
                }
              }}
            >
              <div className="option-card-header">
                <h4 className="option-title-text">{option.title}</h4>
                <div className="option-radio-indicator" aria-hidden="true">
                  {isSelected && <div className="option-radio-dot" />}
                </div>
              </div>

              <p className="option-description-text">{option.description}</p>

              {/* Resource Deltas */}
              <div className="option-deltas-row" aria-label="Option resource impact">
                {['oxygen', 'power', 'food', 'radiation'].map((resKey) => {
                  const dInfo = formatDeltaChip(resKey, delta[resKey]);
                  return (
                    <span
                      key={resKey}
                      className={`resource-delta-chip ${dInfo.statusClass}`}
                      title={`${dInfo.label}: ${dInfo.text}`}
                    >
                      <span>{dInfo.icon}</span>
                      <span>{dInfo.label}</span>
                      <span>{dInfo.text}</span>
                    </span>
                  );
                })}
              </div>

              {/* Recommended Role */}
              {option.recommendedRole && (
                <div className="option-role-box">
                  <div className="role-tag-row">
                    <span aria-hidden="true">{roleMeta.icon}</span>
                    <span className={`role-badge-pill ${roleMeta.colorClass}`}>
                      Lead: {roleMeta.label}
                    </span>
                  </div>
                  {option.rationale && (
                    <p className="role-rationale-text">{option.rationale}</p>
                  )}
                </div>
              )}

              {/* Vote Tally & Percentage Meter */}
              <div className="option-tally-bar-container" aria-label={`Vote count: ${voteCount} (${votePercent}%)`}>
                <div className="option-tally-label-row">
                  <span>{voteCount} {voteCount === 1 ? 'Vote' : 'Votes'}</span>
                  <span>{votePercent}%</span>
                </div>
                <div className="tally-track">
                  <div className="tally-fill" style={{ width: `${votePercent}%` }} />
                </div>
              </div>

              {/* Voter Chips */}
              {voters.length > 0 && (
                <div className="crew-ballots-section" style={{ marginTop: '0.25rem' }}>
                  <div className="voter-avatars-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {voters.map((voter) => (
                      <span
                        key={voter.id}
                        className="role-badge-pill"
                        style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.06)' }}
                        title={`${voter.name} (${voter.role})`}
                      >
                        {voter.avatar || '🧑‍🚀'} {voter.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Crew Ballots Status Manifest */}
      <section className="crew-ballots-section" aria-label="Crew Ballot Manifest">
        <div className="options-section-label">
          <span>Crew Ballot Verification</span>
          <span className="options-count-badge">
            {breakdown.totalVotes} / {safePlayers.length} Ballots Ingested
          </span>
        </div>

        <div className="crew-ballots-grid">
          {safePlayers.map((player) => {
            const hasBallot = ballots[player.id] !== undefined;
            const rMeta = getRoleBadgeMeta(player.role);

            return (
              <div
                key={player.id}
                className={`crew-ballot-chip ${hasBallot ? 'voted' : 'pending'}`}
              >
                <span className="crew-ballot-avatar" aria-hidden="true">
                  {player.avatar || rMeta.icon}
                </span>
                <div className="crew-ballot-details">
                  <span className="crew-ballot-name" title={player.name}>
                    {player.name}
                  </span>
                  <span className={`crew-ballot-status ${hasBallot ? 'status-voted' : 'status-pending'}`}>
                    {hasBallot ? '✓ BALLOT CAST' : '⏳ PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Inline Feedback / Error */}
      {feedbackError && (
        <div className="commander-tie-alert" style={{ borderColor: 'rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.12)' }}>
          <span className="tie-alert-icon" aria-hidden="true">⚠️</span>
          <p className="tie-alert-text" style={{ color: '#fca5a5' }}>{feedbackError}</p>
        </div>
      )}

      {/* Voting Actions Bar */}
      <footer className="voting-actions-bar">
        <div className="active-voter-indicator">
          <span>Astronaut In Station:</span>
          <span className="active-voter-name">
            {activeAstronaut.name} ({activeAstronaut.role})
          </span>
        </div>

        <div className="voting-buttons-group">
          {canCast && !isResolved && (
            <button
              type="button"
              className="btn-mars-primary"
              disabled={!selectedOptionId}
              onClick={handleCastVote}
            >
              {hasVoted ? 'Change Ballot' : 'Cast Official Ballot'}
            </button>
          )}

          {/* Resolve Decision button when voting is complete or expired */}
          {canResolve && typeof onResolve === 'function' && (
            <button
              type="button"
              className="btn-mars-secondary"
              style={{ borderColor: 'var(--status-green)', color: '#34d399' }}
              onClick={handleResolveEvent}
            >
              Finalize Decision &rarr;
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default VotingPanel;
