import { useState } from 'react';
import TaskCard from './TaskCard.jsx';

/**
 * CommandStationModal Component
 * Immersive operational console for the Mission Commander in the Command Centre.
 * Coordinates the crew, audits subsystem statuses, manages emergency resolutions,
 * and advances the Sol survival clock toward the 20-Sol goal.
 */
export default function CommandStationModal({
  mission,
  resources,
  players = [],
  currentPlayer,
  tasks = [],
  activeEvent,
  onOpenCrisisModal,
  onAdvanceSol,
  onCompleteTask,
  onApplyResourceDelta,
}) {
  const currentSol = mission?.round ?? 1;
  const isCommander = currentPlayer?.role === 'Commander' || currentPlayer?.role === 'Mission Commander';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tasks' | 'crew'
  const [feedback, setFeedback] = useState(null);

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = tasks.length;

  const handleTriggerAdvanceSol = () => {
    if (activeEvent && activeEvent.status !== 'resolved') {
      setFeedback({
        type: 'error',
        text: 'Cannot advance Sol! An active crisis emergency requires team resolution first.',
      });
      return;
    }

    if (onAdvanceSol) {
      onAdvanceSol();
    }
  };

  return (
    <div className="station-content-layout">
      {/* Subnav */}
      <div className="station-subnav">
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🚀 Mission Command // Sol {currentSol} / 20
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Commander Directives ({tasks.length})
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'crew' ? 'active' : ''}`}
          onClick={() => setActiveTab('crew')}
        >
          🧑‍🚀 Crew Manifest ({players.length})
        </button>
      </div>

      {feedback && (
        <div className={`station-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '⚠️ '}
          {feedback.text}
        </div>
      )}

      {activeTab === 'overview' ? (
        <div className="command-station-body">
          {/* Top Mission Banner */}
          <div className="mission-progress-banner">
            <div className="progress-info">
              <span className="banner-tag">EXPEDITION OBJECTIVE: SURVIVE 20 SOLS</span>
              <h3 className="banner-title">Martian Sol {currentSol} of 20</h3>
              <p className="banner-sub">
                Outpost Room: <strong>{mission?.roomCode || 'SOL-BASE'}</strong> &bull; Status: <strong>{mission?.status?.toUpperCase()}</strong>
              </p>
            </div>
            <div className="progress-meter-box">
              <div className="sol-progress-track">
                <div
                  className="sol-progress-fill"
                  style={{ width: `${Math.min(100, (currentSol / 20) * 100)}%` }}
                />
              </div>
              <span className="progress-percent">{Math.round((currentSol / 20) * 100)}% Complete</span>
            </div>
          </div>

          {/* Subsystems Quick Overview */}
          <h4 className="section-subheading">Habitat Subsystem Status</h4>
          <div className="subsystems-grid">
            <div className="subsystem-card">
              <span className="card-icon">⚡</span>
              <div>
                <strong>Power Grid</strong>
                <span>{resources?.power ?? 0}% Available</span>
              </div>
            </div>
            <div className="subsystem-card">
              <span className="card-icon">🌱</span>
              <div>
                <strong>Greenhouse</strong>
                <span>{resources?.food ?? 0}% Food &bull; {resources?.water ?? 0}% H₂O</span>
              </div>
            </div>
            <div className="subsystem-card">
              <span className="card-icon">🫧</span>
              <div>
                <strong>Life Support</strong>
                <span>{resources?.oxygen ?? 0}% Oxygen</span>
              </div>
            </div>
            <div className="subsystem-card">
              <span className="card-icon">☢️</span>
              <div>
                <strong>Radiation Dosimetry</strong>
                <span>{resources?.radiation ?? 0}% Dose</span>
              </div>
            </div>
          </div>

          {/* Active Emergency Alert Banner */}
          {activeEvent && (
            <div className="command-emergency-card">
              <div className="emergency-header">
                <span className="emergency-icon" aria-hidden="true">🚨</span>
                <div>
                  <span className="emergency-badge">{activeEvent.severity?.toUpperCase()} CRISIS</span>
                  <h4>{activeEvent.title}</h4>
                </div>
              </div>
              <p className="emergency-desc">{activeEvent.description}</p>
              <button
                type="button"
                className="btn-crisis-deliberate"
                onClick={onOpenCrisisModal}
              >
                🗳️ Open Team Deliberation Chamber &amp; Vote
              </button>
            </div>
          )}

          {/* Advance Sol Action */}
          <div className="sol-advance-box">
            <div className="advance-text">
              <h4>Martian Nightfall &amp; Sol Advancement</h4>
              <p>
                Tasks Completed: <strong>{completedTasksCount} / {totalTasksCount}</strong>.
                When maintenance is logged, the Commander can authorize the end-of-Sol consumption cycle.
              </p>
            </div>
            {isCommander ? (
              <button
                type="button"
                className="btn-advance-sol"
                onClick={handleTriggerAdvanceSol}
              >
                🌙 Advance to Sol {currentSol + 1} →
              </button>
            ) : (
              <span className="specialist-hint">
                🔒 Only the Expedition Lead (Mission Commander) can authorize Sol advancement.
              </span>
            )}
          </div>
        </div>
      ) : activeTab === 'tasks' ? (
        /* Tasks View */
        <div className="station-tasks-body">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCompleteTask={onCompleteTask}
              onApplyResourceDelta={onApplyResourceDelta}
            />
          ))}
        </div>
      ) : (
        /* Crew Roster View */
        <div className="command-crew-body">
          <h4 className="section-subheading">Assigned Expedition Crew</h4>
          <div className="crew-roster-list">
            {players.map((p, idx) => (
              <div key={p.id || idx} className="crew-roster-item">
                <span className="crew-avatar">🧑‍🚀</span>
                <div className="crew-details">
                  <strong>{p.name}</strong>
                  <span className="crew-role">{p.role}</span>
                </div>
                <span className="crew-badge">{p.isHost ? 'Expedition Lead' : 'Specialist'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
