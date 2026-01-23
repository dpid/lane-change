import * as THREE from 'three'
import { WindConfig } from '../config'

interface WindParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
  active: boolean
  initialOpacity: number
}

export class WindSystem {
  private particles: WindParticle[] = []
  private motorcycleGroup: THREE.Group | null = null
  private timeSinceEmit: number = 0
  private isActive: boolean = false

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BoxGeometry(
      WindConfig.LINE_WIDTH,
      WindConfig.LINE_HEIGHT,
      WindConfig.LINE_LENGTH
    )

    for (let i = 0; i < WindConfig.POOL_SIZE; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      scene.add(mesh)

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: WindConfig.LIFETIME,
        active: false,
        initialOpacity: WindConfig.BASE_OPACITY
      })
    }
  }

  setMotorcycle(group: THREE.Group): void {
    this.motorcycleGroup = group
  }

  startEffect(): void {
    this.isActive = true
  }

  stopEffect(): void {
    this.isActive = false
  }

  update(delta: number): void {
    if (this.isActive && this.motorcycleGroup) {
      this.timeSinceEmit += delta
      while (this.timeSinceEmit >= WindConfig.EMISSION_INTERVAL) {
        this.emitParticle()
        this.timeSinceEmit -= WindConfig.EMISSION_INTERVAL
      }
    }

    for (const particle of this.particles) {
      if (!particle.active) continue

      particle.mesh.position.x += particle.velocity.x * delta
      particle.mesh.position.y += particle.velocity.y * delta
      particle.mesh.position.z += particle.velocity.z * delta

      particle.life += delta
      const lifeRatio = particle.life / particle.maxLife

      const material = particle.mesh.material as THREE.MeshBasicMaterial
      if (lifeRatio > WindConfig.FADE_START) {
        const fadeProgress = (lifeRatio - WindConfig.FADE_START) / (1 - WindConfig.FADE_START)
        material.opacity = particle.initialOpacity * (1 - fadeProgress)
      }

      if (particle.life >= particle.maxLife) {
        this.deactivateParticle(particle)
      }
    }
  }

  private emitParticle(): void {
    const particle = this.acquireParticle()
    if (!particle || !this.motorcycleGroup) return

    const motoPos = this.motorcycleGroup.position

    particle.mesh.position.set(
      motoPos.x + (Math.random() - 0.5) * WindConfig.SPAWN_SPREAD_X,
      WindConfig.SPAWN_HEIGHT_MIN + Math.random() * (WindConfig.SPAWN_HEIGHT_MAX - WindConfig.SPAWN_HEIGHT_MIN),
      motoPos.z + WindConfig.SPAWN_OFFSET_Z
    )

    particle.velocity.set(0, 0, WindConfig.VELOCITY_Z)

    particle.life = 0
    particle.maxLife = WindConfig.LIFETIME
    const opacityVariance = (Math.random() - 0.5) * WindConfig.OPACITY_VARIANCE * 2
    particle.initialOpacity = WindConfig.BASE_OPACITY + opacityVariance
    ;(particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.initialOpacity
  }

  reset(): void {
    for (const particle of this.particles) {
      this.deactivateParticle(particle)
    }
    this.timeSinceEmit = 0
    this.isActive = false
  }

  private acquireParticle(): WindParticle | null {
    for (const particle of this.particles) {
      if (!particle.active) {
        particle.active = true
        particle.mesh.visible = true
        return particle
      }
    }
    return null
  }

  private deactivateParticle(particle: WindParticle): void {
    particle.active = false
    particle.mesh.visible = false
  }
}
