/**
 * MISSION: OUTPOST - Mock Dashboard Data
 * Person 2: Mars Dashboard Module (Extended with NASA Space Apps Resources)
 *
 * Provides realistic Mars mission data and NASA scientific telemetry for standalone
 * preview, testing, and fallback when live services are not yet connected.
 */

import { PlayerRoles, MissionStatus } from '../../types/game';

/**
 * Default mock resources for habitat life support.
 * 0–100 scale:
 * - Oxygen, Power, Food: higher is better (danger < 25)
 * - Radiation: higher is dangerous (danger >= 70)
 */
export const mockResources = {
  oxygen: 78,
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
    power: 88,
    food: 95,
    radiation: 12,
  },
  caution: {
    oxygen: 42,
    power: 38,
    food: 46,
    radiation: 48,
  },
  critical: {
    oxygen: 18,
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
 * Mock crew members (up to 6 players for cooperative squad).
 */
export const mockCrew = [
  {
    id: 'p1',
    name: 'Sarah Chen',
    role: PlayerRoles.COMMANDER,
    ready: true,
    avatar: '👨‍🚀',
  },
  {
    id: 'p2',
    name: 'Alex Rivera',
    role: PlayerRoles.ENGINEER,
    ready: true,
    avatar: '👩‍🚀',
  },
  {
    id: 'p3',
    name: 'Dr. Maya Patel',
    role: PlayerRoles.BOTANIST,
    ready: true,
    avatar: '👨‍🔬',
  },
  {
    id: 'p4',
    name: 'Liam Vance',
    role: PlayerRoles.MEDIC,
    ready: true,
    avatar: '🧑‍⚕️',
  },
  {
    id: 'p5',
    name: 'Elena Rostova',
    role: PlayerRoles.SCIENTIST,
    ready: true,
    avatar: '👩‍🔬',
  },
  {
    id: 'p6',
    name: 'Kenji Sato',
    role: PlayerRoles.UNASSIGNED,
    ready: false,
    avatar: '🧑‍🚀',
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
 * Real NASA DONKI Space Weather Mock Structure
 * Source: NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)
 */
export const mockNasaSpaceWeather = {
  summaryRisk: 'Elevated', // 'Nominal' | 'Elevated' | 'Severe' | 'Unknown'
  advisory: 'Solar activity detected – check habitat radiation shielding systems.',
  observationSource: 'NASA DONKI API (Real Astronomical Telemetry)',
  lastUpdated: 'Recent SDO / SOHO Ingest',
  events: [
    {
      id: 'donki-flr-1',
      type: 'Solar Flare',
      classType: 'M2.4 Class',
      eventDate: '2026-11-13 18:42 UTC',
      activeRegion: 'Active Region AR3615',
      description: 'Moderate M-class solar flare observed on the western solar limb by NASA SDO.',
      radiationRisk: 'Elevated',
    },
    {
      id: 'donki-cme-1',
      type: 'Coronal Mass Ejection (CME)',
      classType: 'CME - Partial Halo',
      eventDate: '2026-11-12 21:10 UTC',
      activeRegion: 'Interplanetary Shock',
      description: 'Plasma cloud detected with propagation speed estimated at 720 km/s.',
      radiationRisk: 'Moderate',
    },
  ],
};

/**
 * Real NASA Mars Rover Photos & Mars Trek Mock Structure
 * Source: NASA Mars Rover Photos API & Mars Trek Terrain Systems
 */
export const mockNasaMarsEnvironment = {
  rover: 'Perseverance',
  camera: 'Mastcam-Z (Left)',
  sol: 1280,
  earthDate: '2024-09-28',
  caption: 'Jezero Crater ancient delta fan deposits and stratified Martian bedrock.',
  imageUrl: 'https://images-assets.nasa.gov/image/PIA24419/PIA24419~orig.jpg',
  attribution: 'NASA / JPL-Caltech / ASU / MSSS',
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
