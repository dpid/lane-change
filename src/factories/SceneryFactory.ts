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

    const postRadius = 0.15
    const signWidth = 2.5
    const signHeight = 1.2
    const postHeight = signHeight + signHeight / 2
    const signDepth = 0.1
    const postSpacing = signWidth - 0.2

    const leftPost = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8),
      postMaterial
    )
    leftPost.position.set(-postSpacing / 2, postHeight / 2, 0)

    const rightPost = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8),
      postMaterial
    )
    rightPost.position.set(postSpacing / 2, postHeight / 2, 0)

    const signTexture = this.createSignTexture()
    const signMaterial = new THREE.MeshLambertMaterial({ map: signTexture })

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(signWidth, signHeight, signDepth),
      signMaterial
    )
    sign.position.y = postHeight - signHeight / 2
    sign.position.z = signDepth

    parts.set('leftPost', leftPost)
    parts.set('rightPost', rightPost)
    parts.set('sign', sign)
    root.add(leftPost, rightPost, sign)
  }

  private createSignTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    const width = 256
    const height = 128
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const stripeHeight = 24
    ctx.fillStyle = '#2244aa'
    ctx.fillRect(0, height - stripeHeight, width, stripeHeight)

    ctx.fillStyle = '#cc2222'
    this.drawPixelText(ctx, 'FUN', width / 2, (height - stripeHeight) / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  private drawPixelText(ctx: CanvasRenderingContext2D, text: string, centerX: number, centerY: number): void {
    const pixelPatterns: Record<string, number[][]> = {
      F: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0]
      ],
      U: [
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0]
      ],
      N: [
        [1, 0, 0, 0, 1],
        [1, 1, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1]
      ]
    }

    const pixelSize = 8
    const letterWidth = 5
    const letterHeight = 7
    const letterSpacing = 1
    const totalWidth = text.length * (letterWidth + letterSpacing) - letterSpacing
    const startX = centerX - (totalWidth * pixelSize) / 2
    const startY = centerY - (letterHeight * pixelSize) / 2

    for (let i = 0; i < text.length; i++) {
      const pattern = pixelPatterns[text[i]]
      if (!pattern) continue

      const letterX = startX + i * (letterWidth + letterSpacing) * pixelSize

      for (let row = 0; row < letterHeight; row++) {
        for (let col = 0; col < letterWidth; col++) {
          if (pattern[row][col]) {
            ctx.fillRect(letterX + col * pixelSize, startY + row * pixelSize, pixelSize, pixelSize)
          }
        }
      }
    }
  }

  dispose(geometry: GeometryParts): void {
    disposeGeometryParts(geometry)
  }
}
