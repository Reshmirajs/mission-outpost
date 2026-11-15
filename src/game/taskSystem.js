/**
 * MISSION: OUTPOST - Station Task System
 * NASA Space Apps Challenge 2026
 *
 * Child-friendly, interactive engineering and survival tasks (Ages 7–12)
 * for all 5 habitat stations:
 * - Power Room: Clean Solar Panels, Balance Power Supply
 * - Greenhouse: Water the Plants, Adjust Grow Lights
 * - Life Support Room: Maintain Air Filter, Check Oxygen Supply
 * - Science Lab: Check Radiation Levels, Prepare Storm Shelter
 * - Command Centre: Review Mission Status, Check Crew Health and Status
 */

import { PlayerRoles } from '../types/game.js';

export const TaskStatus = Object.freeze({
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REQUIRES_ATTENTION: 'requires_attention',
});

/**
 * Standardized Master Habitat Tasks for Mars Outpost Survival.
 * Follows the uniform schema required for child-friendly mission operations:
 * - title: Short, action-oriented title
 * - location: Room Name → Equipment Name
 * - equipment: Equipment involved
 * - shortDescription: 1-2 simple sentences explaining the task
 * - steps: Numbered step-by-step instructions (expanded via View Steps)
 * - actionLabel: Clear, tactile action verb for the completion button
 * - successMessage: Friendly confirmation upon successful completion
 * - whyItMatters: Clear educational explanation of why it helps the outpost survive
 */
export const HABITAT_TASKS = [
  // 1. POWER ROOM
  {
    id: 'task-power-sync',
    stationId: 'generator-control',
    roomId: 'power',
    roomName: 'Power Room',
    equipment: 'Solar Panel Array',
    location: 'Power Room → Solar Panel Array',
    title: 'Clean the Solar Panels',
    shortDescription: 'Remove dust from the solar panels so they can generate more electricity for the outpost.',
    shortExplanation: 'Remove dust from the solar panels so they can generate more electricity for the outpost.',
    assignedRole: PlayerRoles.ENGINEER,
    roleTitle: 'Power Engineer',
    steps: [
      'Go to the Solar Panel Array.',
      'Open the Solar Panel Controls.',
      'Select "Clean Solar Panels".',
      'Confirm the cleaning action.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { power: 6 },
    actionLabel: '🧹 Clean Solar Panels',
    successMessage: 'Solar panels cleaned! Electricity generation boosted (+6% Power).',
    whyItMatters: 'Dust can collect on Mars solar panels and reduce electricity production. Cleaning them helps keep the outpost powered.',
    educationalTakeaway: 'Dust can collect on Mars solar panels and reduce electricity production. Cleaning them helps keep the outpost powered.',
  },
  {
    id: 'task-power-grid-balance',
    stationId: 'generator-control',
    roomId: 'power',
    roomName: 'Power Room',
    equipment: 'Power Grid Console',
    location: 'Power Room → Power Grid Console',
    title: 'Balance the Power Supply',
    shortDescription: 'Adjust electricity between life support, crops, and lab systems so the outpost does not run out of power.',
    shortExplanation: 'Adjust electricity between life support, crops, and lab systems so the outpost does not run out of power.',
    assignedRole: PlayerRoles.ENGINEER,
    roleTitle: 'Power Engineer',
    steps: [
      'Check total available electricity from solar and batteries.',
      'Ensure Life Support receives at least 20 kW.',
      'Confirm balanced power distribution across all rooms.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { power: 4 },
    actionLabel: '⚖️ Balance Power Supply',
    successMessage: 'Power supply balanced! Grid stabilized across all habitat rooms (+4% Power).',
    whyItMatters: 'Electricity is limited on Mars. Balancing power ensures astronauts can breathe while still keeping food growing and science running.',
    educationalTakeaway: 'Electricity is limited on Mars. Balancing power ensures astronauts can breathe while still keeping food growing and science running.',
  },

  // 2. GREENHOUSE
  {
    id: 'task-hydroponics-flush',
    stationId: 'hydroponics',
    roomId: 'greenhouse',
    roomName: 'Greenhouse',
    equipment: 'Hydroponic Plant Beds',
    location: 'Greenhouse → Hydroponic Plant Beds',
    title: 'Water the Plants',
    shortDescription: 'Pump clean water and liquid nutrients into the plant trays to keep the fresh vegetables growing.',
    shortExplanation: 'Pump clean water and liquid nutrients into the plant trays to keep the fresh vegetables growing.',
    assignedRole: PlayerRoles.BOTANIST,
    roleTitle: 'Botanist',
    steps: [
      'Check moisture levels in the vegetable plant trays.',
      'Open the main water pump to spray the plant roots.',
      'Confirm steady water flow to sweet potatoes and lettuce.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { food: 7, water: -2 },
    actionLabel: '💧 Water Plant Beds',
    successMessage: 'Plants watered and fed! Harvest yield increased (+7% Food, -2% Water).',
    whyItMatters: 'Martian soil has toxic chemicals, so astronauts grow food in water trays. Watering crops gives the crew fresh food to eat.',
    educationalTakeaway: 'Martian soil has toxic chemicals, so astronauts grow food in water trays. Watering crops gives the crew fresh food to eat.',
  },
  {
    id: 'task-crop-water-ration',
    stationId: 'hydroponics',
    roomId: 'greenhouse',
    roomName: 'Greenhouse',
    equipment: 'LED Grow Lights',
    location: 'Greenhouse → LED Grow Lights',
    title: 'Adjust the Grow Lights',
    shortDescription: 'Set the brightness of the overhead grow lamps so crops get enough light without wasting power.',
    shortExplanation: 'Set the brightness of the overhead grow lamps so crops get enough light without wasting power.',
    assignedRole: PlayerRoles.BOTANIST,
    roleTitle: 'Botanist',
    steps: [
      'Inspect current grow lamp brightness.',
      'Select the daytime photosynthesis light mode.',
      'Confirm the lighting schedule for all plant trays.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { food: 5 },
    actionLabel: '☀️ Set Grow Lights',
    successMessage: 'Grow lights optimized! Photosynthesis active (+5% Food).',
    whyItMatters: 'Mars is further from the Sun and receives less sunlight than Earth. Special LED lamps provide the light plants need to grow food.',
    educationalTakeaway: 'Mars is further from the Sun and receives less sunlight than Earth. Special LED lamps provide the light plants need to grow food.',
  },

  // 3. LIFE SUPPORT ROOM
  {
    id: 'task-scrubber-regen',
    stationId: 'oxygen-control',
    roomId: 'life-support',
    roomName: 'Life Support Room',
    equipment: 'Carbon Dioxide Scrubber',
    location: 'Life Support Room → Carbon Dioxide Scrubber',
    title: 'Maintain the Air Filter',
    shortDescription: 'Clean the air filters to remove the carbon dioxide exhaled by the crew so the air stays safe to breathe.',
    shortExplanation: 'Clean the air filters to remove the carbon dioxide exhaled by the crew so the air stays safe to breathe.',
    assignedRole: PlayerRoles.MEDIC,
    roleTitle: 'Life Support Officer',
    steps: [
      'Check the carbon dioxide level in the habitat air.',
      'Start the filter heating cycle to flush trapped carbon dioxide.',
      'Confirm clean air is circulating through the outpost.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { oxygen: 7, water: 2 },
    actionLabel: '🔄 Clean Air Filter',
    successMessage: 'Air filter cleaned! Oxygen circulation restored (+7% Oxygen, +2% Water).',
    whyItMatters: 'Humans breathe in oxygen and breathe out carbon dioxide. In an airtight Mars habitat, filters must remove carbon dioxide so the crew can breathe safely.',
    educationalTakeaway: 'Humans breathe in oxygen and breathe out carbon dioxide. In an airtight Mars habitat, filters must remove carbon dioxide so the crew can breathe safely.',
  },
  {
    id: 'task-pressure-seal-audit',
    stationId: 'oxygen-control',
    roomId: 'life-support',
    roomName: 'Life Support Room',
    equipment: 'Oxygen Storage Tanks',
    location: 'Life Support Room → Oxygen Storage Tanks',
    title: 'Check the Oxygen Supply',
    shortDescription: 'Inspect the habitat air pressure and check the main oxygen storage tanks and airlock seals for leaks.',
    shortExplanation: 'Inspect the habitat air pressure and check the main oxygen storage tanks and airlock seals for leaks.',
    assignedRole: PlayerRoles.MEDIC,
    roleTitle: 'Life Support Officer',
    steps: [
      'Read the habitat air pressure gauge (nominal 101.3 kPa).',
      'Inspect airlock gaskets for microscopic air leaks.',
      'Verify emergency oxygen reserve tanks are full.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { oxygen: 4 },
    actionLabel: '🔍 Check Oxygen Tanks',
    successMessage: 'Oxygen tanks and seals verified! Habitat pressure secure (+4% Oxygen).',
    whyItMatters: 'Mars has almost no air pressure outside. Checking oxygen tanks and seals keeps the habitat safe like a spacecraft.',
    educationalTakeaway: 'Mars has almost no air pressure outside. Checking oxygen tanks and seals keeps the habitat safe like a spacecraft.',
  },

  // 4. SCIENCE LAB
  {
    id: 'task-dosimeter-cal',
    stationId: 'research-workstation',
    roomId: 'science',
    roomName: 'Science Lab',
    equipment: 'Radiation Sensor Station',
    location: 'Science Lab → Radiation Sensor Station',
    title: 'Check Radiation Levels',
    shortDescription: 'Measure space radiation levels inside the habitat to ensure the protective shielding is keeping the crew safe.',
    shortExplanation: 'Measure space radiation levels inside the habitat to ensure the protective shielding is keeping the crew safe.',
    assignedRole: PlayerRoles.SCIENTIST,
    roleTitle: 'Science & Safety Officer',
    steps: [
      'Read the radiation sensor meter.',
      'Compare the reading with NASA Curiosity rover baseline.',
      'Confirm the habitat shields are blocking cosmic rays.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { radiation: -5 },
    actionLabel: '📡 Check Radiation Sensors',
    successMessage: 'Radiation levels scanned and logged! Crew exposure safe (-5% Radiation Hazard).',
    whyItMatters: 'Mars does not have a thick atmosphere or magnetic shield like Earth. Monitoring radiation ensures the crew stays safe from harmful cosmic rays.',
    educationalTakeaway: 'Mars does not have a thick atmosphere or magnetic shield like Earth. Monitoring radiation ensures the crew stays safe from harmful cosmic rays.',
  },
  {
    id: 'task-storm-shelter-prep',
    stationId: 'research-workstation',
    roomId: 'science',
    roomName: 'Science Lab',
    equipment: 'Storm Shelter Controls',
    location: 'Science Lab → Storm Shelter Controls',
    title: 'Prepare the Storm Shelter',
    shortDescription: 'Check the emergency storm shelter doors and water shielding in case a solar storm hits Mars.',
    shortExplanation: 'Check the emergency storm shelter doors and water shielding in case a solar storm hits Mars.',
    assignedRole: PlayerRoles.SCIENTIST,
    roleTitle: 'Science & Safety Officer',
    steps: [
      'Check the NASA space weather solar flare forecast.',
      'Inspect the storm shelter water wall shields.',
      'Send shelter readiness confirmation to the Commander.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { radiation: -4 },
    actionLabel: '🛡️ Prepare Storm Shelter',
    successMessage: 'Storm shelter verified and ready! Crew protection ensured (-4% Radiation Hazard).',
    whyItMatters: 'Solar flares send bursts of high-energy particles toward Mars. A reinforced storm shelter protects astronauts during space weather storms.',
    educationalTakeaway: 'Solar flares send bursts of high-energy particles toward Mars. A reinforced storm shelter protects astronauts during space weather storms.',
  },

  // 5. COMMAND CENTRE
  {
    id: 'task-mission-briefing',
    stationId: 'mission-console',
    roomId: 'command',
    roomName: 'Command Centre',
    equipment: 'Main Mission Display',
    location: 'Command Centre → Main Mission Display',
    title: 'Review Mission Status',
    shortDescription: 'Review crew health, habitat power, oxygen, water, and food levels to plan the Sol\'s survival priorities.',
    shortExplanation: 'Review crew health, habitat power, oxygen, water, and food levels to plan the Sol\'s survival priorities.',
    assignedRole: PlayerRoles.COMMANDER,
    roleTitle: 'Mission Commander',
    steps: [
      'Check all four habitat room status lights.',
      'Review the crew\'s vital signs and readiness.',
      'Confirm the daily survival plan for the outpost.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: { power: 2, oxygen: 2 },
    actionLabel: '📊 Approve Daily Sol Plan',
    successMessage: 'Mission status reviewed! Crew directives synchronized (+2% Power, +2% Oxygen).',
    whyItMatters: 'A successful Mars mission requires team coordination. Reviewing status helps the Commander spot problems before they turn into emergencies.',
    educationalTakeaway: 'A successful Mars mission requires team coordination. Reviewing status helps the Commander spot problems before they turn into emergencies.',
  },
  {
    id: 'task-sol-advance',
    stationId: 'mission-console',
    roomId: 'command',
    roomName: 'Command Centre',
    equipment: 'Crew Communication Board',
    location: 'Command Centre → Crew Communication Board',
    title: 'Check Crew Health and Status',
    shortDescription: 'Check in with every crew specialist, verify completed repairs, and log daily outpost progress.',
    shortExplanation: 'Check in with every crew specialist, verify completed repairs, and log daily outpost progress.',
    assignedRole: PlayerRoles.COMMANDER,
    roleTitle: 'Mission Commander',
    steps: [
      'Check the list of completed maintenance tasks.',
      'Verify all active emergency alerts have been addressed.',
      'Record the daily log entry for the Sol.',
    ],
    status: TaskStatus.AVAILABLE,
    resourceEffect: {},
    actionLabel: '📝 Verify Crew Health & Log Sol',
    successMessage: 'Crew health verified and daily progress recorded!',
    whyItMatters: 'Astronauts must work together every Sol. Checking health and logging tasks keeps the whole team prepared for the next day on Mars.',
    educationalTakeaway: 'Astronauts must work together every Sol. Checking health and logging tasks keeps the whole team prepared for the next day on Mars.',
  },
];

/**
 * Returns tasks assigned to a specific station.
 * @param {string} stationId
 * @param {Array<Object>} [tasks]
 * @returns {Array<Object>}
 */
export function getTasksForStation(stationId, tasks = HABITAT_TASKS) {
  return tasks.filter((t) => t.stationId === stationId);
}
