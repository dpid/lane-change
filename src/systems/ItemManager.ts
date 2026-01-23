import * as THREE from 'three'
import { PhysicsConfig, SpawnConfig, PoolConfig } from '../config'
import { GeometryType, EffectType, ItemDefinitions } from '../config/items.config'
import { ItemFactory } from '../factories'
import { ObjectPool } from '../pooling'
import type { ScrollManager } from './ScrollManager'
import { Item } from './Item'
import { SpawnDeck } from './SpawnDeck'

export interface CollisionResult {
  killed: boolean
  scoreItems: number
  passedItems: number
  collectedPositions: THREE.Vector3[]
  missedCoins: number
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
    for (const geometryType of Object.values(GeometryType)) {
      if (geometryType === GeometryType.NONE) continue
      const pool = new ObjectPool<Item>(
        () => {
          const item = new Item(geometryType, this.factory)
          item.deactivate()
          this.container.add(item.group)
          return item
        },
        PoolConfig.ITEM_INITIAL_POOL_SIZE,
        PoolConfig.ITEM_MAX_POOL_SIZE
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
    let missedCoins = 0
    const collectedPositions: THREE.Vector3[] = []
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
            const worldPos = new THREE.Vector3()
            item.group.getWorldPosition(worldPos)
            collectedPositions.push(worldPos)
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

      if (!item.passed && item.effectType === EffectType.SCORE && !item.collected &&
          itemWorldZ > motorcycleZ + PASSED_THRESHOLD) {
        item.passed = true
        missedCoins++
      }
    }

    return { killed, scoreItems, passedItems, collectedPositions, missedCoins }
  }

  setSpawnDirection(direction: 'toward_camera' | 'toward_horizon'): void {
    this.spawnDirection = direction
  }

  compensateForContainerReset(containerZOffset: number): void {
    for (const item of this.activeItems) {
      item.group.position.z += containerZOffset
    }
    this.spawnDirection = 'toward_camera'
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
