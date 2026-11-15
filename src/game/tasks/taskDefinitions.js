/** Local preview task definitions. Outcomes use the shared game resource system. */
export const MISSION_TASKS = [
  {
    id: 'mission-console-check', stationId: 'mission-console', role: 'Mission Commander',
    title: 'Synchronize the mission console', type: 'sequence', target: [2, 0, 3],
    instructions: 'Repeat the three illuminated console keys in order.',
    reward: { power: 4 },
  },
  {
    id: 'restore-generator', stationId: 'generator-control', role: 'Power Engineer',
    title: 'Reconnect the generator', type: 'wires', target: ['amber', 'cyan', 'violet'],
    instructions: 'Connect each cable to the matching color terminal.',
    reward: { power: 14 },
  },
  {
    id: 'balance-hydroponics', stationId: 'hydroponics', role: 'Botanist',
    title: 'Balance the nutrient mix', type: 'calibration', target: 3,
    instructions: 'Set the nutrient dial to the green target mark.',
    reward: { food: 12 },
  },
  {
    id: 'service-filter', stationId: 'oxygen-control', role: 'Life Support Officer',
    title: 'Service the oxygen filter', type: 'sequence', target: [1, 3, 0],
    instructions: 'Repeat the filter service sequence shown on the display.',
    reward: { oxygen: 14 },
  },
  {
    id: 'analyse-sample', stationId: 'research-workstation', role: 'Science & Safety Officer',
    title: 'Classify the rock sample', type: 'sample', target: ['iron', 'silica', 'water'],
    instructions: 'Select the three spectral markers from left to right.',
    reward: { radiation: -5 },
  },
  {
    id: 'rover-diagnostics', stationId: 'rover-diagnostics', role: 'Power Engineer',
    title: 'Run rover cable diagnostics', type: 'wires', target: ['amber', 'cyan', 'violet'],
    instructions: 'Reconnect the rover charging leads to matching terminal colors.',
    reward: { power: 6 },
  },
  {
    id: 'restore-comms-signal', stationId: 'communications-console', role: 'Mission Commander',
    title: 'Align the relay signal', type: 'sequence', target: [3, 1, 2],
    instructions: 'Match the relay console sequence to restore the signal lock.',
    reward: { power: 5 },
  },
  {
    id: 'send-earth-signal', stationId: 'send-earth-signal', facilityId: 'communications', role: 'Mission Commander', title: 'Send a signal to Earth', type: 'frequency', target: 7, unit: 'MHz', category: 'communications', difficulty: 'medium', description: 'Tune the simulated carrier, align the relay, then send a short status packet.', instructions: 'Tune the simulated carrier, align the signal lock, then transmit the encoded packet.', reward: { power: 4 },
  },
  {
    id: 'repair-relay', stationId: 'repair-relay', facilityId: 'communications', role: 'Mission Commander', title: 'Repair the communications relay', type: 'wires', target: ['cyan', 'amber', 'violet'], category: 'communications', difficulty: 'medium', description: 'Reconnect the simulated Earth relay signal path.', instructions: 'Match each relay lead to its terminal.', reward: { power: 5 },
  },
  {
    id: 'satellite-frequency', stationId: 'satellite-frequency', facilityId: 'satellite-monitoring', role: 'Mission Commander', title: 'Calibrate satellite communications', type: 'frequency', target: 4, unit: 'MHz', category: 'communications', difficulty: 'hard', description: 'Tune the simulated relay frequency and lock the downlink.', instructions: 'Sweep the simulated receiver to the reference carrier and confirm lock.', reward: { power: 4 },
  },
  {
    id: 'archive-transmission', stationId: 'archive-transmission', facilityId: 'research-archive', role: 'Mission Commander', title: 'Encode an archive transmission', type: 'catalogue', target: { 'MISSION STATUS': 'EARTH', 'SOL LOG': 'ARCHIVE', 'CREW CHECK': 'EARTH' }, options: ['EARTH', 'ARCHIVE', 'HOLD'], category: 'communications', difficulty: 'easy', description: 'Route each simulated briefing packet to the correct destination.', instructions: 'Choose a destination for each outgoing packet.', reward: { power: 3 },
  },
  {
    id: 'power-distribution', stationId: 'power-distribution', facilityId: 'power', role: 'Power Engineer', title: 'Repair power distribution', type: 'wires', target: ['violet', 'amber', 'cyan'], category: 'engineering', difficulty: 'medium', description: 'Restore the simulated distribution bus by reconnecting its leads.', instructions: 'Match the three bus leads to their color-coded terminals.', reward: { power: 12 },
  },
  {
    id: 'generator-diagnosis', stationId: 'generator-diagnosis', facilityId: 'power', role: 'Power Engineer', title: 'Diagnose the generator fault', type: 'diagnosis', target: 'cooling-loop', options: [{ id: 'cooling-loop', label: 'Cooling loop valve' }, { id: 'fuel-cell', label: 'Fuel cell stack' }, { id: 'load-meter', label: 'Load meter' }], category: 'engineering', difficulty: 'easy', description: 'Read the simulated service panel and identify the indicated fault.', instructions: 'Select the component whose telemetry matches the panel note.', reward: { power: 8 },
  },
  {
    id: 'telescope-calibration', stationId: 'telescope-calibration', facilityId: 'observatory', role: 'Power Engineer', title: 'Calibrate the telescope mount', type: 'calibration', target: 4, category: 'engineering', difficulty: 'medium', description: 'Bring the simulated mount alignment into its target band.', instructions: 'Adjust the mount until its marker meets the green alignment band.', reward: { power: 4 },
  },
  {
    id: 'satellite-actuator', stationId: 'satellite-actuator', facilityId: 'satellite-monitoring', role: 'Power Engineer', title: 'Synchronize the antenna actuator', type: 'sequence', target: [2, 3, 1, 0], category: 'engineering', difficulty: 'hard', description: 'Run the safe simulated actuator synchronization sequence.', instructions: 'Repeat the illuminated actuator sequence in order.', reward: { power: 6 },
  },
  {
    id: 'repair-irrigation', stationId: 'repair-irrigation', facilityId: 'greenhouse', role: 'Botanist', title: 'Repair the irrigation loop', type: 'wires', target: ['amber', 'violet', 'cyan'], category: 'botany', difficulty: 'medium', description: 'Reconnect the simulated greenhouse water loop.', instructions: 'Match each irrigation line to its marked valve.', reward: { food: 7 },
  },
  {
    id: 'crop-health', stationId: 'crop-health', facilityId: 'greenhouse', role: 'Botanist', title: 'Monitor crop health', type: 'diagnosis', target: 'water-stress', options: [{ id: 'water-stress', label: 'Water stress' }, { id: 'light-cycle', label: 'Light-cycle mismatch' }, { id: 'nutrient-excess', label: 'Nutrient excess' }], category: 'botany', difficulty: 'easy', description: 'Interpret the simulated crop sensor panel.', instructions: 'Choose the plant condition supported by the displayed readings.', reward: { food: 6 },
  },
  {
    id: 'nutrient-reservoir', stationId: 'nutrient-reservoir', facilityId: 'greenhouse', role: 'Botanist', title: 'Balance the nutrient reservoir', type: 'calibration', target: 2, category: 'botany', difficulty: 'medium', description: 'Set the simulated nutrient mixture to the marked crop target.', instructions: 'Adjust the reservoir dial to the target mark.', reward: { food: 8 },
  },
  {
    id: 'soil-growth-study', stationId: 'soil-growth-study', facilityId: 'geological-storage', role: 'Botanist', title: 'Compare soil growth samples', type: 'sample', target: ['basalt', 'clay', 'ice'], options: ['basalt', 'clay', 'ice', 'sulfate', 'dust'], category: 'botany', difficulty: 'medium', description: 'Compare simulated soil samples for a greenhouse trial.', instructions: 'Select the sample sequence shown in the study card.', reward: { food: 5 },
  },
  {
    id: 'pressure-stabilization', stationId: 'pressure-stabilization', facilityId: 'life-support', role: 'Life Support Officer', title: 'Stabilize habitat pressure', type: 'pressure', target: [2, 1, 3], category: 'life-support', difficulty: 'hard', description: 'Set the simulated valve sequence to stabilize the habitat loop.', instructions: 'Set the three pressure valves in the displayed safe order.', reward: { oxygen: 8 },
  },
  {
    id: 'inspect-cylinder', stationId: 'inspect-cylinder', facilityId: 'life-support', role: 'Life Support Officer', title: 'Inspect reserve oxygen cylinders', type: 'diagnosis', target: 'seal-wear', options: [{ id: 'seal-wear', label: 'Seal wear' }, { id: 'pressure-gauge', label: 'Gauge drift' }, { id: 'mounting-clip', label: 'Mounting clip' }], category: 'life-support', difficulty: 'easy', description: 'Inspect a simulated reserve cylinder telemetry card.', instructions: 'Identify the component flagged by the inspection readings.', reward: { oxygen: 6 },
  },
  {
    id: 'medical-triage', stationId: 'medical-triage', facilityId: 'medical-bay', role: 'Life Support Officer', title: 'Run a crew medical systems check', type: 'catalogue', target: { 'SUIT SEAL': 'CHECK', 'O₂ LOOP': 'SERVICE', 'MED KIT': 'READY' }, options: ['CHECK', 'SERVICE', 'READY'], category: 'life-support', difficulty: 'medium', description: 'Sort simulated equipment checks into the correct clinic actions.', instructions: 'Choose the action that matches each equipment check.', reward: { oxygen: 4 },
  },
  {
    id: 'water-recycling', stationId: 'water-recycling', facilityId: 'life-support', role: 'Life Support Officer', title: 'Restore water recycling', type: 'wires', target: ['cyan', 'violet', 'amber'], category: 'life-support', difficulty: 'medium', description: 'Reconnect the simulated condensate return lines.', instructions: 'Pair each return line with its labeled valve.', reward: { oxygen: 4 },
  },
  {
    id: 'identify-celestial-body', stationId: 'identify-celestial-body', facilityId: 'observatory', role: 'Science & Safety Officer', title: 'Identify a celestial body', type: 'observation', target: 'mars-moon-phobos', options: [{ id: 'mars-moon-phobos', label: 'Phobos', clue: 'Fast orbit, irregular shape, close to Mars.' }, { id: 'mars-moon-deimos', label: 'Deimos', clue: 'Small irregular moon, slower orbit.' }, { id: 'earth-moon', label: 'Earth’s Moon', clue: 'Large round body orbiting Earth.' }], category: 'astronomy', difficulty: 'easy', simulatedObservation: true, description: 'Use a fictional training observation card to identify a body.', instructions: 'Simulated training observation, not live NASA data. Select the body matching the clues.', reward: { food: 2 },
  },
  {
    id: 'track-approaching-object', stationId: 'track-approaching-object', facilityId: 'observatory', role: 'Science & Safety Officer', title: 'Track an approaching object', type: 'observation', target: 'receding', options: [{ id: 'approaching', label: 'Approaching' }, { id: 'receding', label: 'Receding' }, { id: 'stationary', label: 'No measurable motion' }], category: 'astronomy', difficulty: 'medium', simulatedObservation: true, description: 'Classify a fictional observation trajectory.', instructions: 'Simulated range readings are falling across the samples. Choose the matching trajectory category.', reward: { food: 2 },
  },
  {
    id: 'meteorite-analysis', stationId: 'meteorite-analysis', facilityId: 'geological-storage', role: 'Science & Safety Officer', title: 'Analyze meteorite samples', type: 'sample', target: ['iron', 'silicate', 'nickel'], options: ['iron', 'silicate', 'nickel', 'water ice', 'carbon'], category: 'science', difficulty: 'medium', description: 'Classify a simulated meteorite scan.', instructions: 'Select the three spectral markers in the sequence on the sample card.', reward: { food: 3 },
  },
  {
    id: 'martian-soil-analysis', stationId: 'martian-soil-analysis', facilityId: 'geological-storage', role: 'Science & Safety Officer', title: 'Analyze Martian soil', type: 'sample', target: ['basalt', 'sulfate', 'ice'], options: ['basalt', 'sulfate', 'ice', 'iron', 'silicate'], category: 'science', difficulty: 'hard', simulatedObservation: true, description: 'Compare fictional regolith analysis markers.', instructions: 'Choose the three matching markers in order. Dataset is simulated for this task.', reward: { food: 3 },
  },
  {
    id: 'radiation-reading', stationId: 'radiation-reading', facilityId: 'science', role: 'Science & Safety Officer', title: 'Record an instrument reading', type: 'calibration', target: 3, category: 'science', difficulty: 'medium', simulatedObservation: true, description: 'Calibrate and log a fictional training instrument reading.', instructions: 'Move the simulated instrument marker to the reference. This is not a real radiation measurement.', reward: { power: 2 },
  },
  {
    id: 'catalogue-sample-storage', stationId: 'catalogue-sample-storage', facilityId: 'geological-storage', role: 'Science & Safety Officer', title: 'Catalogue research samples', type: 'catalogue', target: { 'CORE A-12': 'COLD', 'DUST B-04': 'DRY', 'ICE C-09': 'SEALED' }, options: ['COLD', 'DRY', 'SEALED'], category: 'science', difficulty: 'medium', description: 'Match simulated sample identifiers to storage locations.', instructions: 'Choose the correct storage location for each sample ID.', reward: { food: 2 },
  },
]

const TASK_FACILITIES = {
  'mission-console-check': 'command', 'restore-generator': 'power', 'balance-hydroponics': 'greenhouse',
  'service-filter': 'life-support', 'analyse-sample': 'science', 'rover-diagnostics': 'rover-garage', 'restore-comms-signal': 'communications',
}

for (const task of MISSION_TASKS) {
  task.facilityId ||= TASK_FACILITIES[task.id]
  task.description ||= task.instructions
  task.category ||= ({
    'mission-console-check': 'operations', 'restore-generator': 'engineering', 'balance-hydroponics': 'botany',
    'service-filter': 'life-support', 'analyse-sample': 'science', 'rover-diagnostics': 'engineering', 'restore-comms-signal': 'communications',
  })[task.id] || 'operations'
  task.difficulty ||= 'medium'
  task.completionCondition ||= { type: task.type, target: task.target }
  task.status ||= 'not_started'
}

export function getTaskForStation(stationId, assignedTasks = MISSION_TASKS) {
  return assignedTasks.find((task) => task.stationId === stationId || task.id === stationId) || null
}
