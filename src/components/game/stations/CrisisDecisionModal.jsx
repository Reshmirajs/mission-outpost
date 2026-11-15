import { useState } from 'react';
import { VotingPanel } from '../../events/VotingPanel.jsx';
import { EventResolution } from '../../events/EventResolution.jsx';

/**
 * CrisisDecisionModal Component
 * Seamless in-map emergency deliberation dialog reusing the existing
 * VotingPanel and EventResolution components from the Events system.
 */
export default function CrisisDecisionModal({
  event,
  players = [],
  currentPlayer,
  resources,
  onResolveCrisis,
  onClose,
}) {
  const safePlayers = Array.isArray(players) && players.length > 0 ? players : [
    { id: 'lead', name: 'Commander Sarah Chen', role: 'Commander', avatar: '👩‍🚀' },
    { id: 'eng', name: 'Alex Rivera', role: 'Engineer', avatar: '👨‍🔧' },
  ];

  const [scenario, setScenario] = useState(() => ({
    id: `crisis-${event.id}-${Date.now()}`,
    label: event.title,
    event,
    status: 'voting',
    timeRemainingSeconds: 50,
    totalSeconds: 60,
    ballots: {},
    resolvedOptionId: null,
    tieBrokenBy: null,
  }));

  const [activePlayerId, setActivePlayerId] = useState(currentPlayer?.id || safePlayers[0]?.id);
  const [view, setView] = useState('voting'); // 'voting' | 'resolution'

  const handleVote = (updatedScenario) => {
    setScenario(updatedScenario);
  };

  const handleResolve = (resolvedScenario) => {
    setScenario(resolvedScenario);
    setView('resolution');
  };

  const handleAcknowledgeAndApply = (appliedDelta) => {
    if (onResolveCrisis) {
      onResolveCrisis(event.id, appliedDelta, scenario.winningOption);
    }
    onClose();
  };

  return (
    <div className="crisis-modal-overlay" role="dialog" aria-modal="true">
      <div className="crisis-modal-dialog">
        <header className="crisis-modal-header">
          <div className="crisis-title-box">
            <span className="crisis-badge">🚨 EMERGENCY INCIDENT DISPATCH</span>
            <h2>{event.title}</h2>
          </div>
          <button type="button" className="crisis-close-btn" onClick={onClose} title="Close Esc">
            ✕
          </button>
        </header>

        {/* Deliberation Station Switcher (for local multiplayer testing) */}
        <div className="crisis-crew-switcher">
          <span className="switcher-label">Deliberate as:</span>
          <div className="switcher-buttons">
            {safePlayers.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`switcher-pill ${activePlayerId === p.id ? 'active' : ''}`}
                onClick={() => setActivePlayerId(p.id)}
              >
                {p.name} ({p.role})
              </button>
            ))}
          </div>
        </div>

        <div className="crisis-modal-body">
          {view === 'voting' ? (
            <VotingPanel
              scenario={scenario}
              players={safePlayers}
              activePlayerId={activePlayerId}
              onVote={handleVote}
              onResolve={handleResolve}
              allowChangeVote={true}
              showTimer={true}
              rule="plurality"
            />
          ) : (
            <EventResolution
              scenario={scenario}
              currentResources={resources}
              onAcknowledge={handleAcknowledgeAndApply}
              confirmLabel="Apply Protocol &amp; Stabilize Base"
            />
          )}
        </div>
      </div>
    </div>
  );
}
