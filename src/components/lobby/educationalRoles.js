import { PlayerRoles } from '../../types/game.js'

/**
 * MISSION: OUTPOST - Educational Astronaut Roles
 * Designed for children aged 7–12 (NASA Space Apps Challenge 2026).
 *
 * NOTE FOR TEAM / PERSON 5:
 * These display labels, systems, and descriptions are presentation mappings
 * designed for educational engagement. The underlying shared data contract
 * remains strictly tied to the shared PlayerRoles enum in src/types/game.js.
 */

export const EDUCATIONAL_ROLE_DETAILS = Object.freeze({
  [PlayerRoles.COMMANDER]: {
    roleKey: PlayerRoles.COMMANDER,
    displayTitle: 'Mission Commander',
    icon: '🧭',
    systemBadge: 'Expedition Command & Mission Operations',
    shortDuty: 'Coordinates crew decisions & prioritizes survival goals.',
    responsibilities: [
      'Coordinates crew discussions and emergency team votes.',
      'Oversees habitat mission objectives and Sol milestones.',
      'Helps the squad balance and prioritize scarce resources under pressure.',
    ],
    marsSystem: 'Habitation Operations Hub & Deep-Space Earth Link',
    whyItMatters:
      'Because radio signals between Mars and Earth can take up to 22 minutes each way, astronauts cannot ask Earth for quick help. The Commander guides the crew to think calmly and make united choices.',
  },
  [PlayerRoles.ENGINEER]: {
    roleKey: PlayerRoles.ENGINEER,
    displayTitle: 'Power Engineer',
    icon: '⚡',
    systemBadge: 'Solar Arrays & Power Grids',
    shortDuty: 'Generates electricity & protects critical habitat heaters.',
    responsibilities: [
      'Manages electricity generation from solar arrays and nuclear batteries.',
      'Monitors power drains from life support, lights, and lab gear.',
      'Advises the crew on conserving energy during severe dust storms.',
    ],
    marsSystem: 'Photovoltaic Solar Fields & Kilopower Storage Units',
    whyItMatters:
      'Mars nighttime temperatures drop to a freezing -60°C (-76°F)! Without electrical power for habitat heaters and air pumps, the outpost will freeze in hours.',
  },
  [PlayerRoles.BOTANIST]: {
    roleKey: PlayerRoles.BOTANIST,
    displayTitle: 'Botanist',
    icon: '🌱',
    systemBadge: 'Hydroponics & Food Production',
    shortDuty: 'Grows fresh crops & manages greenhouse water cycles.',
    responsibilities: [
      'Nurtures crops inside pressurized hydroponic greenhouse bays.',
      'Monitors lighting, moisture, and recycled water efficiency.',
      'Understands how much power and water are needed to keep crops alive.',
    ],
    marsSystem: 'Automated Hydroponic Greenhouse & Water Recovery Loop',
    whyItMatters:
      'Resupply rockets from Earth take roughly 9 months of travel across deep space. Growing sustainable crops on Mars is the only way the crew stays healthy and avoids starvation.',
  },
  [PlayerRoles.MEDIC]: {
    roleKey: PlayerRoles.MEDIC,
    displayTitle: 'Life Support Officer',
    icon: '🫧',
    systemBadge: 'Oxygen Generators & Air Scrubbers',
    shortDuty: 'Extracts breathable oxygen & maintains atmospheric pressure.',
    responsibilities: [
      'Monitors oxygen reserves and habitat air pressure.',
      'Operates carbon dioxide scrubbers to prevent toxic gas buildup.',
      'Detects habitat air leaks and tracks emergency breathing gear.',
    ],
    marsSystem: 'MOXIE Oxygen Extractors & CO₂ Scrubbing Assemblies',
    whyItMatters:
      'The Martian atmosphere is 95% carbon dioxide and has less than 1% of Earth\'s surface pressure. Humans cannot survive even three minutes without mechanical oxygen production.',
  },
  [PlayerRoles.SCIENTIST]: {
    roleKey: PlayerRoles.SCIENTIST,
    displayTitle: 'Science & Safety Officer',
    icon: '🔬',
    systemBadge: 'Radiation Shielding & Weather Radar',
    shortDuty: 'Detects solar radiation storms & tracks dust hazards.',
    responsibilities: [
      'Monitors cosmic rays, solar flares, and surface radiation levels.',
      'Studies Martian weather alerts and incoming atmospheric dust fronts.',
      'Guides the crew into reinforced regolith storm shelters when danger rises.',
    ],
    marsSystem: 'Radiation Assessment Detector (RAD) & Weather Mast',
    whyItMatters:
      'Mars has no thick ozone layer and no global magnetic shield. High-energy radiation particles from deep space can damage human cells unless astronauts track hazards and seek shelter in time.',
  },
})

/**
 * List of educational roles suitable for display in the role selector.
 */
export const ACTIVE_EDUCATIONAL_ROLES = [
  EDUCATIONAL_ROLE_DETAILS[PlayerRoles.COMMANDER],
  EDUCATIONAL_ROLE_DETAILS[PlayerRoles.ENGINEER],
  EDUCATIONAL_ROLE_DETAILS[PlayerRoles.BOTANIST],
  EDUCATIONAL_ROLE_DETAILS[PlayerRoles.MEDIC],
  EDUCATIONAL_ROLE_DETAILS[PlayerRoles.SCIENTIST],
]

/**
 * Helper to safely retrieve educational presentation details for any role key.
 * @param {string} roleKey
 * @returns {typeof EDUCATIONAL_ROLE_DETAILS[keyof typeof EDUCATIONAL_ROLE_DETAILS] | null}
 */
export function getEducationalRole(roleKey) {
  if (!roleKey || roleKey === PlayerRoles.UNASSIGNED) {
    return null
  }
  return EDUCATIONAL_ROLE_DETAILS[roleKey] || null
}

