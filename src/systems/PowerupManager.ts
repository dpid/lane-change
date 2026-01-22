import * as THREE from 'three'
import { AnimationConfig, PhysicsConfig, SpawnConfig } from '../config'
import { PowerupFactory, PowerupType, type GeometryParts } from '../factories'
import { ObjectPool, type PooledEntity } from '../pooling'

class Powerup implements PooledEntity {
  type: PowerupType
  lane: 'left' | 'right'
  collected: boolean = false
  private geometryParts: GeometryParts
  private _active: boolean = false
  rotation: number = 0

  get active(): boolean {
    return this._active
  }

  get group(): THREE.Group {
    return this.geometryParts.root
  }

  constructor(type: PowerupType, factory: PowerupFactory) {
    this.type = type
    this.lane = 'right'
    this.geometryParts = factory.create({ type })
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
    this.collected = false
    this.rotation = 0
    this.group.position.set(0, 0, 0)
    this.group.rotation.set(0, 0, 0)
  }

  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3().setFromObject(this.group)
    box.min.subScalar(PhysicsConfig.COLLECTION_EXPANSION)
    box.max.addScalar(PhysicsConfig.COLLECTION_EXPANSION)
    return box
  }
}

export class PowerupManager {
  private scene: THREE.Scene
  private factory: PowerupFactory
  private pool!: ObjectPool<Powerup>
  private activePowerups: Powerup[] = []
  private spawnTimer: number = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.factory = new PowerupFactory()
    this.initializePool()
  }

  private initializePool(): void {
    const INITIAL_POOL_SIZE = 5
    const MAX_POOL_SIZE = 10

    this.pool = new ObjectPool<Powerup>(
      () => {
        const powerup = new Powerup(PowerupType.COIN, this.factory)
        powerup.deactivate()
        this.scene.add(powerup.group)
        return powerup
      },
      INITIAL_POOL_SIZE,
      MAX_POOL_SIZE
    )
  }

  update(delta: number, scrollSpeed: number): void {
    this.spawnTimer += delta

    if (this.spawnTimer >= SpawnConfig.POWERUP_SPAWN_INTERVAL) {
      this.spawnPowerup()
      this.spawnTimer = 0
    }

    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const powerup = this.activePowerups[i]
      powerup.group.position.z += scrollSpeed * delta

      powerup.rotation += AnimationConfig.COIN_ROTATION_SPEED * delta
      powerup.group.rotation.y = powerup.rotation

      if (powerup.group.position.z > SpawnConfig.OBSTACLE_DESPAWN_Z) {
        this.pool.release(powerup)
        this.activePowerups.splice(i, 1)
      }
    }
  }

  private spawnPowerup(): void {
    const powerup = this.pool.acquire()
    if (!powerup) return

    powerup.lane = Math.random() < 0.5 ? 'left' : 'right'
    powerup.group.position.x = powerup.lane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    const RIDER_HEIGHT = 0.8
    powerup.group.position.y = RIDER_HEIGHT
    powerup.group.position.z = SpawnConfig.OBSTACLE_SPAWN_Z
    this.activePowerups.push(powerup)
  }

  checkCollection(motorcycleBox: THREE.Box3, currentLane: 'left' | 'right'): number {
    let collectedCount = 0

    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const powerup = this.activePowerups[i]

      if (powerup.lane === currentLane && !powerup.collected) {
        if (motorcycleBox.intersectsBox(powerup.getBoundingBox())) {
          powerup.collected = true
          collectedCount++
          this.pool.release(powerup)
          this.activePowerups.splice(i, 1)
        }
      }
    }

    return collectedCount
  }

  reset(): void {
    for (const powerup of this.activePowerups) {
      this.pool.release(powerup)
    }
    this.activePowerups = []
    this.spawnTimer = 0
  }

  getPoolStats(): { available: number; active: number; total: number } {
    return this.pool.getStats()
  }
}
