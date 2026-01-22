import type { GeometryParts } from '../factories'

export enum AnimationState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  JUMPING = 'JUMPING',
  DYING = 'DYING',
  DROPPING = 'DROPPING'
}

export type AnimationEvent = 'stateChanged' | 'animationComplete'

export interface AnimationController {
  readonly currentState: AnimationState

  attach(geometry: GeometryParts): void
  detach(): void
  setState(state: AnimationState): void
  update(delta: number): void
  reset(): void
}
