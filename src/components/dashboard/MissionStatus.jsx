import React from 'react';
import { MissionStatus as StatusEnum } from '../../types/game';

/**
 * Returns user-friendly status badge label and style class.
 * @param {string} status
 */
function getStatusMeta(status) {
  switch (status) {
    case StatusEnum.IN_PROGRESS:
      return { label: 'MISSION ACTIVE', className: 'status-active' };
    case StatusEnum.COMPLETED:
      return { label: 'MISSION ACCOMPLISHED', className: 'status-completed' };
    case StatusEnum.FAILED:
      return { label: 'OUTPOST COMPROMISED', className: 'status-failed' };
    case StatusEnum.LOBBY:
    default:
      return { label: 'EXPEDITION STANDBY', className: 'status-lobby' };
  }
}

/**
 * MissionStatus Component
 * Displays overall outpost status: Current Sol, lifecycle status, crew count, and mission progress.
 */
function MissionStatus({
  mission = {},
  crewCount = 0,
}) {
  const currentSol = mission?.round ?? 1;
  const targetSols = mission?.targetSols ?? 30;
  const status = mission?.status || StatusEnum.LOBBY;
  const roomCode = mission?.roomCode || 'SOLO';

  // Calculate percentage of Sol mission duration completed (clamped 0 - 100)
  const progressPercent = Math.min(100, Math.round((currentSol / Math.max(1, targetSols)) * 100));
  const statusMeta = getStatusMeta(status);

  // Formatted 3-digit Sol string (e.g., SOL 012)
  const formattedSol = String(currentSol).padStart(3, '0');

  return (
    <div className="mission-status-strip">
      {/* Sol Indicator */}
      <div className="status-item sol-indicator">
        <span className="status-item-label">MARTIAN CYCLE</span>
        <div className="sol-badge">
          <span className="sol-prefix">SOL</span>
          <span className="sol-number">{formattedSol}</span>
        </div>
      </div>

      {/* Operational Lifecycle Status */}
      <div className="status-item lifecycle-indicator">
        <span className="status-item-label">MISSION STATUS</span>
        <div className={`status-pill ${statusMeta.className}`}>
          <span className="status-dot-pulse" aria-hidden="true" />
          <span className="status-pill-text">{statusMeta.label}</span>
        </div>
      </div>

      {/* Crew Headcount */}
      <div className="status-item crew-indicator">
        <span className="status-item-label">ACTIVE CREW</span>
        <div className="crew-count-value">
          <span className="crew-icon" aria-hidden="true">🧑‍🚀</span>
          <span className="count-number">{crewCount}</span>
          <span className="count-max">/ 6</span>
        </div>
      </div>

      {/* Mission Sol Progress Bar */}
      <div className="status-item progress-indicator">
        <div className="progress-label-row">
          <span className="status-item-label">EXPEDITION PROGRESS</span>
          <span className="progress-percent-text">{progressPercent}%</span>
        </div>
        <div
          className="mission-progress-track"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Expedition completion progress"
        >
          <div
            className="mission-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="progress-target-hint">
          Sol {currentSol} of {targetSols} Target Sols
        </span>
      </div>

      {/* Room Access Code */}
      <div className="status-item room-indicator">
        <span className="status-item-label">OUTPOST FREQUENCY</span>
        <span className="room-code-tag">{roomCode}</span>
      </div>
    </div>
  );
}

export default MissionStatus;
