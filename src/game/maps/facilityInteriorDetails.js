/** Room-relative furnishings. `solid` objects block movement; wall art and pipes do not. */
export const FACILITY_INTERIOR_DETAILS = {
  command: [
    { id: 'crew-monitor', type: 'monitor', x: 56, y: 52, width: 142, height: 62, label: 'CREW VITALS', color: 0x6bb9c3 },
    { id: 'mars-display', type: 'map-display', x: 254, y: 46, width: 178, height: 78, label: 'MARS / SURFACE RELAY', color: 0xe1a760 },
    { id: 'comms-monitor', type: 'monitor', x: 472, y: 52, width: 138, height: 62, label: 'DEEP SPACE COMMS', color: 0x8a9cc2 },
    { id: 'command-locker-left', type: 'cabinet', x: 28, y: 146, width: 42, height: 112, label: 'OPS', solid: { width: 42, height: 96 } },
    { id: 'command-locker-right', type: 'cabinet', x: 580, y: 146, width: 42, height: 112, label: 'STOW', solid: { width: 42, height: 96 } },
    { id: 'command-floor-lights', type: 'floor-lights', x: 114, y: 270, width: 420, height: 14, color: 0xd9a95f },
  ],
  power: [
    { id: 'power-monitor', type: 'monitor', x: 79, y: 38, width: 132, height: 62, label: 'GRID LOAD', color: 0xe5a44d },
    { id: 'power-tool-locker', type: 'cabinet', x: 24, y: 111, width: 50, height: 78, label: 'TOOLS', solid: { width: 50, height: 72 } },
    { id: 'power-coolant', type: 'cabinet', x: 220, y: 72, width: 50, height: 80, label: 'COOLANT', solid: { width: 46, height: 72 } },
    { id: 'power-cable-run', type: 'pipe-run', x: 92, y: 253, width: 122, height: 18, color: 0xe08c4f, vertical: false },
    { id: 'power-warning', type: 'beacon', x: 240, y: 45, color: 0xffb64d },
  ],
  greenhouse: [
    { id: 'greenhouse-monitor', type: 'monitor', x: 165, y: 39, width: 138, height: 61, label: 'GROW CONDITIONS', color: 0x8bc978 },
    { id: 'nutrient-store-left', type: 'cabinet', x: 25, y: 76, width: 50, height: 79, label: 'NUTRIENTS', solid: { width: 50, height: 72 } },
    { id: 'nutrient-store-right', type: 'cabinet', x: 395, y: 76, width: 50, height: 79, label: 'WATER', solid: { width: 50, height: 72 } },
    { id: 'grow-rack-left', type: 'grow-rack', x: 40, y: 160, width: 66, height: 105, color: 0x80bf70, solid: { width: 60, height: 92 } },
    { id: 'grow-rack-right', type: 'grow-rack', x: 366, y: 160, width: 66, height: 105, color: 0x80bf70, solid: { width: 58, height: 92 } },
    { id: 'irrigation-pipe', type: 'pipe-run', x: 82, y: 122, width: 308, height: 14, color: 0x69baca, vertical: false },
  ],
  'life-support': [
    { id: 'life-monitor', type: 'monitor', x: 128, y: 36, width: 136, height: 60, label: 'PRESSURE / FLOW', color: 0x69b9c1 },
    { id: 'emergency-oxygen', type: 'oxygen-rack', x: 27, y: 105, width: 70, height: 112, label: 'RESERVE O₂', color: 0x7bbecb, solid: { width: 58, height: 96 } },
    { id: 'service-cabinet', type: 'cabinet', x: 295, y: 68, width: 54, height: 82, label: 'FILTERS', solid: { width: 50, height: 72 } },
    { id: 'air-pipe', type: 'pipe-run', x: 108, y: 155, width: 18, height: 145, color: 0x6cabb5, vertical: true },
    { id: 'pressure-beacon', type: 'beacon', x: 320, y: 55, color: 0xe4a552 },
  ],
  science: [
    { id: 'analysis-screen', type: 'monitor', x: 31, y: 38, width: 112, height: 60, label: 'SPECTRAL SCAN', color: 0xb8a1d1 },
    { id: 'sample-screen', type: 'monitor', x: 166, y: 38, width: 112, height: 60, label: 'SAMPLE LOG', color: 0x88c1bb },
    { id: 'specimen-cabinet', type: 'cabinet', x: 24, y: 128, width: 52, height: 94, label: 'SAMPLES', solid: { width: 48, height: 84 } },
    { id: 'sample-freezer', type: 'cabinet', x: 238, y: 112, width: 48, height: 74, label: 'COLD STORE', solid: { width: 42, height: 66 } },
    { id: 'analysis-lights', type: 'floor-lights', x: 86, y: 263, width: 142, height: 12, color: 0x9bc6c1 },
  ],
  'rover-garage': [
    { id: 'rover-status', type: 'monitor', x: 20, y: 33, width: 105, height: 56, label: 'ROVER STATUS', color: 0xd9965c },
    { id: 'rover-bay', type: 'rover', x: 150, y: 102, width: 130, height: 78, color: 0xc47b4e, solid: { width: 116, height: 58 } },
    { id: 'rover-tool-store', type: 'cabinet', x: 27, y: 133, width: 50, height: 90, label: 'TOOLS', solid: { width: 48, height: 80 } },
    { id: 'rover-charge-line', type: 'pipe-run', x: 98, y: 253, width: 148, height: 14, color: 0xe3a64f, vertical: false },
  ],
  communications: [
    { id: 'signal-monitor', type: 'map-display', x: 174, y: 44, width: 174, height: 76, label: 'RELAY ALIGNMENT', color: 0xe1b168 },
    { id: 'signal-rack-left', type: 'cabinet', x: 32, y: 133, width: 48, height: 101, label: 'UPLINK', solid: { width: 44, height: 90 } },
    { id: 'signal-rack-right', type: 'cabinet', x: 555, y: 133, width: 48, height: 101, label: 'BACKUP', solid: { width: 44, height: 90 } },
    { id: 'signal-floor-guides', type: 'floor-lights', x: 177, y: 270, width: 476, height: 14, color: 0xdaa85d },
  ],
  observatory: [
    { id: 'observatory-sky-display', type: 'map-display', x: 82, y: 40, width: 145, height: 66, label: 'SIMULATED SKY VIEW', color: 0x9db8d8 },
    { id: 'observatory-telescope', type: 'telescope', x: 28, y: 136, width: 126, height: 86, label: 'OPTICAL TELESCOPE', color: 0x8eabc9, solid: { width: 84, height: 56, offsetY: 12 } },
    { id: 'observatory-cabinet', type: 'cabinet', x: 242, y: 126, width: 44, height: 94, label: 'OPTICS', solid: { width: 38, height: 78 } },
    { id: 'observatory-guide-lights', type: 'floor-lights', x: 36, y: 268, width: 236, height: 12, color: 0x9db8d8 },
  ],
  'satellite-monitoring': [
    { id: 'satellite-array-screen', type: 'map-display', x: 70, y: 40, width: 175, height: 72, label: 'ORBITAL TRACK · SIM', color: 0x8ec3cd },
    { id: 'satellite-signal-screen', type: 'monitor', x: 250, y: 40, width: 130, height: 60, label: 'LINK BUDGET', color: 0xe1b168 },
    { id: 'satellite-rack-left', type: 'cabinet', x: 28, y: 148, width: 46, height: 86, label: 'UPLINK', solid: { width: 40, height: 76 } },
    { id: 'satellite-rack-right', type: 'cabinet', x: 376, y: 148, width: 46, height: 86, label: 'BACKUP', solid: { width: 40, height: 76 } },
    { id: 'satellite-beacon', type: 'beacon', x: 312, y: 130, color: 0x8ec3cd },
  ],
  'medical-bay': [
    { id: 'medical-monitor', type: 'monitor', x: 122, y: 40, width: 140, height: 60, label: 'MEDICAL SYSTEMS', color: 0xd8878d },
    { id: 'medical-oxygen', type: 'oxygen-rack', x: 24, y: 116, width: 72, height: 112, label: 'O₂ RESERVE', color: 0xd8878d, solid: { width: 58, height: 94 } },
    { id: 'medical-cabinet', type: 'cabinet', x: 284, y: 116, width: 48, height: 94, label: 'SUPPLIES', solid: { width: 42, height: 82 } },
    { id: 'medical-floor-guides', type: 'floor-lights', x: 105, y: 270, width: 160, height: 12, color: 0xd8878d },
  ],
  'geological-storage': [
    { id: 'geology-freezer-left', type: 'cabinet', x: 25, y: 76, width: 52, height: 110, label: 'COLD CORE', solid: { width: 46, height: 98 }, color: 0xc89a67 },
    { id: 'geology-freezer-right', type: 'cabinet', x: 253, y: 76, width: 52, height: 110, label: 'DRY CORE', solid: { width: 46, height: 98 }, color: 0xc89a67 },
    { id: 'geology-sample-screen', type: 'monitor', x: 95, y: 42, width: 140, height: 62, label: 'SAMPLE CATALOGUE', color: 0xc89a67 },
    { id: 'geology-pipe', type: 'pipe-run', x: 86, y: 240, width: 160, height: 14, color: 0xc89a67 },
  ],
  'research-archive': [
    { id: 'archive-index-screen', type: 'monitor', x: 104, y: 42, width: 160, height: 66, label: 'RESEARCH INDEX', color: 0xbaa3d0 },
    { id: 'archive-cabinet-left', type: 'cabinet', x: 30, y: 132, width: 48, height: 110, label: 'SOL LOGS', solid: { width: 42, height: 98 }, color: 0xbaa3d0 },
    { id: 'archive-cabinet-right', type: 'cabinet', x: 270, y: 132, width: 48, height: 110, label: 'SAMPLES', solid: { width: 42, height: 98 }, color: 0xbaa3d0 },
    { id: 'archive-floor-guides', type: 'floor-lights', x: 98, y: 274, width: 150, height: 12, color: 0xbaa3d0 },
  ],
}

/** Observatory furnishings are purpose-built; do not stack the Science Lab fixtures there. */
export function getFacilityInteriorEquipment(equipment = [], facilityId) {
  if (facilityId === 'observatory') return []
  return equipment.filter((item) => !(
    facilityId === 'greenhouse'
    && item.type === 'plant-bed'
    && item.x === 295
    && item.y === 770
  ))
}

/** Convert decorative fixture collision boxes to world-space room bounds. */
export function getFacilityInteriorColliders(room, facilityId) {
  return (FACILITY_INTERIOR_DETAILS[facilityId] || []).flatMap((detail) => {
    if (!detail.solid) return []
    const solid = detail.solid
    const width = solid.width ?? detail.width
    const height = solid.height ?? detail.height
    return [{
      x: room.x + detail.x + (detail.width - width) / 2 + (solid.offsetX || 0),
      y: room.y + detail.y + (detail.height - height) / 2 + (solid.offsetY || 0),
      width,
      height,
    }]
  })
}
