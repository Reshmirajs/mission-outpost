/**
 * MISSION: OUTPOST - Mock Dashboard Data
 * Person 2: Mars Dashboard Module (Extended with NASA Space Apps Resources)
 *
 * Provides realistic Mars mission data and NASA scientific telemetry for standalone
 * preview, testing, and fallback when live services are not yet connected.
 */

import { MissionStatus } from '../../types/game';

/**
 * Default mock resources for habitat life support.
 * 0–100 scale:
 * - Oxygen, Power, Food: higher is better (danger < 25)
 * - Radiation: higher is dangerous (danger >= 70)
 */
export const mockResources = {
  oxygen: 78,
  water: 82,
  power: 64,
  food: 85,
  radiation: 28,
};

/**
 * Alternate mock resource presets for testing warnings and emergency states.
 */
export const mockResourcePresets = {
  nominal: {
    oxygen: 92,
    water: 95,
    power: 88,
    food: 95,
    radiation: 12,
  },
  caution: {
    oxygen: 42,
    water: 36,
    power: 38,
    food: 46,
    radiation: 48,
  },
  critical: {
    oxygen: 18,
    water: 14,
    power: 14,
    food: 20,
    radiation: 76,
  },
};

/**
 * Mock mission status and progress information.
 */
export const mockMission = {
  roomCode: 'OUTP-7',
  round: 12, // Current Sol (Martian day)
  targetSols: 30, // Expedition target Sols
  status: MissionStatus.IN_PROGRESS,
  habitatIntegrity: 94,
  solarCycle: 'Day Phase',
};

/**
 * Mock crew members (the 5 finalized astronaut roles).
 */
export const mockCrew = [
  {
    id: 'p1',
    name: 'Sarah Chen',
    role: 'Mission Commander',
    ready: true,
    avatar: '👨‍🚀',
  },
  {
    id: 'p2',
    name: 'Alex Rivera',
    role: 'Power Engineer',
    ready: true,
    avatar: '👩‍🚀',
  },
  {
    id: 'p3',
    name: 'Dr. Maya Patel',
    role: 'Botanist',
    ready: true,
    avatar: '👨‍🔬',
  },
  {
    id: 'p4',
    name: 'Liam Vance',
    role: 'Life Support Officer',
    ready: true,
    avatar: '🧑‍⚕️',
  },
  {
    id: 'p5',
    name: 'Elena Rostova',
    role: 'Science & Safety Officer',
    ready: true,
    avatar: '👩‍🔬',
  },
];

/**
 * Mock mission objectives.
 * Status values: 'active' | 'completed' | 'at_risk'
 */
export const mockObjectives = [
  {
    id: 'obj-1',
    title: 'Maintain Outpost Atmosphere',
    description: 'Keep life-support oxygen levels safely above 30%.',
    status: 'active',
    category: 'Life Support',
  },
  {
    id: 'obj-2',
    title: 'Sustain Solar Grid & Reserves',
    description: 'Charge battery capacitors before the Martian night storm.',
    status: 'active',
    category: 'Power Grid',
  },
  {
    id: 'obj-3',
    title: 'Hydroponics Harvest Cycle',
    description: 'First hydroponic crop cycle successfully stored in rations.',
    status: 'completed',
    category: 'Provisions',
  },
  {
    id: 'obj-4',
    title: 'Radiation Storm Deflection',
    description: 'Maintain habitat shielding against incoming solar cosmic rays.',
    status: 'at_risk',
    category: 'Hazard Control',
  },
];

/**
 * Sample custom alerts for mission notifications.
 * Types: 'info' | 'warning' | 'critical'
 */
export const mockAlerts = [
  {
    id: 'alt-1',
    type: 'info',
    title: 'Telemetry Synced',
    message: 'NASA Deep Space Network uplink established with Outpost-7.',
    timestamp: 'Sol 12 - 08:30 MTC',
  },
  {
    id: 'alt-2',
    type: 'warning',
    title: 'Dust Approaching',
    message: 'Minor dust devil detected near Sector 4 solar array.',
    timestamp: 'Sol 12 - 07:15 MTC',
  },
];

/**
 * Clearly labelled demo fixture for previewing the DONKI panel when the NASA
 * request is unavailable. These illustrative entries are not NASA observations.
 */
export const mockNasaSpaceWeather = {
  status: 'fallback',
  observationSource: 'Demo sample data only; NASA DONKI observations are unavailable.',
  events: [
    {
      id: 'demo-flr-1',
      type: 'Solar Flare',
      classType: 'Example class',
      eventDate: 'Example timestamp (UTC)',
      activeRegion: '',
      description: 'Illustrative sample event for the dashboard layout; not a real NASA observation.',
      details: [],
    },
    {
      id: 'demo-cme-1',
      type: 'Coronal Mass Ejection (CME)',
      classType: '',
      eventDate: 'Example timestamp (UTC)',
      activeRegion: '',
      description: 'Illustrative sample event for the dashboard layout; not a real NASA observation.',
      details: [],
    },
  ],
};

/**
 * Demo-only fallback for previewing the Mars imagery panel when the NASA
 * Image and Video Library request fails. Terrain values are unverified.
 */
export const mockNasaMarsEnvironment = {
  status: 'fallback',
  caption: 'Demo image preview only; this image was not selected by the current NASA search.',
  imageUrl: 'https://images-assets.nasa.gov/image/PIA24419/PIA24419~orig.jpg',
  marsTrek: {
    featureName: 'Jezero Delta Front',
    coordinates: '18.38°N, 77.58°E',
    elevation: '-2,530 m',
    terrainDescription: 'Sedimentary clay-bearing deltaic formation with boulder fields.',
  },
};

/**
 * NASA RadLab Scientific Context Mock Structure
 * Source: NASA RadLab (Radiation Laboratory / Life Sciences Data)
 */
export const mockNasaRadLab = {
  available: true,
  studyContext: 'NASA RadLab / Mars Science Laboratory RAD Instrument Archive',
  instrument: 'MSL-RAD (Radiation Assessment Detector)',
  cosmicRayContext: 'Galactic Cosmic Rays (GCR) background exposure averages ~1.5 - 2.0 mSv/day on the unshielded Martian surface.',
  shieldingReference: 'Martian regolith habitat shielding provides significant attenuation against GCR and absorbs low-energy Solar Particle Events (SPE).',
  safetyNote: 'NASA permissible exposure limits are monitored continuously to safeguard long-duration crew health.',
  attribution: 'NASA Life Sciences Data Archive / RadLab',
};
