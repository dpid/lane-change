import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { PowerupColors, VehicleTintColors, ItemFactoryConfig } from '../config'
import { GeometryType } from '../config/items.config'
import { AssetLoader, ModelType } from '../loaders'

export interface ItemOptions {
  geometryType: GeometryType
}

const GEOMETRY_TO_MODEL: Partial<Record<GeometryType, ModelType>> = {
  [GeometryType.CAR]: 'car',
  [GeometryType.TRUCK]: 'truck',
  [GeometryType.SEMI_TRUCK]: 'semi-truck'
}

function tintVehicle(group: THREE.Group, color: number): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (!child.material) return

    const material = child.material as THREE.MeshStandardMaterial
    const { r, g, b } = material.color
    const threshold = ItemFactoryConfig.WHITE_THRESHOLD

    if (r > threshold && g > threshold && b > threshold) {
      child.material = material.clone()
      ;(child.material as THREE.MeshStandardMaterial).color.set(color)
    }
  })
}

export class ItemFactory implements GeometryFactory<ItemOptions> {
  create(options: ItemOptions): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    const modelType = GEOMETRY_TO_MODEL[options.geometryType]
    if (modelType) {
      this.buildVehicle(root, parts, modelType)
    } else if (options.geometryType === GeometryType.COIN) {
      this.buildCoin(root, parts)
    }

    return { root, parts }
  }

  private buildVehicle(root: THREE.Group, parts: Map<string, THREE.Object3D>, modelType: ModelType): void {
    const voxModel = AssetLoader.getInstance().getModel(modelType)
    voxModel.scale.setScalar(ItemFactoryConfig.VOX_SCALE)
    voxModel.rotation.y = Math.PI
    voxModel.position.y = ItemFactoryConfig.VOX_Y_OFFSET

    const colorIndex = Math.floor(Math.random() * VehicleTintColors.length)
    tintVehicle(voxModel, VehicleTintColors[colorIndex])

    parts.set('body', voxModel)
    root.add(voxModel)
  }

  private buildCoin(root: THREE.Group, parts: Map<string, THREE.Object3D>): void {
    const material = new THREE.MeshLambertMaterial({ color: PowerupColors.coin })

    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(ItemFactoryConfig.COIN_RADIUS, ItemFactoryConfig.COIN_RADIUS, ItemFactoryConfig.COIN_THICKNESS, 8),
      material
    )
    coin.rotation.x = Math.PI / 2

    parts.set('coin', coin)
    root.add(coin)
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
