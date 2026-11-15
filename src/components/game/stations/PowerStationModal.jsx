import { useState } from 'react';
import { validatePowerAllocation } from '../../../game/resourceManager.js';
import TaskCard from './TaskCard.jsx';

/**
 * PowerStationModal Component
 * Immersive operational console for the Power Engineer in the Power Room.
 * Teaches electrical generation, battery management, and allocation trade-offs.
 */
export default function PowerStationModal({
  resources,
  currentPlayer,
  tasks = [],
  onCompleteTask,
  onApplyResourceDelta,
  powerGrid,
  onUpdatePowerGrid,
}) {
  const currentPower = resources?.power ?? 80;
  const isEngineer = currentPlayer?.role === 'Engineer' || currentPlayer?.role === 'Power Engineer';

  // Local grid allocation state (in kW / game units)
  const [allocation, setAllocation] = useState(
    powerGrid || {
      lifeSupport: 35,
      greenhouse: 25,
      science: 20,
      aux: 20,
    }
  );
  const [activeTab, setActiveTab] = useState('allocation'); // 'allocation' | 'tasks'
  const [feedback, setFeedback] = useState(null);

  const validation = validatePowerAllocation(allocation, currentPower);

  const handleSliderChange = (key, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setAllocation((prev) => ({
      ...prev,
      [key]: num,
    }));
    setFeedback(null);
  };

  const handleConfirmAllocation = () => {
    if (!validation.valid) {
      setFeedback({ type: 'error', text: validation.error });
      return;
    }
    if (onUpdatePowerGrid) {
      onUpdatePowerGrid(allocation);
    }
    setFeedback({
      type: 'success',
      text: `Power grid rebalanced! ${validation.total} kW allocated. Remaining buffer: ${validation.remaining} kW.`,
    });
  };

  return (
    <div className="station-content-layout">
      {/* Station Header Sub-nav */}
      <div className="station-subnav">
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'allocation' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocation')}
        >
          ⚡ Power Grid Allocation
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          🛠️ Maintenance Tasks ({tasks.length})
        </button>
      </div>

      {feedback && (
        <div className={`station-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '⚠️ '}
          {feedback.text}
        </div>
      )}

      {activeTab === 'allocation' ? (
        <div className="power-station-body">
          {/* Telemetry Overview */}
          <div className="telemetry-stat-row">
            <div className="stat-card">
              <span className="stat-label">GRID POWER</span>
              <strong className="stat-value">{currentPower}%</strong>
              <small className="stat-note">Base Supply</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">SOLAR GENERATION</span>
              <strong className="stat-value">55 kW</strong>
              <small className="stat-note">Sector 4 Photovoltaics</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">BATTERY STORAGE</span>
              <strong className="stat-value">85 kWh</strong>
              <small className="stat-note">Backup Reserves</small>
            </div>
            <div className={`stat-card ${!validation.valid ? 'danger' : ''}`}>
              <span className="stat-label">REMAINING BUFFER</span>
              <strong className="stat-value">{validation.remaining} kW</strong>
              <small className="stat-note">Capacity headroom</small>
            </div>
          </div>

          <div className="allocation-guide">
            <p>
              <strong>Educational Concept:</strong> Mars has no electrical grid! Astronauts generate power from solar panels
              and nuclear batteries. You must allocate finite electricity between essential life support and other systems.
            </p>
          </div>

          {/* Allocation Controls */}
          <div className="allocation-controls-list">
            <div className="allocation-slider-group">
              <div className="slider-header">
                <span className="slider-label">🫧 Life Support (Air &amp; Heat)</span>
                <span className="slider-val">{allocation.lifeSupport} kW (Min: 20 kW)</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={allocation.lifeSupport}
                onChange={(e) => handleSliderChange('lifeSupport', e.target.value)}
              />
              <span className="slider-tip">Keeps oxygen scrubbers and cabin temperature at 21°C.</span>
            </div>

            <div className="allocation-slider-group">
              <div className="slider-header">
                <span className="slider-label">🌱 Greenhouse (Grow Lights)</span>
                <span className="slider-val">{allocation.greenhouse} kW</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={allocation.greenhouse}
                onChange={(e) => handleSliderChange('greenhouse', e.target.value)}
              />
              <span className="slider-tip">High-intensity LED arrays for vegetable and microgreen photosynthesis.</span>
            </div>

            <div className="allocation-slider-group">
              <div className="slider-header">
                <span className="slider-label">🔬 Science Lab (Sensors)</span>
                <span className="slider-val">{allocation.science} kW</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={allocation.science}
                onChange={(e) => handleSliderChange('science', e.target.value)}
              />
              <span className="slider-tip">Runs radiation dosimeters and spectrometer sample analysis.</span>
            </div>

            <div className="allocation-slider-group">
              <div className="slider-header">
                <span className="slider-label">💡 Auxiliary &amp; Quarters</span>
                <span className="slider-val">{allocation.aux} kW</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={allocation.aux}
                onChange={(e) => handleSliderChange('aux', e.target.value)}
              />
              <span className="slider-tip">Lighting, crew tablet computers, and food warming appliances.</span>
            </div>
          </div>

          <div className="station-action-bar">
            <button
              type="button"
              className="btn-confirm-action"
              onClick={handleConfirmAllocation}
              disabled={!validation.valid}
            >
              Confirm Power Allocation ({validation.total} / {currentPower} kW)
            </button>
            {!isEngineer && (
              <span className="specialist-hint">💡 Power Engineer specializes in grid efficiency.</span>
            )}
          </div>
        </div>
      ) : (
        /* Maintenance Tasks View */
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
