import * as THREE from 'three'
import { EnvironmentColors, SpawnConfig } from '../config'

export class Ground {
  private scene: THREE.Scene
  private worldContainer: THREE.Object3D
  private laneMarkings: THREE.Group
  private edgeLines: THREE.Group

  constructor(scene: THREE.Scene, worldContainer: THREE.Object3D) {
    this.scene = scene
    this.worldContainer = worldContainer
    this.laneMarkings = new THREE.Group()
    this.edgeLines = new THREE.Group()
    this.createGround()
  }

  private createGround(): void {
    const roadGeometry = new THREE.PlaneGeometry(SpawnConfig.ROAD_WIDTH, SpawnConfig.ROAD_LENGTH)
    const roadMaterial = new THREE.MeshLambertMaterial({ color: EnvironmentColors.road })
    const roadPlane = new THREE.Mesh(roadGeometry, roadMaterial)
    roadPlane.rotation.x = -Math.PI / 2
    roadPlane.position.y = 0
    this.scene.add(roadPlane)

    this.createGrass()
    this.createLaneMarkings()
    this.createEdgeLines()
    this.worldContainer.add(this.laneMarkings)
    this.worldContainer.add(this.edgeLines)
  }

  private createGrass(): void {
    const grassWidth = 50
    const grassGeometry = new THREE.PlaneGeometry(grassWidth, SpawnConfig.ROAD_LENGTH)
    const grassMaterial = new THREE.MeshLambertMaterial({ color: EnvironmentColors.grass })

    const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial)
    leftGrass.rotation.x = -Math.PI / 2
    leftGrass.position.set(-(SpawnConfig.ROAD_WIDTH / 2 + grassWidth / 2), -0.01, 0)
    this.scene.add(leftGrass)

    const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial)
    rightGrass.rotation.x = -Math.PI / 2
    rightGrass.position.set(SpawnConfig.ROAD_WIDTH / 2 + grassWidth / 2, -0.01, 0)
    this.scene.add(rightGrass)
  }

  private createLaneMarkings(): void {
    const material = new THREE.MeshBasicMaterial({ color: EnvironmentColors.laneMarking })
    const dashGeometry = new THREE.BoxGeometry(SpawnConfig.LANE_DASH_WIDTH, 0.01, SpawnConfig.LANE_DASH_LENGTH)

    const dashInterval = SpawnConfig.LANE_DASH_LENGTH + SpawnConfig.LANE_DASH_GAP
    const numDashes = Math.ceil(SpawnConfig.ROAD_LENGTH / dashInterval) + 5

    for (let i = 0; i < numDashes; i++) {
      const dash = new THREE.Mesh(dashGeometry, material)
      dash.position.set(0, 0.01, -SpawnConfig.ROAD_LENGTH / 2 + i * dashInterval)
      this.laneMarkings.add(dash)
    }
  }

  private createEdgeLines(): void {
    const material = new THREE.MeshBasicMaterial({ color: EnvironmentColors.laneMarking })
    const lineWidth = 0.15
    const segmentLength = 5
    const numSegments = Math.ceil(SpawnConfig.ROAD_LENGTH / segmentLength) + 5

    const leftEdgeX = -(SpawnConfig.ROAD_WIDTH / 2 - lineWidth / 2)
    const rightEdgeX = SpawnConfig.ROAD_WIDTH / 2 - lineWidth / 2

    const lineGeometry = new THREE.BoxGeometry(lineWidth, 0.01, segmentLength)

    for (let i = 0; i < numSegments; i++) {
      const leftLine = new THREE.Mesh(lineGeometry, material)
      leftLine.position.set(leftEdgeX, 0.01, -SpawnConfig.ROAD_LENGTH / 2 + i * segmentLength)
      this.edgeLines.add(leftLine)

      const rightLine = new THREE.Mesh(lineGeometry, material)
      rightLine.position.set(rightEdgeX, 0.01, -SpawnConfig.ROAD_LENGTH / 2 + i * segmentLength)
      this.edgeLines.add(rightLine)
    }
  }

  update(_delta: number): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z
    const wrapDistance = SpawnConfig.LANE_MARKING_WRAP_THRESHOLD - SpawnConfig.LANE_MARKING_RESET_Z

    this.laneMarkings.children.forEach((dash) => {
      while (dash.position.z + containerZ > SpawnConfig.LANE_MARKING_WRAP_THRESHOLD) {
        dash.position.z -= wrapDistance
      }
    })

    this.edgeLines.children.forEach((line) => {
      while (line.position.z + containerZ > SpawnConfig.LANE_MARKING_WRAP_THRESHOLD) {
        line.position.z -= wrapDistance
      }
    })
  }
}
