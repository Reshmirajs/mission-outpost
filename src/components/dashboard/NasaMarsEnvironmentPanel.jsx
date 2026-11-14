import React, { useState } from 'react';

function formatCreatedDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

/** Shows one NASA Image Library rover image or the clearly labelled demo fallback. */
function NasaMarsEnvironmentPanel({ marsEnvironment = null }) {
  const [imageError, setImageError] = useState(false);

  const status = marsEnvironment?.status || 'unavailable';
  const isFallback = status === 'fallback';
  const isLive = status === 'live';
  const hasImage = Boolean(marsEnvironment?.imageUrl && !imageError);
  const marsTrek = isFallback ? marsEnvironment?.marsTrek : null;
  const panelLabel = isFallback
    ? 'DEMO FALLBACK · NOT A LIVE SEARCH RESULT'
    : isLive
      ? 'LIVE NASA IMAGE LIBRARY RESULT'
      : status === 'loading'
        ? 'NASA IMAGE SEARCH LOADING'
        : status === 'no-results'
          ? 'NO NASA RESULTS'
          : 'NASA IMAGE SEARCH UNAVAILABLE';

  return (
    <div className="dashboard-panel nasa-panel nasa-mars-environment-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">🔴</span>
          <div>
            <h3>Mars Environment &amp; Surface Imagery</h3>
            <span className="nasa-disclaimer-pill">{panelLabel}</span>
          </div>
        </div>
        <span className="nasa-attribution-tag">
          {isFallback ? 'Demo preview' : 'NASA Image and Video Library'}
        </span>
      </div>

      {status === 'loading' && (
        <div className="empty-panel-notice" role="status" aria-live="polite">
          <p>Searching NASA for Mars rover images…</p>
        </div>
      )}

      {status === 'no-results' && (
        <div className="empty-panel-notice" role="status">
          <p>No Mars rover images were returned by NASA’s Image and Video Library search.</p>
        </div>
      )}

      {isFallback && (
        <div className="empty-panel-notice" role="alert">
          <p>NASA imagery is unavailable. Showing a demo fallback image.</p>
          {marsEnvironment.error && <span className="empty-subtext">{marsEnvironment.error}</span>}
        </div>
      )}

      {status === 'error' && (
        <div className="empty-panel-notice" role="alert">
          <p>NASA imagery could not be loaded.</p>
          {marsEnvironment.error && <span className="empty-subtext">{marsEnvironment.error}</span>}
        </div>
      )}

      {status === 'unavailable' && (
        <div className="empty-panel-notice" role="status">
          <p>NASA image data is not available in this preview.</p>
        </div>
      )}

      {(isLive || isFallback) && (
        <div className="mars-environment-content">
          <div className="rover-image-card">
            <div className="rover-image-wrapper">
              {hasImage ? (
                <img
                  src={marsEnvironment.imageUrl}
                  alt={marsEnvironment.title || marsEnvironment.description || 'Mars rover image'}
                  className="rover-photo-element"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="rover-photo-placeholder" role="status">
                  <span className="placeholder-icon">🪐</span>
                  <span className="placeholder-text">NASA image could not be displayed.</span>
                </div>
              )}

              <div className="rover-photo-overlay">
                <span className="overlay-rover-tag">{isFallback ? 'DEMO IMAGE' : 'NASA IMAGE'}</span>
              </div>
            </div>

            {(marsEnvironment.title || marsEnvironment.description || marsEnvironment.caption
              || marsEnvironment.dateCreated || marsEnvironment.photographer || marsEnvironment.center
              || marsEnvironment.location || marsEnvironment.nasaId) && (
              <div className="rover-photo-caption-block">
                {marsEnvironment.title && <p className="rover-caption-text">{marsEnvironment.title}</p>}
                {marsEnvironment.description && <p className="rover-caption-text">{marsEnvironment.description}</p>}
                {marsEnvironment.caption && <p className="rover-caption-text">{marsEnvironment.caption}</p>}
                {isLive && (
                  <div className="rover-meta-chips">
                    {marsEnvironment.dateCreated && (
                      <span className="meta-chip"><strong>Date created:</strong> {formatCreatedDate(marsEnvironment.dateCreated)}</span>
                    )}
                    {marsEnvironment.photographer && (
                      <span className="meta-chip"><strong>Photographer:</strong> {marsEnvironment.photographer}</span>
                    )}
                    {marsEnvironment.center && (
                      <span className="meta-chip"><strong>NASA center:</strong> {marsEnvironment.center}</span>
                    )}
                    {marsEnvironment.location && (
                      <span className="meta-chip"><strong>Location:</strong> {marsEnvironment.location}</span>
                    )}
                    {marsEnvironment.nasaId && (
                      <span className="meta-chip"><strong>NASA ID:</strong> {marsEnvironment.nasaId}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {marsTrek && (
            <div className="mars-trek-terrain-card">
              <div className="trek-header-row">
                <span className="trek-title">Demo terrain context</span>
                <span className="trek-source-badge">DEMO ONLY · UNVERIFIED</span>
              </div>

              <div className="trek-details-grid">
                {marsTrek.featureName && (
                  <div className="trek-detail-item">
                    <span className="trek-label">SAMPLE FEATURE</span>
                    <span className="trek-value">{marsTrek.featureName}</span>
                  </div>
                )}
                {marsTrek.coordinates && (
                  <div className="trek-detail-item">
                    <span className="trek-label">SAMPLE COORDINATES</span>
                    <span className="trek-value">{marsTrek.coordinates}</span>
                  </div>
                )}
                {marsTrek.elevation && (
                  <div className="trek-detail-item">
                    <span className="trek-label">SAMPLE ELEVATION</span>
                    <span className="trek-value">{marsTrek.elevation}</span>
                  </div>
                )}
              </div>

              {marsTrek.terrainDescription && <p className="trek-description">{marsTrek.terrainDescription}</p>}
              <p className="trek-description">This terrain information is unverified demo content, not NASA Image Library metadata.</p>
            </div>
          )}

          <div className="nasa-panel-footer">
            {isLive && marsEnvironment.attribution && (
              <span className="nasa-api-credit">Photo credit: {marsEnvironment.attribution}</span>
            )}
            {isLive && marsEnvironment.sourceUrl && (
              <a className="nasa-api-credit" href={marsEnvironment.sourceUrl} target="_blank" rel="noreferrer">
                View NASA media record
              </a>
            )}
            {isFallback && <span className="nasa-api-credit">Demo fallback image; not selected by the live NASA search.</span>}
            <a className="nasa-api-credit" href="https://images.nasa.gov/" target="_blank" rel="noreferrer">
              NASA Image and Video Library
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default NasaMarsEnvironmentPanel;
