import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { PowerupColors } from '../config'

export enum PowerupType {
  COIN = 'COIN'
}

export interface PowerupOptions {
  type: PowerupType
}

export class PowerupFactory implements GeometryFactory<PowerupOptions> {
  create(options: PowerupOptions): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    switch (options.type) {
      case PowerupType.COIN:
        this.buildCoin(root, parts)
        break
    }

    return { root, parts }
  }

  private buildCoin(root: THREE.Group, parts: Map<string, THREE.Object3D>): void {
    const material = new THREE.MeshLambertMaterial({ color: PowerupColors.coin })

    const coinRadius = 0.3
    const coinThickness = 0.05
    const riderHeight = 0.8

    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 8),
      material
    )
    coin.rotation.x = Math.PI / 2
    coin.position.y = riderHeight

    parts.set('coin', coin)
    root.add(coin)
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
