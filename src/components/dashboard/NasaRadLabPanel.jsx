import React from 'react';

/**
 * NasaRadLabPanel Component
 * Displays real scientific astronaut radiation exposure context from NASA RadLab / MSL-RAD.
 * Never displays invented or simulated values as real scientific measurements.
 *
 * @param {Object} props
 * @param {Object} [props.radLab] - Scientific radiation payload from NASA integration teammate.
 */
function NasaRadLabPanel({ radLab = null }) {
  const isAvailable = Boolean(radLab && radLab.available);

  return (
    <div className="dashboard-panel nasa-panel nasa-radlab-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">🔬</span>
          <div>
            <h3>NASA RadLab Scientific Context</h3>
            <span className="nasa-disclaimer-pill">ASTRONAUT RADIATION DOSIMETRY ARCHIVE</span>
          </div>
        </div>

        <span className="nasa-attribution-tag">
          NASA RadLab / MSL-RAD
        </span>
      </div>

      {!isAvailable ? (
        <div className="empty-panel-notice radlab-standby-notice">
          <span className="empty-icon">⚛️</span>
          <p>Scientific RadLab data is currently unavailable.</p>
          <span className="empty-subtext">
            Awaiting telemetry feed from the NASA integration service. Unverified dose values are omitted to preserve scientific integrity.
          </span>
        </div>
      ) : (
        <div className="radlab-content-body">
          <div className="radlab-instrument-badge">
            <span className="instrument-label">REFERENCE INSTRUMENT:</span>
            <span className="instrument-name">{radLab.instrument || 'Mars Science Laboratory RAD'}</span>
          </div>

          <div className="radlab-notes-grid">
            {radLab.cosmicRayContext && (
              <div className="radlab-note-box">
                <span className="note-title">🌌 Galactic Cosmic Rays (GCR)</span>
                <p className="note-body">{radLab.cosmicRayContext}</p>
              </div>
            )}

            {radLab.shieldingReference && (
              <div className="radlab-note-box">
                <span className="note-title">🛡️ Habitat Shielding Dynamics</span>
                <p className="note-body">{radLab.shieldingReference}</p>
              </div>
            )}
          </div>

          {radLab.safetyNote && (
            <p className="radlab-safety-summary">
              <strong>Health Directive:</strong> {radLab.safetyNote}
            </p>
          )}

          {/* Attribution */}
          <div className="nasa-panel-footer">
            <span className="nasa-api-credit">
              Scientific Reference: {radLab.attribution || 'NASA Life Sciences Data Archive / RadLab'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NasaRadLabPanel;
