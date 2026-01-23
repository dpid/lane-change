import * as THREE from 'three'
import { BaseParticle, BaseParticleSystem } from './BaseParticleSystem'
import { drawPixelText } from '../utils/textures'
import { PopupConfig } from '../config/popup.config'

interface ScorePopup extends BaseParticle {
  startY: number
  elapsed: number
  material: THREE.MeshBasicMaterial
}

export class ScorePopupSystem extends BaseParticleSystem<ScorePopup> {
  private textureCache: Map<string, THREE.CanvasTexture> = new Map()
  private geometry: THREE.PlaneGeometry

  constructor(scene: THREE.Scene) {
    super()
    this.geometry = new THREE.PlaneGeometry(PopupConfig.PLANE_WIDTH, PopupConfig.PLANE_HEIGHT)
    this.pregenerateTextures()
    this.initPool(scene)
  }

  private pregenerateTextures(): void {
    for (let i = 1; i <= PopupConfig.MAX_PREGENERATE_VALUE; i++) {
      this.getOrCreateTexture(i, false)
      this.getOrCreateTexture(i, true)
    }
  }

  private getOrCreateTexture(points: number, isGold: boolean): THREE.CanvasTexture {
    const key = `${points}-${isGold}`
    let texture = this.textureCache.get(key)
    if (!texture) {
      texture = this.createTexture(points, isGold)
      this.textureCache.set(key, texture)
    }
    return texture
  }

  private createTexture(points: number, isGold: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = PopupConfig.TEXTURE_SIZE
    canvas.height = PopupConfig.TEXTURE_SIZE

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const color = isGold ? PopupConfig.COLOR_COIN : PopupConfig.COLOR_OBSTACLE
    const text = `+${points}`

    drawPixelText(ctx, {
      text,
      centerX: canvas.width / 2,
      centerY: canvas.height / 2,
      color,
      pixelSize: PopupConfig.PIXEL_SIZE
    })

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  private initPool(scene: THREE.Scene): void {
    for (let i = 0; i < PopupConfig.POOL_SIZE; i++) {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        opacity: 0
      })

      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.visible = false
      scene.add(mesh)

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        active: false,
        startY: 0,
        elapsed: 0,
        material
      })
    }
  }

  show(position: THREE.Vector3, points: number, isGold: boolean): void {
    const popup = this.acquireParticle()
    if (!popup) return

    const texture = this.getOrCreateTexture(points, isGold)
    popup.material.map = texture
    popup.material.needsUpdate = true
    popup.material.opacity = PopupConfig.START_OPACITY

    popup.mesh.position.set(position.x, position.y + PopupConfig.SPAWN_OFFSET_Y, 0)
    popup.startY = popup.mesh.position.y
    popup.elapsed = 0
    popup.life = PopupConfig.LIFETIME
  }

  update(delta: number): void {
    for (const popup of this.particles) {
      if (!popup.active) continue

      popup.elapsed += delta
      const progress = popup.elapsed / popup.life

      if (progress >= 1) {
        this.deactivateParticle(popup)
        continue
      }

      const floatProgress = progress
      popup.mesh.position.y = popup.startY + floatProgress * PopupConfig.FLOAT_DISTANCE

      if (progress > PopupConfig.FADE_START_RATIO) {
        const fadeProgress = (progress - PopupConfig.FADE_START_RATIO) / (1 - PopupConfig.FADE_START_RATIO)
        popup.material.opacity = PopupConfig.START_OPACITY * (1 - fadeProgress)
      }
    }
  }
}
