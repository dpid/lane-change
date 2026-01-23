export const AnimationConfig = {
  WHEEL_ROTATION_SPEED: 15,
  LEAN_ANGLE: 0.4,
  COIN_ROTATION_SPEED: 3,
  WHEELIE_DURATION: 2.0,
  WHEELIE_ANGLE: -0.611,
  WHEELIE_EASE_IN_TIME: 0.1,
  WHEELIE_EASE_OUT_TIME: 0.4
} as const

export type AnimationConfigType = typeof AnimationConfig
