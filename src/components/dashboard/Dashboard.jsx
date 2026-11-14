import React from 'react';
import ResourceCard from './ResourceCard';
import MissionStatus from './MissionStatus';
import CrewPanel from './CrewPanel';
import ObjectivesPanel from './ObjectivesPanel';
import AlertsPanel from './AlertsPanel';
import NasaSpaceWeatherPanel from './NasaSpaceWeatherPanel';
import NasaMarsEnvironmentPanel from './NasaMarsEnvironmentPanel';
import NasaRadLabPanel from './NasaRadLabPanel';
import {
  mockResources,
  mockMission,
  mockCrew,
  mockObjectives,
  mockAlerts,
  mockNasaSpaceWeather,
  mockNasaMarsEnvironment,
  mockNasaRadLab,
} from './mockDashboardData';
import './Dashboard.css';

/**
 * Mars Dashboard Component (Person 2 - Mission: Outpost)
 * Extended with NASA Space Apps Scientific Resources (DONKI, Mars Rover Photos, Mars Trek, RadLab).
 *
 * Provides a real-time, responsive overview of habitat resources, mission status,
 * crew manifests, survival directives, hazard alarms, and real NASA astronomical data.
 *
 * @param {Object} props
 * @param {import('../../types/game').Resources} [props.resources] - Active habitat resources (oxygen, power, food, radiation).
 * @param {import('../../types/game').Mission} [props.mission] - Current mission session details.
 * @param {import('../../types/game').Player[]} [props.players] - List of connected crew astronauts.
 * @param {Array<Object>} [props.objectives] - Active and completed mission survival objectives.
 * @param {Array<Object>} [props.alerts] - Custom telemetry alerts and hazard notifications.
 * @param {Object} [props.nasaData] - Combined NASA payload from NASA integration teammate.
 * @param {Object} [props.spaceWeather] - Space weather observations from NASA DONKI.
 * @param {Object} [props.marsEnvironment] - Surface images & terrain context from NASA Mars Rover / Mars Trek.
 * @param {Object} [props.radLab] - Radiation dosimetry context from NASA RadLab.
 */
function Dashboard({
  resources,
  mission,
  players,
  objectives,
  alerts,
  nasaData,
  spaceWeather,
  marsEnvironment,
  radLab,
}) {
  // Gracefully fallback to mock data if props are omitted (for standalone preview and testing)
  const activeResources = resources || mockResources;
  const activeMission = mission || mockMission;
  const activePlayers = players || mockCrew;
  const activeObjectives = objectives || mockObjectives;
  const activeAlerts = alerts || mockAlerts;

  // NASA integration props with standalone mock fallbacks
  const activeSpaceWeather = spaceWeather !== undefined
    ? spaceWeather
    : (nasaData?.spaceWeather || mockNasaSpaceWeather);

  const activeMarsEnvironment = marsEnvironment !== undefined
    ? marsEnvironment
    : (nasaData?.marsEnvironment || mockNasaMarsEnvironment);

  const activeRadLab = radLab !== undefined
    ? radLab
    : (nasaData?.radLab || mockNasaRadLab);

  const oxygenVal = activeResources?.oxygen ?? 0;
  const powerVal = activeResources?.power ?? 0;
  const foodVal = activeResources?.food ?? 0;
  const radiationVal = activeResources?.radiation ?? 0;

  return (
    <div className="mars-dashboard" role="region" aria-label="Mars Habitat Dashboard">
      {/* Top Header Bar */}
      <header className="dashboard-top-bar">
        <div className="dashboard-heading-group">
          <span className="dashboard-mars-orb" aria-hidden="true" />
          <div>
            <h2 className="dashboard-title">Habitat Command // Telemetry</h2>
            <div className="dashboard-subtitle">
              Mission: Outpost &bull; Sector 4 Jezero Crater Base &bull; Powered by NASA Open Data
            </div>
          </div>
        </div>

        <div className="dashboard-header-badges">
          <div className="dashboard-telemetry-badge">
            <span className="telemetry-pulse-dot" aria-hidden="true" />
            <span>REAL-TIME TELEMETRY FEED // SYNCHRONIZED</span>
          </div>
          <span className="nasa-partner-badge">
            NASA SPACE APPS CHALLENGE 2026
          </span>
        </div>
      </header>

      {/* A. Mission Status Overview */}
      <section aria-label="Mission Status Overview">
        <MissionStatus
          mission={activeMission}
          crewCount={activePlayers.length}
        />
      </section>

      {/* B. Resource Monitoring Grid (Dual-Layer Simulated vs NASA Context) */}
      <section className="resources-section" aria-label="Life Support Resources">
        <div className="dashboard-section-label">
          <span>Habitation Life Support Telemetry</span>
          <span className="section-label-hint">SIMULATED BASE SYSTEMS</span>
        </div>

        <div className="resource-cards-grid">
          {/* Oxygen */}
          <ResourceCard
            name="Oxygen Reserves"
            value={oxygenVal}
            type="oxygen"
            icon="🫧"
            unit="%"
          />

          {/* Power */}
          <ResourceCard
            name="Core Power Grid"
            value={powerVal}
            type="power"
            icon="⚡"
            unit="%"
          />

          {/* Food */}
          <ResourceCard
            name="Food Rations"
            value={foodVal}
            type="food"
            icon="🌱"
            unit="%"
          />

          {/* Radiation (Dual-Layer: Simulated Habitat Shielding + Real NASA Space Weather Observation) */}
          <ResourceCard
            name="Radiation Exposure"
            value={radiationVal}
            type="radiation"
            icon="☢️"
            unit="%"
            nasaContext={activeSpaceWeather}
          />
        </div>
      </section>

      {/* C. NASA Scientific Data & Space Weather Observation Section */}
      <section className="nasa-scientific-section" aria-label="NASA Scientific Telemetry">
        <div className="dashboard-section-label label-nasa">
          <span>NASA Astronomical Observations &amp; Mars Environment</span>
          <span className="section-label-hint hint-nasa">REAL SCIENTIFIC DATASETS</span>
        </div>

        <div className="nasa-panels-grid">
          {/* Real Space Weather Events from NASA DONKI */}
          <NasaSpaceWeatherPanel spaceWeather={activeSpaceWeather} />

          {/* Real Mars Surface Imagery from NASA Rovers & Mars Trek */}
          <NasaMarsEnvironmentPanel marsEnvironment={activeMarsEnvironment} />
        </div>

        {/* NASA RadLab Scientific Context */}
        <div className="nasa-radlab-container">
          <NasaRadLabPanel radLab={activeRadLab} />
        </div>
      </section>

      {/* D. Crew, Objectives & Real-Time Alerts Layout */}
      <div className="dashboard-split-layout">
        {/* Left Column: Crew Manifest & Objectives */}
        <div className="dashboard-left-column">
          <CrewPanel players={activePlayers} />
          <ObjectivesPanel objectives={activeObjectives} />
        </div>

        {/* Right Column: In-Game Alarms & Telemetry Feed */}
        <div className="dashboard-right-column">
          <AlertsPanel
            alerts={activeAlerts}
            resources={activeResources}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
