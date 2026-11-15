import React, { useState } from 'react';
import { EventModal } from './EventModal.jsx';
import { VotingPanel } from './VotingPanel.jsx';
import { EventResolution } from './EventResolution.jsx';
import { mockCrewMembers } from './mockEventsData.js';
import './Events.css';

/**
 * InGameEventManager
 *
 * Lightweight embedded event interface designed to live inside MarsGameView
 * alongside the Phaser canvas and GameHud — without replacing or duplicating
 * the standalone Events Chamber (EventsContainer).
 *
 * Rendering behaviour by severity:
 *   - No active event  → renders nothing (null).
 *   - 'warning'        → compact dismissible toast-banner anchored at the
 *                        top of the game view. The player can expand it into
 *                        a full voting overlay on demand.
 *   - 'critical' /
 *     'emergency'      → immediately opens the existing EventModal overlay
 *                        (which already has severity-pulsing borders) with
 *                        VotingPanel or EventResolution embedded via the
 *                        modal's children slot.
 *
 * All voting and resolution logic is delegated to the unmodified functions
 * in votingUtils.js.  Resource delta callbacks flow back to the caller
 * (MarsGameView → App.jsx → handleApplyResourceDelta) unchanged.
 *
 * NOT yet wired to:
 *   - Scheduled / random event triggers.
 *   - Multiplayer synchronisation.
 *   - NASA DONKI space-weather data.
 * Those integrations will be added in later phases.
 *
 * @param {Object}   props
 * @param {Object}   [props.event]                - Active event from EVENTS_CATALOG. null = no active event.
 * @param {Object}   [props.scenario]             - Current voting scenario (created externally by caller).
 * @param {Array}    [props.players]              - Crew members; defaults to mockCrewMembers.
 * @param {string}   [props.activePlayerId]       - ID of the crew member operating this terminal.
 * @param {Object}   [props.resources]            - Live habitat resources for preview.
 * @param {Object}   [props.mission]              - Mission state { round, status, roomCode }.
 * @param {Function} [props.onVote]               - Called with updated scenario after a ballot is cast.
 * @param {Function} [props.onResolve]            - Called with resolved scenario when voting ends.
 * @param {Function} [props.onAcknowledge]        - Called with appliedDelta when outcome is ingested.
 * @param {Function} [props.onApplyResourceDelta] - Alternative callback name for appliedDelta ingestion (preferred: onAcknowledge).
 * @param {Function} [props.onDismiss]            - Called when the player dismisses the warning toast.
 */
export function InGameEventManager({
  event = null,
  scenario = null,
  players = mockCrewMembers,
  activePlayerId = null,
  resources = null,
  mission = null,
  onVote,
  onResolve,
  onAcknowledge,
  onApplyResourceDelta,
  onDismiss,
}) {
  // Whether the warning toast has been expanded into the full voting overlay
  const [warningExpanded, setWarningExpanded] = useState(false);
  const currentEventId = event?.id ?? null;
  const [prevEventId, setPrevEventId] = useState(currentEventId);

  // Reset warning expansion when active event changes to a different event ID
  if (currentEventId !== prevEventId) {
    setPrevEventId(currentEventId);
    setWarningExpanded(false);
  }

  const safePlayers = Array.isArray(players) && players.length > 0 ? players : mockCrewMembers;
  const resolvedActivePlayerId = activePlayerId || safePlayers[0]?.id || 'p1';

  // Nothing to render when there is no active event
  if (!event) return null;

  const severity = String(event.severity || 'warning').toLowerCase();
  const isResolved = scenario?.status === 'resolved';

  // -----------------------------------------------------------------
  // Shared: vote handler — delegates to caller
  // -----------------------------------------------------------------
  const handleVote = (updatedScenario) => {
    if (typeof onVote === 'function') onVote(updatedScenario);
  };

  // -----------------------------------------------------------------
  // Shared: resolve handler — force-resolve if needed, then delegate
  // -----------------------------------------------------------------
  const handleResolve = (resolvedScenario) => {
    if (typeof onResolve === 'function') onResolve(resolvedScenario);
  };

  // -----------------------------------------------------------------
  // Shared: acknowledge / ingest delta — delegates to caller
  // Supports both onAcknowledge and onApplyResourceDelta (prefers onAcknowledge)
  // -----------------------------------------------------------------
  const handleAcknowledge = (appliedDelta) => {
    const callback = typeof onAcknowledge === 'function' ? onAcknowledge : onApplyResourceDelta;
    if (typeof callback === 'function') {
      callback(appliedDelta);
    }
  };

  // -----------------------------------------------------------------
  // Shared: inner content — VotingPanel or EventResolution
  // This is embedded inside either the toast expansion or the modal.
  // -----------------------------------------------------------------
  const innerContent = isResolved ? (
    <EventResolution
      scenario={scenario}
      currentResources={resources}
      onAcknowledge={handleAcknowledge}
      confirmLabel="Acknowledge & Ingest Telemetry"
    />
  ) : (
    <VotingPanel
      scenario={scenario}
      players={safePlayers}
      activePlayerId={resolvedActivePlayerId}
      onVote={handleVote}
      onResolve={handleResolve}
      allowChangeVote={false}
      showTimer={true}
      rule="plurality"
    />
  );

  // =================================================================
  // CASE 1: WARNING severity → compact dismissible toast banner
  // =================================================================
  if (severity === 'warning') {
    // Collapsed toast — small strip at the top of the game view
    if (!warningExpanded) {
      return (
        <div
          className="ingame-event-toast severity-warning"
          role="alert"
          aria-live="polite"
        >
          <div className="ingame-toast-left">
            <span className="ingame-toast-icon" aria-hidden="true">
              {event.icon || '⚠️'}
            </span>
            <div className="ingame-toast-text">
              <span className="ingame-toast-category">{event.category}</span>
              <span className="ingame-toast-title">{event.title}</span>
            </div>
            <span className="ingame-toast-severity-pill">WARNING</span>
          </div>

          <div className="ingame-toast-actions">
            <button
              type="button"
              className="btn-mars-secondary ingame-toast-btn"
              onClick={() => setWarningExpanded(true)}
            >
              🗳️ Deliberate
            </button>
            {typeof onDismiss === 'function' && (
              <button
                type="button"
                className="btn-mars-secondary ingame-toast-btn"
                onClick={onDismiss}
                aria-label="Dismiss warning notification"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      );
    }

    // Expanded toast — renders the full voting/resolution UI inside the modal
    return (
      <EventModal
        event={event}
        isOpen={true}
        onClose={() => setWarningExpanded(false)}
        selectedOptionId=""
      >
        {innerContent}
      </EventModal>
    );
  }

  // =================================================================
  // CASE 2: CRITICAL or EMERGENCY severity → immediate full overlay
  // Uses the existing EventModal with severity-pulsing borders.
  // =================================================================
  return (
    <EventModal
      event={event}
      isOpen={true}
      onClose={typeof onDismiss === 'function' ? onDismiss : undefined}
      selectedOptionId=""
    >
      {innerContent}
    </EventModal>
  );
}

export default InGameEventManager;
