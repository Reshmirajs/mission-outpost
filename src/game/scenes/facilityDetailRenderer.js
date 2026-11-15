import { FACILITY_INTERIOR_DETAILS } from '../maps/facilityInteriorDetails.js'

function drawMonitor(scene, room, detail, map = false) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const { width, height } = detail
  const art = scene.add.graphics().setDepth(y + height)
  art.fillStyle(0x080e10, 0.45)
  art.fillRoundedRect(x + 4, y + 6, width, height, 7)
  art.fillStyle(0x343b3e, 1)
  art.fillRoundedRect(x, y, width, height, 7)
  art.lineStyle(2, detail.color, 0.9)
  art.strokeRoundedRect(x, y, width, height, 7)
  art.fillStyle(0x101b20, 1)
  art.fillRoundedRect(x + 6, y + 5, width - 12, height - 18, 4)
  if (map) {
    art.lineStyle(1.5, detail.color, 0.75)
    art.lineBetween(x + 18, y + 31, x + width * 0.42, y + 18)
    art.lineBetween(x + width * 0.42, y + 18, x + width * 0.7, y + 34)
    art.lineBetween(x + width * 0.7, y + 34, x + width - 18, y + 20)
    art.fillStyle(0xe8ae62, 1)
    art.fillCircle(x + width * 0.42, y + 18, 3)
    art.fillCircle(x + width * 0.7, y + 34, 3)
  } else {
    for (let row = 0; row < 3; row += 1) {
      const left = x + 13
      const lineY = y + 14 + row * 9
      art.lineStyle(1, row === 0 ? detail.color : 0x658086, row === 0 ? 0.85 : 0.5)
      art.lineBetween(left, lineY, x + width - 14 - (row % 2) * 14, lineY)
      art.fillStyle(row === 1 ? 0xe5b55e : detail.color, 0.85)
      art.fillCircle(x + width - 12, lineY, 2)
    }
  }
  art.fillStyle(detail.color, 0.9)
  art.fillRect(x + 9, y + height - 10, 5, 2)
  art.fillRect(x + 17, y + height - 10, 5, 2)
  scene.add.text(x + width / 2, y + height + 1, detail.label, {
    fontFamily: 'Arial, sans-serif', fontSize: '6px', fontStyle: 'bold',
    color: '#d8c3ab', align: 'center',
  }).setOrigin(0.5, 0).setDepth(y + height + 2)
}

function drawCabinet(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const { width, height } = detail
  const art = scene.add.graphics().setDepth(y + height)
  art.fillStyle(0x070808, 0.38)
  art.fillRoundedRect(x + 5, y + 7, width, height, 6)
  art.fillStyle(0x4b5558, 1)
  art.fillRoundedRect(x, y, width, height, 6)
  art.lineStyle(2, 0x899193, 0.85)
  art.strokeRoundedRect(x, y, width, height, 6)
  art.fillStyle(0x313b3d, 1)
  art.fillRoundedRect(x + 5, y + 6, width - 10, height - 13, 4)
  for (let slot = 0; slot < 4; slot += 1) {
    art.fillStyle(slot === 0 ? detail.color || 0xe7a94f : 0x778284, slot === 0 ? 0.9 : 0.6)
    art.fillRoundedRect(x + 9, y + 12 + slot * 7, Math.max(7, width - 23), 2, 1)
  }
  art.fillStyle(detail.color || 0xdaa458, 0.9)
  art.fillCircle(x + width - 9, y + 12, 2.2)
  scene.add.text(x + width / 2, y + height + 1, detail.label, {
    fontFamily: 'Arial, sans-serif', fontSize: '5px', fontStyle: 'bold',
    color: '#d8c3ab', align: 'center',
  }).setOrigin(0.5, 0).setDepth(y + height + 2)
}

function drawGrowRack(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const { width, height } = detail
  const art = scene.add.graphics().setDepth(y + height)
  art.fillStyle(0x070909, 0.28)
  art.fillRoundedRect(x + 5, y + 7, width, height, 5)
  art.lineStyle(5, 0x6d7771, 0.95)
  art.lineBetween(x + 5, y + 2, x + 5, y + height - 3)
  art.lineBetween(x + width - 5, y + 2, x + width - 5, y + height - 3)
  for (let shelf = 0; shelf < 3; shelf += 1) {
    const shelfY = y + 16 + shelf * 30
    art.fillStyle(0x343d37, 1)
    art.fillRoundedRect(x + 4, shelfY + 10, width - 8, 13, 4)
    art.fillStyle(0x94bd71, 0.88)
    art.fillRoundedRect(x + 8, shelfY + 7, width - 16, 4, 2)
    for (let plant = 0; plant < 3; plant += 1) {
      const plantX = x + 15 + plant * ((width - 30) / 2)
      art.fillStyle(plant % 2 ? 0x8fbe75 : 0x70a965, 1)
      art.fillEllipse(plantX, shelfY + 5, 7, 11, 12)
    }
  }
  art.lineStyle(2, detail.color, 0.8)
  art.lineBetween(x + 8, y + 1, x + width - 8, y + 1)
}

function drawOxygenRack(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const art = scene.add.graphics().setDepth(y + detail.height)
  art.fillStyle(0x070909, 0.32)
  art.fillRoundedRect(x + 4, y + 6, detail.width, detail.height, 6)
  for (let bottle = 0; bottle < 3; bottle += 1) {
    const bx = x + 8 + bottle * 18
    art.fillStyle(0x50676a, 1)
    art.fillRoundedRect(bx, y + 13, 14, detail.height - 26, 7)
    art.lineStyle(1.5, 0xb6d6d0, 0.8)
    art.strokeRoundedRect(bx, y + 13, 14, detail.height - 26, 7)
    art.fillStyle(detail.color, 0.85)
    art.fillRect(bx + 2, y + 25, 10, 5)
    art.fillStyle(0xc4c9c1, 1)
    art.fillRect(bx + 4, y + 8, 6, 7)
  }
  art.lineStyle(4, 0x8b9794, 1)
  art.lineBetween(x + 2, y + detail.height - 8, x + detail.width - 2, y + detail.height - 8)
  scene.add.text(x + detail.width / 2, y + detail.height + 1, detail.label, {
    fontFamily: 'Arial, sans-serif', fontSize: '5px', fontStyle: 'bold',
    color: '#d8c3ab', align: 'center',
  }).setOrigin(0.5, 0).setDepth(y + detail.height + 2)
}

function drawPipeRun(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const art = scene.add.graphics().setDepth(y + detail.height + 1)
  const horizontal = !detail.vertical
  const x2 = horizontal ? x + detail.width : x
  const y2 = horizontal ? y : y + detail.height
  art.lineStyle(10, 0x1c2223, 0.65)
  art.lineBetween(x + 2, y + 3, x2 + 2, y2 + 3)
  art.lineStyle(6, 0x68777a, 1)
  art.lineBetween(x, y, x2, y2)
  art.lineStyle(2, detail.color, 0.9)
  art.lineBetween(x, y - 1, x2, y2 - 1)
  for (const fraction of [0.08, 0.5, 0.92]) {
    const jointX = x + (x2 - x) * fraction
    const jointY = y + (y2 - y) * fraction
    art.fillStyle(0xb1aaa0, 1)
    art.fillCircle(jointX, jointY, 4)
    art.fillStyle(detail.color, 1)
    art.fillCircle(jointX, jointY, 1.6)
  }
}

function drawFloorLights(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const art = scene.add.graphics().setDepth(y - 1)
  art.fillStyle(0x0b1010, 0.35)
  art.fillRoundedRect(x, y + 4, detail.width, detail.height, 5)
  art.fillStyle(detail.color, 0.45)
  art.fillRoundedRect(x, y, detail.width, detail.height - 4, 5)
  art.fillStyle(0xffedc7, 0.72)
  for (let index = 0; index < Math.floor(detail.width / 32); index += 1) {
    art.fillRoundedRect(x + 8 + index * 32, y + 3, 15, 3, 2)
  }
}

function drawBeacon(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const base = scene.add.graphics().setDepth(y + 5)
  base.fillStyle(0x2a3030, 1)
  base.fillRoundedRect(x - 15, y + 7, 30, 10, 3)
  base.fillStyle(detail.color, 0.95)
  base.fillCircle(x, y + 2, 7)
  const glow = scene.add.circle(x, y + 2, 13, detail.color, 0.18).setDepth(y + 4)
  scene.tweens.add({ targets: glow, alpha: 0.5, scale: 1.45, duration: 800, yoyo: true, repeat: -1 })
}

function drawRover(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const { width, height } = detail
  const art = scene.add.graphics().setDepth(y + height)
  art.fillStyle(0x090a0b, 0.35)
  art.fillRoundedRect(x + 8, y + height - 14, width - 16, 17, 7)
  for (const wheelX of [x + 24, x + width - 24]) {
    art.fillStyle(0x202629, 1)
    art.fillCircle(wheelX, y + height - 13, 13)
    art.lineStyle(3, 0x89908d, 0.9)
    art.strokeCircle(wheelX, y + height - 13, 8)
  }
  art.fillStyle(detail.color, 1)
  art.lineStyle(3, 0xd9b080, 0.9)
  art.fillRoundedRect(x + 18, y + 13, width - 36, height - 28, 12)
  art.strokeRoundedRect(x + 18, y + 13, width - 36, height - 28, 12)
  art.fillStyle(0x27383c, 1)
  art.fillRoundedRect(x + width / 2 - 19, y + 19, 38, 23, 6)
  art.fillStyle(0xb8d7d2, 0.9)
  art.fillCircle(x + width / 2, y + 30, 5)
  art.lineStyle(3, 0xb7a586, 1)
  art.lineBetween(x + width / 2, y + 15, x + width / 2 + 9, y - 1)
  art.fillStyle(0xd4c18f, 1)
  art.fillCircle(x + width / 2 + 9, y - 1, 4)
}

function drawTelescope(scene, room, detail) {
  const x = room.x + detail.x
  const y = room.y + detail.y
  const art = scene.add.graphics().setDepth(y + detail.height)
  art.fillStyle(0x090a0b, 0.32)
  art.fillEllipse(x + detail.width / 2, y + detail.height - 9, detail.width * 0.84, 19)
  art.lineStyle(8, 0x525d62, 1)
  art.lineBetween(x + 56, y + 54, x + 42, y + 83)
  art.lineBetween(x + 56, y + 54, x + 76, y + 83)
  art.lineBetween(x + 56, y + 54, x + 59, y + 82)
  art.fillStyle(0x657178, 1)
  art.fillRoundedRect(x + 21, y + 27, 78, 25, 9)
  art.lineStyle(3, detail.color, 1)
  art.strokeRoundedRect(x + 21, y + 27, 78, 25, 9)
  art.fillStyle(0x1f373f, 1)
  art.fillCircle(x + 24, y + 39, 10)
  art.lineStyle(2, 0xa7d5df, 0.9)
  art.strokeCircle(x + 24, y + 39, 10)
  art.fillStyle(0xd3aa70, 1)
  art.fillRoundedRect(x + 92, y + 33, 13, 13, 4)
  scene.add.text(x + detail.width / 2, y + detail.height + 1, detail.label, {
    fontFamily: 'Arial, sans-serif', fontSize: '5px', fontStyle: 'bold',
    color: '#d8c3ab', align: 'center',
  }).setOrigin(0.5, 0).setDepth(y + detail.height + 2)
}

export function drawInteriorAtmosphere(scene, room, facility) {
  const graphics = scene.add.graphics().setDepth(1)
  const accent = facility.lightColor
  graphics.lineStyle(2, 0x0e1213, 0.38)
  graphics.strokeRoundedRect(room.x + 20, room.y + 42, room.width - 40, room.height - 70, 15)
  graphics.lineStyle(2, 0x9aa0a0, 0.34)
  for (let side = 0; side < 2; side += 1) {
    const wallX = side === 0 ? room.x + 23 : room.x + room.width - 23
    graphics.lineBetween(wallX, room.y + 44, wallX, room.y + room.height - 28)
    for (let brace = 0; brace < 3; brace += 1) {
      const braceY = room.y + 82 + brace * ((room.height - 124) / 2)
      graphics.fillStyle(0x62696a, 0.8)
      graphics.fillRoundedRect(wallX - 5, braceY, 10, 32, 3)
      graphics.fillStyle(accent, 0.5)
      graphics.fillRect(wallX - 2, braceY + 5, 4, 2)
    }
  }
  graphics.fillStyle(accent, 0.13)
  graphics.fillRoundedRect(room.x + room.width / 2 - 2, room.y + room.height - 42, 4, 37, 2)

  const lightCount = Math.max(2, Math.floor(room.width / 190))
  for (let index = 0; index < lightCount; index += 1) {
    const lightX = room.x + room.width * ((index + 1) / (lightCount + 1))
    const lightY = room.y + 18
    const pool = scene.add.ellipse(lightX, lightY + 35, Math.min(100, room.width / lightCount), 40, accent, 0.045).setDepth(1.2)
    scene.add.rectangle(lightX, lightY, Math.min(58, room.width / lightCount - 12), 7, 0x252b2b).setDepth(3)
    const lens = scene.add.rectangle(lightX, lightY, Math.min(42, room.width / lightCount - 20), 2, accent, 0.92).setDepth(4)
    scene.tweens.add({ targets: lens, alpha: 0.55, duration: 1300 + index * 160, yoyo: true, repeat: -1 })
    scene.tweens.add({ targets: pool, alpha: 0.085, duration: 1700 + index * 170, yoyo: true, repeat: -1 })
  }
}

export function drawFacilityDetails(scene, room, facility) {
  const details = FACILITY_INTERIOR_DETAILS[facility.id] || []
  for (const detail of details) {
    if (detail.type === 'monitor') drawMonitor(scene, room, detail)
    else if (detail.type === 'map-display') drawMonitor(scene, room, detail, true)
    else if (detail.type === 'cabinet') drawCabinet(scene, room, detail)
    else if (detail.type === 'grow-rack') drawGrowRack(scene, room, detail)
    else if (detail.type === 'oxygen-rack') drawOxygenRack(scene, room, detail)
    else if (detail.type === 'pipe-run') drawPipeRun(scene, room, detail)
    else if (detail.type === 'floor-lights') drawFloorLights(scene, room, detail)
    else if (detail.type === 'beacon') drawBeacon(scene, room, detail)
    else if (detail.type === 'rover') drawRover(scene, room, detail)
    else if (detail.type === 'telescope') drawTelescope(scene, room, detail)
  }
}
