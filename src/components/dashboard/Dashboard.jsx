import MissionStatus from './MissionStatus.jsx'
import OutpostCrewCard from './OutpostCrewCard.jsx'
import OutpostSystemsPanel from './OutpostSystemsPanel.jsx'
import ObjectivesPanel from './ObjectivesPanel.jsx'
import NasaInsightsCard from './NasaInsightsCard.jsx'
import CrewChat from '../chat/CrewChat.jsx'
import CrisisVotingCard from './CrisisVotingCard.jsx'
import {
  mockResources,
  mockMission,
  mockCrew,
  mockObjectives,
  mockNasaSpaceWeather,
  mockNasaMarsEnvironment,
} from './mockDashboardData.js'
import './Dashboard.css'

/**
 * MISSION: OUTPOST — Multiplayer Mission Dashboard
 * NASA Space Apps Challenge 2026
 *
 * Implements the 3-Column Mission Control Workspace:
 * - Left Column (approx 22%): Outpost info, 6-character room code, and actual Crew manifest.
 * - Centre Column (approx 48%): Mission status, 5 outpost resource systems, mission objectives, and NASA insights.
 * - Right Column (approx 30%): Real-time crew comms chat and active crisis decision voting.
 * - Top Navigation: Back to Habitat button when opened from the in-game map.
 */
export default function Dashboard({
  resources = null,
  mission = null,
  players = null,
  currentPlayer = null,
  objectives = null,
  activeCrisis = null,
  onVote = null,
  onApplyResourceDelta = null,
  onBackToHabitat = null,
  spaceWeather = null,
  marsEnvironment = null,
}) {
  const activeResources = resources || mockResources
  const activeMission = mission || mockMission
  const activePlayers = (Array.isArray(players) && players.length > 0) ? players : mockCrew
  const activeObjectives = objectives || mockObjectives
  const activeSpaceWeather = spaceWeather || mockNasaSpaceWeather
  const activeMarsEnvironment = marsEnvironment || mockNasaMarsEnvironment

  return (
    <div className="mars-dashboard" role="region" aria-label="Mars Mission Control Dashboard">
      {/* Top Header Bar */}
      <header className="dashboard-top-bar">
        <div className="dashboard-heading-group">
          <span className="dashboard-mars-orb" aria-hidden="true" />
          <div>
            <h2 className="dashboard-title">Habitat Command // Mission Control</h2>
            <div className="dashboard-subtitle">
              Mission: Outpost &bull; Sector 4 Jezero Crater Base &bull; Powered by NASA Open Data
            </div>
          </div>
        </div>

        <div className="dashboard-header-badges">
          {/* Back to Habitat Map Action (Visible when navigated from in-game HUD) */}
          {onBackToHabitat && (
            <button
              type="button"
              className="btn-back-to-habitat"
              onClick={onBackToHabitat}
              title="Return to the in-game Phaser habitat map"
            >
              <span className="back-arrow" aria-hidden="true">←</span>
              <span>Back to Habitat</span>
            </button>
          )}

          <div className="dashboard-telemetry-badge">
            <span className="telemetry-pulse-dot" aria-hidden="true" />
            <span>REAL-TIME TELEMETRY FEED // SYNCHRONIZED</span>
          </div>

          <span className="nasa-partner-badge">
            NASA SPACE APPS CHALLENGE 2026
          </span>
        </div>
      </header>

      {/* 3-Column Dashboard Body */}
      <main className="dashboard-three-columns-layout">
        {/* ==============================================================
            LEFT COLUMN (approx 22%): Outpost & Crew
            ============================================================== */}
        <aside className="dashboard-col-left" aria-label="Outpost and Crew Manifest">
          <OutpostCrewCard
            mission={activeMission}
            players={activePlayers}
            currentPlayer={currentPlayer}
          />
        </aside>

        {/* ==============================================================
            CENTRE COLUMN (approx 48%): Mission Control Telemetry
            ============================================================== */}
        <section className="dashboard-col-center" aria-label="Mission Telemetry and Objectives">
          {/* A. Mission Status Overview */}
          <div className="centre-module-block">
            <MissionStatus
              mission={activeMission}
              crewCount={activePlayers.length}
            />
          </div>

          {/* B. Outpost Systems (5 Resources) */}
          <div className="centre-module-block">
            <OutpostSystemsPanel resources={activeResources} />
          </div>

          {/* C. Mission Objectives */}
          <div className="centre-module-block">
            <ObjectivesPanel objectives={activeObjectives} />
          </div>

          {/* D. NASA & Mars Insights */}
          <div className="centre-module-block">
            <NasaInsightsCard
              spaceWeather={activeSpaceWeather}
              marsEnvironment={activeMarsEnvironment}
            />
          </div>
        </section>

        {/* ==============================================================
            RIGHT COLUMN (approx 30%): Crew Comms & Crisis Voting
            ============================================================== */}
        <aside className="dashboard-col-right" aria-label="Crew Comms and Crisis Decisions">
          {/* A. Crew Chat */}
          <div className="right-module-block">
            <CrewChat
              roomCode={activeMission?.roomCode}
              currentPlayer={currentPlayer}
            />
          </div>

          {/* B. Active Crisis and Voting */}
          <div className="right-module-block">
            <CrisisVotingCard
              activeCrisis={activeCrisis}
              players={activePlayers}
              currentPlayer={currentPlayer}
              onVote={onVote}
              onApplyResourceDelta={onApplyResourceDelta}
            />
          </div>
        </aside>
      </main>
    </div>
  )
}
