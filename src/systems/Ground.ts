import * as THREE from 'three'
import { EnvironmentColors } from '../config'

const LANE_DASH_LENGTH = 1
const LANE_DASH_GAP = 2
const LANE_DASH_WIDTH = 0.1
const ROAD_WIDTH = 8
const ROAD_LENGTH = 100
const LANE_MARKING_WRAP_THRESHOLD = 10
const LANE_MARKING_RESET_Z = -40

export class Ground {
  private scene: THREE.Scene
  private laneMarkings: THREE.Group
  private edgeLines: THREE.Group

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.laneMarkings = new THREE.Group()
    this.edgeLines = new THREE.Group()
    this.createGround()
  }

  private createGround(): void {
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH)
    const roadMaterial = new THREE.MeshLambertMaterial({ color: EnvironmentColors.road })
    const roadPlane = new THREE.Mesh(roadGeometry, roadMaterial)
    roadPlane.rotation.x = -Math.PI / 2
    roadPlane.position.y = 0
    this.scene.add(roadPlane)

    this.createLaneMarkings()
    this.createEdgeLines()
    this.scene.add(this.laneMarkings)
    this.scene.add(this.edgeLines)
  }

  private createLaneMarkings(): void {
    const material = new THREE.MeshBasicMaterial({ color: EnvironmentColors.laneMarking })
    const dashGeometry = new THREE.BoxGeometry(LANE_DASH_WIDTH, 0.01, LANE_DASH_LENGTH)

    const dashInterval = LANE_DASH_LENGTH + LANE_DASH_GAP
    const numDashes = Math.ceil(ROAD_LENGTH / dashInterval) + 5

    for (let i = 0; i < numDashes; i++) {
      const dash = new THREE.Mesh(dashGeometry, material)
      dash.position.set(0, 0.01, -ROAD_LENGTH / 2 + i * dashInterval)
      this.laneMarkings.add(dash)
    }
  }

  private createEdgeLines(): void {
    const material = new THREE.MeshBasicMaterial({ color: EnvironmentColors.laneMarking })
    const lineWidth = 0.15
    const segmentLength = 5
    const numSegments = Math.ceil(ROAD_LENGTH / segmentLength) + 5

    const leftEdgeX = -(ROAD_WIDTH / 2 - lineWidth / 2)
    const rightEdgeX = ROAD_WIDTH / 2 - lineWidth / 2

    const lineGeometry = new THREE.BoxGeometry(lineWidth, 0.01, segmentLength)

    for (let i = 0; i < numSegments; i++) {
      const leftLine = new THREE.Mesh(lineGeometry, material)
      leftLine.position.set(leftEdgeX, 0.01, -ROAD_LENGTH / 2 + i * segmentLength)
      this.edgeLines.add(leftLine)

      const rightLine = new THREE.Mesh(lineGeometry, material)
      rightLine.position.set(rightEdgeX, 0.01, -ROAD_LENGTH / 2 + i * segmentLength)
      this.edgeLines.add(rightLine)
    }
  }

  update(delta: number, scrollSpeed: number): void {
    const moveAmount = scrollSpeed * delta

    this.laneMarkings.children.forEach((dash) => {
      dash.position.z += moveAmount

      if (dash.position.z > LANE_MARKING_WRAP_THRESHOLD) {
        dash.position.z = LANE_MARKING_RESET_Z
      }
    })

    this.edgeLines.children.forEach((line) => {
      line.position.z += moveAmount

      if (line.position.z > LANE_MARKING_WRAP_THRESHOLD) {
        line.position.z = LANE_MARKING_RESET_Z
      }
    })
  }
}
