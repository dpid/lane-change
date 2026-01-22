export const AnimationConfig = {
  WHEEL_ROTATION_SPEED: 15,
  LEAN_ANGLE: 0.4,
  COIN_ROTATION_SPEED: 3
} as const

export type AnimationConfigType = typeof AnimationConfig
