import * as THREE from 'three'
import type { CharacterController, CharacterEvent, CharacterEventCallback } from './CharacterController'
import { CharacterState, CharacterEventEmitter } from './CharacterController'
import { MotorcycleFactory, type GeometryParts } from '../factories'
import { MotorcycleAnimator, AnimationState, type MotorcycleAnimationContext } from '../animation'
import { PhysicsConfig, AnimationConfig } from '../config'
import type { InputAction } from '../input/InputAction'
import { InputActionType } from '../input/InputAction'

export class MotorcycleController extends CharacterEventEmitter implements CharacterController {
  private _state: CharacterState = CharacterState.IDLE
  private factory: MotorcycleFactory
  private animator: MotorcycleAnimator
  private geometryParts!: GeometryParts
  private _group: THREE.Group

  private currentLane: 'left' | 'right' = 'right'
  private targetLane: 'left' | 'right' | null = null
  private isLaneSwitching: boolean = false
  private laneProgress: number = 0

  private jumpVelocity: number = 0
  private groundY: number = 0

  private flickerTime: number = 0
  private materials: THREE.MeshStandardMaterial[] = []

  get state(): CharacterState {
    return this._state
  }

  get group(): THREE.Group {
    return this._group
  }

  constructor(scene: THREE.Scene) {
    super()
    this.factory = new MotorcycleFactory()
    this.animator = new MotorcycleAnimator()
    this._group = new THREE.Group()

    this.buildCharacter()

    this._group.position.set(PhysicsConfig.LANE_RIGHT_X, PhysicsConfig.DROP_START_Y, 0)
    this._group.visible = false
    scene.add(this._group)
  }

  private buildCharacter(): void {
    this.geometryParts = this.factory.create()
    this.animator.attach(this.geometryParts)
    this._group.add(this.geometryParts.root)
    this.setupTransparentMaterials()
  }

  private setupTransparentMaterials(): void {
    this.materials = []
    this.geometryParts.root.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const mat = child.material.clone() as THREE.MeshStandardMaterial
        mat.transparent = true
        mat.opacity = 1
        child.material = mat
        this.materials.push(mat)
      }
    })
  }

  private setOpacity(opacity: number): void {
    for (const mat of this.materials) {
      mat.opacity = opacity
    }
  }

  handleAction(action: InputAction): void {
    if (action.type === InputActionType.SWITCH_LANE) {
      this.switchLane()
    }
  }

  switchLane(): void {
    if (this._state !== CharacterState.RUNNING || this.isLaneSwitching) {
      return
    }

    this.targetLane = this.currentLane === 'left' ? 'right' : 'left'
    this.isLaneSwitching = true
    this.laneProgress = 0
    this._state = CharacterState.JUMPING
    this.animator.setState(AnimationState.JUMPING)
  }

  triggerWheelie(): void {
    this.animator.triggerWheelie()
  }

  isWheelieActive(): boolean {
    return this.animator.isWheelieActive
  }

  getCurrentLane(): 'left' | 'right' {
    return this.currentLane
  }

  spawn(): void {
    this._state = CharacterState.IDLE
    this._group.visible = false
    const laneX = this.currentLane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    this._group.position.set(laneX, PhysicsConfig.DROP_START_Y, 0)
    this._group.rotation.set(0, 0, 0)
    this._group.scale.set(1, 1, 1)
    this.jumpVelocity = 0
    this.targetLane = null
    this.isLaneSwitching = false
    this.laneProgress = 0
    this.flickerTime = 0
    this.rebuildCharacter()
    this.animator.reset()
  }

  reset(): void {
    this.spawn()
  }

  private rebuildCharacter(): void {
    if (this.geometryParts) {
      this._group.remove(this.geometryParts.root)
      this.factory.dispose(this.geometryParts)
    }
    this.buildCharacter()
  }

  dropIn(): void {
    this._state = CharacterState.DROPPING
    this.animator.setState(AnimationState.DROPPING)
    this._group.visible = true
    this._group.position.y = PhysicsConfig.DROP_START_Y
    this.jumpVelocity = 0
  }

  die(): void {
    this._state = CharacterState.DYING
    this.animator.setState(AnimationState.DYING)
  }

  triggerVoxelBurst(): THREE.Matrix4 {
    this._group.updateMatrixWorld()
    const bodyPivot = this.geometryParts.parts.get('bodyPivot') as THREE.Group | undefined
    if (!bodyPivot || bodyPivot.children.length === 0) {
      this._group.visible = false
      return this._group.matrixWorld.clone()
    }
    bodyPivot.children[0].updateMatrixWorld()
    const worldMatrix = bodyPivot.children[0].matrixWorld.clone()
    this._group.visible = false
    return worldMatrix
  }

  update(delta: number, speedMultiplier: number = 1): void {
    switch (this._state) {
      case CharacterState.DROPPING:
        this.updateDropping(delta)
        break
      case CharacterState.RUNNING:
        this.updateRunning(delta)
        break
      case CharacterState.JUMPING:
        this.updateJumping(delta, speedMultiplier)
        break
      case CharacterState.DYING:
        this.updateDying(delta)
        break
    }
  }

  private updateDropping(delta: number): void {
    this.jumpVelocity -= PhysicsConfig.GRAVITY * delta
    this._group.position.y += this.jumpVelocity * delta

    const context: MotorcycleAnimationContext = {
      targetLane: null,
      laneProgress: 0,
      groupY: this._group.position.y,
      dyingTime: 0
    }
    this.animator.update(delta, context)

    if (this._group.position.y <= this.groundY) {
      this._group.position.y = this.groundY
      this._state = CharacterState.RUNNING
      this.animator.setState(AnimationState.RUNNING)
      this.emit('land', 2.0)
      this.emit('dropComplete')
    }
  }

  private updateRunning(delta: number): void {
    const context: MotorcycleAnimationContext = {
      targetLane: null,
      laneProgress: 0,
      groupY: this._group.position.y,
      dyingTime: 0
    }
    this.animator.update(delta, context)
  }

  private updateJumping(delta: number, speedMultiplier: number): void {
    if (!this.targetLane || !this.isLaneSwitching) {
      return
    }

    this.laneProgress += PhysicsConfig.LANE_SWITCH_SPEED * speedMultiplier * delta

    if (this.laneProgress >= 1) {
      this.laneProgress = 1
    }

    const startX = this.currentLane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    const endX = this.targetLane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    const easedProgress = THREE.MathUtils.smoothstep(this.laneProgress, 0, 1)
    this._group.position.x = THREE.MathUtils.lerp(startX, endX, easedProgress)

    const leanDirection = this.targetLane === 'left' ? 1 : -1
    const leanProgress = Math.min(easedProgress * PhysicsConfig.LANE_LEAN_SPEED_FACTOR, 1)
    const leanAmount = Math.sin(leanProgress * Math.PI)
    this._group.rotation.z = leanDirection * leanAmount * PhysicsConfig.LANE_LEAN_ANGLE * speedMultiplier

    const context: MotorcycleAnimationContext = {
      targetLane: this.targetLane,
      laneProgress: this.laneProgress,
      groupY: this._group.position.y,
      dyingTime: 0
    }
    this.animator.update(delta, context)

    if (this.laneProgress >= 1) {
      this.currentLane = this.targetLane
      this.targetLane = null
      this.isLaneSwitching = false
      this.laneProgress = 0
      this._state = CharacterState.RUNNING
      this.animator.setState(AnimationState.RUNNING)
      this.emit('land', 1.0)
    }
  }

  private updateDying(_delta: number): void {
  }

  updateInvincibilityFlicker(progress: number, delta: number): void {
    if (progress >= 1) {
      this.setOpacity(1)
      return
    }

    this.flickerTime += delta

    const flickerPeriod = THREE.MathUtils.lerp(
      AnimationConfig.INVINCIBILITY_FLICKER_START_PERIOD,
      AnimationConfig.INVINCIBILITY_FLICKER_END_PERIOD,
      progress
    )
    const minOpacity = THREE.MathUtils.lerp(
      AnimationConfig.INVINCIBILITY_MIN_OPACITY,
      1.0,
      progress
    )

    const sineValue = Math.sin((this.flickerTime / flickerPeriod) * Math.PI * 2)
    const normalizedSine = (sineValue + 1) / 2
    const opacity = THREE.MathUtils.lerp(minOpacity, 1.0, normalizedSine)

    this.setOpacity(opacity)
  }

  getPosition(): THREE.Vector3 {
    return this._group.position.clone()
  }

  getBoundingBox(): THREE.Box3 {
    const pos = this._group.position
    const halfWidth = 0.3
    const halfDepth = 0.4
    const height = 1.0
    return new THREE.Box3(
      new THREE.Vector3(pos.x - halfWidth, pos.y, pos.z - halfDepth),
      new THREE.Vector3(pos.x + halfWidth, pos.y + height, pos.z + halfDepth)
    )
  }

  loseHitpoint(_scrollSpeed: number): void {
    this.die()
  }

  isDead(): boolean {
    return this._state === CharacterState.DYING || this._state === CharacterState.IDLE
  }

  jumpSuccess(): void {
  }

  on(event: CharacterEvent, callback: CharacterEventCallback): () => void {
    return super.on(event, callback)
  }

  off(event: CharacterEvent, callback: CharacterEventCallback): void {
    super.off(event, callback)
  }
}
