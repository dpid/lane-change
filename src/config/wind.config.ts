export const WindConfig = {
  POOL_SIZE: 50,

  LINE_WIDTH: 0.03,
  LINE_HEIGHT: 0.03,
  LINE_LENGTH: 2.0,

  SPAWN_OFFSET_Z: -4,
  SPAWN_SPREAD_X: 6,
  SPAWN_HEIGHT_MIN: 0.5,
  SPAWN_HEIGHT_MAX: 2.5,

  VELOCITY_Z: 80,

  LIFETIME: 0.25,

  EMISSION_INTERVAL: 0.015,

  BASE_OPACITY: 0.5,
  OPACITY_VARIANCE: 0.2,
  FADE_START: 0.7
} as const

export type WindConfigType = typeof WindConfig
