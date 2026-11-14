import React from 'react';
import { getResourceCondition } from './dashboardUtils';

/**
 * ResourceCard Component
 * Displays a single resource gauge with dynamic status warnings, meter fill, and iconography.
 * When representing Radiation, it supports displaying dual-layer telemetry:
 * 1. The in-game simulated habitat radiation level (0–100%).
 * 2. Real NASA DONKI astronomical space-weather observations (clearly distinguished).
 *
 * @param {Object} props
 * @param {string} [props.name]
 * @param {number} [props.value]
 * @param {'oxygen'|'power'|'food'|'radiation'} [props.type]
 * @param {string} [props.icon]
 * @param {string} [props.unit]
 * @param {Object} [props.nasaContext] - Optional real NASA space weather observation context for radiation.
 */
function ResourceCard({
  name = 'Resource',
  value = 100,
  type = 'oxygen',
  icon = '📊',
  unit = '%',
  nasaContext = null,
}) {
  const numericValue = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(100, value)) : 0;
  const condition = getResourceCondition(type, numericValue);
  const isRadiation = type === 'radiation';

  return (
    <div className={`resource-card-panel status-${condition.status} resource-type-${type}`}>
      {/* Top Header */}
      <div className="card-top-row">
        <div className="resource-title-group">
          <span className="resource-symbol-badge" aria-hidden="true">{icon}</span>
          <div>
            <span className="resource-label-text">{name}</span>
            {isRadiation && (
              <span className="telemetry-source-badge badge-simulated">
                SIMULATED MISSION METRIC
              </span>
            )}
          </div>
        </div>
        <span className={`condition-tag condition-tag-${condition.status}`}>
          {condition.label}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="metric-display-row">
        <span className="metric-number">{numericValue}</span>
        <span className="metric-unit">{unit}</span>
      </div>

      {/* Progress Bar / Meter */}
      <div
        className="meter-bar-container"
        role="progressbar"
        aria-valuenow={numericValue}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`${name} level`}
      >
        <div
          className={`meter-bar-fill fill-${type} fill-status-${condition.status}`}
          style={{ width: `${numericValue}%` }}
        />
      </div>

      {/* Subtext description / in-game condition prompt */}
      <div className="meter-footer-info">
        <span className="condition-description">{condition.message}</span>
      </div>

      {/* Real NASA Space-Weather Context (Distinct from simulated game values) */}
      {isRadiation && nasaContext && (
        <div className="nasa-radiation-context-box">
          <div className="nasa-context-header">
            <span className="nasa-context-tag">REAL NASA DONKI OBSERVATION</span>
            <span className="nasa-risk-pill">{nasaContext.summaryRisk || 'Monitored'} Risk</span>
          </div>
          <p className="nasa-context-advisory">
            {nasaContext.advisory || 'Solar activity monitored by NASA SDO/DONKI.'}
          </p>
          <div className="nasa-context-attribution">
            <span>Source: NASA Space Weather Database (DONKI)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceCard;
