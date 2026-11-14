import { PlayerRoles } from '../../types/game.js'

/**
 * MISSION: OUTPOST — Specialist Astronaut Roles Specification
 * Strictly follows the educational responsibilities and exact sequence:
 * 1. Mission Commander (COMMANDER)
 * 2. Power Engineer (ENGINEER)
 * 3. Botanist (BOTANIST)
 * 4. Life Support Officer (MEDIC)
 * 5. Science & Safety Officer (SCIENTIST)
 */

export const SPECIALIST_ROLES = [
  {
    roleKey: PlayerRoles.COMMANDER,
    roleNumber: 1,
    title: 'Mission Commander',
    badge: 'Expedition Command',
    accentColor: '#f59e0b', // Amber / Gold
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    suitTrim: '#fbbf24',
    icon: '🧭',
    introduction: 'Coordinates the crew and helps everyone work together.',
    responsibilities: [
      'Coordinate mission decisions.',
      'Help prioritise limited resources.',
      'Keep the crew informed.',
      'Make sure everyone contributes to important decisions.',
    ],
    missionCapability:
      'Guides emergency team deliberations, organizes expedition tasks, and maintains squad cohesion across Sol cycles.',
    whyItMatters:
      'Mars missions operate under intense communication delays with Earth. A unified crew that communicates clearly survives critical emergencies.',
    specialistGear: 'Tactical Command HUD & Earth Uplink Transceiver',
  },
  {
    roleKey: PlayerRoles.ENGINEER,
    roleNumber: 2,
    title: 'Power Engineer',
    badge: 'Power Grid & Storage',
    accentColor: '#eab308', // Electric Amber / Yellow
    accentGlow: 'rgba(234, 179, 8, 0.4)',
    suitTrim: '#facc15',
    icon: '⚡',
    introduction: 'Keeps the outpost powered and operational.',
    responsibilities: [
      'Monitor energy generation.',
      'Manage battery storage.',
      'Balance energy consumption.',
      'Help the crew respond to power shortages.',
    ],
    missionCapability:
      'Diverts power between life-support and scientific instruments, recharges batteries, and clears solar array dust.',
    whyItMatters:
      'Nighttime temperatures on Mars plummet to -60°C. Without reliable electrical power for habitat heaters and pumps, systems freeze within hours.',
    specialistGear: 'Photovoltaic Balancer & Kilopower Diagnostic Gauntlet',
  },
  {
    roleKey: PlayerRoles.BOTANIST,
    roleNumber: 3,
    title: 'Botanist',
    badge: 'Hydroponics & Food',
    accentColor: '#10b981', // Emerald Green
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    suitTrim: '#34d399',
    icon: '🌱',
    introduction: 'Helps the crew produce food and manage the greenhouse.',
    responsibilities: [
      'Monitor plant growth.',
      'Manage food production.',
      'Consider water requirements.',
      'Balance food production with available resources.',
    ],
    missionCapability:
      'Cultivates fast-growing crops in the pressurized hydroponic bay, tracks nutrient cycles, and optimizes greenhouse water use.',
    whyItMatters:
      'Cargo resupply flights from Earth take around 9 months of transit. Growing fresh, sustainable calories on-site is essential for long-duration crew health.',
    specialistGear: 'Greenhouse Climate Sensor & Bio-Culture Cannister',
  },
  {
    roleKey: PlayerRoles.MEDIC,
    roleNumber: 4,
    title: 'Life Support Officer',
    badge: 'Atmosphere & Oxygen',
    accentColor: '#06b6d4', // Cyan / Sky Blue
    accentGlow: 'rgba(6, 182, 212, 0.4)',
    suitTrim: '#38bdf8',
    icon: '🫧',
    introduction: 'Helps maintain the essential systems that keep astronauts alive.',
    responsibilities: [
      'Monitor oxygen availability.',
      'Monitor water resources.',
      'Help maintain habitat conditions.',
      'Respond to life-support problems.',
    ],
    missionCapability:
      'Regulates oxygen generation, checks carbon dioxide scrubber canisters, and repairs habitat pressure valves.',
    whyItMatters:
      "The Martian atmosphere is 95% toxic carbon dioxide and has under 1% of Earth's atmospheric pressure. Breathable air must be constantly recycled.",
    specialistGear: 'Oxygen Generator Monitor & Atmospheric Rebreather',
  },
  {
    roleKey: PlayerRoles.SCIENTIST,
    roleNumber: 5,
    title: 'Science & Safety Officer',
    badge: 'Radiation & Environment',
    accentColor: '#8b5cf6', // Violet / Purple
    accentGlow: 'rgba(139, 92, 246, 0.4)',
    suitTrim: '#a78bfa',
    icon: '🔬',
    introduction: 'Monitors environmental conditions and helps protect the crew.',
    responsibilities: [
      'Monitor environmental hazards.',
      'Understand radiation exposure.',
      'Observe Martian weather conditions.',
      'Help the crew make informed safety decisions.',
    ],
    missionCapability:
      'Analyzes incoming solar flares and cosmic rays, tracks approaching regional dust storms, and advises on radiation shelter protocols.',
    whyItMatters:
      "Mars lacks Earth's thick ozone layer and global magnetic shield. Detecting high-energy radiation events early allows the crew to seek shielded habitat quarters.",
    specialistGear: 'Surface Radiation Dosimeter & Weather Sensor Mast',
  },
]

/**
 * Quick lookup helper by shared PlayerRoles key
 */
export const SPECIALIST_ROLES_MAP = Object.freeze(
  SPECIALIST_ROLES.reduce((acc, role) => {
    acc[role.roleKey] = role
    return acc
  }, {})
)

/**
 * Backward compatibility alias for mock service and tests
 */
export const EDUCATIONAL_ROLE_DETAILS = Object.freeze(
  SPECIALIST_ROLES.reduce((acc, role) => {
    acc[role.roleKey] = {
      ...role,
      displayTitle: role.title,
    }
    return acc
  }, {})
)

/**
 * Returns role presentation details for a given roleKey
 */
export function getSpecialistRole(roleKey) {
  if (!roleKey || roleKey === PlayerRoles.UNASSIGNED) return null
  return SPECIALIST_ROLES_MAP[roleKey] || null
}

export function getEducationalRole(roleKey) {
  return getSpecialistRole(roleKey)
}
