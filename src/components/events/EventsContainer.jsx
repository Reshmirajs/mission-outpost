import React, { useState } from 'react';
import { EVENTS_CATALOG, getEventById } from './eventsCatalog.js';
import { mockVotingScenarios, mockCrewMembers } from './mockEventsData.js';
import { resolveEvent } from './votingUtils.js';
import { EventModal } from './EventModal.jsx';
import { VotingPanel } from './VotingPanel.jsx';
import { EventResolution } from './EventResolution.jsx';
import { submitVote } from '../../services/multiplayer/index.js';
import './Events.css';

/**
 * Creates a fresh active voting scenario for a selected event.
 *
 * @param {Object} event
 * @returns {Object}
 */
function createScenarioFromEvent(event) {
  return {
    id: `scenario-${event.id}-${Date.now()}`,
    label: event.title,
    event,
    status: 'voting',
    timeRemainingSeconds: 50,
    totalSeconds: 60,
    ballots: {},
    resolvedOptionId: null,
    tieBrokenBy: null,
  };
}

/**
 * EventsContainer Component
 *
 * Top-level container managing the complete Martian Crisis & Team Decision lifecycle:
 * - 12-event catalog incident selector.
 * - Quick-load preset scenarios (Tie-breaker deadlock, emergency pressure drop, deliberation).
 * - 5-astronaut crew station switcher for simulated multiplayer deliberation.
 * - Interactive VotingPanel with live tally bars and countdown timer.
 * - EventModal emergency dispatch overlay.
 * - EventResolution showing winning protocols and resource impacts.
 * - Applies resource changes through onApplyResourceDelta.
 *
 * @param {Object} props
 * @param {Object} [props.resources] - Active habitat resources { oxygen, power, food, radiation }.
 * @param {Object} [props.mission] - Active mission state { round, status, roomCode }.
 * @param {Array<Object>} [props.players] - Active crew list (defaults to mockCrewMembers).
 * @param {Function} [props.onApplyResourceDelta] - Callback fired to apply delta: (delta) => void.
 */
export function EventsContainer({
  resources = { oxygen: 78, power: 64, food: 85, radiation: 28 },
  mission = { round: 12, targetSols: 30, status: 'in_progress', roomCode: 'OUTP-7' },
  players = mockCrewMembers,
  currentPlayerId = null,
  onApplyResourceDelta,
}) {
  const safePlayers = Array.isArray(players) && players.length > 0 ? players : mockCrewMembers;

  // Active scenario state (defaults to the rich inProgress scenario)
  const [currentScenario, setCurrentScenario] = useState(mockVotingScenarios.inProgress);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [prevCurrentPlayerId, setPrevCurrentPlayerId] = useState(currentPlayerId);
  const [activeView, setActiveView] = useState('voting'); // 'voting' | 'resolution'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState('evt-solar-particle');
  const [activePresetKey, setActivePresetKey] = useState('inProgress');
  const [ingestNotice, setIngestNotice] = useState(null);

  // Synchronize player selection when currentPlayerId changes externally
  if (currentPlayerId !== prevCurrentPlayerId) {
    setPrevCurrentPlayerId(currentPlayerId);
    if (currentPlayerId && safePlayers.some((p) => p.id === currentPlayerId)) {
      setSelectedPlayerId(currentPlayerId);
    }
  }

  const activePlayerId = selectedPlayerId || (currentPlayerId && safePlayers.some((p) => p.id === currentPlayerId) ? currentPlayerId : safePlayers[0]?.id || 'p1');
  const setActivePlayerId = setSelectedPlayerId;

  // Derive composite scenario including remote Firebase votes
  let displayScenario = currentScenario;
  const scenarioVoteId = currentScenario?.id;
  if (mission?.roomCode && scenarioVoteId && mission?.votes?.[scenarioVoteId]) {
    const remoteVotesForScenario = mission.votes[scenarioVoteId];
    if (remoteVotesForScenario && typeof remoteVotesForScenario === 'object') {
      const remoteBallots = {};
      for (const [pId, voteObj] of Object.entries(remoteVotesForScenario)) {
        if (voteObj) {
          remoteBallots[pId] = voteObj.optionId || voteObj.choice || voteObj;
        }
      }
      displayScenario = {
        ...currentScenario,
        ballots: {
          ...(currentScenario.ballots || {}),
          ...remoteBallots,
        },
      };
    }
  }

  const activeEvent = displayScenario?.event || EVENTS_CATALOG[0];
  const ballots = displayScenario?.ballots || {};
  const isResolved = displayScenario?.status === 'resolved';

  /**
   * Switches to a specific event from the 12-event catalog.
   */
  const handleSelectEvent = (eventId) => {
    const event = getEventById(eventId) || EVENTS_CATALOG[0];
    setSelectedCatalogId(eventId);
    setActivePresetKey('custom');
    setCurrentScenario(createScenarioFromEvent(event));
    setActiveView('voting');
    setIngestNotice(null);
  };

  /**
   * Loads a pre-configured mock voting scenario.
   */
  const handleLoadPresetScenario = (key) => {
    const preset = mockVotingScenarios[key];
    if (preset) {
      setActivePresetKey(key);
      setSelectedCatalogId(preset.event?.id || '');
      setCurrentScenario(preset);
      setActiveView(preset.status === 'resolved' ? 'resolution' : 'voting');
      setIngestNotice(null);
    }
  };

  /**
   * Handles when an astronaut casts a ballot in the VotingPanel.
   * Updates local state and synchronizes the ballot to Firebase if in multiplayer mode.
   */
  const handleBallotCast = (updatedScenario, ballot) => {
    setCurrentScenario(updatedScenario);
    setIngestNotice(null);

    // If connected to a multiplayer room, push the ballot to Firebase Realtime Database
    if (mission?.roomCode && currentScenario?.id && ballot?.playerId && ballot?.optionId) {
      submitVote(mission.roomCode, {
        voteId: currentScenario.id,
        playerId: ballot.playerId,
        optionId: ballot.optionId,
        choice: ballot.optionId,
      }).catch((err) => {
        console.error('[Multiplayer:Events] Failed to submit ballot to Firebase:', err);
      });
    }
  };

  /**
   * Handles when voting resolves into a decision.
   */
  const handleScenarioResolved = (resolvedScenario) => {
    setCurrentScenario(resolvedScenario);
    setActiveView('resolution');
  };

  /**
   * Ingests the resolved decision's resource delta into the habitat life support system.
   */
  const handleIngestTelemetry = (appliedDelta) => {
    if (typeof onApplyResourceDelta === 'function') {
      onApplyResourceDelta(appliedDelta);
    }

    const winningTitle =
      currentScenario?.winningOption?.title ||
      currentScenario?.event?.options?.find((o) => o.id === currentScenario?.resolvedOptionId)?.title ||
      'Emergency Protocol';

    setIngestNotice({
      title: winningTitle,
      delta: appliedDelta,
      timestamp: `Sol ${mission?.round ?? 1} Telemetry Ingested`,
    });
  };

  // Formatted Sol indicator
  const solNumber = String(mission?.round ?? 1).padStart(3, '0');

  return (
    <div className="events-container-wrapper" role="region" aria-label="Crisis and Events Chamber">
      {/* 1. Synchronized Habitat Telemetry Strip */}
      <section className="events-telemetry-strip" aria-label="Active Habitat Telemetry">
        <div className="telemetry-strip-left">
          <span className="events-chamber-orb" aria-hidden="true" />
          <div>
            <h2 className="events-chamber-title">Crisis Command // Deliberation Chamber</h2>
            <div className="events-chamber-subtitle">
              Sector 4 Jezero Base &bull; SOL {solNumber} &bull; Mission {mission?.status?.toUpperCase() || 'ACTIVE'}
            </div>
          </div>
        </div>

        <div className="telemetry-strip-metrics" aria-label="Synchronized Life Support Status">
          <div className="telemetry-metric-pill metric-oxygen" title="Atmospheric Oxygen">
            <span aria-hidden="true">🫧</span>
            <span className="metric-name">O2:</span>
            <span className="metric-val">{resources?.oxygen ?? 0}%</span>
          </div>

          <div className="telemetry-metric-pill metric-power" title="Core Power Grid">
            <span aria-hidden="true">⚡</span>
            <span className="metric-name">PWR:</span>
            <span className="metric-val">{resources?.power ?? 0}%</span>
          </div>

          <div className="telemetry-metric-pill metric-food" title="Food Rations">
            <span aria-hidden="true">🌱</span>
            <span className="metric-name">FOOD:</span>
            <span className="metric-val">{resources?.food ?? 0}%</span>
          </div>

          <div className="telemetry-metric-pill metric-radiation" title="Radiation Exposure">
            <span aria-hidden="true">☢️</span>
            <span className="metric-name">RAD:</span>
            <span className="metric-val">{resources?.radiation ?? 0}%</span>
          </div>
        </div>
      </section>

      {/* 2. Success Ingestion Notification Banner */}
      {ingestNotice && (
        <aside className="telemetry-ingested-banner" role="alert">
          <div className="ingested-banner-left">
            <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>✅</span>
            <div>
              <p className="ingested-banner-text">
                Protocol Telemetry Ingested: <strong>{ingestNotice.title}</strong>
              </p>
              <span className="events-chamber-subtitle" style={{ color: '#a7f3d0' }}>
                {ingestNotice.timestamp} &bull; Habitat life-support gauges updated.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-mars-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            onClick={() => setIngestNotice(null)}
          >
            Dismiss
          </button>
        </aside>
      )}

      {/* 3. Crisis Event Selector & Preset Scenarios Card */}
      <section className="events-controls-card" aria-label="Incident Selector and Testing Controls">
        <div className="controls-card-header">
          <h3>Active Incident Dispatch</h3>

          <div className="preset-scenarios-row">
            <span className="crew-station-label">Test Scenarios:</span>
            <button
              type="button"
              className={`scenario-pill-btn ${activePresetKey === 'tied' ? 'active' : ''}`}
              onClick={() => handleLoadPresetScenario('tied')}
              title="2-vs-2 Deadlock broken by Commander Sarah Chen"
            >
              ⭐ Commander Tie-Breaker
            </button>
            <button
              type="button"
              className={`scenario-pill-btn ${activePresetKey === 'emergency' ? 'active' : ''}`}
              onClick={() => handleLoadPresetScenario('emergency')}
              title="Airlock Pressure Drop with 12s urgent countdown"
            >
              🚨 Emergency Hull Breach
            </button>
            <button
              type="button"
              className={`scenario-pill-btn ${activePresetKey === 'inProgress' ? 'active' : ''}`}
              onClick={() => handleLoadPresetScenario('inProgress')}
              title="Solar Particle Event (3/5 crew voted)"
            >
              ⏳ Deliberation In-Progress
            </button>
            <button
              type="button"
              className={`scenario-pill-btn ${activePresetKey === 'resolved' ? 'active' : ''}`}
              onClick={() => handleLoadPresetScenario('resolved')}
              title="Resolved Coronal Mass Ejection outcome"
            >
              ✓ Resolved CME Impact
            </button>
          </div>
        </div>

        <div className="events-selector-group">
          <label htmlFor="catalog-event-select" className="crew-station-label">
            12-Event Martian Catalog:
          </label>
          <select
            id="catalog-event-select"
            className="events-dropdown-select"
            value={selectedCatalogId}
            onChange={(e) => handleSelectEvent(e.target.value)}
          >
            {EVENTS_CATALOG.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.icon} [{ev.severity.toUpperCase()}] {ev.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-mars-secondary"
            onClick={() => setIsModalOpen(true)}
            title="Open high-visibility alert dispatch overlay"
          >
            🚨 Open Incident Dispatch Modal
          </button>
        </div>

        {/* 4. Crew Station Switcher: Enables voting as each of the 5 astronauts */}
        <div className="crew-station-wrapper">
          <span className="crew-station-label">
            Astronaut Deliberation Station (Switch Active Crew Member to Cast Ballot):
          </span>
          <div className="crew-stations-grid" role="radiogroup" aria-label="Select active astronaut">
            {safePlayers.map((player) => {
              const isActive = activePlayerId === player.id;
              const hasBallot = ballots[player.id] !== undefined;

              return (
                <button
                  type="button"
                  key={player.id}
                  className={`crew-station-card ${isActive ? 'active' : ''}`}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setActivePlayerId(player.id)}
                >
                  <span className="crew-station-avatar" aria-hidden="true">
                    {player.avatar || '🧑‍🚀'}
                  </span>
                  <div className="crew-station-info">
                    <span className="crew-station-name">{player.name}</span>
                    <span className="crew-station-role">{player.role}</span>
                  </div>
                  <span
                    className={`crew-station-voted-dot ${hasBallot ? 'voted' : 'pending'}`}
                    title={hasBallot ? 'Ballot submitted' : 'Pending ballot'}
                    aria-label={hasBallot ? 'Ballot submitted' : 'Pending ballot'}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. View Switcher Tabs (Deliberation Chamber vs Resolution Dispatch) */}
      <nav className="events-view-switcher" aria-label="Event Chamber Views">
        <button
          type="button"
          className={`view-subtab-btn ${activeView === 'voting' ? 'active' : ''}`}
          onClick={() => setActiveView('voting')}
        >
          🗳️ Voting &amp; Deliberation Chamber
        </button>
        <button
          type="button"
          className={`view-subtab-btn ${activeView === 'resolution' ? 'active' : ''}`}
          onClick={() => {
            if (!isResolved) {
              // Resolve on demand if switching to resolution tab
              const res = resolveEvent(currentScenario, safePlayers, { force: true });
              if (res.success) {
                setCurrentScenario(res.scenario);
              }
            }
            setActiveView('resolution');
          }}
        >
          📊 Protocol Resolution &amp; Impact
        </button>
      </nav>

      {/* 6. Active Chamber Content View */}
      {activeView === 'voting' ? (
        <VotingPanel
          scenario={displayScenario}
          players={safePlayers}
          activePlayerId={activePlayerId}
          onVote={handleBallotCast}
          onResolve={handleScenarioResolved}
          allowChangeVote={true}
          showTimer={true}
          rule="plurality"
        />
      ) : (
        <EventResolution
          scenario={displayScenario}
          currentResources={resources}
          onAcknowledge={handleIngestTelemetry}
          confirmLabel="Acknowledge &amp; Ingest Telemetry"
        />
      )}

      {/* 7. Emergency Incident Dispatch Modal Overlay */}
      <EventModal
        event={activeEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedOptionId={ballots[activePlayerId] || ''}
        onSelectOption={(optionId) => {
          // Allow casting or selecting option from modal
          const updated = {
            ...currentScenario,
            ballots: { ...ballots, [activePlayerId]: optionId },
          };
          handleBallotCast(updated, { playerId: activePlayerId, optionId });
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

export default EventsContainer;
