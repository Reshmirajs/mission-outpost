/**
 * MISSION: OUTPOST - Mars Survival Events Catalog
 * NASA Space Apps Challenge 2026 - Person 4: Events & Team Decisions
 *
 * Comprehensive catalog of scientific and environmental Martian hazards,
 * infrastructure crises, and expedition dilemmas.
 *
 * Each event provides multiple strategic choices with explicit resource deltas
 * (oxygen, power, food, radiation) and recommends specialist astronaut roles.
 *
 * Data conventions:
 * - Roles strictly match PlayerRoles from src/types/game.js.
 * - Resource deltas follow src/game/resourceManager.js conventions:
 *   - oxygen, power, food: negative values indicate drain, positive indicate gains.
 *   - radiation: positive values indicate increased hazard, negative indicate reduced hazard.
 * - Severity levels: 'warning' | 'critical' | 'emergency'.
 */

import { PlayerRoles } from '../../types/game.js';

/**
 * Event Severity Classifications
 */
export const EventSeverities = Object.freeze({
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
});

/**
 * Event Domain Categories
 */
export const EventCategories = Object.freeze({
  WEATHER: 'Weather & Environment',
  SPACE_WEATHER: 'Space Weather & Radiation',
  LIFE_SUPPORT: 'Life Support & Habitat',
  ENGINEERING: 'Engineering & Grid',
  AGRICULTURE: 'Agriculture & Provisions',
  EXPEDITION: 'Expedition & Anomaly',
});

/**
 * Master catalog of Mars survival events.
 * Contains 12 fully fleshed-out crisis scenarios.
 *
 * @type {ReadonlyArray<Object>}
 */
export const EVENTS_CATALOG = Object.freeze([
  // 1. Dust storm
  {
    id: 'evt-dust-storm',
    title: 'Global Martian Dust Storm',
    category: EventCategories.WEATHER,
    severity: EventSeverities.CRITICAL,
    icon: '🌪️',
    description:
      'Massive localized dust plumes have coalesced into a regional dust tempest over Sector 4. Atmospheric opacity (tau) has quadrupled, cutting solar array irradiance by over 80% and scouring external telemetry masts with abrasive fine regolith.',
    options: [
      {
        id: 'opt-dust-cells',
        title: 'Stow Arrays & Switch to Reserve Fuel Cells',
        description:
          'Retract and lock photovoltaic panels to prevent abrasive dust damage. Run the habitat on reserve chemical fuel cells until the tempest clears.',
        delta: { oxygen: 0, power: -20, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Power Engineer ensures minimal grid surges while switching to chemical reserves.',
      },
      {
        id: 'opt-dust-sweep',
        title: 'Deploy Electrostatic Blowers & Maintain Low Trickle',
        description:
          'Use pulsed electrostatic charges to keep central array panels partially clear, maintaining minimal grid trickle-charge at the cost of higher system wear and atmospheric air purge.',
        delta: { oxygen: -5, power: -10, food: 0, radiation: +5 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Mission Commander balances tactical power trade-offs against external hardware strain.',
      },
      {
        id: 'opt-dust-bunker',
        title: 'Bunker Down in Emergency Low-Power Mode',
        description:
          'Throttle life support and thermal heating to bare survival minimums to hoard power, placing physical strain on crew stamina and provisions.',
        delta: { oxygen: -10, power: -5, food: -5, radiation: 0 },
        recommendedRole: PlayerRoles.MEDIC,
        rationale: 'Medic monitors crew metabolic depression and vitals during deep low-oxygen hibernation.',
      },
    ],
  },

  // 2. Atmospheric pressure drop
  {
    id: 'evt-pressure-drop',
    title: 'Airlock Seal Compromise & Pressure Drop',
    category: EventCategories.LIFE_SUPPORT,
    severity: EventSeverities.EMERGENCY,
    icon: '💨',
    description:
      'Micro-meteorite impact or micromachining fatigue has breached secondary airlock gasket Beta-3. Habitat barometric pressure is leaking into the Martian vacuum at 1.8 kPa per minute.',
    options: [
      {
        id: 'opt-pressure-bulkhead',
        title: 'Emergency Bulkhead Lockdown & Sealant Injection',
        description:
          'Slam airtight pressure doors, isolating the compromised vestibule, and deploy fast-curing polymer foam to seal the breach.',
        delta: { oxygen: -15, power: -5, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer rapidly seals mechanical flanges before pressure differential warps the hull.',
      },
      {
        id: 'opt-pressure-scrubbers',
        title: 'Over-pressurize Reserve Scrubbers & Conduct Rapid EVA',
        description:
          'Flood habitat with reserve O2 while a crew member performs a rapid external patch, preventing structural deformation of the inner airlock.',
        delta: { oxygen: -25, power: -10, food: 0, radiation: -5 },
        recommendedRole: PlayerRoles.MEDIC,
        rationale: 'Medic safeguards astronaut hyperbaric transitions during rapid emergency EVA.',
      },
      {
        id: 'opt-pressure-vent',
        title: 'Vent Depressurized Chamber & Cryo-Reclaim Gasses',
        description:
          'Pump atmospheric gasses out of the airlock into storage cylinders before depressurizing to prevent catastrophic explosive decompression.',
        delta: { oxygen: -8, power: -18, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Commander coordinates disciplined evacuation protocol under severe time constraints.',
      },
    ],
  },

  // 3. Solar particle event
  {
    id: 'evt-solar-particle',
    title: 'Solar Particle Event (SPE) Inbound',
    category: EventCategories.SPACE_WEATHER,
    severity: EventSeverities.EMERGENCY,
    icon: '☀️',
    description:
      'NASA Deep Space Network telemetry alerts of an imminent relativistic proton deluge following an X-class solar flare eruption. Unshielded surface exposure will be lethal within hours.',
    options: [
      {
        id: 'opt-spe-shelter',
        title: 'Retreat to Underground Regolith Storm Shelter',
        description:
          'Crew evacuates into the sub-surface bunker beneath two meters of compacted Martian regolith, suspending active surface operations.',
        delta: { oxygen: -5, power: -10, food: 0, radiation: +6 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist monitors real-time dosimeters and verifies radiation attenuation curves.',
      },
      {
        id: 'opt-spe-magnetic',
        title: 'Energize Active Magnetic Deflector Shield',
        description:
          'Route maximum wattage into the outpost superconducting magnetic field coils to deflect charged protons away from habitat modules.',
        delta: { oxygen: 0, power: -28, food: 0, radiation: +2 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer tunes inductive coil harmonics to prevent thermal quenching of the superconductors.',
      },
      {
        id: 'opt-spe-waterwall',
        title: 'Deploy Water-Wall Dampening & Medical Prophylaxis',
        description:
          'Pump greywater and food reserve hydration packs into hab wall lining to absorb secondary neutrons while administering radioprotective drugs.',
        delta: { oxygen: 0, power: -8, food: -5, radiation: +14 },
        recommendedRole: PlayerRoles.MEDIC,
        rationale: 'Medic administers radioprotective antioxidants and monitors cellular DNA biomarkers.',
      },
    ],
  },

  // 4. Coronal mass ejection
  {
    id: 'evt-coronal-mass-ejection',
    title: 'Coronal Mass Ejection (CME) Impact',
    category: EventCategories.SPACE_WEATHER,
    severity: EventSeverities.CRITICAL,
    icon: '⚡',
    description:
      'A multi-billion ton magnetized plasma cloud ejected from the Sun has collided with Mars ionosphere. Intense electromagnetic fluctuations and secondary gamma flaring are impacting base telemetry.',
    options: [
      {
        id: 'opt-cme-ground',
        title: 'Isolate Sensitive Avionics & Ground Transformer Banks',
        description:
          'Trip circuit breakers on primary power buses to prevent electromagnetic cascade failures, relying temporarily on localized capacitor banks.',
        delta: { oxygen: 0, power: -16, food: 0, radiation: +8 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer shields primary bus relays from inductive electromagnetic pulses.',
      },
      {
        id: 'opt-cme-science',
        title: 'Deploy Radiative Spectral Analyzers for Solar Research',
        description:
          'Keep sensors and communication arrays operational to capture groundbreaking scientific telemetry, accepting higher radiation exposure.',
        delta: { oxygen: 0, power: -10, food: 0, radiation: +20 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist captures high-value heliophysics telemetry that aids future mission survival.',
      },
      {
        id: 'opt-cme-commander',
        title: 'Coordinated Shield Modulation Under Commander Protocol',
        description:
          'Execute tactical sector-by-sector power cycling to keep critical habitat life support balanced against the CME wave-front.',
        delta: { oxygen: -5, power: -14, food: 0, radiation: +5 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Commander balances defensive power distribution across life support and communication.',
      },
    ],
  },

  // 5. Power grid failure
  {
    id: 'evt-power-grid-failure',
    title: 'Main Power Grid Bus Brownout',
    category: EventCategories.ENGINEERING,
    severity: EventSeverities.CRITICAL,
    icon: '🔌',
    description:
      'A high-voltage transformer in Substation Delta experienced an explosive arc flash. Main bus bars are short-circuiting, threatening an outpost-wide total electrical blackout.',
    options: [
      {
        id: 'opt-grid-reroute',
        title: 'Reroute Emergency Bus & Bypass Substation Delta',
        description:
          'Manually bypass scorched transformer circuits to restore power to critical systems, operating at lower efficiency.',
        delta: { oxygen: -5, power: -15, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer rewires solid-state switches and restores balanced three-phase power.',
      },
      {
        id: 'opt-grid-curtail',
        title: 'Shut Down Hydroponics Pods to Conserve Core Grid',
        description:
          'Cut lighting and climate control to the greenhouse bay to preserve core habitat life support power.',
        delta: { oxygen: 0, power: -8, food: -12, radiation: 0 },
        recommendedRole: PlayerRoles.BOTANIST,
        rationale: 'Botanist minimizes crop shock by selecting resilient plant strains for dark dormancy.',
      },
      {
        id: 'opt-grid-reboot',
        title: 'Flash-Reboot Kilopower Fission Core',
        description:
          'Perform a rapid core thermal restart. If successful, power surges back, but radiation shielding suffers momentary thermal leakage.',
        delta: { oxygen: -8, power: +10, food: 0, radiation: +12 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist calculates safe thermal flux margins during nuclear generator reboot.',
      },
    ],
  },

  // 6. Water recycler failure
  {
    id: 'evt-water-recycler-failure',
    title: 'Closed-Loop Water Recycler Membrane Rupture',
    category: EventCategories.LIFE_SUPPORT,
    severity: EventSeverities.CRITICAL,
    icon: '💧',
    description:
      'Catalytic oxidation membranes in the environmental control system have fouled with insoluble perchlorates, stopping potable water synthesis and oxygen electrolysis.',
    options: [
      {
        id: 'opt-water-acidwash',
        title: 'Acid-Wash Filtration Cores & Flush System',
        description:
          'Circulate chemical solvents through the fouled membranes at high temperature to dissolve salt scales and restore flow.',
        delta: { oxygen: -8, power: -12, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer optimizes pump pressure heads during hazardous solvent wash cycles.',
      },
      {
        id: 'opt-water-divert',
        title: 'Tap Hydroponic Nutrient Reservoir for Life Support',
        description:
          'Divert purified water from the hydroponic plant trays into the drinking and oxygen generation reservoirs.',
        delta: { oxygen: -4, power: -6, food: -15, radiation: 0 },
        recommendedRole: PlayerRoles.BOTANIST,
        rationale: 'Botanist safely extracts nutrient reservoir water without killing the root systems.',
      },
      {
        id: 'opt-water-sabatier',
        title: 'Emergency Sabatier Reactor Synthesis Run',
        description:
          'React waste carbon dioxide with hydrogen fuel reserves to synthesize water and oxygen, consuming heavy electrical reserves.',
        delta: { oxygen: +6, power: -22, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist monitors stoichiometry and catalytic efficiency of the Sabatier methanation.',
      },
    ],
  },

  // 7. Hydroponics crop disease
  {
    id: 'evt-crop-disease',
    title: 'Hydroponics Bacterial Blight Outbreak',
    category: EventCategories.AGRICULTURE,
    severity: EventSeverities.WARNING,
    icon: '🌾',
    description:
      'An opportunistic Martian regolith microbe has contaminated the aeroponic potato and dwarf wheat nursery. Leaves are chlorotic and root rot is spreading rapidly through the hydroponic trays.',
    options: [
      {
        id: 'opt-crop-cull',
        title: 'Cull Infected Bays & Plant Fast-Growing Microgreens',
        description:
          'Cull 40% of the diseased crops, bathe trays in ultraviolet sterilization, and plant nitrogen-fixing microgreens.',
        delta: { oxygen: -4, power: -8, food: -10, radiation: 0 },
        recommendedRole: PlayerRoles.BOTANIST,
        rationale: 'Botanist isolates contaminated plant tissue and accelerates replacement seedling growth.',
      },
      {
        id: 'opt-crop-phage',
        title: 'Synthesize Targeted Bacteriophage Solution',
        description:
          'Engineer a bacteriophage in the biology lab to eradicate the pathogen while preserving existing mature crops.',
        delta: { oxygen: 0, power: -14, food: -4, radiation: 0 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist clones targeted phages using automated microbial sequencers.',
      },
      {
        id: 'opt-crop-mash',
        title: 'Emergency Harvest & Heat-Pasteurize Mash',
        description:
          'Pull all surviving biomass immediately and heat-pasteurize it. Minimizes medical contamination risk but produces meager nutritional yield.',
        delta: { oxygen: -2, power: -6, food: -16, radiation: 0 },
        recommendedRole: PlayerRoles.MEDIC,
        rationale: 'Medic ensures harvested produce meets stringent microbial toxicity clearance standards.',
      },
    ],
  },

  // 8. Food shortage
  {
    id: 'evt-food-shortage',
    title: 'Provisions Spoilage & Critical Food Shortage',
    category: EventCategories.AGRICULTURE,
    severity: EventSeverities.WARNING,
    icon: '🍱',
    description:
      'Moisture condensation inside Storage Pod 2 caused mold infestation across three pallets of freeze-dried meal pouches, threatening crew caloric sufficiency for upcoming Sols.',
    options: [
      {
        id: 'opt-food-rationing',
        title: 'Institute Strict Caloric Rationing Protocol',
        description:
          'Reduce daily caloric intake to 1,400 kcal per crew member. Conserves remaining stock but decreases crew stamina and cognitive reserves.',
        delta: { oxygen: 0, power: +4, food: -8, radiation: 0 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Commander enforces disciplined rationing schedules and morale maintenance.',
      },
      {
        id: 'opt-food-accelerate',
        title: 'Emergency Greenhouse Photoperiod Acceleration',
        description:
          'Blast grow lights at 24-hour photoperiod and inject concentrated fertilizer to force an early spirulina and leafy green harvest.',
        delta: { oxygen: -6, power: -18, food: +12, radiation: 0 },
        recommendedRole: PlayerRoles.BOTANIST,
        rationale: 'Botanist maximizes photosynthetic yields without burning out tender plant leaves.',
      },
      {
        id: 'opt-food-slurry',
        title: 'Synthesize High-Density Algal Protein Slurry',
        description:
          'Convert biological waste and laboratory starch cultures into edible protein paste to supplement crew rations.',
        delta: { oxygen: -4, power: -10, food: +6, radiation: 0 },
        recommendedRole: PlayerRoles.MEDIC,
        rationale: 'Medic balances electrolyte and vitamin content in emergency synthetic pastes.',
      },
    ],
  },

  // 9. Distress beacon detection
  {
    id: 'evt-distress-beacon',
    title: 'Automated Distress Beacon from Chryse Planitia',
    category: EventCategories.EXPEDITION,
    severity: EventSeverities.WARNING,
    icon: '📡',
    description:
      'Long-range UHF radio antennae have intercepted a repeating automated distress signal originating 14 kilometers northeast in Chryse Planitia, likely from an uncrewed cargo lander or lost rover.',
    options: [
      {
        id: 'opt-beacon-sortie',
        title: 'Dispatch Pressurized Rover on Salvage Expedition',
        description:
          'Send a two-person sortie to investigate. If it is a supply lander, recoverable MRE rations and equipment could be enormous.',
        delta: { oxygen: -12, power: -18, food: +15, radiation: +6 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Commander leads long-distance surface expeditions through hazardous terrain.',
      },
      {
        id: 'opt-beacon-drone',
        title: 'Deploy Autonomous Tethered Scout Drone',
        description:
          'Deploy a tethered robotic recon scout to survey the coordinates without endangering human crew members.',
        delta: { oxygen: 0, power: -12, food: +4, radiation: 0 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist controls remote sensing and lidar mapping payloads.',
      },
      {
        id: 'opt-beacon-ignore',
        title: 'Log Coordinates & Preserve Base Resources',
        description:
          'Deem the traverse too perilous under current atmospheric conditions. Maintain existing base operations.',
        delta: { oxygen: 0, power: 0, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer protects critical rover battery reserves for base emergency backup.',
      },
    ],
  },

  // 10. Abandoned rover discovery
  {
    id: 'evt-abandoned-rover',
    title: 'Derelict Exploration Rover Discovered',
    category: EventCategories.EXPEDITION,
    severity: EventSeverities.WARNING,
    icon: '🚙',
    description:
      'While scanning regional topography, the orbital radar mapped the heat signature of a long-decommissioned Mars exploration rover half-buried in a dunescape 6 km away.',
    options: [
      {
        id: 'opt-rover-rtg',
        title: 'Cannibalize RTG Nuclear Battery for Core Power',
        description:
          'Retrieve the rover still-warm Radioisotope Thermoelectric Generator (RTG). Provides massive power boost at the expense of higher background radiation.',
        delta: { oxygen: -4, power: +22, food: 0, radiation: +14 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer safe-handles decaying plutonium thermocouples and integrates DC power taps.',
      },
      {
        id: 'opt-rover-panels',
        title: 'Salvage High-Efficiency Multi-junction Solar Cells',
        description:
          'Carefully dismantle and clean the rover solar wings to augment the habitat auxiliary array.',
        delta: { oxygen: -6, power: +12, food: 0, radiation: +2 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist extracts fragile gallium arsenide solar wafer cells without micro-fracturing.',
      },
      {
        id: 'opt-rover-avionics',
        title: 'Recover Avionics & Sealed Geological Sample Cache',
        description:
          'Extract the rover terrain sensors and sample cache containing sealed sub-surface mineral cores.',
        delta: { oxygen: -3, power: -4, food: +4, radiation: 0 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Commander retrieves strategic exploration records for mission survival intel.',
      },
    ],
  },

  // 11. Sub-surface Marsquake (Bonus scenario)
  {
    id: 'evt-seismic-tremor',
    title: 'Sub-surface Marsquake & Structural Shift',
    category: EventCategories.WEATHER,
    severity: EventSeverities.CRITICAL,
    icon: '🌋',
    description:
      'A magnitude 4.2 seismic tremor originating from Cerberus Fossae fault lines has rattled outpost foundations. Tension cables snapped and foundation struts shifted by 14 centimeters.',
    options: [
      {
        id: 'opt-quake-jack',
        title: 'Hydraulically Re-level Foundation Struts',
        description:
          'Engage high-pressure hydraulic jacks to level the habitat modules before structural shearing breaches air seals.',
        delta: { oxygen: -4, power: -14, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.ENGINEER,
        rationale: 'Engineer restores foundational load balance and relieves structural shear.',
      },
      {
        id: 'opt-quake-evac',
        title: 'Temporary Transfer to Pressurized Rover Habitat',
        description:
          'Evacuate personnel into external rovers while seismic aftershocks damp down in the bedrock.',
        delta: { oxygen: -10, power: -8, food: -4, radiation: +4 },
        recommendedRole: PlayerRoles.COMMANDER,
        rationale: 'Commander manages disciplined emergency crew relocation.',
      },
    ],
  },

  // 12. Perchlorate Dust Infiltration (Bonus scenario)
  {
    id: 'evt-perchlorate-dust',
    title: 'Toxic Perchlorate Dust Infiltration',
    category: EventCategories.LIFE_SUPPORT,
    severity: EventSeverities.WARNING,
    icon: '☣️',
    description:
      'Fine perchlorate-laden regolith was inadvertently tracked through airlock scrubbers into the crew living quarters, causing respiratory irritation and thyroid stress.',
    options: [
      {
        id: 'opt-dust-decontam',
        title: 'Full Chemical Decontamination & Hepa Purge',
        description:
          'Flush living quarters with electrostatic precipitators and neutralize salts with dilute acidic wash.',
        delta: { oxygen: -12, power: -10, food: 0, radiation: 0 },
        recommendedRole: PlayerRoles.MEDIC,
        rationale: 'Medic oversees biochemical safety protocols and crew pulmonary health.',
      },
      {
        id: 'opt-dust-isolate',
        title: 'Seal Habitation Quarters & Sleep in Laboratory Pod',
        description:
          'Quarantine contaminated quarters and crowd the crew into the science module until automated scrubbers finish.',
        delta: { oxygen: -5, power: -6, food: -5, radiation: 0 },
        recommendedRole: PlayerRoles.SCIENTIST,
        rationale: 'Scientist calibrates lab air handling and particle monitors.',
      },
    ],
  },
]);

/**
 * Retrieves a single event by its unique identifier.
 *
 * @param {string} id - The event identifier (e.g. 'evt-dust-storm').
 * @returns {Object|undefined} The event object, or undefined if not found.
 */
export function getEventById(id) {
  if (!id || typeof id !== 'string') return undefined;
  return EVENTS_CATALOG.find((event) => event.id === id);
}

/**
 * Filters the catalog by severity level.
 *
 * @param {'warning'|'critical'|'emergency'} severity
 * @returns {Array<Object>}
 */
export function getEventsBySeverity(severity) {
  return EVENTS_CATALOG.filter((event) => event.severity === severity);
}

/**
 * Filters the catalog by event category.
 *
 * @param {string} category
 * @returns {Array<Object>}
 */
export function getEventsByCategory(category) {
  return EVENTS_CATALOG.filter((event) => event.category === category);
}

/**
 * Selects a random event from the catalog, optionally excluding specific IDs.
 *
 * @param {string[]} [excludeIds=[]] - Array of event IDs to skip.
 * @returns {Object} A random event.
 */
export function getRandomEvent(excludeIds = []) {
  const excluded = new Set(Array.isArray(excludeIds) ? excludeIds : []);
  const available = EVENTS_CATALOG.filter((event) => !excluded.has(event.id));
  const pool = available.length > 0 ? available : EVENTS_CATALOG;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
