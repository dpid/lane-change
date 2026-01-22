import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { MotorcycleColors } from '../config/colors.config'

export interface MotorcycleOptions {
  bodyColor?: number
  helmetColor?: number
}

export class MotorcycleFactory implements GeometryFactory<MotorcycleOptions> {
  create(options?: MotorcycleOptions): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    const bodyColor = options?.bodyColor ?? MotorcycleColors.body
    const chassisColor = MotorcycleColors.chassis
    const wheelColor = MotorcycleColors.wheels
    const helmetColor = options?.helmetColor ?? MotorcycleColors.riderHelmet
    const jacketColor = MotorcycleColors.riderJacket
    const pantsColor = MotorcycleColors.riderPants

    const bodyPivot = new THREE.Group()
    parts.set('bodyPivot', bodyPivot)

    const frontFork = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.5),
      new THREE.MeshLambertMaterial({ color: chassisColor })
    )
    frontFork.position.set(0, 0.35, -0.7)
    frontFork.rotation.x = -0.3

    const frontForkSupport = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.3, 0.08),
      new THREE.MeshLambertMaterial({ color: chassisColor })
    )
    frontForkSupport.position.set(0, 0.25, -0.65)

    const fuelTank = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.2, 0.5),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    )
    fuelTank.position.set(0, 0.4, -0.1)

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    )
    seat.position.set(0, 0.5, 0.25)

    const rearSection = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.25),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    )
    rearSection.position.set(0, 0.4, 0.55)

    const exhaustLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    )
    exhaustLeft.rotation.x = Math.PI / 2
    exhaustLeft.position.set(-0.12, 0.25, 0.4)

    const exhaustRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    )
    exhaustRight.rotation.x = Math.PI / 2
    exhaustRight.position.set(0.12, 0.25, 0.4)

    const headlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xffffaa })
    )
    headlight.rotation.x = Math.PI / 2
    headlight.position.set(0, 0.4, -0.9)

    const handlebarBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.04, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    )
    handlebarBase.position.set(0, 0.55, -0.6)

    const handlebarGripLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    )
    handlebarGripLeft.rotation.z = Math.PI / 2
    handlebarGripLeft.position.set(-0.18, 0.55, -0.6)

    const handlebarGripRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    )
    handlebarGripRight.rotation.z = Math.PI / 2
    handlebarGripRight.position.set(0.18, 0.55, -0.6)

    bodyPivot.add(
      frontFork,
      frontForkSupport,
      fuelTank,
      seat,
      rearSection,
      exhaustLeft,
      exhaustRight,
      headlight,
      handlebarBase,
      handlebarGripLeft,
      handlebarGripRight
    )

    const frontWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.08),
      new THREE.MeshLambertMaterial({ color: wheelColor })
    )
    frontWheel.rotation.z = Math.PI / 2
    frontWheel.position.set(0, 0.15, -0.8)
    parts.set('frontWheel', frontWheel)

    const frontWheelRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.09),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    )
    frontWheelRim.rotation.z = Math.PI / 2
    frontWheelRim.position.set(0, 0.15, -0.8)
    frontWheel.add(frontWheelRim)

    const rearWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.1),
      new THREE.MeshLambertMaterial({ color: wheelColor })
    )
    rearWheel.rotation.z = Math.PI / 2
    rearWheel.position.set(0, 0.18, 0.5)
    parts.set('rearWheel', rearWheel)

    const rearWheelRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.11),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    )
    rearWheelRim.rotation.z = Math.PI / 2
    rearWheelRim.position.set(0, 0.18, 0.5)
    rearWheel.add(rearWheelRim)

    const riderGroup = new THREE.Group()
    parts.set('riderGroup', riderGroup)

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.35, 0.2),
      new THREE.MeshLambertMaterial({ color: jacketColor })
    )
    torso.position.set(0, 0.75, 0.1)
    torso.rotation.x = 0.3

    const leftShoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.25, 0.12),
      new THREE.MeshLambertMaterial({ color: jacketColor })
    )
    leftShoulder.position.set(-0.16, 0.75, 0.05)
    leftShoulder.rotation.x = 0.5
    leftShoulder.rotation.z = -0.3

    const rightShoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.25, 0.12),
      new THREE.MeshLambertMaterial({ color: jacketColor })
    )
    rightShoulder.position.set(0.16, 0.75, 0.05)
    rightShoulder.rotation.x = 0.5
    rightShoulder.rotation.z = 0.3

    const leftForearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.2, 0.08),
      new THREE.MeshLambertMaterial({ color: jacketColor })
    )
    leftForearm.position.set(-0.18, 0.58, -0.5)
    leftForearm.rotation.x = -0.8

    const rightForearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.2, 0.08),
      new THREE.MeshLambertMaterial({ color: jacketColor })
    )
    rightForearm.position.set(0.18, 0.58, -0.5)
    rightForearm.rotation.x = -0.8

    const leftThigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.25, 0.12),
      new THREE.MeshLambertMaterial({ color: pantsColor })
    )
    leftThigh.position.set(-0.08, 0.55, 0.2)
    leftThigh.rotation.x = 1.2

    const rightThigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.25, 0.12),
      new THREE.MeshLambertMaterial({ color: pantsColor })
    )
    rightThigh.position.set(0.08, 0.55, 0.2)
    rightThigh.rotation.x = 1.2

    const leftLowerLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.1),
      new THREE.MeshLambertMaterial({ color: pantsColor })
    )
    leftLowerLeg.position.set(-0.12, 0.35, -0.05)
    leftLowerLeg.rotation.x = 0.5

    const rightLowerLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.1),
      new THREE.MeshLambertMaterial({ color: pantsColor })
    )
    rightLowerLeg.position.set(0.12, 0.35, -0.05)
    rightLowerLeg.rotation.x = 0.5

    const helmetGroup = new THREE.Group()
    parts.set('helmetGroup', helmetGroup)

    const helmetMain = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.2, 0.24),
      new THREE.MeshLambertMaterial({ color: helmetColor })
    )
    helmetMain.position.set(0, 0.95, 0)

    const helmetVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.08, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.5 })
    )
    helmetVisor.position.set(0, 0.94, -0.11)

    helmetGroup.add(helmetMain, helmetVisor)

    riderGroup.add(
      torso,
      leftShoulder,
      rightShoulder,
      leftForearm,
      rightForearm,
      leftThigh,
      rightThigh,
      leftLowerLeg,
      rightLowerLeg,
      helmetGroup
    )

    root.add(bodyPivot, frontWheel, rearWheel, riderGroup)

    return { root, parts }
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
