import * as THREE from 'three'
import { PhysicsConfig, SpawnConfig } from '../config'
import { ObstacleFactory, ObstacleType, type GeometryParts } from '../factories'
import { ObjectPool, type PooledEntity } from '../pooling'

const OBSTACLE_OWN_VELOCITY = PhysicsConfig.SCROLL_SPEED * (PhysicsConfig.OBSTACLE_SCROLL_FACTOR - 1)

class Obstacle implements PooledEntity {
  type: ObstacleType
  lane: 'left' | 'right'
  passed: boolean = false
  private geometryParts: GeometryParts
  private _active: boolean = false

  get active(): boolean {
    return this._active
  }

  get group(): THREE.Group {
    return this.geometryParts.root
  }

  constructor(type: ObstacleType, factory: ObstacleFactory) {
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
    this.passed = false
    this.group.position.set(0, 0, 0)
    this.group.rotation.set(0, 0, 0)
  }

  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3().setFromObject(this.group)
    box.min.addScalar(PhysicsConfig.COLLISION_SHRINK)
    box.max.subScalar(PhysicsConfig.COLLISION_SHRINK)
    return box
  }
}

export class ObstacleManager {
  private container: THREE.Object3D
  private factory: ObstacleFactory
  private pools: Map<ObstacleType, ObjectPool<Obstacle>> = new Map()
  private activeObstacles: Obstacle[] = []
  private spawnTimer: number = 0
  private spawnInterval: number = SpawnConfig.OBSTACLE_MIN_SPAWN_INTERVAL

  constructor(container: THREE.Object3D) {
    this.container = container
    this.factory = new ObstacleFactory()
    this.initializePools()
  }

  private initializePools(): void {
    const types = [ObstacleType.CAR, ObstacleType.TRUCK]
    const INITIAL_POOL_SIZE = 5
    const MAX_POOL_SIZE = 15

    for (const type of types) {
      const pool = new ObjectPool<Obstacle>(
        () => {
          const obstacle = new Obstacle(type, this.factory)
          obstacle.deactivate()
          this.container.add(obstacle.group)
          return obstacle
        },
        INITIAL_POOL_SIZE,
        MAX_POOL_SIZE
      )
      this.pools.set(type, pool)
    }
  }

  update(delta: number): void {
    this.spawnTimer += delta

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnObstacle()
      this.spawnTimer = 0
      const range = SpawnConfig.OBSTACLE_MAX_SPAWN_INTERVAL - SpawnConfig.OBSTACLE_MIN_SPAWN_INTERVAL
      this.spawnInterval = SpawnConfig.OBSTACLE_MIN_SPAWN_INTERVAL + Math.random() * range
    }

    const containerZ = (this.container as THREE.Group).position.z

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i]
      obstacle.group.position.z += OBSTACLE_OWN_VELOCITY * delta

      const worldZ = obstacle.group.position.z + containerZ
      if (worldZ > SpawnConfig.DESPAWN_Z) {
        const pool = this.pools.get(obstacle.type)
        if (pool) {
          pool.release(obstacle)
        }
        this.activeObstacles.splice(i, 1)
      }
    }
  }

  private spawnObstacle(): void {
    const types = [ObstacleType.CAR, ObstacleType.TRUCK]
    const type = types[Math.floor(Math.random() * types.length)]

    const pool = this.pools.get(type)
    if (!pool) return

    const obstacle = pool.acquire()
    if (!obstacle) return

    const containerZ = (this.container as THREE.Group).position.z
    obstacle.lane = Math.random() < 0.5 ? 'left' : 'right'
    obstacle.group.position.x = obstacle.lane === 'left' ? PhysicsConfig.LANE_LEFT_X : PhysicsConfig.LANE_RIGHT_X
    obstacle.group.position.z = SpawnConfig.SPAWN_Z - containerZ
    this.activeObstacles.push(obstacle)
  }

  checkCollision(motorcycleBox: THREE.Box3, currentLane: 'left' | 'right', worldZ: number): boolean {
    for (const obstacle of this.activeObstacles) {
      if (obstacle.lane === currentLane) {
        const obstacleBox = obstacle.getBoundingBox()
        obstacleBox.translate(new THREE.Vector3(0, 0, worldZ))
        if (motorcycleBox.intersectsBox(obstacleBox)) {
          return true
        }
      }
    }
    return false
  }

  getPassedObstacles(motorcycleZ: number, worldZ: number): number {
    let count = 0
    const PASSED_THRESHOLD = 0.5
    for (const obstacle of this.activeObstacles) {
      const obstacleWorldZ = obstacle.group.position.z + worldZ
      if (!obstacle.passed && obstacleWorldZ > motorcycleZ + PASSED_THRESHOLD) {
        obstacle.passed = true
        count++
      }
    }
    return count
  }

  reset(): void {
    for (const obstacle of this.activeObstacles) {
      const pool = this.pools.get(obstacle.type)
      if (pool) {
        pool.release(obstacle)
      }
    }
    this.activeObstacles = []
    this.spawnTimer = 0
  }

  getPoolStats(): Map<ObstacleType, { available: number; active: number; total: number }> {
    const stats = new Map()
    this.pools.forEach((pool, type) => {
      stats.set(type, pool.getStats())
    })
    return stats
  }
}
