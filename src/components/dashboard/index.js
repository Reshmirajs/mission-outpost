/**
 * MISSION: OUTPOST - Dashboard Module Exports
 * Person 2: Mars Dashboard Module (Extended with NASA Space Apps Telemetry)
 */

export { default as Dashboard } from './Dashboard';
export { default as ResourceCard } from './ResourceCard';
export { default as MissionStatus } from './MissionStatus';
export { default as CrewPanel } from './CrewPanel';
export { default as ObjectivesPanel } from './ObjectivesPanel';
export { default as AlertsPanel } from './AlertsPanel';
export { default as NasaSpaceWeatherPanel } from './NasaSpaceWeatherPanel';
export { default as NasaMarsEnvironmentPanel } from './NasaMarsEnvironmentPanel';
export { default as NasaRadLabPanel } from './NasaRadLabPanel';
export {
  RESOURCE_THRESHOLDS,
  getResourceCondition,
  deriveResourceAlerts,
} from './dashboardUtils';
export * from './mockDashboardData';
export { default } from './Dashboard';
