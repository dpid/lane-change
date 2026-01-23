import * as THREE from 'three'
import { AnimationConfig } from '../config'
import { GeometryType, EffectType, ItemDefinitions } from '../config/items.config'
import { ItemFactory, type GeometryParts } from '../factories'
import { type PooledEntity } from '../pooling'

export class Item implements PooledEntity {
  geometryType: GeometryType
  effectType: EffectType
  lane: 'left' | 'right' = 'right'
  passed: boolean = false
  collected: boolean = false
  velocity: number = 0
  private geometryParts: GeometryParts
  private _active: boolean = false
  private rotation: number = 0
  private rotates: boolean
  private collisionModifier: number

  get active(): boolean {
    return this._active
  }

  get group(): THREE.Group {
    return this.geometryParts.root
  }

  constructor(geometryType: GeometryType, factory: ItemFactory) {
    this.geometryType = geometryType
    const definition = ItemDefinitions[geometryType]
    this.effectType = definition.effectType
    this.rotates = definition.rotates
    this.collisionModifier = definition.collisionModifier
    this.geometryParts = factory.create({ geometryType })
  }

  activate(): void {
    this._active = true
    this.group.visible = true
  }

  deactivate(): void {
    this._active = false
    this.group.visible = false
  }

  reset(): void {
    this.passed = false
    this.collected = false
    this.rotation = 0
    this.group.position.set(0, 0, 0)
    this.group.rotation.set(0, 0, 0)
  }

  updateRotation(delta: number): void {
    if (this.rotates) {
      this.rotation += AnimationConfig.COIN_ROTATION_SPEED * delta
      this.group.rotation.y = this.rotation
    }
  }

  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3().setFromObject(this.group)
    if (this.collisionModifier < 0) {
      box.min.subScalar(this.collisionModifier)
      box.max.addScalar(this.collisionModifier)
    } else {
      box.min.subScalar(this.collisionModifier)
      box.max.addScalar(this.collisionModifier)
    }
    return box
  }
}
