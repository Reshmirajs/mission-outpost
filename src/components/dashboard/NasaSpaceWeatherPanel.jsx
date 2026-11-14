import React from 'react';

/**
 * Returns visual styling for NASA Space Weather risk tiers.
 * @param {string} risk
 */
function getSpaceWeatherRiskStyle(risk) {
  switch ((risk || '').toLowerCase()) {
    case 'severe':
    case 'high':
      return {
        className: 'risk-severe',
        label: 'SEVERE SOLAR RISK',
        icon: '🚨',
      };
    case 'elevated':
    case 'moderate':
      return {
        className: 'risk-elevated',
        label: 'ELEVATED SOLAR RISK',
        icon: '⚠️',
      };
    case 'nominal':
    case 'low':
      return {
        className: 'risk-nominal',
        label: 'SOLAR WEATHER NOMINAL',
        icon: '🛡️',
      };
    default:
      return {
        className: 'risk-unknown',
        label: 'MONITORING ACTIVE',
        icon: '☀️',
      };
  }
}

/**
 * NasaSpaceWeatherPanel Component
 * Displays real space weather events (Solar Flares & CMEs) from NASA DONKI.
 * Clearly separates real astronomical observations from simulated game states.
 *
 * @param {Object} props
 * @param {Object} [props.spaceWeather] - Space weather payload from NASA DONKI service.
 */
function NasaSpaceWeatherPanel({ spaceWeather = null }) {
  const hasData = Boolean(spaceWeather && Array.isArray(spaceWeather.events) && spaceWeather.events.length > 0);
  const riskMeta = getSpaceWeatherRiskStyle(spaceWeather?.summaryRisk);

  return (
    <div className="dashboard-panel nasa-panel nasa-space-weather-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">☀️</span>
          <div>
            <h3>NASA Space Weather (DONKI)</h3>
            <span className="nasa-disclaimer-pill">REAL NASA ASTRONOMICAL DATA</span>
          </div>
        </div>

        <span className="nasa-attribution-tag">
          NASA DONKI API
        </span>
      </div>

      {/* Advisory Banner */}
      <div className={`space-weather-advisory-banner ${riskMeta.className}`}>
        <span className="advisory-icon" aria-hidden="true">{riskMeta.icon}</span>
        <div className="advisory-text-group">
          <div className="advisory-risk-label">{riskMeta.label}</div>
          <p className="advisory-message">
            {spaceWeather?.advisory || 'Solar activity detected. Verify outpost radiation shielding systems.'}
          </p>
        </div>
      </div>

      {/* Events List (Flares & CMEs) */}
      {!hasData ? (
        <div className="empty-panel-notice">
          <span className="empty-icon">🛰️</span>
          <p>NASA DONKI space weather telemetry is currently in standby.</p>
          <span className="empty-subtext">
            No severe solar flares or Coronal Mass Ejections (CMEs) currently logged.
          </span>
        </div>
      ) : (
        <div className="space-weather-events-list">
          {spaceWeather.events.map((event, idx) => (
            <div key={event.id || `sw-event-${idx}`} className="space-weather-event-card">
              <div className="event-card-header">
                <div className="event-type-group">
                  <span className="event-type-pill">{event.type}</span>
                  {event.classType && (
                    <span className="event-class-badge">{event.classType}</span>
                  )}
                </div>
                {event.radiationRisk && (
                  <span className={`event-risk-badge risk-${event.radiationRisk.toLowerCase()}`}>
                    {event.radiationRisk} Radiation Risk
                  </span>
                )}
              </div>

              <div className="event-meta-row">
                {event.eventDate && (
                  <span className="event-meta-item">
                    <strong>Recorded:</strong> {event.eventDate}
                  </span>
                )}
                {event.activeRegion && (
                  <span className="event-meta-item">
                    <strong>Source:</strong> {event.activeRegion}
                  </span>
                )}
              </div>

              {event.description && (
                <p className="event-description-text">{event.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Attribution & Scientific Note */}
      <div className="nasa-panel-footer">
        <p className="scientific-clarification-note">
          <strong>Scientific Note:</strong> NASA DONKI telemetry monitors actual solar events.
          Simulated game radiation levels reflect local habitat shield penetration.
        </p>
        <span className="nasa-api-credit">
          {spaceWeather?.observationSource || 'Data provided by NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)'}
        </span>
      </div>
    </div>
  );
}

export default NasaSpaceWeatherPanel;
