import * as THREE from 'three'
import type { AnimationController } from './AnimationController'
import { AnimationState } from './AnimationController'
import type { GeometryParts } from '../factories'
import { AnimationConfig, PhysicsConfig } from '../config'

export interface MotorcycleAnimationContext {
  targetLane: 'left' | 'right' | null
  laneProgress: number
  groupY: number
  dyingTime: number
}

export class MotorcycleAnimator implements AnimationController {
  private _currentState: AnimationState = AnimationState.IDLE
  private parts: GeometryParts | null = null

  private frontWheel: THREE.Object3D | null = null
  private rearWheel: THREE.Object3D | null = null
  private bodyPivot: THREE.Group | null = null

  private wheelRotation: number = 0
  private currentLean: number = 0
  private initialBodyRotation: THREE.Euler | null = null

  get currentState(): AnimationState {
    return this._currentState
  }

  attach(geometry: GeometryParts): void {
    this.parts = geometry

    this.frontWheel = geometry.parts.get('frontWheel') ?? null
    this.rearWheel = geometry.parts.get('rearWheel') ?? null
    this.bodyPivot = geometry.parts.get('bodyPivot') as THREE.Group ?? null

    if (this.bodyPivot) {
      this.initialBodyRotation = this.bodyPivot.rotation.clone()
    }
  }

  detach(): void {
    this.parts = null
    this.frontWheel = null
    this.rearWheel = null
    this.bodyPivot = null
    this.initialBodyRotation = null
  }

  setState(state: AnimationState): void {
    if (this._currentState !== state) {
      this._currentState = state
    }
  }

  update(delta: number, context?: MotorcycleAnimationContext): void {
    if (!this.parts || !context) return

    switch (this._currentState) {
      case AnimationState.DROPPING:
        this.updateDropping(delta, context)
        break
      case AnimationState.RUNNING:
        this.updateRunning(delta, context)
        break
      case AnimationState.JUMPING:
        this.updateJumping(delta, context)
        break
      case AnimationState.DYING:
        this.updateDying(delta, context)
        break
    }
  }

  private updateDropping(_delta: number, _context: MotorcycleAnimationContext): void {
    this.currentLean = 0
    if (this.bodyPivot) {
      this.bodyPivot.rotation.z = 0
    }
  }

  private updateRunning(delta: number, _context: MotorcycleAnimationContext): void {
    this.wheelRotation += AnimationConfig.WHEEL_ROTATION_SPEED * delta

    if (this.frontWheel) {
      this.frontWheel.rotation.x = -this.wheelRotation
    }
    if (this.rearWheel) {
      this.rearWheel.rotation.x = -this.wheelRotation
    }

    this.currentLean = 0
    if (this.bodyPivot) {
      this.bodyPivot.rotation.z = 0
    }
  }

  private updateJumping(delta: number, context: MotorcycleAnimationContext): void {
    this.wheelRotation += AnimationConfig.WHEEL_ROTATION_SPEED * delta

    if (this.frontWheel) {
      this.frontWheel.rotation.x = -this.wheelRotation
    }
    if (this.rearWheel) {
      this.rearWheel.rotation.x = -this.wheelRotation
    }

    if (context.targetLane && this.bodyPivot) {
      const targetLean = context.targetLane === 'left' ? AnimationConfig.LEAN_ANGLE : -AnimationConfig.LEAN_ANGLE
      const leanDelta = AnimationConfig.LEAN_TRANSITION_SPEED * delta

      if (context.laneProgress < 1) {
        this.currentLean = THREE.MathUtils.lerp(this.currentLean, targetLean, leanDelta)
      } else {
        this.currentLean = THREE.MathUtils.lerp(this.currentLean, 0, leanDelta)
      }

      this.bodyPivot.rotation.z = this.currentLean
    }
  }

  private updateDying(delta: number, _context: MotorcycleAnimationContext): void {
    if (this.bodyPivot) {
      this.bodyPivot.rotation.y += delta * PhysicsConfig.CRASH_SPIN_SPEED
    }
  }

  reset(): void {
    this._currentState = AnimationState.IDLE
    this.wheelRotation = 0
    this.currentLean = 0

    if (this.frontWheel) {
      this.frontWheel.rotation.x = 0
    }
    if (this.rearWheel) {
      this.rearWheel.rotation.x = 0
    }
    if (this.bodyPivot && this.initialBodyRotation) {
      this.bodyPivot.rotation.copy(this.initialBodyRotation)
    }
  }
}
