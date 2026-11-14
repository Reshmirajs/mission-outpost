import React from 'react';

/**
 * Returns status badges for mission objectives.
 * @param {'active'|'completed'|'at_risk'} status
 */
function getObjectiveBadge(status) {
  switch (status) {
    case 'completed':
      return {
        label: 'COMPLETED',
        badgeClass: 'obj-badge-completed',
        icon: '✓',
      };
    case 'at_risk':
      return {
        label: 'AT RISK',
        badgeClass: 'obj-badge-at-risk',
        icon: '⚠️',
      };
    case 'active':
    default:
      return {
        label: 'IN PROGRESS',
        badgeClass: 'obj-badge-active',
        icon: '⏳',
      };
  }
}

/**
 * ObjectivesPanel Component
 * Displays survival directives, milestone statuses (Active, Completed, At Risk), and descriptions.
 */
function ObjectivesPanel({ objectives = [] }) {
  const safeObjectives = Array.isArray(objectives) ? objectives : [];

  return (
    <div className="dashboard-panel objectives-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">🎯</span>
          <h3>Expedition Directives</h3>
        </div>
        <span className="panel-counter-badge">
          {safeObjectives.filter(o => o.status === 'completed').length} / {safeObjectives.length} Directives Met
        </span>
      </div>

      {/* Objectives List */}
      {safeObjectives.length === 0 ? (
        <div className="empty-panel-notice">
          <span className="empty-icon">📋</span>
          <p>No active directives assigned.</p>
          <span className="empty-subtext">Awaiting mission command briefing.</span>
        </div>
      ) : (
        <div className="objectives-list">
          {safeObjectives.map((objective, index) => {
            const badge = getObjectiveBadge(objective.status);

            return (
              <div
                key={objective.id || `objective-${index}`}
                className={`objective-card status-${objective.status}`}
              >
                {/* Left status indicator icon */}
                <div className="objective-icon-col" aria-hidden="true">
                  <span className={`status-indicator-glyph glyph-${objective.status}`}>
                    {badge.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="objective-body">
                  <div className="objective-title-row">
                    <span className="objective-title-text">{objective.title}</span>
                    <span className={`objective-status-badge ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </div>
                  {objective.description && (
                    <p className="objective-desc-text">{objective.description}</p>
                  )}
                  {objective.category && (
                    <span className="objective-category-tag">
                      {objective.category}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ObjectivesPanel;
