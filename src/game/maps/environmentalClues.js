/**
 * Subtle inspection hints for the local habitat preview. These are visual
 * storytelling only and never trigger traps, damage, or resource changes.
 */
export const ENVIRONMENTAL_CLUES = [
  {
    id: 'power-cable-wear',
    type: 'damaged-cable',
    x: 224,
    y: 307,
    interactionRadius: 62,
    tooltip: 'Something looks unusual... A cable sleeve appears worn.',
  },
  {
    id: 'life-support-pipe-leak',
    type: 'pipe-leak',
    x: 977,
    y: 620,
    interactionRadius: 72,
    tooltip: 'Something looks unusual... A small indicator is blinking by the pipe.',
  },
  {
    id: 'corridor-floor-panel',
    type: 'loose-floor-panel',
    x: 217,
    y: 473,
    interactionRadius: 74,
    tooltip: 'Something looks unusual... One floor panel sits slightly out of place.',
  },
  {
    id: 'science-equipment-wear',
    type: 'damaged-equipment',
    x: 1350,
    y: 690,
    interactionRadius: 72,
    tooltip: 'Something looks unusual... The sample rack has a small warning light.',
  },
]
