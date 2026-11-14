import React from 'react';

function formatUtcTimestamp(value) {
  if (!value) return 'Time not provided';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)} UTC`;
}

/** Displays NASA DONKI observations without treating them as Mars radiation readings. */
function NasaSpaceWeatherPanel({ spaceWeather = null }) {
  const status = spaceWeather?.status || 'unavailable';
  const events = Array.isArray(spaceWeather?.events) ? spaceWeather.events : [];
  const isFallback = status === 'fallback';
  const hasLiveData = status === 'live' || status === 'partial';
  const panelLabel = isFallback
    ? 'DEMO FALLBACK · NOT LIVE NASA DATA'
    : status === 'partial'
      ? 'PARTIAL LIVE NASA OBSERVATIONS'
      : status === 'loading'
        ? 'NASA FEED LOADING'
        : status === 'error'
          ? 'NASA FEED ERROR'
          : 'NASA SOLAR EVENT OBSERVATIONS';

  return (
    <div className="dashboard-panel nasa-panel nasa-space-weather-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">☀️</span>
          <div>
            <h3>NASA Space Weather (DONKI)</h3>
            <span className="nasa-disclaimer-pill">
              {panelLabel}
            </span>
          </div>
        </div>
        <span className="nasa-attribution-tag">NASA DONKI</span>
      </div>

      <div className="space-weather-advisory-banner">
        <span className="advisory-text-group">
          <span className="advisory-risk-label">Observation feed</span>
          <span className="advisory-message">
            Solar flare and CME records are observations. This panel does not calculate Mars surface radiation,
            crew exposure, or game effects from them.
          </span>
        </span>
      </div>

      {status === 'loading' && (
        <div className="empty-panel-notice" role="status" aria-live="polite">
          <p>Loading NASA DONKI solar flare and CME observations…</p>
        </div>
      )}

      {isFallback && (
        <div className="empty-panel-notice" role="alert">
          <p>NASA data is unavailable. Showing clearly labelled demo examples.</p>
          {spaceWeather.error && <span className="empty-subtext">{spaceWeather.error}</span>}
        </div>
      )}

      {status === 'partial' && Array.isArray(spaceWeather.failures) && (
        <div className="empty-panel-notice" role="alert">
          <p>Some NASA DONKI data could not be loaded. Events from the successful endpoint are still shown.</p>
          {spaceWeather.failures.map((failure) => (
            <span className="empty-subtext" key={failure.eventType}>
              {failure.eventType} endpoint: {failure.message}
            </span>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="empty-panel-notice" role="alert">
          <p>NASA DONKI data could not be displayed.</p>
          {spaceWeather.error && <span className="empty-subtext">{spaceWeather.error}</span>}
        </div>
      )}

      {hasLiveData && spaceWeather.usedDemoKey && (
        <div className="empty-panel-notice" role="status">
          <p>No NASA API key is configured; this request used NASA’s limited DEMO_KEY.</p>
          <span className="empty-subtext">Add VITE_NASA_API_KEY to your local environment for a higher request limit.</span>
        </div>
      )}

      {hasLiveData && events.length === 0 && (
        <div className="empty-panel-notice" role="status">
          <p>
            {status === 'partial'
              ? 'The successful endpoint returned no events for the selected seven-day period.'
              : 'No solar flare or CME events were returned for the selected seven-day period.'}
          </p>
          <span className="empty-subtext">An empty response is reported as no events, not as a hazard level.</span>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-weather-events-list">
          {events.map((event, index) => (
            <article key={event.id || `sw-event-${index}`} className="space-weather-event-card">
              <div className="event-card-header">
                <div className="event-type-group">
                  <span className="event-type-pill">{event.type || 'Solar event'}</span>
                  {event.classType && <span className="event-class-badge">{event.classType}</span>}
                </div>
              </div>

              <div className="event-meta-row">
                <span className="event-meta-item">
                  <strong>Event time (UTC):</strong> {formatUtcTimestamp(event.eventDate)}
                </span>
                {event.activeRegion && (
                  <span className="event-meta-item">
                    <strong>Location / active region:</strong> {event.activeRegion}
                  </span>
                )}
              </div>

              {event.description && <p className="event-description-text">{event.description}</p>}

              {Array.isArray(event.details) && event.details.length > 0 && (
                <ul className="event-description-text">
                  {event.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              )}

              {event.sourceUrl && (
                <a className="nasa-api-credit" href={event.sourceUrl} target="_blank" rel="noreferrer">
                  Open NASA DONKI event record
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="nasa-panel-footer">
        <p className="scientific-clarification-note">
          <strong>Scientific note:</strong> DONKI reports solar events observed and analyzed by NASA.
          These records are not direct radiation measurements at the fictional outpost.
        </p>
        <span className="nasa-api-credit">
          {spaceWeather?.observationSource || 'NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)'}
          {spaceWeather?.dateRange && ` · ${spaceWeather.dateRange.startDate} to ${spaceWeather.dateRange.endDate} UTC`}
        </span>
        <a className="nasa-api-credit" href={spaceWeather?.nasaApiUrl || 'https://api.nasa.gov/DONKI'} target="_blank" rel="noreferrer">
          NASA DONKI API source
        </a>
      </div>
    </div>
  );
}

export default NasaSpaceWeatherPanel;
