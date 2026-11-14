import { useState } from 'react'
import { SPECIALIST_ROLES } from './educationalRoles.js'
import AstronautIllustration from './AstronautIllustration.jsx'

/**
 * SpecialistRoleSelector Component
 * Dedicated full-screen / large panel role-selection experience displaying
 * ONE specialist role at a time in a two-column format with standing astronaut
 * on the left and engineering responsibilities on the right.
 */
export default function SpecialistRoleSelector({
  currentRoleKey,
  players = [],
  currentPlayerId,
  onConfirmRole,
  onClose,
}) {
  // Find initial index from currentRoleKey, default to 0 (Mission Commander)
  const initialIndex = Math.max(
    0,
    SPECIALIST_ROLES.findIndex((r) => r.roleKey === currentRoleKey)
  )
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [slideDirection, setSlideDirection] = useState('forward')

  const activeRole = SPECIALIST_ROLES[currentIndex]

  // Role Availability Check
  const occupiedByOtherPlayer = players.find(
    (p) => p.id !== currentPlayerId && p.role === activeRole.roleKey
  )
  const isOccupiedBySelf = currentRoleKey === activeRole.roleKey
  const isTaken = Boolean(occupiedByOtherPlayer)

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      setSlideDirection('backward')
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < SPECIALIST_ROLES.length - 1) {
      setSlideDirection('forward')
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleConfirm = () => {
    if (isTaken) return
    onConfirmRole(activeRole.roleKey)
  }

  return (
    <div className="role-selector-backdrop" role="dialog" aria-modal="true" aria-labelledby="role-panel-title">
      <div className="specialist-role-modal-card">
        {/* Top Bar with Close Button */}
        <div className="role-modal-top-bar">
          <div className="role-modal-breadcrumb">
            <span className="breadcrumb-dot"></span>
            <span>OUTPOST CREW SPECIALIZATION // STATION ASSIGNMENT</span>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close role selector"
          >
            ×
          </button>
        </div>

        {/* Main Two-Column Container */}
        <div className={`role-modal-body slide-${slideDirection}`} key={activeRole.roleKey}>
          {/* LEFT COLUMN: STANDING ASTRONAUT CHARACTER */}
          <div className="role-col-character">
            <div className="character-stage-halo" style={{ background: activeRole.accentGlow }}></div>
            
            <div className="character-wrapper">
              <AstronautIllustration
                roleKey={activeRole.roleKey}
                size="large"
                isAnimated={true}
              />
            </div>

            <div className="character-gear-caption">
              <span className="gear-tag-label">SPECIALIST EVA RIG:</span>
              <span className="gear-tag-value" style={{ color: activeRole.suitTrim }}>
                {activeRole.specialistGear}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: ROLE INFORMATION & RESPONSIBILITIES */}
          <div className="role-col-details">
            {/* Header: Role counter & Availability */}
            <div className="role-details-header">
              <div className="role-counter-pill font-mono">
                ROLE {activeRole.roleNumber} OF {SPECIALIST_ROLES.length}
              </div>

              <div className="role-availability-badge">
                {isTaken ? (
                  <span className="badge-taken">
                    <span className="badge-dot red"></span> TAKEN // OCCUPIED BY {occupiedByOtherPlayer.name}
                  </span>
                ) : isOccupiedBySelf ? (
                  <span className="badge-assigned-self">
                    <span className="badge-dot green"></span> CURRENTLY ASSIGNED TO YOU
                  </span>
                ) : (
                  <span className="badge-available">
                    <span className="badge-dot green"></span> AVAILABLE FOR ASSIGNMENT
                  </span>
                )}
              </div>
            </div>

            {/* Role Title & Icon */}
            <div className="role-title-row">
              <span className="role-badge-icon" style={{ borderColor: activeRole.accentColor }}>
                {activeRole.icon}
              </span>
              <div>
                <h2 id="role-panel-title" className="role-main-title">
                  {activeRole.title}
                </h2>
                <span className="role-sub-badge" style={{ color: activeRole.suitTrim }}>
                  {activeRole.badge}
                </span>
              </div>
            </div>

            {/* Introduction */}
            <p className="role-intro-text">
              {activeRole.introduction}
            </p>

            {/* Key Responsibilities */}
            <div className="role-info-section">
              <h4 className="info-section-title">KEY RESPONSIBILITIES</h4>
              <ul className="responsibilities-list">
                {activeRole.responsibilities.map((resp, idx) => (
                  <li key={idx} className="resp-item">
                    <span className="resp-bullet" style={{ color: activeRole.accentColor }}>▹</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mission Capability */}
            <div className="role-info-section">
              <h4 className="info-section-title">MISSION CAPABILITY</h4>
              <p className="capability-text">
                {activeRole.missionCapability}
              </p>
            </div>

            {/* Why This Role Matters */}
            <div className="role-why-matters-box" style={{ borderColor: activeRole.accentColor }}>
              <div className="why-label" style={{ color: activeRole.suitTrim }}>
                WHY THIS MATTERS TO MARS SURVIVAL:
              </div>
              <p className="why-content">
                {activeRole.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION & CONFIRMATION BAR */}
        <div className="role-modal-bottom-bar">
          <div className="nav-controls-left">
            <button
              type="button"
              className="btn-nav-arrow"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Previous role"
            >
              ← PREVIOUS
            </button>

            {/* Role Steps Indicator (Dots) */}
            <div className="role-indicator-dots" aria-hidden="true">
              {SPECIALIST_ROLES.map((r, idx) => (
                <button
                  key={r.roleKey}
                  type="button"
                  className={`dot-step ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setSlideDirection(idx > currentIndex ? 'forward' : 'backward')
                    setCurrentIndex(idx)
                  }}
                  title={r.title}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn-nav-arrow"
              onClick={handleNext}
              disabled={currentIndex === SPECIALIST_ROLES.length - 1}
              aria-label="Next role"
            >
              NEXT →
            </button>
          </div>

          <div className="nav-actions-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            {isTaken ? (
              <button
                type="button"
                className="btn-primary btn-disabled-taken"
                disabled
                title={`This station is already claimed by ${occupiedByOtherPlayer.name}`}
              >
                STATION TAKEN
              </button>
            ) : isOccupiedBySelf ? (
              <button
                type="button"
                className="btn-primary btn-current-role"
                onClick={handleConfirm}
              >
                KEEP {activeRole.title.toUpperCase()}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary btn-confirm-role"
                onClick={handleConfirm}
                style={{
                  background: `linear-gradient(135deg, ${activeRole.accentColor} 0%, #d84315 100%)`,
                }}
              >
                CONFIRM {activeRole.title.toUpperCase()}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

