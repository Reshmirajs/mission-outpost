import { useState } from 'react';
import TaskCard from './TaskCard.jsx';

/**
 * LifeSupportStationModal Component
 * Immersive operational console for the Life Support Officer (Medic) in the Life Support Room.
 * Teaches closed habitat pressurization, oxygen generation, and carbon dioxide scrubbers.
 */
export default function LifeSupportStationModal({
  resources,
  currentPlayer,
  tasks = [],
  onCompleteTask,
  onApplyResourceDelta,
}) {
  const currentOxygen = resources?.oxygen ?? 85;
  const currentWater = resources?.water ?? 90;
  const isMedic = currentPlayer?.role === 'Medic' || currentPlayer?.role === 'Life Support Officer';

  const [activeTab, setActiveTab] = useState('systems'); // 'systems' | 'tasks'
  const [feedback, setFeedback] = useState(null);
  const [co2FilterStatus] = useState(98); // % filter life
  const [cabinPressure] = useState(101.3); // kPa

  const handleEmergencyO2Burst = () => {
    if (currentOxygen >= 95) {
      setFeedback({ type: 'error', text: 'Oxygen is already near 100%! Save emergency gas cylinders for low-pressure incidents.' });
      return;
    }
    if (onApplyResourceDelta) {
      onApplyResourceDelta({ oxygen: 5, power: -2 });
    }
    setFeedback({
      type: 'success',
      text: 'Emergency O₂ bottle injected into air ducts (+5% Oxygen, -2% Power).',
    });
  };

  return (
    <div className="station-content-layout">
      {/* Subnav */}
      <div className="station-subnav">
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'systems' ? 'active' : ''}`}
          onClick={() => setActiveTab('systems')}
        >
          🫧 Atmosphere &amp; Pressure Telemetry
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          🧰 Life Support Tasks ({tasks.length})
        </button>
      </div>

      {feedback && (
        <div className={`station-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '⚠️ '}
          {feedback.text}
        </div>
      )}

      {activeTab === 'systems' ? (
        <div className="life-support-station-body">
          {/* Telemetry Overview */}
          <div className="telemetry-stat-row">
            <div className={`stat-card ${currentOxygen < 40 ? 'danger' : ''}`}>
              <span className="stat-label">CABIN OXYGEN</span>
              <strong className="stat-value">{currentOxygen}%</strong>
              <small className="stat-note">Atmospheric O₂ Mix</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">BAROMETRIC PRESSURE</span>
              <strong className="stat-value">{cabinPressure} kPa</strong>
              <small className="stat-note">Nominal 101.3 kPa</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">ZEOLITE SCRUBBER</span>
              <strong className="stat-value">{co2FilterStatus}%</strong>
              <small className="stat-note">CO₂ Absorption Life</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">WATER PURIFICATION</span>
              <strong className="stat-value">{currentWater}%</strong>
              <small className="stat-note">98% Recycler Rate</small>
            </div>
          </div>

          <div className="allocation-guide">
            <p>
              <strong>Educational Concept:</strong> Why do astronauts need scrubbers? When humans breathe, they convert oxygen
              into carbon dioxide (CO₂). In an airtight base, breathing exhaled air would be toxic. Zeolite rocks trap CO₂ molecules
              to keep the air clean and breathable!
            </p>
          </div>

          {/* Diagnostic Controls */}
          <div className="systems-diagnostic-box">
            <h3 className="section-subheading">Scrubber Diagnostic &amp; Emergency Injection</h3>
            <div className="diagnostic-actions-row">
              <div className="diagnostic-info-card">
                <h4>Primary Oxygen Generator (MOXIE Loop)</h4>
                <p>Splits carbon dioxide into breathable oxygen and carbon monoxide exhaust. Running nominal.</p>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={handleEmergencyO2Burst}
                >
                  ⚡ Inject 5% Emergency O₂ Reserve (-2% Power)
                </button>
              </div>

              <div className="diagnostic-info-card">
                <h4>Airlock Seal Integrity Sensor</h4>
                <p>Differential pressure between inner habitat (101 kPa) and Martian surface (0.6 kPa).</p>
                <span className="badge-nominal">Status: Seals Tight (Delta 0.0 kPa/min)</span>
              </div>
            </div>
          </div>

          <div className="station-action-bar">
            {!isMedic && (
              <span className="specialist-hint">💡 Life Support Officer monitors crew vitals and atmospheric scrubbers.</span>
            )}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
