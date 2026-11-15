/** Convert the facility's normalized entrance marker to Phaser world coordinates. */
export function resolveInteriorSpawn(room, marker) {
  return {
    x: room.x + room.width * marker.x,
    y: room.y + room.height - marker.yFromBottom,
  }
}

export function resolveExteriorSpawn(facility, marker) {
  return {
    x: facility.x + facility.width / 2 + marker.x,
    y: facility.y + facility.height + marker.y,
  }
}

/** Search near the intended entrance first, then try the facility fallback. */
export function findNearestSafeSpawn(primary, fallbacks, isSafe, { step = 12, maxRadius = 192 } = {}) {
  const search = (origin) => {
    if (isSafe(origin)) return origin
    for (let radius = step; radius <= maxRadius; radius += step) {
      const candidates = Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2
        return {
          x: origin.x + Math.cos(angle) * radius,
          y: origin.y + Math.sin(angle) * radius,
        }
      }).sort((left, right) => (
        Math.hypot(left.x - primary.x, left.y - primary.y)
        - Math.hypot(right.x - primary.x, right.y - primary.y)
      ))
      const safe = candidates.find(isSafe)
      if (safe) return safe
    }
    return null
  }

  const preferred = search(primary)
  if (preferred) return preferred
  for (const fallback of fallbacks) {
    const safe = search(fallback)
    if (safe) return safe
  }
  return null
}
