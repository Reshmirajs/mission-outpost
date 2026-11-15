import React, { useState } from 'react';
import { EVENTS_CATALOG, getEventById } from './eventsCatalog.js';
import { mockVotingScenarios, mockCrewMembers } from './mockEventsData.js';
import { resolveEvent, createScenarioFromEvent } from './votingUtils.js';
import { EventModal } from './EventModal.jsx';
import { VotingPanel } from './VotingPanel.jsx';
import { EventResolution } from './EventResolution.jsx';
import './Events.css';

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
  onApplyResourceDelta,
}) {
  const safePlayers = Array.isArray(players) && players.length > 0 ? players : mockCrewMembers;

  // Active scenario state (defaults to the rich inProgress scenario)
  const [currentScenario, setCurrentScenario] = useState(mockVotingScenarios.inProgress);
  const [activePlayerId, setActivePlayerId] = useState(safePlayers[0]?.id || 'p1');
  const [activeView, setActiveView] = useState('voting'); // 'voting' | 'resolution'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState('evt-solar-particle');
  const [activePresetKey, setActivePresetKey] = useState('inProgress');
  const [ingestNotice, setIngestNotice] = useState(null);

  const activeEvent = currentScenario?.event || EVENTS_CATALOG[0];
  const ballots = currentScenario?.ballots || {};
  const isResolved = currentScenario?.status === 'resolved';

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
   */
  const handleBallotCast = (updatedScenario) => {
    setCurrentScenario(updatedScenario);
    setIngestNotice(null);
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
          scenario={currentScenario}
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
          scenario={currentScenario}
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
          setCurrentScenario(updated);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

export default EventsContainer;
