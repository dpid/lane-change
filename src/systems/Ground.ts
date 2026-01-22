import * as THREE from 'three'
import { EnvironmentColors, SpawnConfig } from '../config'
import { ObjectPool, type PooledEntity } from '../pooling'
import type { ScrollManager } from './ScrollManager'

class LaneDash implements PooledEntity {
  private mesh: THREE.Mesh
  private _active: boolean = false

  get active(): boolean {
    return this._active
  }

  get object(): THREE.Mesh {
    return this.mesh
  }

  constructor(geometry: THREE.BoxGeometry, material: THREE.Material) {
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.01
  }

  activate(): void {
    this._active = true
    this.mesh.visible = true
  }

  deactivate(): void {
    this._active = false
    this.mesh.visible = false
  }

  reset(): void {
    this.mesh.position.set(0, 0.01, 0)
  }
}

class EdgeLineSegment implements PooledEntity {
  private mesh: THREE.Mesh
  private _active: boolean = false

  get active(): boolean {
    return this._active
  }

  get object(): THREE.Mesh {
    return this.mesh
  }

  constructor(geometry: THREE.BoxGeometry, material: THREE.Material) {
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.01
  }

  activate(): void {
    this._active = true
    this.mesh.visible = true
  }

  deactivate(): void {
    this._active = false
    this.mesh.visible = false
  }

  reset(): void {
    this.mesh.position.y = 0.01
  }
}

const LANE_DASH_POOL_SIZE = 20
const EDGE_LINE_POOL_SIZE = 15

export class Ground {
  private scene: THREE.Scene
  private worldContainer: THREE.Object3D
  private scrollManager: ScrollManager

  private dashPool: ObjectPool<LaneDash>
  private leftEdgePool: ObjectPool<EdgeLineSegment>
  private rightEdgePool: ObjectPool<EdgeLineSegment>

  private dashSpawnTimer: number = 0
  private edgeSpawnTimer: number = 0

  private dashGeometry: THREE.BoxGeometry
  private edgeGeometry: THREE.BoxGeometry
  private lineMaterial: THREE.MeshBasicMaterial

  private leftEdgeX: number
  private rightEdgeX: number

  constructor(scene: THREE.Scene, scrollManager: ScrollManager) {
    this.scene = scene
    this.scrollManager = scrollManager
    this.worldContainer = scrollManager.worldContainer

    this.lineMaterial = new THREE.MeshBasicMaterial({ color: EnvironmentColors.laneMarking })
    this.dashGeometry = new THREE.BoxGeometry(
      SpawnConfig.LANE_DASH_WIDTH,
      0.01,
      SpawnConfig.LANE_DASH_LENGTH
    )

    const lineWidth = 0.15
    this.edgeGeometry = new THREE.BoxGeometry(lineWidth, 0.01, SpawnConfig.EDGE_LINE_SEGMENT_LENGTH)
    this.leftEdgeX = -(SpawnConfig.ROAD_WIDTH / 2 - lineWidth / 2)
    this.rightEdgeX = SpawnConfig.ROAD_WIDTH / 2 - lineWidth / 2

    this.dashPool = this.createDashPool()
    this.leftEdgePool = this.createEdgePool()
    this.rightEdgePool = this.createEdgePool()

    this.createGround()
    this.populateInitialElements()
  }

  private createDashPool(): ObjectPool<LaneDash> {
    return new ObjectPool<LaneDash>(
      () => {
        const dash = new LaneDash(this.dashGeometry, this.lineMaterial)
        dash.deactivate()
        this.worldContainer.add(dash.object)
        return dash
      },
      LANE_DASH_POOL_SIZE
    )
  }

  private createEdgePool(): ObjectPool<EdgeLineSegment> {
    return new ObjectPool<EdgeLineSegment>(
      () => {
        const segment = new EdgeLineSegment(this.edgeGeometry, this.lineMaterial)
        segment.deactivate()
        this.worldContainer.add(segment.object)
        return segment
      },
      EDGE_LINE_POOL_SIZE
    )
  }

  private createGround(): void {
    const roadGeometry = new THREE.PlaneGeometry(SpawnConfig.ROAD_WIDTH, SpawnConfig.ROAD_LENGTH)
    const roadMaterial = new THREE.MeshLambertMaterial({ color: EnvironmentColors.road })
    const roadPlane = new THREE.Mesh(roadGeometry, roadMaterial)
    roadPlane.rotation.x = -Math.PI / 2
    const centerZ = (SpawnConfig.FAR_BOUND_Z + SpawnConfig.NEAR_BOUND_Z) / 2
    roadPlane.position.set(0, 0, centerZ)
    this.scene.add(roadPlane)

    this.createGrass()
  }

  private createGrass(): void {
    const grassWidth = 50
    const grassGeometry = new THREE.PlaneGeometry(grassWidth, SpawnConfig.ROAD_LENGTH)
    const grassMaterial = new THREE.MeshLambertMaterial({ color: EnvironmentColors.grass })
    const centerZ = (SpawnConfig.FAR_BOUND_Z + SpawnConfig.NEAR_BOUND_Z) / 2

    const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial)
    leftGrass.rotation.x = -Math.PI / 2
    leftGrass.position.set(-(SpawnConfig.ROAD_WIDTH / 2 + grassWidth / 2), -0.01, centerZ)
    this.scene.add(leftGrass)

    const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial)
    rightGrass.rotation.x = -Math.PI / 2
    rightGrass.position.set(SpawnConfig.ROAD_WIDTH / 2 + grassWidth / 2, -0.01, centerZ)
    this.scene.add(rightGrass)
  }

  private populateInitialElements(): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z
    const dashInterval = SpawnConfig.LANE_DASH_LENGTH + SpawnConfig.LANE_DASH_GAP

    for (let z = SpawnConfig.FAR_BOUND_Z; z <= SpawnConfig.NEAR_BOUND_Z; z += dashInterval) {
      this.spawnDashAt(z - containerZ)
    }

    for (let z = SpawnConfig.FAR_BOUND_Z; z <= SpawnConfig.NEAR_BOUND_Z; z += SpawnConfig.EDGE_LINE_SEGMENT_LENGTH) {
      this.spawnEdgeLinesAt(z - containerZ)
    }
  }

  private spawnDashAt(localZ: number): void {
    const dash = this.dashPool.acquire()
    if (!dash) return
    dash.object.position.x = 0
    dash.object.position.z = localZ
  }

  private spawnEdgeLinesAt(localZ: number): void {
    const leftSegment = this.leftEdgePool.acquire()
    if (leftSegment) {
      leftSegment.object.position.x = this.leftEdgeX
      leftSegment.object.position.z = localZ
    }

    const rightSegment = this.rightEdgePool.acquire()
    if (rightSegment) {
      rightSegment.object.position.x = this.rightEdgeX
      rightSegment.object.position.z = localZ
    }
  }

  update(delta: number): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z
    const intervalMultiplier = this.scrollManager.getSpawnIntervalMultiplier()

    this.dashSpawnTimer += delta
    if (this.dashSpawnTimer >= SpawnConfig.LANE_DASH_SPAWN_INTERVAL * intervalMultiplier) {
      this.spawnDashAt(SpawnConfig.FAR_BOUND_Z - containerZ)
      this.dashSpawnTimer = 0
    }

    this.edgeSpawnTimer += delta
    if (this.edgeSpawnTimer >= SpawnConfig.EDGE_LINE_SPAWN_INTERVAL * intervalMultiplier) {
      this.spawnEdgeLinesAt(SpawnConfig.FAR_BOUND_Z - containerZ)
      this.edgeSpawnTimer = 0
    }

    this.despawnElements(containerZ)
  }

  private despawnElements(containerZ: number): void {
    for (const dash of this.dashPool.getActive()) {
      const worldZ = dash.object.position.z + containerZ
      if (worldZ > SpawnConfig.NEAR_BOUND_Z) {
        this.dashPool.release(dash)
      }
    }

    for (const segment of this.leftEdgePool.getActive()) {
      const worldZ = segment.object.position.z + containerZ
      if (worldZ > SpawnConfig.NEAR_BOUND_Z) {
        this.leftEdgePool.release(segment)
      }
    }

    for (const segment of this.rightEdgePool.getActive()) {
      const worldZ = segment.object.position.z + containerZ
      if (worldZ > SpawnConfig.NEAR_BOUND_Z) {
        this.rightEdgePool.release(segment)
      }
    }
  }

  reset(): void {
    this.dashPool.releaseAll()
    this.leftEdgePool.releaseAll()
    this.rightEdgePool.releaseAll()
    this.dashSpawnTimer = 0
    this.edgeSpawnTimer = 0
    this.populateInitialElements()
  }
}
