import { useState } from 'react';
import { validateWaterAllocation } from '../../../game/resourceManager.js';
import TaskCard from './TaskCard.jsx';

/**
 * GreenhouseStationModal Component
 * Immersive operational console for the Botanist in the Greenhouse.
 * Teaches food production, closed-loop hydroponics, and water rationing.
 */
export default function GreenhouseStationModal({
  resources,
  currentPlayer,
  tasks = [],
  onCompleteTask,
  onApplyResourceDelta,
  cropIrrigationPolicy,
  onUpdateIrrigationPolicy,
}) {
  const currentFood = resources?.food ?? 85;
  const currentWater = resources?.water ?? 90;
  const isBotanist = currentPlayer?.role === 'Botanist';

  const [policy, setPolicy] = useState(cropIrrigationPolicy || 'standard'); // 'eco' | 'standard' | 'high'
  const [activeTab, setActiveTab] = useState('irrigation'); // 'irrigation' | 'tasks'
  const [feedback, setFeedback] = useState(null);

  const policyDetails = {
    eco: {
      label: 'Eco Conservation Mode',
      waterUse: 10,
      cropGrowth: 'Slow Growth (+3% Food/Sol)',
      desc: 'Rations water strictly. Plants grow slowly but preserve critical drinking reserves.',
    },
    standard: {
      label: 'Standard Balanced Growth',
      waterUse: 20,
      cropGrowth: 'Nominal Growth (+6% Food/Sol)',
      desc: 'Optimal balance of moisture and nutrient delivery for sweet potatoes and dwarf wheat.',
    },
    high: {
      label: 'Maximum Crop Yield',
      waterUse: 32,
      cropGrowth: 'Accelerated Harvest (+10% Food/Sol)',
      desc: 'Heavy misting maximizes crop production, but uses significant water reserves.',
    },
  };

  const handlePolicyChange = (newPolicy) => {
    const val = validateWaterAllocation(policyDetails[newPolicy].waterUse, currentWater);
    if (!val.valid) {
      setFeedback({ type: 'error', text: val.error });
      return;
    }
    setPolicy(newPolicy);
    if (onUpdateIrrigationPolicy) {
      onUpdateIrrigationPolicy(newPolicy);
    }
    setFeedback({
      type: 'success',
      text: `Irrigation policy set to ${policyDetails[newPolicy].label}!`,
    });
  };

  return (
    <div className="station-content-layout">
      {/* Sub-navigation */}
      <div className="station-subnav">
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'irrigation' ? 'active' : ''}`}
          onClick={() => setActiveTab('irrigation')}
        >
          🌱 Hydroponic Irrigation
        </button>
        <button
          type="button"
          className={`station-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          🥬 Botanist Tasks ({tasks.length})
        </button>
      </div>

      {feedback && (
        <div className={`station-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '⚠️ '}
          {feedback.text}
        </div>
      )}

      {activeTab === 'irrigation' ? (
        <div className="greenhouse-station-body">
          {/* Telemetry Overview */}
          <div className="telemetry-stat-row">
            <div className="stat-card">
              <span className="stat-label">FOOD RESERVES</span>
              <strong className="stat-value">{currentFood}%</strong>
              <small className="stat-note">Rations Available</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">WATER SUPPLY</span>
              <strong className="stat-value">{currentWater}%</strong>
              <small className="stat-note">Habitat Storage</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">PLANT HEALTH</span>
              <strong className="stat-value">94%</strong>
              <small className="stat-note">Photosynthetic Index</small>
            </div>
            <div className="stat-card">
              <span className="stat-label">DAILY IRRIGATION</span>
              <strong className="stat-value">{policyDetails[policy].waterUse} L</strong>
              <small className="stat-note">Per Sol allocation</small>
            </div>
          </div>

          <div className="allocation-guide">
            <p>
              <strong>Educational Concept:</strong> Martian soil (regolith) contains toxic chlorine salts called perchlorates!
              Astronauts grow plants in aeroponic tubes where roots hang in midair and receive a misty spray of water and nutrients.
            </p>
          </div>

          <h3 className="section-subheading">Select Irrigation Strategy</h3>
          <div className="policy-selection-grid">
            {Object.entries(policyDetails).map(([key, details]) => {
              const isSelected = policy === key;
              return (
                <div
                  key={key}
                  className={`policy-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePolicyChange(key)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="policy-card-header">
                    <h4>{details.label}</h4>
                    {isSelected && <span className="policy-active-tag">ACTIVE</span>}
                  </div>
                  <p className="policy-desc">{details.desc}</p>
                  <div className="policy-impact">
                    <span>💧 Uses: {details.waterUse} L/Sol</span>
                    <span>📈 Yield: {details.cropGrowth}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="station-action-bar">
            {!isBotanist && (
              <span className="specialist-hint">💡 The Botanist optimizes crop nutrients and prevents plant disease.</span>
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
