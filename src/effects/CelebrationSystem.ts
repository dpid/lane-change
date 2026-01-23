import * as THREE from 'three'
import { CelebrationConfig } from '../config'
import { BaseParticleSystem, type BaseParticle } from './BaseParticleSystem'

interface CelebrationParticle extends BaseParticle {}

export class CelebrationSystem extends BaseParticleSystem<CelebrationParticle> {
  private geometry: THREE.BoxGeometry

  constructor(scene: THREE.Scene) {
    super()
    this.geometry = new THREE.BoxGeometry(
      CelebrationConfig.PARTICLE_SIZE,
      CelebrationConfig.PARTICLE_SIZE,
      CelebrationConfig.PARTICLE_SIZE
    )

    for (let i = 0; i < CelebrationConfig.POOL_SIZE; i++) {
      const colorIndex = Math.floor(Math.random() * CelebrationConfig.COLORS.length)
      const material = new THREE.MeshBasicMaterial({
        color: CelebrationConfig.COLORS[colorIndex],
        transparent: true,
        opacity: 1
      })

      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.visible = false
      scene.add(mesh)

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        active: false
      })
    }
  }

  emitBurst(position: THREE.Vector3): void {
    for (let i = 0; i < CelebrationConfig.PARTICLES_PER_BURST; i++) {
      const particle = this.acquireParticle()
      if (!particle) continue

      particle.mesh.position.copy(position)

      const colorIndex = Math.floor(Math.random() * CelebrationConfig.COLORS.length)
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.color.setHex(CelebrationConfig.COLORS[colorIndex])
      material.opacity = 1

      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.5
      const speed = CelebrationConfig.BURST_BASE_SPEED +
        (Math.random() - 0.5) * CelebrationConfig.BURST_SPEED_VARIANCE * 2

      particle.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + CelebrationConfig.BURST_UPWARD_BIAS,
        Math.sin(phi) * Math.sin(theta) * speed
      )

      particle.life = 0
    }
  }

  update(delta: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue

      particle.velocity.y -= CelebrationConfig.GRAVITY * delta

      particle.mesh.position.x += particle.velocity.x * delta
      particle.mesh.position.y += particle.velocity.y * delta
      particle.mesh.position.z += particle.velocity.z * delta

      particle.life += delta
      const lifeRatio = particle.life / CelebrationConfig.LIFETIME

      if (lifeRatio >= CelebrationConfig.FADE_START) {
        const fadeProgress = (lifeRatio - CelebrationConfig.FADE_START) /
          (1 - CelebrationConfig.FADE_START)
        const material = particle.mesh.material as THREE.MeshBasicMaterial
        material.opacity = 1 - fadeProgress
      }

      if (particle.life >= CelebrationConfig.LIFETIME) {
        this.deactivateParticle(particle)
      }
    }
  }
}
