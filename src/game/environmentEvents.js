/** Fictional preview events. All resource effects are applied by resourceManager. */
export const SIMULATED_SOL_EVENTS = [
  { id: 'dust-front', title: 'Dust front crossing', message: 'Static and airborne dust are reducing solar intake.', type: 'warning', delta: { power: -4, radiation: 4 } },
  { id: 'power-fluctuation', title: 'Power fluctuation', message: 'A generator surge has lowered reserve power. Check the Power Station.', type: 'critical', delta: { power: -9 } },
  { id: 'pressure-leak', title: 'Pressure leak detected', message: 'The habitat monitor reports an oxygen pressure drop. Check Life Support.', type: 'critical', delta: { oxygen: -9 } },
  { id: 'cold-night', title: 'Cold night cycle', message: 'Heating demand has increased and food stores need attention.', type: 'warning', delta: { power: -3, food: -5 } },
]

export function getSimulatedSolEvent(sol) {
  const index = Math.max(0, Number(sol) - 2) % SIMULATED_SOL_EVENTS.length
  return SIMULATED_SOL_EVENTS[index]
}
