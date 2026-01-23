export const ObstacleColors = {
  sedans: [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff, 0xffffff, 0x888888] as readonly number[],
  truck: 0xcc8800
} as const

export const PowerupColors = {
  coin: 0xffd700
} as const

export const EnvironmentColors = {
  skyTop: 0x4a90e2,
  skyBottom: 0xb8d4f0,
  road: 0x3a3a3a,
  laneMarking: 0xcccccc,
  grass: 0x4a7c23,
  fog: 0xb8d4f0
} as const

export const FogConfig = {
  near: -30,
  far: 100
} as const

export const VehicleTintColors = [
  0xffffff,
  0xe9c46a,
  0x457b9d,
  0x2a9d8f
] as const

