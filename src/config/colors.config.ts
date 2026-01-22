export const MotorcycleColors = {
  body: 0x1a1a1a,
  chassis: 0x333333,
  wheels: 0x0a0a0a,
  riderHelmet: 0xff0000,
  riderJacket: 0x4169e1,
  riderPants: 0x2d2d2d
} as const

export const ObstacleColors = {
  sedans: [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff, 0xffffff, 0x888888] as readonly number[],
  truck: 0xcc8800,
  oilSlick: 0x1a1a1a
} as const

export const PowerupColors = {
  coin: 0xffd700
} as const

export const EnvironmentColors = {
  skyTop: 0x4a90e2,
  skyBottom: 0xb8d4f0,
  road: 0x3a3a3a,
  laneMarking: 0xffffff,
  buildingBase: 0x5a5a5a,
  buildingVariant1: 0x6a6a7a,
  buildingVariant2: 0x4a5a6a,
  buildingVariant3: 0x7a7a8a,
  windowLit: 0xffee88,
  windowDark: 0x2a2a3a
} as const

export type MotorcycleColorsType = typeof MotorcycleColors
export type ObstacleColorsType = typeof ObstacleColors
export type PowerupColorsType = typeof PowerupColors
export type EnvironmentColorsType = typeof EnvironmentColors
