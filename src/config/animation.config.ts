export const AnimationConfig = {
  WHEEL_ROTATION_SPEED: 15,
  LEAN_ANGLE: 0.4,
  LEAN_TRANSITION_SPEED: 6
} as const

export type AnimationConfigType = typeof AnimationConfig
