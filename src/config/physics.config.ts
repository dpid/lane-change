export const PhysicsConfig = {
  SCROLL_SPEED: 10,
  LANE_SWITCH_SPEED: 8,
  LANE_LEFT_X: -1.5,
  LANE_RIGHT_X: 1.5,
  DROP_START_Y: 5,
  GRAVITY: 20,

  SHADOW_BASE_SCALE: 1.0,
  SHADOW_MIN_SCALE: 0.3,
  SHADOW_MAX_HEIGHT: 5,
  SHADOW_BASE_OPACITY: 0.3,

  CRASH_POP_VELOCITY: 6,
  CRASH_FALL_Y: -5,
  CRASH_SPIN_SPEED: 15
} as const

export type PhysicsConfigType = typeof PhysicsConfig
