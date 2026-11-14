import React, { useEffect } from 'react';
import './Events.css';

/**
 * Returns role badge styling and icon for a given astronaut role.
 *
 * @param {string} role
 * @returns {{ icon: string, label: string, colorClass: string }}
 */
function getRoleMeta(role) {
  const r = String(role || '').toLowerCase();
  if (r.includes('commander')) {
    return { icon: '⭐', label: 'Commander', colorClass: 'role-commander' };
  }
  if (r.includes('engineer')) {
    return { icon: '⚡', label: 'Engineer', colorClass: 'role-engineer' };
  }
  if (r.includes('botanist')) {
    return { icon: '🌱', label: 'Botanist', colorClass: 'role-botanist' };
  }
  if (r.includes('medic') || r.includes('life support')) {
    return { icon: '🫧', label: 'Medic', colorClass: 'role-medic' };
  }
  if (r.includes('scientist')) {
    return { icon: '🔬', label: 'Scientist', colorClass: 'role-scientist' };
  }
  return { icon: '🧑‍🚀', label: role || 'Crew', colorClass: 'role-unassigned' };
}

/**
 * Formats a resource delta for display with appropriate indicator styling.
 *
 * @param {'oxygen'|'power'|'food'|'radiation'} key
 * @param {number} value
 * @returns {{ text: string, statusClass: string, icon: string, label: string }}
 */
function formatResourceDelta(key, value) {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const isRadiation = key === 'radiation';

  let icon = '📊';
  let label = 'Resource';
  if (key === 'oxygen') { icon = '🫧'; label = 'O2'; }
  else if (key === 'power') { icon = '⚡'; label = 'Pwr'; }
  else if (key === 'food') { icon = '🌱'; label = 'Food'; }
  else if (key === 'radiation') { icon = '☢️'; label = 'Rad'; }

  if (num === 0) {
    return { text: `0%`, statusClass: 'delta-neutral', icon, label };
  }

  const sign = num > 0 ? `+${num}%` : `${num}%`;

  // For life support, positive is good (gain), negative is bad (drain)
  // For radiation, positive is bad (danger), negative is good (reduction)
  let isPositive = num > 0;
  if (isRadiation) {
    isPositive = num < 0;
  }

  return {
    text: sign,
    statusClass: isPositive ? 'delta-positive' : 'delta-negative',
    icon,
    label,
  };
}

/**
 * EventModal Component
 *
 * High-visibility Mars mission-control emergency modal.
 * Displays critical incident briefing, strategic decision options, resource deltas,
 * specialist role recommendations, and decision selection controls.
 *
 * Does not directly modify mission state or life-support resources.
 *
 * @param {Object} props
 * @param {Object} [props.event] - Active event object (title, category, severity, description, options).
 * @param {boolean} [props.isOpen=true] - Whether the modal dialog is visible.
 * @param {Function} [props.onClose] - Callback fired when close button or backdrop is clicked.
 * @param {string} [props.selectedOptionId] - ID of the currently selected option.
 * @param {Function} [props.onSelectOption] - Callback fired when an option is selected: (optionId) => void.
 * @param {React.ReactNode} [props.children] - Optional slot to embed VotingPanel or EventResolution inside the modal.
 * @param {string} [props.confirmLabel] - Label for action button (e.g. 'Lock In Decision').
 * @param {Function} [props.onConfirm] - Callback fired when the action button is clicked: (optionId) => void.
 */
export function EventModal({
  event = null,
  isOpen = true,
  onClose,
  selectedOptionId = '',
  onSelectOption,
  children,
  confirmLabel = 'Select Decision',
  onConfirm,
}) {
  // Listen for Escape key to close modal gracefully
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) {
    return null;
  }

  const severity = String(event.severity || 'warning').toLowerCase();
  const options = Array.isArray(event.options) ? event.options : [];

  return (
    <div
      className="event-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function') {
          onClose();
        }
      }}
    >
      <div
        className={`event-modal-dialog severity-${severity}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-event-title"
        aria-describedby="modal-event-desc"
      >
        {/* Header Bar */}
        <header className="event-modal-header">
          <div className="modal-header-left">
            <div className="modal-event-icon-badge" aria-hidden="true">
              {event.icon || '🚨'}
            </div>
            <div className="modal-title-group">
              <span className="modal-event-category">
                {event.category || 'Environmental Alert'}
              </span>
              <h2 id="modal-event-title" className="modal-event-title">
                {event.title || 'Martian Crisis Alert'}
              </h2>
            </div>
          </div>

          <div className="modal-header-controls">
            <div className={`severity-badge badge-${severity}`}>
              <span className="severity-dot" aria-hidden="true" />
              <span>{severity.toUpperCase()}</span>
            </div>

            {typeof onClose === 'function' && (
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close event dispatch"
                title="Dismiss modal"
              >
                &times;
              </button>
            )}
          </div>
        </header>

        {/* Modal Body */}
        <div className="event-modal-body">
          {/* Situational Briefing */}
          <section className="event-briefing-box" aria-label="Incident Briefing">
            <div className="briefing-header-tag">Incident Telemetry // Dispatch</div>
            <p id="modal-event-desc" className="briefing-description-text">
              {event.description || 'No situational telemetry recorded.'}
            </p>
          </section>

          {/* If child components (e.g. VotingPanel or EventResolution) are provided, render them */}
          {children ? (
            <div className="modal-embedded-content">{children}</div>
          ) : (
            /* Otherwise render default options selection grid */
            <section className="modal-options-section" aria-label="Available Protocol Directives">
              <div className="options-section-label">
                <span>Directives &amp; Action Protocols</span>
                <span className="options-count-badge">
                  {options.length} Strategic Choices
                </span>
              </div>

              <div className="event-options-grid" role="radiogroup" aria-label="Emergency options">
                {options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const roleMeta = getRoleMeta(option.recommendedRole);
                  const delta = option.delta || {};

                  return (
                    <div
                      key={option.id}
                      className={`event-option-card ${isSelected ? 'is-selected' : ''}`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => {
                        if (typeof onSelectOption === 'function') {
                          onSelectOption(option.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && typeof onSelectOption === 'function') {
                          e.preventDefault();
                          onSelectOption(option.id);
                        }
                      }}
                    >
                      {/* Option Header */}
                      <div className="option-card-header">
                        <h4 className="option-title-text">{option.title}</h4>
                        <div className="option-radio-indicator" aria-hidden="true">
                          {isSelected && <div className="option-radio-dot" />}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="option-description-text">{option.description}</p>

                      {/* Projected Resource Deltas */}
                      <div className="option-deltas-row" aria-label="Projected resource changes">
                        {['oxygen', 'power', 'food', 'radiation'].map((resKey) => {
                          const deltaInfo = formatResourceDelta(resKey, delta[resKey]);
                          return (
                            <span
                              key={resKey}
                              className={`resource-delta-chip ${deltaInfo.statusClass}`}
                              title={`${deltaInfo.label}: ${deltaInfo.text}`}
                            >
                              <span>{deltaInfo.icon}</span>
                              <span>{deltaInfo.label}</span>
                              <span>{deltaInfo.text}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Specialist Role Recommendation */}
                      {option.recommendedRole && (
                        <div className="option-role-box">
                          <div className="role-tag-row">
                            <span className="role-mini-icon" aria-hidden="true">{roleMeta.icon}</span>
                            <span className={`role-badge-pill ${roleMeta.colorClass}`}>
                              Recommended: {roleMeta.label}
                            </span>
                          </div>
                          {option.rationale && (
                            <p className="role-rationale-text">{option.rationale}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer Controls (when not rendering custom children) */}
        {!children && (
          <footer className="event-modal-footer">
            {typeof onClose === 'function' && (
              <button
                type="button"
                className="btn-mars-secondary"
                onClick={onClose}
              >
                Dismiss
              </button>
            )}

            {typeof onConfirm === 'function' && (
              <button
                type="button"
                className="btn-mars-primary"
                disabled={!selectedOptionId}
                onClick={() => onConfirm(selectedOptionId)}
              >
                {confirmLabel}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

export default EventModal;
