import * as THREE from 'three'
import type { CharacterController, CharacterEvent, CharacterEventCallback } from './CharacterController'
import { CharacterState, CharacterEventEmitter } from './CharacterController'
import { MotorcycleFactory, type GeometryParts } from '../factories'
import { MotorcycleAnimator, AnimationState, type MotorcycleAnimationContext } from '../animation'
import { PhysicsConfig } from '../config'
import type { InputAction } from '../input/InputAction'
import { InputActionType } from '../input/InputAction'

export class MotorcycleController extends CharacterEventEmitter implements CharacterController {
  private _state: CharacterState = CharacterState.IDLE
  private factory: MotorcycleFactory
  private animator: MotorcycleAnimator
  private geometryParts!: GeometryParts
  private _group: THREE.Group
  private shadow!: THREE.Mesh
  private scene: THREE.Scene

  private currentLane: 'left' | 'right' = 'right'
  private targetLane: 'left' | 'right' | null = null
  private isLaneSwitching: boolean = false
  private laneProgress: number = 0

  private jumpVelocity: number = 0
  private groundY: number = 0
  private dyingTime: number = 0

  get state(): CharacterState {
    return this._state
  }

  get group(): THREE.Group {
    return this._group
  }

  constructor(scene: THREE.Scene) {
    super()
    this.scene = scene
    this.factory = new MotorcycleFactory()
    this.animator = new MotorcycleAnimator()
    this._group = new THREE.Group()

    this.buildCharacter()
    this.buildShadow()

    this._group.position.set(PhysicsConfig.LANE_RIGHT_X, PhysicsConfig.DROP_START_Y, 0)
    this._group.visible = false
    scene.add(this._group)
  }

  private buildCharacter(): void {
    this.geometryParts = this.factory.create()
    this.animator.attach(this.geometryParts)
    this._group.add(this.geometryParts.root)
  }

  private buildShadow(): void {
    const shadowGeometry = new THREE.PlaneGeometry(1, 0.6)
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    })
    this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    this.shadow.rotation.x = -Math.PI / 2
    this.shadow.position.set(PhysicsConfig.LANE_RIGHT_X, 0.02, 0)
    this.shadow.visible = false
    this.scene.add(this.shadow)
  }

  private updateShadow(): void {
    const height = Math.max(0, this._group.position.y - this.groundY)
    const t = Math.min(height / PhysicsConfig.SHADOW_MAX_HEIGHT, 1)
    const scale = PhysicsConfig.SHADOW_BASE_SCALE - t * (PhysicsConfig.SHADOW_BASE_SCALE - PhysicsConfig.SHADOW_MIN_SCALE)

    this.shadow.scale.set(scale, scale, 1)
    this.shadow.position.x = this._group.position.x
    this.shadow.position.z = this._group.position.z

    const material = this.shadow.material as THREE.MeshBasicMaterial
    material.opacity = PhysicsConfig.SHADOW_BASE_OPACITY * (1 - t * 0.5)
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

  getCurrentLane(): 'left' | 'right' {
    return this.currentLane
  }

  spawn(): void {
    this._state = CharacterState.IDLE
    this._group.visible = false
    this.shadow.visible = false
    this.shadow.scale.set(1, 1, 1)
    this._group.position.set(PhysicsConfig.LANE_RIGHT_X, PhysicsConfig.DROP_START_Y, 0)
    this._group.rotation.set(0, 0, 0)
    this._group.scale.set(1, 1, 1)
    this.jumpVelocity = 0
    this.currentLane = 'right'
    this.targetLane = null
    this.isLaneSwitching = false
    this.laneProgress = 0
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
    this.shadow.visible = true
    this._group.position.y = PhysicsConfig.DROP_START_Y
    this.jumpVelocity = 0
  }

  die(): void {
    this._state = CharacterState.DYING
    this.animator.setState(AnimationState.DYING)
    this.dyingTime = 0
    this.jumpVelocity = PhysicsConfig.CRASH_POP_VELOCITY
    this.shadow.visible = false
    this.tintRed()
    this.renderOnTop()
  }

  private renderOnTop(): void {
    this._group.renderOrder = 999
    this._group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        child.material.depthTest = false
      }
    })
  }

  private tintRed(): void {
    this._group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        child.material = child.material.clone()
        child.material.color.lerp(new THREE.Color(0xff0000), 0.5)
      }
    })
  }

  update(delta: number): void {
    switch (this._state) {
      case CharacterState.DROPPING:
        this.updateDropping(delta)
        break
      case CharacterState.RUNNING:
        this.updateRunning(delta)
        break
      case CharacterState.JUMPING:
        this.updateJumping(delta)
        break
      case CharacterState.DYING:
        this.updateDying(delta)
        break
    }
    this.updateShadow()
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

  private updateJumping(delta: number): void {
    if (!this.targetLane || !this.isLaneSwitching) {
      return
    }

    this.laneProgress += PhysicsConfig.LANE_SWITCH_SPEED * delta

    if (this.laneProgress >= 1) {
      this.laneProgress = 1
    }

    const startX = this.currentLane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    const endX = this.targetLane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    const easedProgress = THREE.MathUtils.smoothstep(this.laneProgress, 0, 1)
    this._group.position.x = THREE.MathUtils.lerp(startX, endX, easedProgress)

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

  private updateDying(delta: number): void {
    this.dyingTime += delta
    this.jumpVelocity -= PhysicsConfig.GRAVITY * delta
    this._group.position.y += this.jumpVelocity * delta

    const context: MotorcycleAnimationContext = {
      targetLane: null,
      laneProgress: 0,
      groupY: this._group.position.y,
      dyingTime: this.dyingTime
    }
    this.animator.update(delta, context)

    if (this._group.position.y < PhysicsConfig.CRASH_FALL_Y) {
      this._state = CharacterState.IDLE
      this.emit('dieComplete')
    }
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
