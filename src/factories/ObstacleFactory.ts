import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { ObstacleColors } from '../config'

export enum ObstacleType {
  CAR = 'CAR',
  TRUCK = 'TRUCK'
}

export interface ObstacleOptions {
  type: ObstacleType
  colorIndex?: number
}

export class ObstacleFactory implements GeometryFactory<ObstacleOptions> {
  create(options: ObstacleOptions): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    switch (options.type) {
      case ObstacleType.CAR:
        this.buildCar(root, parts, options)
        break
      case ObstacleType.TRUCK:
        this.buildTruck(root, parts)
        break
    }

    return { root, parts }
  }

  private buildCar(root: THREE.Group, parts: Map<string, THREE.Object3D>, options: ObstacleOptions): void {
    const colorIndex = options.colorIndex ?? Math.floor(Math.random() * ObstacleColors.sedans.length)
    const bodyColor = ObstacleColors.sedans[colorIndex]
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor })
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x222244 })
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a })

    const bodyGroup = new THREE.Group()
    parts.set('body', bodyGroup)

    const carLength = 2.0
    const carWidth = 1.0
    const carHeight = 0.6

    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth, carHeight, carLength * 0.3),
      bodyMaterial
    )
    hood.position.set(0, carHeight / 2, -carLength * 0.35)

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth, carHeight * 1.2, carLength * 0.4),
      bodyMaterial.clone()
    )
    cabin.position.set(0, carHeight * 1.1, 0)

    const trunk = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth, carHeight, carLength * 0.3),
      bodyMaterial.clone()
    )
    trunk.position.set(0, carHeight / 2, carLength * 0.35)

    const frontWindow = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth * 0.9, carHeight * 0.8, 0.1),
      windowMaterial
    )
    frontWindow.position.set(0, carHeight * 1.2, -carLength * 0.15)

    const rearWindow = new THREE.Mesh(
      new THREE.BoxGeometry(carWidth * 0.9, carHeight * 0.8, 0.1),
      windowMaterial.clone()
    )
    rearWindow.position.set(0, carHeight * 1.2, carLength * 0.15)

    const leftWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, carHeight * 0.8, carLength * 0.3),
      windowMaterial.clone()
    )
    leftWindow.position.set(-carWidth * 0.48, carHeight * 1.2, 0)

    const rightWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, carHeight * 0.8, carLength * 0.3),
      windowMaterial.clone()
    )
    rightWindow.position.set(carWidth * 0.48, carHeight * 1.2, 0)

    bodyGroup.add(hood, cabin, trunk, frontWindow, rearWindow, leftWindow, rightWindow)

    const wheelsGroup = new THREE.Group()
    parts.set('wheels', wheelsGroup)

    const wheelRadius = 0.25
    const wheelWidth = 0.15
    const wheelXOffset = carWidth * 0.5
    const wheelZOffset = carLength * 0.35

    const frontLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial
    )
    frontLeft.rotation.z = Math.PI / 2
    frontLeft.position.set(-wheelXOffset, wheelRadius, -wheelZOffset)

    const frontRight = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    frontRight.rotation.z = Math.PI / 2
    frontRight.position.set(wheelXOffset, wheelRadius, -wheelZOffset)

    const rearLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    rearLeft.rotation.z = Math.PI / 2
    rearLeft.position.set(-wheelXOffset, wheelRadius, wheelZOffset)

    const rearRight = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    rearRight.rotation.z = Math.PI / 2
    rearRight.position.set(wheelXOffset, wheelRadius, wheelZOffset)

    wheelsGroup.add(frontLeft, frontRight, rearLeft, rearRight)

    root.add(bodyGroup, wheelsGroup)
  }

  private buildTruck(root: THREE.Group, parts: Map<string, THREE.Object3D>): void {
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: ObstacleColors.truck })
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x222244 })
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a })

    const bodyGroup = new THREE.Group()
    parts.set('body', bodyGroup)

    const cabWidth = 1.2
    const cabHeight = 1.2
    const cabLength = 1.0
    const cargoWidth = 1.2
    const cargoHeight = 1.4
    const cargoLength = 2.0

    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(cabWidth, cabHeight, cabLength),
      bodyMaterial
    )
    cab.position.set(0, cabHeight / 2 + 0.4, -1.0)

    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(cabWidth * 0.9, cabHeight * 0.6, 0.1),
      windowMaterial
    )
    windshield.position.set(0, cabHeight * 0.8, -cabLength * 0.5 - 1.0)

    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(cargoWidth, cargoHeight, cargoLength),
      bodyMaterial.clone()
    )
    cargo.position.set(0, cargoHeight / 2 + 0.4, 0.6)

    bodyGroup.add(cab, windshield, cargo)

    const wheelsGroup = new THREE.Group()
    parts.set('wheels', wheelsGroup)

    const wheelRadius = 0.35
    const wheelWidth = 0.2
    const wheelXOffset = cabWidth * 0.55
    const frontWheelZ = -1.3
    const rearWheelZ1 = 0.4
    const rearWheelZ2 = 1.0

    const frontLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial
    )
    frontLeft.rotation.z = Math.PI / 2
    frontLeft.position.set(-wheelXOffset, wheelRadius, frontWheelZ)

    const frontRight = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    frontRight.rotation.z = Math.PI / 2
    frontRight.position.set(wheelXOffset, wheelRadius, frontWheelZ)

    const rearLeft1 = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    rearLeft1.rotation.z = Math.PI / 2
    rearLeft1.position.set(-wheelXOffset, wheelRadius, rearWheelZ1)

    const rearRight1 = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    rearRight1.rotation.z = Math.PI / 2
    rearRight1.position.set(wheelXOffset, wheelRadius, rearWheelZ1)

    const rearLeft2 = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    rearLeft2.rotation.z = Math.PI / 2
    rearLeft2.position.set(-wheelXOffset, wheelRadius, rearWheelZ2)

    const rearRight2 = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 8),
      wheelMaterial.clone()
    )
    rearRight2.rotation.z = Math.PI / 2
    rearRight2.position.set(wheelXOffset, wheelRadius, rearWheelZ2)

    wheelsGroup.add(frontLeft, frontRight, rearLeft1, rearRight1, rearLeft2, rearRight2)

    root.add(bodyGroup, wheelsGroup)
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
