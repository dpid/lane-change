import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { EnvironmentColors } from '../config'

export enum SceneryType {
  STREETLIGHT = 'STREETLIGHT',
  SIGN = 'SIGN',
  BUILDING_EDGE = 'BUILDING_EDGE'
}

export interface SceneryOptions {
  type: SceneryType
}

export class SceneryFactory implements GeometryFactory<SceneryOptions> {
  create(options: SceneryOptions): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    switch (options.type) {
      case SceneryType.STREETLIGHT:
        this.buildStreetlight(root, parts)
        break
      case SceneryType.SIGN:
        this.buildSign(root, parts)
        break
      case SceneryType.BUILDING_EDGE:
        this.buildBuildingEdge(root, parts)
        break
    }

    return { root, parts }
  }

  private buildStreetlight(root: THREE.Group, parts: Map<string, THREE.Object3D>): void {
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 })
    const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffcc })

    const poleRadius = 0.08
    const poleHeight = 4.0

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 6),
      poleMaterial
    )
    pole.position.y = poleHeight / 2

    const lightRadius = 0.2
    const lightHeight = 0.3

    const light = new THREE.Mesh(
      new THREE.CylinderGeometry(lightRadius, lightRadius, lightHeight, 6),
      lightMaterial
    )
    light.position.y = poleHeight

    parts.set('pole', pole)
    parts.set('light', light)
    root.add(pole, light)
  }

  private buildSign(root: THREE.Group, parts: Map<string, THREE.Object3D>): void {
    const postMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 })
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0x2d7a2d })

    const postRadius = 0.05
    const postHeight = 2.5

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 6),
      postMaterial
    )
    post.position.y = postHeight / 2

    const signWidth = 0.6
    const signHeight = 0.4
    const signDepth = 0.05

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(signWidth, signHeight, signDepth),
      signMaterial
    )
    sign.position.y = postHeight - signHeight / 2

    parts.set('post', post)
    parts.set('sign', sign)
    root.add(post, sign)
  }

  private buildBuildingEdge(root: THREE.Group, parts: Map<string, THREE.Object3D>): void {
    const buildingColors = [
      EnvironmentColors.buildingBase,
      EnvironmentColors.buildingVariant1,
      EnvironmentColors.buildingVariant2,
      EnvironmentColors.buildingVariant3
    ]

    const randomColor = buildingColors[Math.floor(Math.random() * buildingColors.length)]
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: randomColor })
    const windowMaterial = new THREE.MeshLambertMaterial({ color: EnvironmentColors.windowLit })

    const buildingWidth = 3.0
    const buildingHeight = 5.0 + Math.random() * 10.0
    const buildingDepth = 2.0

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth),
      buildingMaterial
    )
    building.position.y = buildingHeight / 2

    const buildingGroup = new THREE.Group()
    buildingGroup.add(building)

    const windowSize = 0.3
    const windowSpacingY = 1.0
    const windowSpacingX = 0.8
    const windowsPerRow = 3
    const numRows = Math.floor(buildingHeight / windowSpacingY)

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < windowsPerRow; col++) {
        const window = new THREE.Mesh(
          new THREE.BoxGeometry(windowSize, windowSize, 0.1),
          windowMaterial.clone()
        )
        window.position.set(
          (col - 1) * windowSpacingX,
          row * windowSpacingY + 1.0,
          buildingDepth / 2 + 0.05
        )
        buildingGroup.add(window)
      }
    }

    parts.set('building', buildingGroup)
    root.add(buildingGroup)
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
