import Phaser from 'phaser'
import { HABITAT_LAYOUT } from '../maps/habitatLayout'
import { INTERACTIVE_STATIONS } from '../maps/stationDefinitions'
import { ENVIRONMENTAL_CLUES } from '../maps/environmentalClues'

const ROOM_WALL = 0xf8e8d7
const WALL_OUTLINE = 0x927a77

const ROOM_DECOR = {
  power: { floor: 0xddaF99, tile: 0xe8c0aa, trim: 0xe88b66 },
  command: { floor: 0xa9b9cb, tile: 0xc4d2df, trim: 0x678fa7 },
  greenhouse: { floor: 0xb3c99f, tile: 0xc9d9b4, trim: 0x76a86c },
  'life-support': { floor: 0x9fc9cb, tile: 0xb9d9d8, trim: 0x5a9ea4 },
  science: { floor: 0xc2b3cf, tile: 0xd7cbe0, trim: 0x9a78ad },
}

function drawSegment(graphics, x, y, from, to, horizontal) {
  if (horizontal) graphics.lineBetween(x + from, y, x + to, y)
  else graphics.lineBetween(x, y + from, x, y + to)
}

function drawWallEdge(graphics, x, y, length, horizontal, openings = []) {
  const sorted = [...openings].sort((a, b) => a.offset - b.offset)
  let cursor = 0

  for (const opening of sorted) {
    const start = Math.max(cursor, opening.offset)
    const end = Math.min(length, opening.offset + opening.width)

    if (start > cursor) drawWallLayers(graphics, x, y, cursor, start, horizontal)
    cursor = Math.max(cursor, end)
  }

  if (cursor < length) drawWallLayers(graphics, x, y, cursor, length, horizontal)
}

function drawWallLayers(graphics, x, y, from, to, horizontal) {
  graphics.lineStyle(27, WALL_OUTLINE, 1)
  drawSegment(graphics, x, y + 3, from, to, horizontal)
  graphics.lineStyle(21, ROOM_WALL, 1)
  drawSegment(graphics, x, y, from, to, horizontal)
  graphics.lineStyle(4, 0xffffff, 0.75)
  drawSegment(graphics, x, y - 5, from, to, horizontal)
}

function drawTileFloor(graphics, room, decor) {
  const floorX = room.x + 15
  const floorY = room.y + 15
  const floorWidth = room.width - 30
  const floorHeight = room.height - 30

  graphics.fillStyle(decor.floor, 1)
  graphics.fillRoundedRect(floorX, floorY, floorWidth, floorHeight, 13)

  const tileSize = 34
  for (let row = 0, y = floorY + 5; y < floorY + floorHeight - 4; row += 1, y += tileSize) {
    for (let column = 0, x = floorX + 5; x < floorX + floorWidth - 4; column += 1, x += tileSize) {
      const alternate = (row + column) % 2 === 0
      graphics.fillStyle(decor.tile, alternate ? 0.32 : 0.16)
      graphics.fillRoundedRect(x, y, tileSize - 3, tileSize - 3, 5)
      graphics.fillStyle(0xffffff, alternate ? 0.17 : 0.08)
      graphics.fillCircle(x + 6, y + 6, 1.5)
    }
  }
}

function drawRoomShell(scene, room) {
  const decor = { ...ROOM_DECOR[room.id], floor: room.color, trim: room.accent }
  const graphics = scene.add.graphics().setDepth(0)

  graphics.fillStyle(0x76595a, 0.22)
  graphics.fillRoundedRect(room.x + 8, room.y + 12, room.width, room.height, 22)
  graphics.fillStyle(0x916f70, 1)
  graphics.fillRoundedRect(room.x, room.y, room.width, room.height, 22)
  graphics.fillStyle(ROOM_WALL, 1)
  graphics.fillRoundedRect(room.x + 5, room.y + 5, room.width - 10, room.height - 10, 19)

  drawTileFloor(graphics, room, decor)

  const openings = room.openings || {}
  drawWallEdge(graphics, room.x, room.y, room.width, true, openings.top)
  drawWallEdge(graphics, room.x, room.y + room.height, room.width, true, openings.bottom)
  drawWallEdge(graphics, room.x, room.y, room.height, false, openings.left)
  drawWallEdge(graphics, room.x + room.width, room.y, room.height, false, openings.right)

  // Rounded corner caps and small matching wall panels make the rooms feel built together.
  graphics.fillStyle(ROOM_WALL, 1)
  for (const [x, y] of [
    [room.x, room.y],
    [room.x + room.width, room.y],
    [room.x, room.y + room.height],
    [room.x + room.width, room.y + room.height],
  ]) {
    graphics.fillCircle(x, y, 13)
    graphics.lineStyle(3, WALL_OUTLINE, 0.65)
    graphics.strokeCircle(x, y, 13)
  }

  for (const [panelX, panelY] of [
    [room.x + 30, room.y + 8],
    [room.x + room.width - 50, room.y + 8],
  ]) {
    graphics.fillStyle(decor.trim, 0.9)
    graphics.fillRoundedRect(panelX, panelY, 22, 7, 3)
  }

  drawRoomSign(scene, room, decor.trim)
}

function drawRoomSign(scene, room, trim) {
  const sign = scene.add.graphics().setDepth(12)
  const signX = room.x + 23
  const signY = room.y + 23
  const signWidth = Math.min(room.width - 50, 275)

  sign.fillStyle(0x735d68, 0.25)
  sign.fillRoundedRect(signX + 3, signY + 4, signWidth, 28, 10)
  sign.fillStyle(0xfff3e7, 1)
  sign.fillRoundedRect(signX, signY, signWidth, 28, 10)
  sign.lineStyle(2, trim, 1)
  sign.strokeRoundedRect(signX, signY, signWidth, 28, 10)

  scene.add.text(signX + 12, signY + 6, room.name, {
    fontFamily: 'Arial, sans-serif',
    fontSize: room.name.length > 15 ? '12px' : '14px',
    fontStyle: 'bold',
    color: '#574b62',
  }).setDepth(13)
}

function drawCorridorFloors(scene) {
  const graphics = scene.add.graphics().setDepth(-1)
  const corridorColor = 0xd4b2a4

  for (const corridor of HABITAT_LAYOUT.corridors) {
    graphics.fillStyle(0x80676e, 0.25)
    graphics.fillRoundedRect(corridor.x + 4, corridor.y + 6, corridor.width, corridor.height, 14)
    graphics.fillStyle(corridorColor, 1)
    graphics.fillRoundedRect(corridor.x, corridor.y, corridor.width, corridor.height, 12)
    graphics.lineStyle(2, 0xf8e5d2, 0.8)
    graphics.strokeRoundedRect(corridor.x + 4, corridor.y + 4, corridor.width - 8, corridor.height - 8, 10)

    if (corridor.orientation === 'vertical') {
      graphics.fillStyle(0xf4d1ba, 0.55)
      for (let y = corridor.y + 14; y < corridor.y + corridor.height - 10; y += 25) {
        graphics.fillRoundedRect(corridor.x + corridor.width / 2 - 4, y, 8, 13, 4)
      }
      graphics.lineStyle(5, 0xf8e8d7, 0.8)
      graphics.lineBetween(corridor.x + 3, corridor.y + 10, corridor.x + 3, corridor.y + corridor.height - 10)
      graphics.lineBetween(corridor.x + corridor.width - 3, corridor.y + 10, corridor.x + corridor.width - 3, corridor.y + corridor.height - 10)
    } else {
      graphics.fillStyle(0xf4d1ba, 0.55)
      for (let x = corridor.x + 13; x < corridor.x + corridor.width - 8; x += 24) {
        graphics.fillRoundedRect(x, corridor.y + corridor.height / 2 - 4, 12, 8, 4)
      }
      graphics.lineStyle(5, 0xf8e8d7, 0.8)
      graphics.lineBetween(corridor.x + 10, corridor.y + 3, corridor.x + corridor.width - 10, corridor.y + 3)
      graphics.lineBetween(corridor.x + 10, corridor.y + corridor.height - 3, corridor.x + corridor.width - 10, corridor.y + corridor.height - 3)
    }
  }
}

function drawDoorThresholds(scene) {
  const graphics = scene.add.graphics().setDepth(5)
  const doorColor = 0xffe2a1

  graphics.lineStyle(8, 0x886d75, 0.55)
  graphics.lineBetween(385, 211, 385, 279)
  graphics.lineBetween(217, 467, 217, 535)
  graphics.lineBetween(805, 408, 805, 537)
  graphics.lineBetween(1032, 695, 1113, 695)

  graphics.lineStyle(4, doorColor, 1)
  graphics.lineBetween(385, 211, 385, 279)
  graphics.lineBetween(217, 467, 217, 535)
  graphics.lineBetween(805, 408, 805, 537)
  graphics.lineBetween(1032, 695, 1113, 695)

  for (const [x, y] of [[360, 205], [360, 285], [410, 205], [410, 285], [170, 390], [265, 390], [170, 545], [265, 545], [760, 400], [850, 400], [760, 545], [850, 545], [1025, 655], [1025, 735], [1120, 655], [1120, 735]]) {
    graphics.fillStyle(0xfff5dc, 1)
    graphics.fillCircle(x, y, 6)
    graphics.lineStyle(2, 0xb88c83, 0.8)
    graphics.strokeCircle(x, y, 6)
  }
}

function addSoftShadow(graphics, x, y, width, height, alpha = 0.2) {
  graphics.fillStyle(0x66545d, alpha)
  graphics.fillEllipse(x + 4, y + height * 0.35, width * 0.95, height * 0.32)
}

function drawConsole(graphics, item) {
  const { x, y, color = 0x60889e } = item
  addSoftShadow(graphics, x, y, 122, 77, 0.3)
  graphics.fillStyle(0x8f7779, 1)
  graphics.fillRoundedRect(x - 52, y - 7, 104, 46, 14)
  graphics.fillStyle(color, 1)
  graphics.fillRoundedRect(x - 59, y - 25, 118, 48, 14)
  graphics.lineStyle(3, 0xfff0dc, 0.95)
  graphics.strokeRoundedRect(x - 59, y - 25, 118, 48, 14)

  graphics.fillStyle(0x344b65, 1)
  graphics.fillRoundedRect(x - 46, y - 17, 92, 25, 7)
  graphics.fillStyle(0x8ce2ce, 0.95)
  graphics.fillRoundedRect(x - 39, y - 11, 24, 3, 2)
  graphics.fillStyle(0xf8c978, 0.95)
  graphics.fillRoundedRect(x - 39, y - 4, 39, 3, 2)
  graphics.lineStyle(2, 0x91dcda, 0.85)
  graphics.lineBetween(x + 10, y + 1, x + 19, y - 4)
  graphics.lineBetween(x + 19, y - 4, x + 28, y - 1)
  graphics.lineBetween(x + 28, y - 1, x + 38, y - 13)

  for (let button = 0; button < 4; button += 1) {
    graphics.fillStyle([0xffb279, 0xffd17e, 0x85d7c4, 0xe6a8b8][button], 1)
    graphics.fillCircle(x - 29 + button * 19, y + 15, 3)
  }
}

function drawChair(graphics, item) {
  const { x, y, color = 0xe99b78 } = item
  addSoftShadow(graphics, x, y, 43, 39, 0.2)
  graphics.fillStyle(0x92717b, 1)
  graphics.fillRoundedRect(x - 16, y - 19, 32, 24, 10)
  graphics.fillStyle(color, 1)
  graphics.fillRoundedRect(x - 17, y - 8, 34, 24, 10)
  graphics.lineStyle(2, 0xffe7cc, 0.85)
  graphics.strokeRoundedRect(x - 17, y - 8, 34, 24, 10)
}

function drawMissionTable(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 200, 108, 0.25)
  graphics.fillStyle(0x9a7375, 1)
  graphics.fillRoundedRect(x - 90, y - 33, 180, 72, 20)
  graphics.fillStyle(0xe4ba8c, 1)
  graphics.fillRoundedRect(x - 96, y - 42, 192, 68, 20)
  graphics.lineStyle(3, 0xffedcf, 0.95)
  graphics.strokeRoundedRect(x - 96, y - 42, 192, 68, 20)
  graphics.fillStyle(0xc58f7f, 1)
  graphics.fillRoundedRect(x - 44, y - 22, 88, 28, 11)
  graphics.lineStyle(2, 0x7ca9ac, 1)
  graphics.strokeRoundedRect(x - 38, y - 17, 76, 18, 8)
  graphics.fillStyle(0x86c5bd, 0.7)
  graphics.fillRoundedRect(x - 29, y - 12, 24, 3, 2)
  graphics.fillRoundedRect(x + 1, y - 12, 24, 3, 2)
}

function drawGenerator(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 112, 112, 0.28)
  graphics.fillStyle(0xd47d58, 1)
  graphics.fillRoundedRect(x - 45, y - 44, 90, 88, 18)
  graphics.lineStyle(4, 0xffe0b8, 1)
  graphics.strokeRoundedRect(x - 45, y - 44, 90, 88, 18)
  graphics.fillStyle(0xf5bd76, 1)
  graphics.fillRoundedRect(x - 30, y - 30, 60, 58, 12)
  graphics.fillStyle(0x8d5d69, 1)
  graphics.fillCircle(x, y - 1, 20)
  graphics.fillStyle(0xffd96f, 1)
  graphics.fillCircle(x, y - 1, 10)
  graphics.fillStyle(0xfff0b2, 0.95)
  graphics.fillCircle(x, y - 1, 4)

  graphics.lineStyle(3, 0x875f67, 0.8)
  for (let vent = 0; vent < 4; vent += 1) {
    graphics.lineBetween(x - 31 + vent * 20, y + 34, x - 21 + vent * 20, y + 34)
  }
}

function drawBatteryBank(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 104, 98, 0.25)
  for (let cell = 0; cell < 3; cell += 1) {
    const cellX = x - 39 + cell * 27
    graphics.fillStyle(0x718c9c, 1)
    graphics.fillRoundedRect(cellX, y - 37, 24, 74, 9)
    graphics.lineStyle(2, 0xffead1, 0.9)
    graphics.strokeRoundedRect(cellX, y - 37, 24, 74, 9)
    graphics.fillStyle(cell === 1 ? 0xffd978 : 0x8fe0c1, 1)
    graphics.fillRoundedRect(cellX + 7, y - 24, 10, 24, 4)
    graphics.fillStyle(0x496778, 1)
    graphics.fillRoundedRect(cellX + 6, y + 9, 12, 4, 2)
  }
}

function drawCableRun(graphics, item) {
  const { x, y, width = 130 } = item
  graphics.lineStyle(10, 0x9c6b61, 1)
  graphics.lineBetween(x - width / 2, y, x - 30, y)
  graphics.lineBetween(x - 30, y, x - 12, y + 12)
  graphics.lineBetween(x - 12, y + 12, x + 26, y + 12)
  graphics.lineBetween(x + 26, y + 12, x + width / 2, y - 4)
  graphics.lineStyle(4, 0xffd377, 0.95)
  graphics.lineBetween(x - width / 2, y - 2, x - 30, y - 2)
  graphics.lineBetween(x - 30, y - 2, x - 12, y + 10)
  graphics.lineBetween(x - 12, y + 10, x + 26, y + 10)
  graphics.lineBetween(x + 26, y + 10, x + width / 2, y - 6)
}

function drawPlantBed(graphics, item) {
  const { x, y, width = 138, height = 66 } = item
  addSoftShadow(graphics, x, y, width + 12, height + 18, 0.24)
  graphics.fillStyle(0x986e66, 1)
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 14)
  graphics.lineStyle(3, 0xffe3bc, 1)
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 14)
  graphics.fillStyle(0x66584c, 1)
  graphics.fillRoundedRect(x - width / 2 + 8, y - height / 2 + 8, width - 16, height - 16, 10)

  const leafColors = [0x76b774, 0x8dc67d, 0x579c75, 0xa0cf83]
  for (let plant = 0; plant < 5; plant += 1) {
    const plantX = x - width / 2 + 20 + plant * ((width - 40) / 4)
    const plantY = y + (plant % 2 === 0 ? -5 : 4)
    graphics.lineStyle(3, 0x76a866, 1)
    graphics.lineBetween(plantX, plantY + 10, plantX, plantY - 4)
    graphics.fillStyle(leafColors[plant % leafColors.length], 1)
    graphics.fillEllipse(plantX - 6, plantY - 5, 11, 7)
    graphics.fillEllipse(plantX + 6, plantY - 7, 11, 7)
  }
}

function drawWaterPipe(graphics, item) {
  const { x, y, width = 280 } = item
  graphics.lineStyle(13, 0x638f9b, 1)
  graphics.lineBetween(x - width / 2, y, x - width / 2 + 28, y)
  graphics.lineBetween(x - width / 2 + 28, y, x - width / 2 + 28, y + 24)
  graphics.lineBetween(x - width / 2 + 28, y + 24, x + width / 2 - 28, y + 24)
  graphics.lineBetween(x + width / 2 - 28, y + 24, x + width / 2 - 28, y)
  graphics.lineBetween(x + width / 2 - 28, y, x + width / 2, y)
  graphics.lineStyle(4, 0xc2f1de, 0.9)
  graphics.lineBetween(x - width / 2, y - 3, x - width / 2 + 28, y - 3)
  graphics.lineBetween(x - width / 2 + 31, y + 21, x + width / 2 - 31, y + 21)
  graphics.fillStyle(0x79c9d2, 1)
  graphics.fillCircle(x, y + 24, 8)
}

function drawOxygenTanks(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 121, 122, 0.25)
  for (let tank = 0; tank < 3; tank += 1) {
    const tankX = x - 42 + tank * 42
    graphics.fillStyle(0x719eaa, 1)
    graphics.fillRoundedRect(tankX, y - 45, 34, 91, 15)
    graphics.fillStyle(0xb4e0d8, 1)
    graphics.fillRoundedRect(tankX + 6, y - 36, 8, 60, 4)
    graphics.lineStyle(3, 0xf5e8d4, 1)
    graphics.strokeRoundedRect(tankX, y - 45, 34, 91, 15)
    graphics.fillStyle(0x617f89, 1)
    graphics.fillRoundedRect(tankX + 10, y - 53, 14, 10, 4)
    graphics.fillStyle(tank === 1 ? 0xffd27b : 0x92ddc0, 1)
    graphics.fillCircle(tankX + 17, y + 30, 4)
  }
}

function drawScrubber(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 119, 104, 0.24)
  graphics.fillStyle(0x65949a, 1)
  graphics.fillRoundedRect(x - 50, y - 40, 100, 80, 17)
  graphics.lineStyle(3, 0xe8f5dc, 1)
  graphics.strokeRoundedRect(x - 50, y - 40, 100, 80, 17)
  graphics.fillStyle(0xc9e8d8, 1)
  graphics.fillCircle(x, y - 3, 25)
  graphics.fillStyle(0x75b7b3, 1)
  graphics.fillCircle(x, y - 3, 6)
  graphics.lineStyle(5, 0x75b7b3, 1)
  graphics.lineBetween(x, y - 23, x, y - 9)
  graphics.lineBetween(x + 20, y - 3, x + 6, y - 3)
  graphics.lineBetween(x, y + 17, x, y + 3)
  graphics.lineBetween(x - 20, y - 3, x - 6, y - 3)
  graphics.fillStyle(0xffd477, 1)
  graphics.fillCircle(x + 35, y + 27, 5)
}

function drawMicroscope(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 73, 69, 0.2)
  graphics.lineStyle(13, 0x81709d, 1)
  graphics.lineBetween(x - 5, y + 18, x + 13, y - 9)
  graphics.lineBetween(x + 13, y - 9, x + 1, y - 28)
  graphics.lineStyle(8, 0xf2b982, 1)
  graphics.lineBetween(x - 7, y + 18, x + 17, y + 18)
  graphics.fillStyle(0x9180ac, 1)
  graphics.fillRoundedRect(x - 8, y - 34, 18, 10, 4)
  graphics.fillStyle(0x7ec6bf, 1)
  graphics.fillCircle(x - 7, y + 10, 5)
  graphics.lineStyle(3, 0xfff0dd, 1)
  graphics.strokeCircle(x - 7, y + 10, 5)
}

function drawSampleRack(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 89, 67, 0.2)
  graphics.fillStyle(0x8e7b9b, 1)
  graphics.fillRoundedRect(x - 37, y - 29, 74, 53, 10)
  graphics.lineStyle(3, 0xf2e3d4, 1)
  graphics.strokeRoundedRect(x - 37, y - 29, 74, 53, 10)
  for (let vial = 0; vial < 4; vial += 1) {
    const vialX = x - 25 + vial * 16
    graphics.fillStyle([0x84cbbd, 0xf3c276, 0xe89ca8, 0x9fb8e5][vial], 0.9)
    graphics.fillRoundedRect(vialX, y - 13, 10, 28, 5)
    graphics.fillStyle(0xfff1dd, 1)
    graphics.fillRoundedRect(vialX + 2, y - 19, 6, 7, 2)
    graphics.fillStyle(0xffffff, 0.65)
    graphics.fillRoundedRect(vialX + 2, y - 7, 2, 9, 1)
  }
}

function drawLabBench(graphics, item) {
  const { x, y } = item
  addSoftShadow(graphics, x, y, 127, 98, 0.25)
  graphics.fillStyle(0x8a7b9b, 1)
  graphics.fillRoundedRect(x - 54, y - 39, 108, 78, 16)
  graphics.fillStyle(0xefdbca, 1)
  graphics.fillRoundedRect(x - 61, y - 45, 122, 28, 11)
  graphics.lineStyle(3, 0xfaf1e6, 0.95)
  graphics.strokeRoundedRect(x - 61, y - 45, 122, 28, 11)
  graphics.fillStyle(0x8dd1c5, 1)
  graphics.fillCircle(x - 25, y - 30, 7)
  graphics.fillStyle(0xf2c272, 1)
  graphics.fillCircle(x, y - 30, 7)
  graphics.fillStyle(0xe6a1ae, 1)
  graphics.fillCircle(x + 25, y - 30, 7)
  graphics.fillStyle(0x6e5a84, 1)
  graphics.fillRoundedRect(x - 31, y + 3, 62, 16, 7)
}

function drawVentFan(graphics, item) {
  const { x, y } = item
  graphics.fillStyle(0x77aeb2, 1)
  graphics.fillRoundedRect(x - 42, y - 27, 84, 54, 13)
  graphics.lineStyle(3, 0xe7f2df, 1)
  graphics.strokeRoundedRect(x - 42, y - 27, 84, 54, 13)
  graphics.fillStyle(0x527e88, 1)
  graphics.fillCircle(x, y, 18)
  graphics.fillStyle(0xbfe4d7, 1)
  graphics.fillEllipse(x, y - 8, 7, 16)
  graphics.fillEllipse(x + 8, y + 3, 7, 16)
  graphics.fillEllipse(x - 8, y + 3, 7, 16)
  graphics.fillStyle(0xf5d18a, 1)
  graphics.fillCircle(x, y, 4)
}

function drawStation(graphics, scene, item) {
  switch (item.type) {
    case 'console': drawConsole(graphics, item); break
    case 'chair': drawChair(graphics, item); break
    case 'table': drawMissionTable(graphics, item); break
    case 'generator': drawGenerator(graphics, item); break
    case 'battery': drawBatteryBank(graphics, item); break
    case 'cable': drawCableRun(graphics, item); break
    case 'plant-bed': drawPlantBed(graphics, item); break
    case 'water-pipe': drawWaterPipe(graphics, item); break
    case 'tank': drawOxygenTanks(graphics, item); break
    case 'scrubber': drawScrubber(graphics, item); break
    case 'microscope': drawMicroscope(graphics, item); break
    case 'sample-rack': drawSampleRack(graphics, item); break
    case 'lab-table': drawLabBench(graphics, item); break
    case 'vent': drawVentFan(graphics, item); break
    default: break
  }

  if (item.station) {
    const badge = scene.add.graphics().setDepth(item.y - 5)
    badge.fillStyle(0xfff2dc, 0.96)
    badge.fillCircle(item.x + 44, item.y - 38, 11)
    badge.lineStyle(2, 0xd79573, 1)
    badge.strokeCircle(item.x + 44, item.y - 38, 11)
    badge.fillStyle(0x9c715f, 1)
    badge.fillCircle(item.x + 44, item.y - 38, 3)
  }
}

function drawEnvironmentalClue(scene, clue) {
  const mark = scene.add.graphics().setDepth(clue.y + 8)

  if (clue.type === 'damaged-cable') {
    mark.lineStyle(4, 0xffd178, 0.95)
    mark.lineBetween(clue.x - 8, clue.y - 5, clue.x - 2, clue.y + 1)
    mark.lineBetween(clue.x - 2, clue.y + 1, clue.x + 3, clue.y - 6)
    mark.lineBetween(clue.x + 3, clue.y - 6, clue.x + 8, clue.y - 1)
    mark.lineStyle(2, 0xffefb2, 0.9)
    mark.lineBetween(clue.x - 11, clue.y - 11, clue.x - 7, clue.y - 14)
    mark.lineBetween(clue.x + 10, clue.y - 10, clue.x + 13, clue.y - 13)
  } else if (clue.type === 'pipe-leak') {
    mark.fillStyle(0x79c9d2, 0.82)
    mark.fillEllipse(clue.x - 6, clue.y + 7, 5, 9)
    mark.fillEllipse(clue.x + 2, clue.y + 10, 4, 7)
    mark.fillStyle(0xffd178, 0.9)
    mark.fillCircle(clue.x + 10, clue.y - 7, 4)
    mark.fillStyle(0xfff2cf, 0.9)
    mark.fillCircle(clue.x + 10, clue.y - 7, 1.5)
  } else if (clue.type === 'loose-floor-panel') {
    const panel = scene.add.container(clue.x, clue.y).setDepth(clue.y + 7)
    const plate = scene.add.graphics()
    plate.fillStyle(0x9a797a, 0.3)
    plate.fillRoundedRect(-20, -10, 40, 23, 5)
    plate.fillStyle(0xd7b7a3, 1)
    plate.fillRoundedRect(-20, -13, 40, 22, 5)
    plate.lineStyle(2, 0xf3dfca, 0.9)
    plate.strokeRoundedRect(-20, -13, 40, 22, 5)
    plate.fillStyle(0xf0c27b, 0.9)
    plate.fillCircle(-13, -7, 2)
    plate.fillCircle(13, -7, 2)
    panel.add(plate)
    panel.setAngle(-3)

    mark.fillStyle(0xb98065, 0.78)
    mark.fillCircle(clue.x - 27, clue.y + 10, 2)
    mark.fillCircle(clue.x + 25, clue.y + 13, 2.5)
  } else if (clue.type === 'damaged-equipment') {
    mark.lineStyle(2, 0xd38a70, 0.95)
    mark.lineBetween(clue.x + 15, clue.y - 17, clue.x + 10, clue.y - 11)
    mark.lineBetween(clue.x + 10, clue.y - 11, clue.x + 15, clue.y - 7)
    mark.fillStyle(0xffc86e, 0.95)
    mark.fillCircle(clue.x + 23, clue.y - 21, 4)
    mark.fillStyle(0xfff2cf, 0.95)
    mark.fillCircle(clue.x + 23, clue.y - 21, 1.5)
  }

  if (clue.type !== 'loose-floor-panel') {
    const badge = scene.add.graphics().setDepth(clue.y + 9)
    const badgeX = clue.x + 18
    const badgeY = clue.y - 16
    badge.fillStyle(0xfff3dc, 0.94)
    badge.fillCircle(badgeX, badgeY, 7)
    badge.lineStyle(1.5, 0xc58c71, 0.9)
    badge.strokeCircle(badgeX, badgeY, 7)
    scene.add.text(badgeX, badgeY - 4, '!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#a56c58',
    }).setOrigin(0.5).setDepth(clue.y + 10)
  }
}

function addPlantSway(scene, room) {
  const beds = room.equipment.filter((item) => item.type === 'plant-bed')
  for (const [bedIndex, bed] of beds.entries()) {
    for (let plant = 0; plant < 3; plant += 1) {
      const leaf = scene.add.ellipse(
        bed.x - 42 + plant * 40,
        bed.y - 14 - (plant % 2) * 5,
        13,
        7,
        plant % 2 === 0 ? 0x82bd79 : 0x9bcd83,
      ).setDepth(bed.y + 2)
      scene.tweens.add({
        targets: leaf,
        angle: plant % 2 === 0 ? 8 : -8,
        duration: 1450 + bedIndex * 130,
        yoyo: true,
        repeat: -1,
        delay: plant * 170,
        ease: 'Sine.easeInOut',
      })
    }
  }
}

function addSoftLights(scene) {
  const lights = [
    { x: 554, y: 149, color: 0x83dfc9 },
    { x: 770, y: 149, color: 0xffd17c },
    { x: 905, y: 149, color: 0xe99ab3 },
    { x: 149, y: 180, color: 0xffd674 },
    { x: 1344, y: 650, color: 0x9ce2d4 },
  ]

  for (const [index, light] of lights.entries()) {
    const glow = scene.add.circle(light.x, light.y, 9, light.color, 0.24).setDepth(7)
    const core = scene.add.circle(light.x, light.y, 3.5, light.color, 1).setDepth(8)
    scene.tweens.add({
      targets: glow,
      alpha: 0.58,
      scale: 1.7,
      duration: 1000 + index * 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    scene.tweens.add({
      targets: core,
      alpha: 0.55,
      duration: 800 + index * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }
}

const ASTRONAUT_STYLES = {
  'Mission Commander': { suit: 0xfff1d8, accent: 0xe3ad55, pack: 0xc8904f, mark: 'C', spawn: { x: 585, y: 292 } },
  Commander: { suit: 0xfff1d8, accent: 0xe3ad55, pack: 0xc8904f, mark: 'C', spawn: { x: 585, y: 292 } },
  'Power Engineer': { suit: 0xf29b62, accent: 0xffd06e, pack: 0xbf694f, mark: 'P', spawn: { x: 300, y: 320 } },
  Engineer: { suit: 0xf29b62, accent: 0xffd06e, pack: 0xbf694f, mark: 'P', spawn: { x: 300, y: 320 } },
  Botanist: { suit: 0x85bd79, accent: 0xd8e89b, pack: 0x4e8f6b, mark: 'B', spawn: { x: 475, y: 756 } },
  'Life Support Officer': { suit: 0x79b9d6, accent: 0xd5f0e9, pack: 0x4d91b4, mark: 'L', spawn: { x: 980, y: 755 } },
  Medic: { suit: 0x79b9d6, accent: 0xd5f0e9, pack: 0x4d91b4, mark: 'L', spawn: { x: 980, y: 755 } },
  'Science & Safety Officer': { suit: 0xb39bd2, accent: 0xf1d08c, pack: 0x7f69a8, mark: 'S', spawn: { x: 1300, y: 785 } },
  Scientist: { suit: 0xb39bd2, accent: 0xf1d08c, pack: 0x7f69a8, mark: 'S', spawn: { x: 1300, y: 785 } },
}

const FALLBACK_SPAWNS = [
  { x: 585, y: 292 },
  { x: 300, y: 320 },
  { x: 475, y: 756 },
  { x: 980, y: 755 },
  { x: 1300, y: 785 },
]

function makeAstronautLimb(scene, color, gloveColor, isLeg = false) {
  const limb = scene.add.container(0, 0)
  const piece = scene.add.graphics()
  piece.fillStyle(color, 1)
  piece.lineStyle(2, 0x755f70, 1)
  if (isLeg) {
    piece.fillRoundedRect(-5, -7, 10, 15, 5)
    piece.strokeRoundedRect(-5, -7, 10, 15, 5)
  } else {
    piece.fillRoundedRect(-5, -7, 10, 17, 5)
    piece.strokeRoundedRect(-5, -7, 10, 17, 5)
  }
  const end = isLeg
    ? scene.add.ellipse(0, 7, 14, 7, 0x765f71)
    : scene.add.circle(0, 11, 5, gloveColor)
  limb.add([piece, end])
  return limb
}

function createAstronaut(scene, player, index) {
  const role = player.role || 'Mission Commander'
  const style = ASTRONAUT_STYLES[role] || ASTRONAUT_STYLES['Mission Commander']
  const spawn = style.spawn || FALLBACK_SPAWNS[index] || FALLBACK_SPAWNS[0]
  const astronaut = scene.add.container(spawn.x, spawn.y).setDepth(spawn.y)
  const visual = scene.add.container(0, 0)

  const shadow = scene.add.ellipse(0, 1, 38, 14, 0x715f68, 0.25)
  const backpack = scene.add.graphics()
  backpack.fillStyle(style.pack, 1)
  backpack.lineStyle(2, 0xffead6, 1)
  backpack.fillRoundedRect(-22, -39, 13, 22, 5)
  backpack.strokeRoundedRect(-22, -39, 13, 22, 5)
  const leftLeg = makeAstronautLimb(scene, style.suit, style.accent, true).setPosition(-7, -6)
  const rightLeg = makeAstronautLimb(scene, style.suit, style.accent, true).setPosition(7, -6)
  const leftArm = makeAstronautLimb(scene, style.suit, style.accent).setPosition(-15, -25)
  const rightArm = makeAstronautLimb(scene, style.suit, style.accent).setPosition(15, -25)
  const torso = scene.add.graphics()
  torso.fillStyle(style.suit, 1)
  torso.lineStyle(3, 0x856e79, 1)
  torso.fillRoundedRect(-13.5, -35.5, 27, 25, 8)
  torso.strokeRoundedRect(-13.5, -35.5, 27, 25, 8)
  const chestStripe = scene.add.graphics()
  chestStripe.fillStyle(style.accent, 1)
  chestStripe.fillRoundedRect(-13.5, -17, 27, 6, 3)
  const badge = scene.add.circle(0, -27, 7, style.pack).setStrokeStyle(2, 0xfff0d9)
  const emblem = scene.add.text(0, -27, style.mark, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '8px',
    fontStyle: 'bold',
    color: '#fff8e8',
  }).setOrigin(0.5)
  const helmet = scene.add.circle(0, -43, 17, 0xfff2dc).setStrokeStyle(3, 0x8b7280)
  const visor = scene.add.ellipse(0, -44, 17, 10, 0x527c91)
  const visorGlint = scene.add.ellipse(-4, -47, 4, 2.5, 0xe4fff2, 0.9)

  visual.add([
    shadow,
    backpack,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    chestStripe,
    badge,
    emblem,
    helmet,
    visor,
    visorGlint,
  ])

  if (role === 'Power Engineer' || role === 'Engineer') {
    const toolBelt = scene.add.graphics()
    toolBelt.fillStyle(0x795f5d, 1)
    toolBelt.fillRoundedRect(-12, -16.5, 24, 7, 2)
    const tool = scene.add.rectangle(9, -17, 3, 10, 0xf4d28b).setRotation(-0.4)
    visual.add([toolBelt, tool])
  } else if (role === 'Botanist') {
    visual.add([
      scene.add.ellipse(-3, -27, 8, 4, 0x9bd47d).setRotation(-0.6),
      scene.add.ellipse(3, -27, 8, 4, 0x9bd47d).setRotation(0.6),
    ])
  } else if (role === 'Life Support Officer' || role === 'Medic') {
    visual.add(scene.add.text(0, -27, 'O₂', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '6px',
      fontStyle: 'bold',
      color: '#fff8e8',
    }).setOrigin(0.5))
  } else if (role === 'Science & Safety Officer' || role === 'Scientist') {
    const scope = scene.add.circle(0, -27, 3, 0x9de2d2)
    const orbit = scene.add.ellipse(0, -27, 12, 5).setStrokeStyle(1, 0x9de2d2)
    orbit.setRotation(0.5)
    visual.add([scope, orbit])
  } else {
    const starDots = scene.add.graphics()
    starDots.fillStyle(0xfff0a8, 1)
    for (let point = 0; point < 5; point += 1) {
      const angle = (point / 5) * Math.PI * 2 - Math.PI / 2
      starDots.fillCircle(Math.cos(angle) * 5, -27 + Math.sin(angle) * 5, 1.7)
    }
    visual.add(starDots)
  }

  const nameParts = (player.name || `Crew ${index + 1}`).split(' ')
  const firstName = nameParts[0] === 'Dr.' ? nameParts[1] || nameParts[0] : nameParts[0]
  const nameTag = scene.add.text(0, -77, firstName, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '10px',
    fontStyle: 'bold',
    color: '#554a60',
    backgroundColor: '#fff2de',
    padding: { x: 5, y: 2 },
  }).setOrigin(0.5)
  const roleTag = scene.add.text(0, -65, role.toUpperCase(), {
    fontFamily: 'Arial, sans-serif',
    fontSize: '6px',
    fontStyle: 'bold',
    color: '#795f70',
    backgroundColor: '#f7e7d4',
    padding: { x: 4, y: 1 },
  }).setOrigin(0.5)

  astronaut.add([visual, roleTag, nameTag])

  return {
    id: player.id || `preview-crew-${index}`,
    role,
    container: astronaut,
    visual,
    visor,
    visorGlint,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    animationTime: index * 0.65,
    controlled: player.controlled !== undefined ? player.controlled : (role === 'Mission Commander' || role === 'Commander' || index === 0),
    walking: false,
    facing: 'down',
  }
}

function drawBackdrop(scene) {
  const graphics = scene.add.graphics().setDepth(-5)
  graphics.fillStyle(0xefd3bd, 1)
  graphics.fillRect(0, 0, HABITAT_LAYOUT.width, HABITAT_LAYOUT.height)

  graphics.fillStyle(0xf7e4d0, 0.45)
  for (let y = 32; y < HABITAT_LAYOUT.height; y += 38) {
    for (let x = 30 + ((y / 38) % 2) * 18; x < HABITAT_LAYOUT.width; x += 38) {
      graphics.fillCircle(x, y, 2)
    }
  }

  graphics.fillStyle(0xf7e4ce, 0.7)
  graphics.fillRoundedRect(34, 37, HABITAT_LAYOUT.width - 68, HABITAT_LAYOUT.height - 74, 38)
  graphics.lineStyle(5, 0xc08f86, 0.75)
  graphics.strokeRoundedRect(34, 37, HABITAT_LAYOUT.width - 68, HABITAT_LAYOUT.height - 74, 38)
}

const WALL_COLLISION_THICKNESS = 18
const CREW_COLLISION_BOX = { width: 22, height: 18, offsetY: -3 }

const SOLID_FURNITURE_BOUNDS = {
  console: { width: 118, height: 64, offsetY: 7 },
  chair: { width: 38, height: 37, offsetY: -1 },
  table: { width: 192, height: 68, offsetY: -8 },
  generator: { width: 90, height: 88 },
  battery: { width: 78, height: 76 },
  'plant-bed': { width: 138, height: 66 },
  tank: { width: 120, height: 98, offsetX: 17, offsetY: -3 },
  scrubber: { width: 100, height: 80 },
  microscope: { width: 45, height: 58 },
  'sample-rack': { width: 74, height: 53 },
  'lab-table': { width: 122, height: 84, offsetY: -3 },
  vent: { width: 84, height: 54 },
}

function makeCollisionRect(x, y, width, height) {
  return { x, y, width, height }
}

function appendWallEdgeColliders(colliders, room, side, openings = []) {
  const horizontal = side === 'top' || side === 'bottom'
  const length = horizontal ? room.width : room.height
  const sorted = [...openings].sort((a, b) => a.offset - b.offset)
  const boundary = side === 'top' ? room.y
    : side === 'bottom' ? room.y + room.height
      : side === 'left' ? room.x
        : room.x + room.width
  let cursor = 0

  const addSegment = (from, to) => {
    const thickness = WALL_COLLISION_THICKNESS
    if (horizontal) {
      const centerY = boundary + (side === 'bottom' ? -2 : 2)
      colliders.push(makeCollisionRect(
        room.x + from - 4,
        centerY - thickness / 2,
        to - from + 8,
        thickness,
      ))
    } else {
      const centerX = boundary + (side === 'right' ? -2 : 2)
      colliders.push(makeCollisionRect(
        centerX - thickness / 2,
        room.y + from - 4,
        thickness,
        to - from + 8,
      ))
    }
  }

  for (const opening of sorted) {
    const start = Math.max(cursor, opening.offset)
    const end = Math.min(length, opening.offset + opening.width)
    if (start > cursor) addSegment(cursor, start)
    cursor = Math.max(cursor, end)
  }
  if (cursor < length) addSegment(cursor, length)
}

function createHabitatCollisionGeometry() {
  const colliders = []
  const walkableRegions = [
    ...HABITAT_LAYOUT.rooms.map(({ x, y, width, height }) => ({ x, y, width, height })),
    ...HABITAT_LAYOUT.corridors,
  ]

  for (const room of HABITAT_LAYOUT.rooms) {
    const openings = room.openings || {}
    appendWallEdgeColliders(colliders, room, 'top', openings.top)
    appendWallEdgeColliders(colliders, room, 'bottom', openings.bottom)
    appendWallEdgeColliders(colliders, room, 'left', openings.left)
    appendWallEdgeColliders(colliders, room, 'right', openings.right)

    for (const item of room.equipment) {
      const bounds = SOLID_FURNITURE_BOUNDS[item.type]
      if (!bounds) continue
      const centerX = item.x + (bounds.offsetX || 0)
      const centerY = item.y + (bounds.offsetY || 0)
      colliders.push(makeCollisionRect(
        centerX - bounds.width / 2,
        centerY - bounds.height / 2,
        bounds.width,
        bounds.height,
      ))
    }
  }

  // The decorated corridor rails are solid; the open ends remain walkable doorways.
  for (const corridor of HABITAT_LAYOUT.corridors) {
    if (corridor.orientation === 'vertical') {
      colliders.push(makeCollisionRect(corridor.x - 2, corridor.y, 10, corridor.height))
      colliders.push(makeCollisionRect(corridor.x + corridor.width - 8, corridor.y, 10, corridor.height))
    } else {
      colliders.push(makeCollisionRect(corridor.x, corridor.y - 2, corridor.width, 10))
      colliders.push(makeCollisionRect(corridor.x, corridor.y + corridor.height - 8, corridor.width, 10))
    }
  }

  return { colliders, walkableRegions }
}

function overlaps(left, right) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
}

export default class HabitatScene extends Phaser.Scene {
  constructor({
    players = [],
    onNearbyStationChange = () => {},
    onStationChange = () => {},
    onNearbyClueChange = () => {},
    onPlayerMove = null,
  } = {}) {
    super('HabitatScene')
    this.fitHabitat = this.fitHabitat.bind(this)
    this.previewPlayers = players
    this.onNearbyStationChange = onNearbyStationChange
    this.onStationChange = onStationChange
    this.onNearbyClueChange = onNearbyClueChange
    this.onPlayerMove = onPlayerMove
    this.nearbyStation = null
    this.nearbyClue = null
    this.activeStation = null
  }

  updateRemotePlayerPosition({ id, role, x, y, facing, walking }) {
    if (!this.astronauts) return
    const remoteAstronaut = this.astronauts.find(
      (a) => (a.id === id || (role && a.role === role)) && !a.controlled
    )
    if (!remoteAstronaut) return

    remoteAstronaut.container.x = x
    remoteAstronaut.container.y = y
    remoteAstronaut.container.setDepth(y + 2)
    if (facing && remoteAstronaut.facing !== facing) {
      const h = facing === 'right' ? 1 : facing === 'left' ? -1 : 0
      const v = facing === 'down' ? 1 : facing === 'up' ? -1 : 0
      this.setAstronautFacing(remoteAstronaut, h, v)
    }
    remoteAstronaut.walking = Boolean(walking)
  }

  create() {
    this.cameras.main.setBackgroundColor('#efd3bd')
    this.cameras.main.setBounds(0, 0, HABITAT_LAYOUT.width, HABITAT_LAYOUT.height)

    drawBackdrop(this)
    drawCorridorFloors(this)
    for (const room of HABITAT_LAYOUT.rooms) drawRoomShell(this, room)
    drawDoorThresholds(this)

    for (const room of HABITAT_LAYOUT.rooms) {
      for (const item of room.equipment) {
        const furniture = this.add.graphics().setDepth(item.y)
        drawStation(furniture, this, item)
      }
      if (room.id === 'greenhouse') addPlantSway(this, room)
    }

    addSoftLights(this)
    for (const clue of ENVIRONMENTAL_CLUES) drawEnvironmentalClue(this, clue)
    const collisionGeometry = createHabitatCollisionGeometry()
    this.solidColliders = collisionGeometry.colliders
    this.walkableRegions = collisionGeometry.walkableRegions
    this.astronauts = this.previewPlayers.slice(0, 5).map((player, index) => createAstronaut(this, player, index))
    this.controlledAstronaut = this.astronauts.find((astronaut) => astronaut.controlled) || this.astronauts[0]
    this.setupMovementInput()

    this.fitHabitat(this.scale.gameSize)
    this.scale.on('resize', this.fitHabitat, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.fitHabitat, this)
    })
  }

  fitHabitat(gameSize) {
    const width = gameSize?.width || this.scale.width
    const height = gameSize?.height || this.scale.height
    const camera = this.cameras.main
    const zoom = Math.min(width / HABITAT_LAYOUT.width, height / HABITAT_LAYOUT.height)

    camera.setZoom(zoom)
    camera.centerOn(HABITAT_LAYOUT.width / 2, HABITAT_LAYOUT.height / 2)
  }

  setupMovementInput() {
    const keyboard = this.input.keyboard
    if (!keyboard) return

    this.cursors = keyboard.createCursorKeys()
    this.wasd = keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }, false)
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false)
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, false)
    keyboard.clearCaptures()

    if (this.game.canvas) {
      this.game.canvas.tabIndex = 0
      this.game.canvas.focus()
    }
  }

  isOnHabitatFloor(x, y) {
    return this.walkableRegions.some((region) => (
      x >= region.x && x <= region.x + region.width
      && y >= region.y && y <= region.y + region.height
    ))
  }

  canAstronautOccupy(astronaut, x, y) {
    const body = makeCollisionRect(
      x - CREW_COLLISION_BOX.width / 2,
      y + CREW_COLLISION_BOX.offsetY - CREW_COLLISION_BOX.height / 2,
      CREW_COLLISION_BOX.width,
      CREW_COLLISION_BOX.height,
    )

    if (!this.isOnHabitatFloor(x, y)) return false
    if (body.x < 0 || body.y < 0 || body.x + body.width > HABITAT_LAYOUT.width || body.y + body.height > HABITAT_LAYOUT.height) {
      return false
    }

    return !this.solidColliders.some((collider) => overlaps(body, collider))
  }

  moveAstronaut(astronaut, deltaX, deltaY) {
    const stepCount = Math.max(1, Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / 5))
    const stepX = deltaX / stepCount
    const stepY = deltaY / stepCount

    for (let step = 0; step < stepCount; step += 1) {
      const nextX = astronaut.container.x + stepX
      if (this.canAstronautOccupy(astronaut, nextX, astronaut.container.y)) {
        astronaut.container.x = nextX
      }

      const nextY = astronaut.container.y + stepY
      if (this.canAstronautOccupy(astronaut, astronaut.container.x, nextY)) {
        astronaut.container.y = nextY
      }
    }
  }

  setAstronautFacing(astronaut, horizontal, vertical) {
    if (Math.abs(horizontal) > Math.abs(vertical)) {
      astronaut.facing = horizontal < 0 ? 'left' : 'right'
    } else if (vertical !== 0) {
      astronaut.facing = vertical < 0 ? 'up' : 'down'
    }

    const visorPositions = {
      down: { x: 0, y: -36, angle: 0 },
      up: { x: 0, y: -50, angle: 0 },
      left: { x: -8, y: -43, angle: -90 },
      right: { x: 8, y: -43, angle: 90 },
    }
    const position = visorPositions[astronaut.facing]
    astronaut.visor.setPosition(position.x, position.y).setAngle(position.angle)
    astronaut.visorGlint.setPosition(position.x - 4, position.y - 2)
  }

  updateAstronautAnimation(astronaut, delta) {
    astronaut.animationTime += delta / 1000
    const cycle = astronaut.animationTime * (astronaut.walking ? 15 : 3.2)

    if (astronaut.walking) {
      const swing = Math.sin(cycle) * 0.42
      astronaut.leftLeg.rotation = swing
      astronaut.rightLeg.rotation = -swing
      astronaut.leftArm.rotation = -swing * 0.8
      astronaut.rightArm.rotation = swing * 0.8
      astronaut.visual.y = Math.abs(Math.sin(cycle)) * 1.5
    } else {
      astronaut.leftLeg.rotation = 0
      astronaut.rightLeg.rotation = 0
      astronaut.leftArm.rotation = 0
      astronaut.rightArm.rotation = 0
      astronaut.visual.y = Math.sin(cycle) * 1.1
    }

    astronaut.container.setDepth(astronaut.container.y + 2)
  }

  update(_time, frameDelta) {
    const delta = Math.min(frameDelta, 50) / 1000

    const isTyping = typeof document !== 'undefined' && document.activeElement && (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    )

    if (this.controlledAstronaut && this.cursors && this.wasd) {
      if (isTyping) {
        if (this.controlledAstronaut.walking) {
          this.controlledAstronaut.walking = false
          if (this.onPlayerMove) {
            this.onPlayerMove({
              id: this.controlledAstronaut.id,
              role: this.controlledAstronaut.role,
              x: this.controlledAstronaut.container.x,
              y: this.controlledAstronaut.container.y,
              facing: this.controlledAstronaut.facing,
              walking: false,
            })
          }
        }
      } else if (this.activeStation) {
        this.controlledAstronaut.walking = false
        if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.closeStationInteraction()
      } else {
        const horizontal = Number(this.cursors.right.isDown || this.wasd.d.isDown)
          - Number(this.cursors.left.isDown || this.wasd.a.isDown)
        const vertical = Number(this.cursors.down.isDown || this.wasd.s.isDown)
          - Number(this.cursors.up.isDown || this.wasd.w.isDown)

        if (horizontal !== 0 || vertical !== 0) {
          this.setAstronautFacing(this.controlledAstronaut, horizontal, vertical)
          const length = Math.hypot(horizontal, vertical)
          const distance = 170 * delta
          const startX = this.controlledAstronaut.container.x
          const startY = this.controlledAstronaut.container.y
          this.moveAstronaut(
            this.controlledAstronaut,
            (horizontal / length) * distance,
            (vertical / length) * distance,
          )
          this.controlledAstronaut.walking = (
            Math.abs(this.controlledAstronaut.container.x - startX)
            + Math.abs(this.controlledAstronaut.container.y - startY)
          ) > 0.2
        } else {
          this.controlledAstronaut.walking = false
        }

        if (this.onPlayerMove && this.controlledAstronaut) {
          this.onPlayerMove({
            id: this.controlledAstronaut.id,
            role: this.controlledAstronaut.role,
            x: this.controlledAstronaut.container.x,
            y: this.controlledAstronaut.container.y,
            facing: this.controlledAstronaut.facing,
            walking: this.controlledAstronaut.walking,
          })
        }

        this.updateNearbyStation()
        this.updateNearbyClue()
        if (this.nearbyStation && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.openStationInteraction(this.nearbyStation)
        }
      }
    }

    for (const astronaut of this.astronauts) this.updateAstronautAnimation(astronaut, delta * 1000)
  }

  updateNearbyStation() {
    const playerX = this.controlledAstronaut.container.x
    const playerY = this.controlledAstronaut.container.y
    const closestStation = INTERACTIVE_STATIONS
      .map((station) => ({
        station,
        distance: Math.hypot(playerX - station.x, playerY - station.y),
      }))
      .filter(({ station, distance }) => distance <= station.interactionRadius)
      .sort((left, right) => left.distance - right.distance)[0]?.station || null

    if (closestStation?.id !== this.nearbyStation?.id) {
      this.nearbyStation = closestStation
      this.onNearbyStationChange(closestStation)
    }
  }

  updateNearbyClue() {
    const playerX = this.controlledAstronaut.container.x
    const playerY = this.controlledAstronaut.container.y
    const closestClue = ENVIRONMENTAL_CLUES
      .map((clue) => ({
        clue,
        distance: Math.hypot(playerX - clue.x, playerY - clue.y),
      }))
      .filter(({ clue, distance }) => distance <= clue.interactionRadius)
      .sort((left, right) => left.distance - right.distance)[0]?.clue || null

    if (closestClue?.id !== this.nearbyClue?.id) {
      this.nearbyClue = closestClue
      this.onNearbyClueChange(closestClue)
    }
  }

  openStationInteraction(station) {
    this.activeStation = station
    this.controlledAstronaut.walking = false
    this.onStationChange(station)
  }

  closeStationInteraction() {
    if (!this.activeStation) return
    this.activeStation = null
    this.onStationChange(null)
    this.game.canvas?.focus()
  }
}
