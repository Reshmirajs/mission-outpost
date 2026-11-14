import React, { useState } from 'react';

/**
 * NasaMarsEnvironmentPanel Component
 * Displays real Mars surface photography from NASA Mars Rovers (Perseverance / Curiosity)
 * alongside Mars Trek orbital terrain elevation context.
 *
 * @param {Object} props
 * @param {Object} [props.marsEnvironment] - Environment payload from NASA services.
 */
function NasaMarsEnvironmentPanel({ marsEnvironment = null }) {
  const [imageError, setImageError] = useState(false);

  const hasData = Boolean(marsEnvironment);
  const roverName = marsEnvironment?.rover || 'Mars Rover';
  const cameraName = marsEnvironment?.camera || 'Navigation Camera';
  const sol = marsEnvironment?.sol ?? 'N/A';
  const earthDate = marsEnvironment?.earthDate || 'N/A';
  const caption = marsEnvironment?.caption || 'Martian landscape captured by NASA surface exploration rover.';
  const attribution = marsEnvironment?.attribution || 'NASA / JPL-Caltech';
  const marsTrek = marsEnvironment?.marsTrek || null;

  return (
    <div className="dashboard-panel nasa-panel nasa-mars-environment-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">🔴</span>
          <div>
            <h3>Mars Environment &amp; Surface Telemetry</h3>
            <span className="nasa-disclaimer-pill">REAL NASA SURFACE RECONNAISSANCE</span>
          </div>
        </div>

        <span className="nasa-attribution-tag">
          NASA Mars Rover API
        </span>
      </div>

      {!hasData ? (
        <div className="empty-panel-notice">
          <span className="empty-icon">📷</span>
          <p>NASA Mars Rover photography is currently in standby.</p>
          <span className="empty-subtext">Waiting for the next orbital Mars Relay downlink.</span>
        </div>
      ) : (
        <div className="mars-environment-content">
          {/* Rover Surface Photo Display */}
          <div className="rover-image-card">
            <div className="rover-image-wrapper">
              {marsEnvironment?.imageUrl && !imageError ? (
                <img
                  src={marsEnvironment.imageUrl}
                  alt={`Mars surface captured by ${roverName}`}
                  className="rover-photo-element"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="rover-photo-placeholder">
                  <span className="placeholder-icon">🪐</span>
                  <span className="placeholder-text">NASA Rover Imagery Synced</span>
                  <span className="placeholder-subtext">{roverName} &bull; Sol {sol}</span>
                </div>
              )}

              {/* Photo Overlay Chips */}
              <div className="rover-photo-overlay">
                <span className="overlay-rover-tag">{roverName}</span>
                <span className="overlay-sol-tag">Sol {sol}</span>
              </div>
            </div>

            {/* Photo Metadata Caption */}
            <div className="rover-photo-caption-block">
              <p className="rover-caption-text">{caption}</p>
              <div className="rover-meta-chips">
                <span className="meta-chip">
                  <strong>Camera:</strong> {cameraName}
                </span>
                <span className="meta-chip">
                  <strong>Earth Date:</strong> {earthDate}
                </span>
              </div>
            </div>
          </div>

          {/* NASA Mars Trek Terrain Context (If Available) */}
          {marsTrek && (
            <div className="mars-trek-terrain-card">
              <div className="trek-header-row">
                <span className="trek-title">
                  <span className="trek-icon" aria-hidden="true">🗺️</span>
                  Mars Trek Terrain Context
                </span>
                <span className="trek-source-badge">NASA Solar System Treks</span>
              </div>

              <div className="trek-details-grid">
                <div className="trek-detail-item">
                  <span className="trek-label">SECTOR / FEATURE</span>
                  <span className="trek-value">{marsTrek.featureName || 'Martian Surface'}</span>
                </div>
                <div className="trek-detail-item">
                  <span className="trek-label">AREOCENTRIC COORDINATES</span>
                  <span className="trek-value">{marsTrek.coordinates || 'Equatorial Mars'}</span>
                </div>
                <div className="trek-detail-item">
                  <span className="trek-label">SURFACE ELEVATION</span>
                  <span className="trek-value">{marsTrek.elevation || 'Datum Zero'}</span>
                </div>
              </div>

              {marsTrek.terrainDescription && (
                <p className="trek-description">{marsTrek.terrainDescription}</p>
              )}
            </div>
          )}

          {/* Attribution */}
          <div className="nasa-panel-footer">
            <span className="nasa-api-credit">
              Imagery &amp; Cartography Courtesy: {attribution}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NasaMarsEnvironmentPanel;
