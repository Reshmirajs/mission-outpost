import React from 'react';
import { deriveResourceAlerts } from './dashboardUtils';

/**
 * Returns visual metadata for alert severity.
 * @param {'info'|'warning'|'critical'} type
 */
function getAlertSeverity(type) {
  switch (type) {
    case 'critical':
      return {
        icon: '🚨',
        label: 'CRITICAL',
        containerClass: 'alert-box-critical',
      };
    case 'warning':
      return {
        icon: '⚠️',
        label: 'WARNING',
        containerClass: 'alert-box-warning',
      };
    case 'info':
    default:
      return {
        icon: 'ℹ️',
        label: 'INFO',
        containerClass: 'alert-box-info',
      };
  }
}

/**
 * AlertsPanel Component
 * Displays system warnings, dynamically generated threshold alarms, and informational messages.
 */
function AlertsPanel({
  alerts = [],
  resources = null,
}) {
  // Automatically generate resource alerts and combine with explicit custom alerts
  const dynamicAlerts = resources ? deriveResourceAlerts(resources) : [];
  const combinedAlerts = [...dynamicAlerts, ...(Array.isArray(alerts) ? alerts : [])];

  // Count active warnings and criticals
  const criticalCount = combinedAlerts.filter(a => a.type === 'critical').length;
  const warningCount = combinedAlerts.filter(a => a.type === 'warning').length;

  return (
    <div className="dashboard-panel alerts-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">📡</span>
          <h3>Habitat Alarms &amp; Telemetry Feed</h3>
        </div>

        {/* Severity counters */}
        <div className="alert-count-tags">
          {criticalCount > 0 && (
            <span className="badge-critical-count">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="badge-warning-count">
              {warningCount} Warning
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="badge-nominal-count">
              Nominal
            </span>
          )}
        </div>
      </div>

      {/* Alert Feed */}
      {combinedAlerts.length === 0 ? (
        <div className="nominal-status-box">
          <span className="nominal-pulse-ring" aria-hidden="true">🛡️</span>
          <div className="nominal-text-group">
            <h4>All Systems Operating Within Safe Thresholds</h4>
            <p>No active atmospheric, electrical, or radiation hazards detected.</p>
          </div>
        </div>
      ) : (
        <div className="alerts-feed-list">
          {combinedAlerts.map((alert, index) => {
            const severity = getAlertSeverity(alert.type);

            return (
              <div
                key={alert.id || `alert-${index}`}
                className={`alert-entry-card ${severity.containerClass}`}
              >
                <div className="alert-left-symbol" aria-hidden="true">
                  <span className="alert-emoji">{severity.icon}</span>
                </div>

                <div className="alert-content-body">
                  <div className="alert-headline-row">
                    <span className="alert-title-text">{alert.title}</span>
                    <span className={`alert-severity-pill pill-${alert.type}`}>
                      {severity.label}
                    </span>
                  </div>

                  <p className="alert-detail-message">{alert.message}</p>

                  {alert.timestamp && (
                    <span className="alert-time-tag">{alert.timestamp}</span>
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

export default AlertsPanel;
