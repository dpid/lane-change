import * as THREE from 'three'
import { AnimationConfig, PhysicsConfig, SpawnConfig } from '../config'
import { GeometryType, EffectType, ItemDefinitions } from '../config/items.config'
import { ItemFactory, type GeometryParts } from '../factories'
import { ObjectPool, type PooledEntity } from '../pooling'
import type { ScrollManager } from './ScrollManager'

class Item implements PooledEntity {
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

class SpawnDeck {
  private deck: GeometryType[] = []
  private discard: GeometryType[] = []

  constructor() {
    this.buildDeck()
    this.shuffle()
  }

  private buildDeck(): void {
    this.deck = []
    for (const definition of Object.values(ItemDefinitions)) {
      for (let i = 0; i < definition.cardCount; i++) {
        this.deck.push(definition.geometryType)
      }
    }
  }

  private shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
    }
  }

  draw(): GeometryType {
    if (this.deck.length === 0) {
      this.deck = this.discard
      this.discard = []
      this.shuffle()
    }
    const card = this.deck.pop()!
    this.discard.push(card)
    return card
  }

  reset(): void {
    this.discard = []
    this.buildDeck()
    this.shuffle()
  }
}

export interface CollisionResult {
  killed: boolean
  scoreItems: number
  passedItems: number
}

export class ItemManager {
  private container: THREE.Object3D
  private scrollManager: ScrollManager
  private factory: ItemFactory
  private pools: Map<GeometryType, ObjectPool<Item>> = new Map()
  private activeItems: Item[] = []
  private spawnTimer: number = 0
  private spawnDeck: SpawnDeck
  private spawnDirection: 'toward_camera' | 'toward_horizon' = 'toward_camera'

  constructor(container: THREE.Object3D, scrollManager: ScrollManager) {
    this.container = container
    this.scrollManager = scrollManager
    this.factory = new ItemFactory()
    this.spawnDeck = new SpawnDeck()
    this.initializePools()
  }

  private initializePools(): void {
    const INITIAL_POOL_SIZE = 5
    const MAX_POOL_SIZE = 15

    for (const geometryType of Object.values(GeometryType)) {
      if (geometryType === GeometryType.NONE) continue
      const pool = new ObjectPool<Item>(
        () => {
          const item = new Item(geometryType, this.factory)
          item.deactivate()
          this.container.add(item.group)
          return item
        },
        INITIAL_POOL_SIZE,
        MAX_POOL_SIZE
      )
      this.pools.set(geometryType, pool)
    }
  }

  update(delta: number): void {
    this.spawnTimer += delta

    const spawnInterval = SpawnConfig.ITEM_SPAWN_INTERVAL * this.scrollManager.getSpawnIntervalMultiplier()
    if (this.spawnTimer >= spawnInterval) {
      this.spawnItem()
      this.spawnTimer = 0
    }

    const containerZ = (this.container as THREE.Group).position.z

    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i]
      item.group.position.z += item.velocity * delta
      item.updateRotation(delta)

      const worldZ = item.group.position.z + containerZ
      if (worldZ > SpawnConfig.NEAR_BOUND_Z || worldZ < SpawnConfig.FAR_BOUND_Z) {
        const pool = this.pools.get(item.geometryType)
        if (pool) {
          pool.release(item)
        }
        this.activeItems.splice(i, 1)
      }
    }
  }

  private spawnItem(): void {
    const geometryType = this.spawnDeck.draw()
    if (geometryType === GeometryType.NONE) return
    const definition = ItemDefinitions[geometryType]
    const pool = this.pools.get(geometryType)
    if (!pool) return

    const item = pool.acquire()
    if (!item) return

    const containerZ = (this.container as THREE.Group).position.z
    item.lane = Math.random() < 0.5 ? 'left' : 'right'
    item.group.position.x = item.lane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    item.group.position.y = definition.yOffset

    const baseVelocity = this.scrollManager.getScrollSpeed() * (PhysicsConfig.OBSTACLE_SCROLL_FACTOR - 1)
    if (this.spawnDirection === 'toward_camera') {
      item.group.position.z = SpawnConfig.FAR_SPAWN_Z - containerZ
    } else {
      item.group.position.z = SpawnConfig.NEAR_SPAWN_Z - containerZ
    }
    item.velocity = baseVelocity

    this.activeItems.push(item)
  }

  checkCollisions(motorcycleBox: THREE.Box3, currentLane: 'left' | 'right', motorcycleZ: number): CollisionResult {
    this.container.updateMatrixWorld(true)
    const containerZ = (this.container as THREE.Group).position.z

    let killed = false
    let scoreItems = 0
    let passedItems = 0
    const PASSED_THRESHOLD = 0.5

    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i]
      const itemWorldZ = item.group.position.z + containerZ

      if (item.lane === currentLane && !item.collected) {
        const itemBox = item.getBoundingBox()
        if (motorcycleBox.intersectsBox(itemBox)) {
          if (item.effectType === EffectType.KILL) {
            killed = true
          } else if (item.effectType === EffectType.SCORE) {
            item.collected = true
            scoreItems++
            const pool = this.pools.get(item.geometryType)
            if (pool) {
              pool.release(item)
            }
            this.activeItems.splice(i, 1)
          }
        }
      }

      if (!item.passed && item.effectType === EffectType.KILL && itemWorldZ > motorcycleZ + PASSED_THRESHOLD) {
        item.passed = true
        passedItems++
      }
    }

    return { killed, scoreItems, passedItems }
  }

  setSpawnDirection(direction: 'toward_camera' | 'toward_horizon'): void {
    this.spawnDirection = direction
  }

  reset(): void {
    for (const item of this.activeItems) {
      const pool = this.pools.get(item.geometryType)
      if (pool) {
        pool.release(item)
      }
    }
    this.activeItems = []
    this.spawnTimer = 0
    this.spawnDirection = 'toward_camera'
    this.spawnDeck.reset()
  }

  getPoolStats(): Map<GeometryType, { available: number; active: number; total: number }> {
    const stats = new Map()
    this.pools.forEach((pool, type) => {
      stats.set(type, pool.getStats())
    })
    return stats
  }
}
