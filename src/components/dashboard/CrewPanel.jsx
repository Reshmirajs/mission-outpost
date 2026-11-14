import React from 'react';
import { PlayerRoles } from '../../types/game';

/**
 * Returns role icons and styling badges for crew roles.
 * @param {string} role
 */
function getRoleBadge(role) {
  switch (role) {
    case PlayerRoles.COMMANDER:
      return { icon: '⭐', label: 'Commander', colorClass: 'role-commander' };
    case PlayerRoles.ENGINEER:
      return { icon: '🔧', label: 'Engineer', colorClass: 'role-engineer' };
    case PlayerRoles.BOTANIST:
      return { icon: '🌱', label: 'Botanist', colorClass: 'role-botanist' };
    case PlayerRoles.MEDIC:
      return { icon: '💊', label: 'Medic', colorClass: 'role-medic' };
    case PlayerRoles.SCIENTIST:
      return { icon: '🔬', label: 'Scientist', colorClass: 'role-scientist' };
    case PlayerRoles.UNASSIGNED:
    default:
      return { icon: '👤', label: 'Unassigned', colorClass: 'role-unassigned' };
  }
}

/**
 * CrewPanel Component
 * Displays the list of connected astronauts, their assigned mission role, and readiness status.
 * Handles up to 6 players in a clean, responsive card layout.
 */
function CrewPanel({ players = [] }) {
  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <div className="dashboard-panel crew-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-icon" aria-hidden="true">👥</span>
          <h3>Habitat Crew Manifest</h3>
        </div>
        <span className="panel-counter-badge">
          {safePlayers.length} / 6 Personnel
        </span>
      </div>

      {/* Crew Grid */}
      {safePlayers.length === 0 ? (
        <div className="empty-panel-notice">
          <span className="empty-icon">🛰️</span>
          <p>No crew members registered yet.</p>
          <span className="empty-subtext">Awaiting astronaut arrival via airlock.</span>
        </div>
      ) : (
        <div className="crew-card-grid">
          {safePlayers.map((member, index) => {
            const roleInfo = getRoleBadge(member.role);
            const isReady = Boolean(member.ready);

            return (
              <div
                key={member.id || `crew-${index}`}
                className={`crew-member-card ${isReady ? 'is-ready' : 'is-standby'}`}
              >
                {/* Member Avatar / Icon */}
                <div className="crew-avatar-wrapper">
                  <span className="crew-avatar-icon">
                    {member.avatar || roleInfo.icon}
                  </span>
                  <span
                    className={`crew-status-dot ${isReady ? 'dot-ready' : 'dot-standby'}`}
                    title={isReady ? 'Active / Ready' : 'Standby'}
                    aria-label={isReady ? 'Active / Ready' : 'Standby'}
                  />
                </div>

                {/* Member Details */}
                <div className="crew-details">
                  <div className="crew-name-row">
                    <span className="crew-member-name" title={member.name || 'Unnamed Astronaut'}>
                      {member.name || 'Unnamed Astronaut'}
                    </span>
                    <span className={`crew-readiness-tag ${isReady ? 'tag-ready' : 'tag-standby'}`}>
                      {isReady ? 'READY' : 'STANDBY'}
                    </span>
                  </div>

                  {/* Role Tag */}
                  <div className="crew-role-row">
                    <span className={`role-badge ${roleInfo.colorClass}`}>
                      <span className="role-mini-icon" aria-hidden="true">{roleInfo.icon}</span>
                      <span>{roleInfo.label}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CrewPanel;
