import { useState } from 'react';
import TaskCard from './TaskCard.jsx';

/**
 * ScienceStationModal Component
 * Immersive operational console for the Science & Safety Officer (Scientist) in the Science Lab.
 * Teaches space radiation physics, solar particle events (SPEs), shielding materials, and NASA observations.
 */
export default function ScienceStationModal({
  resources,
  currentPlayer,
  tasks = [],
  onCompleteTask,
  onApplyResourceDelta,
}) {
  const currentRadiation = resources?.radiation ?? 20;
  const isScientist = currentPlayer?.role === 'Scientist' || currentPlayer?.role === 'Science & Safety Officer';

  const [activeTab, setActiveTab] = useState('radiation'); // 'radiation' | 'tasks' | 'nasa'
  const [feedback, setFeedback] = useState(null);
  const [shelterActive, setShelterActive] = useState(false);

  const handleActivateStormShelter = () => {
    if (shelterActive) {
      setFeedback({ type: 'error', text: 'Command Bunker storm shelter is already pressurized and active!' });
      return;
    }
    setShelterActive(true);
    if (onApplyResourceDelta) {
      onApplyResourceDelta({ radiation: -6, power: -2 });
    }
    setFeedback({
      type: 'success',
      text: 'Storm Shelter Protocol Engaged! Crew directed to reinforced Command Bunker (-6% Radiation, -2% Auxiliary Power).',
    });
  };

  return (
    <div className="station-content-layout">
      {/* Subnav */}
      <div className="station-subnav">
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'radiation' ? 'active' : ''}`}
          onClick={() => setActiveTab('radiation')}
        >
          ☢️ Dosimetry &amp; Shielding
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          🔬 Science Tasks ({tasks.length})
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'nasa' ? 'active' : ''}`}
          onClick={() => setActiveTab('nasa')}
        >
          🛰️ NASA Data Context
        </button>
      </div>

      {feedback && (
        <div className={`station-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '⚠️ '}
          {feedback.text}
        </div>
      )}

      {activeTab === 'radiation' ? (
        <div className="science-station-body">
          {/* Telemetry Overview */}
          <div className="telemetry-stat-row">
            <div className={`stat-card ${currentRadiation > 50 ? 'danger' : ''}`}>
              <span className="stat-label">CUMULATIVE DOSE</span>
              <strong className="stat-value">{currentRadiation}%</strong>
              <small className="stat-note">Critical Limit: 100%</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">BACKGROUND RATE</span>
              <strong className="stat-value">22 µSv/h</strong>
              <small className="stat-note">Galactic Cosmic Rays</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">REGOLITH SHIELD</span>
              <strong className="stat-value">2.4 m</strong>
              <small className="stat-note">Overhead Habitat Berm</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">STORM SHELTER</span>
              <strong className="stat-value">{shelterActive ? 'SECURED' : 'STANDBY'}</strong>
              <small className="stat-note">Command Bunker</small>
            </div>
          </div>

          <div className="allocation-guide">
            <p>
              <strong>Educational Concept:</strong> Why can’t we just "turn off" radiation? Radiation is made of high-energy
              atomic particles streaming from the Sun and deep space. Unlike heat or light, you cannot switch it off — you must
              place heavy mass (like bags of water or Martian sand/regolith) between the astronauts and space!
            </p>
          </div>

          <div className="shielding-comparison-box">
            <h3 className="section-subheading">Radiation Shielding Analysis &amp; Protection</h3>
            <div className="shielding-grid">
              <div className="shield-card">
                <h4>Martian Regolith Berm</h4>
                <p>2.5 meters of local soil piled over habitat domes absorbs high-energy galactic cosmic rays.</p>
                <span className="badge-shield">Attenuation: 78% absorbed</span>
              </div>
              <div className="shield-card">
                <h4>Water Wall Absorbers</h4>
                <p>Water tanks line the bedroom walls. Hydrogen atoms in water are effective at stopping secondary neutrons.</p>
                <span className="badge-shield">Attenuation: 85% absorbed</span>
              </div>
              <div className="shield-card highlight">
                <h4>Storm Shelter (Command Bunker)</h4>
                <p>Central reinforced room with thickest shielding for intense Solar Particle Events.</p>
                <button
                  type="button"
                  className="btn-shelter-action"
                  onClick={handleActivateStormShelter}
                >
                  🛡️ {shelterActive ? 'Shelter Active (-6% Rad)' : 'Engage Storm Shelter Protocol'}
                </button>
              </div>
            </div>
          </div>

          <div className="station-action-bar">
            {!isScientist && (
              <span className="specialist-hint">💡 Science &amp; Safety Officer analyzes cosmic ray telemetry and issues safety advisories.</span>
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
        /* NASA Scientific Context */
        <div className="science-nasa-context-body">
          <div className="nasa-disclaimer-banner">
            <span>🛰️ <strong>NASA Science Apps Integration:</strong> Telemetry reflects real observational missions.</span>
          </div>

          <div className="nasa-cards-container">
            <div className="nasa-context-card">
              <h4>NASA DONKI (Space Weather Database)</h4>
              <p>
                Monitors solar flares and coronal mass ejections (CMEs). Solar storms take 1–3 days to travel from the
                Sun to Mars, giving astronauts early warning to bunker down!
              </p>
              <span className="nasa-tag">Source: NASA Goddard Space Flight Center</span>
            </div>

            <div className="nasa-context-card">
              <h4>NASA Curiosity Rover (RAD Instrument)</h4>
              <p>
                The Radiation Assessment Detector (RAD) on Curiosity measured that a round-trip to Mars exposes
                astronauts to approximately 0.66 Sieverts — about the maximum career limit for astronauts.
              </p>
              <span className="nasa-tag">Source: NASA JPL / Mars Science Laboratory</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
