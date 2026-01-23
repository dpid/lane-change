import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { AssetLoader } from '../loaders'
import { MotorcycleFactoryConfig } from '../config'

export class MotorcycleFactory implements GeometryFactory<void> {
  create(): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    const bodyPivot = new THREE.Group()
    parts.set('bodyPivot', bodyPivot)

    const voxModel = AssetLoader.getInstance().getModel('motorcycle')
    voxModel.scale.setScalar(MotorcycleFactoryConfig.VOX_SCALE)
    voxModel.rotation.y = Math.PI
    voxModel.position.y = MotorcycleFactoryConfig.VOX_Y_OFFSET

    bodyPivot.add(voxModel)
    root.add(bodyPivot)

    return { root, parts }
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
