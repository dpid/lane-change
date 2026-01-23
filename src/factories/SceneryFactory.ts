import * as THREE from 'three'
import { GeometryFactory, GeometryParts, disposeGeometryParts } from './GeometryFactory'
import { SceneryFactoryConfig } from '../config'
import { createSignTexture } from '../utils/textures'

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

    const { POST_RADIUS, SIGN_WIDTH, SIGN_HEIGHT, SIGN_DEPTH, POST_SPACING_INSET } = SceneryFactoryConfig
    const postHeight = SIGN_HEIGHT + SIGN_HEIGHT / 2
    const postSpacing = SIGN_WIDTH - POST_SPACING_INSET

    const leftPost = new THREE.Mesh(
      new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, postHeight, 8),
      postMaterial
    )
    leftPost.position.set(-postSpacing / 2, postHeight / 2, 0)

    const rightPost = new THREE.Mesh(
      new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, postHeight, 8),
      postMaterial
    )
    rightPost.position.set(postSpacing / 2, postHeight / 2, 0)

    const signTexture = createSignTexture()
    const signMaterial = new THREE.MeshLambertMaterial({ map: signTexture })

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(SIGN_WIDTH, SIGN_HEIGHT, SIGN_DEPTH),
      signMaterial
    )
    sign.position.y = postHeight - SIGN_HEIGHT / 2
    sign.position.z = SIGN_DEPTH

    parts.set('leftPost', leftPost)
    parts.set('rightPost', rightPost)
    parts.set('sign', sign)
    root.add(leftPost, rightPost, sign)
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
