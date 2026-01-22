import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'

export enum SceneryType {
  SIGN = 'SIGN'
}

export interface SceneryOptions {
  type: SceneryType
}

export class SceneryFactory implements GeometryFactory<SceneryOptions> {
  create(options: SceneryOptions): GeometryParts {
    const parts = new Map<string, THREE.Object3D>()
    const root = new THREE.Group()

    switch (options.type) {
      case SceneryType.SIGN:
        this.buildSign(root, parts)
        break
    }

    return { root, parts }
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

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
