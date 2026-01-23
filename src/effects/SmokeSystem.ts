import * as THREE from 'three'
import { ParticlesConfig } from '../config'
import { BaseParticleSystem, type BaseParticle } from './BaseParticleSystem'

interface SmokeParticle extends BaseParticle {
  maxLife: number
  initialOpacity: number
}

export class SmokeSystem extends BaseParticleSystem<SmokeParticle> {
  private motorcycleGroup: THREE.Group | null = null
  private timeSinceEmit: number = 0

  constructor(scene: THREE.Scene) {
    super()
    const geometry = new THREE.BoxGeometry(
      ParticlesConfig.PARTICLE_SIZE,
      ParticlesConfig.PARTICLE_SIZE,
      ParticlesConfig.PARTICLE_SIZE
    )

    for (let i = 0; i < ParticlesConfig.POOL_SIZE; i++) {
      const material = new THREE.MeshLambertMaterial({
        color: ParticlesConfig.COLOR,
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
        maxLife: 1,
        active: false,
        initialOpacity: ParticlesConfig.INITIAL_OPACITY
      })
    }
  }

  setMotorcycle(group: THREE.Group): void {
    this.motorcycleGroup = group
  }

  update(delta: number, isEmitting: boolean, scrollSpeed: number): void {
    if (isEmitting && this.motorcycleGroup) {
      this.timeSinceEmit += delta
      const interval = ParticlesConfig.EMISSION_INTERVAL / Math.max(1, scrollSpeed / 20)
      while (this.timeSinceEmit >= interval) {
        this.emitParticle(scrollSpeed)
        this.timeSinceEmit -= interval
      }
    }

    for (const particle of this.particles) {
      if (!particle.active) continue

      particle.velocity.y += ParticlesConfig.GRAVITY * delta
      particle.velocity.multiplyScalar(ParticlesConfig.DRAG)

      particle.mesh.position.x += particle.velocity.x * delta
      particle.mesh.position.y += particle.velocity.y * delta
      particle.mesh.position.z += particle.velocity.z * delta

      particle.life += delta
      const lifeRatio = particle.life / particle.maxLife

      const material = particle.mesh.material as THREE.MeshLambertMaterial
      material.opacity = particle.initialOpacity * (1 - lifeRatio)

      const scale = 1 + lifeRatio * (ParticlesConfig.SCALE_GROWTH - 1)
      particle.mesh.scale.setScalar(scale)

      if (particle.life >= particle.maxLife) {
        this.deactivateParticle(particle)
      }
    }
  }

  private emitParticle(scrollSpeed: number): void {
    const particle = this.acquireParticle()
    if (!particle || !this.motorcycleGroup) return

    const pos = this.motorcycleGroup.position
    const r = ParticlesConfig.EMISSION_RANDOMNESS
    particle.mesh.position.set(
      pos.x + ParticlesConfig.EMISSION_OFFSET_X + (Math.random() - 0.5) * r,
      pos.y + ParticlesConfig.EMISSION_OFFSET_Y + (Math.random() - 0.5) * r,
      pos.z + ParticlesConfig.EMISSION_OFFSET_Z + (Math.random() - 0.5) * r
    )

    const spread = ParticlesConfig.VELOCITY_SPREAD
    particle.velocity.set(
      (Math.random() - 0.5) * spread,
      ParticlesConfig.VELOCITY_Y_DRIFT + (Math.random() - 0.5) * spread,
      scrollSpeed * ParticlesConfig.VELOCITY_SCROLL_FACTOR
    )

    particle.life = 0
    particle.maxLife = THREE.MathUtils.lerp(
      ParticlesConfig.LIFETIME_MIN,
      ParticlesConfig.LIFETIME_MAX,
      Math.random()
    )
    const opacityVariance = (Math.random() - 0.5) * ParticlesConfig.OPACITY_RANDOMNESS * 2
    particle.initialOpacity = ParticlesConfig.INITIAL_OPACITY + opacityVariance
    particle.mesh.scale.setScalar(1)
    ;(particle.mesh.material as THREE.MeshLambertMaterial).opacity = particle.initialOpacity
  }

  emitCrashBurst(scrollSpeed: number): void {
    if (!this.motorcycleGroup) return

    const intensity = scrollSpeed / 20
    const count = Math.floor(ParticlesConfig.CRASH_BURST_COUNT * intensity)
    for (let i = 0; i < count; i++) {
      const particle = this.acquireParticle()
      if (!particle) break

      const pos = this.motorcycleGroup.position

      const azimuth = Math.random() * Math.PI * 2
      const elevation = Math.random() * Math.PI * 0.5
      const speed = (3 + Math.random() * 2) * intensity

      const cosElev = Math.cos(elevation)
      const vx = Math.cos(azimuth) * cosElev * speed
      const vy = Math.sin(elevation) * speed
      const vz = Math.sin(azimuth) * cosElev * speed

      particle.mesh.position.set(
        pos.x,
        pos.y + 0.5,
        pos.z
      )

      particle.velocity.set(vx, vy, vz)

      particle.life = 0
      particle.maxLife = THREE.MathUtils.lerp(
        ParticlesConfig.LIFETIME_MIN * 1.5,
        ParticlesConfig.LIFETIME_MAX * 1.5,
        Math.random()
      )
      particle.initialOpacity = ParticlesConfig.INITIAL_OPACITY * Math.min(intensity, 2)
      particle.mesh.scale.setScalar(1 + intensity * 0.5)
      ;(particle.mesh.material as THREE.MeshLambertMaterial).opacity = particle.initialOpacity
    }
  }

  override reset(): void {
    super.reset()
    this.timeSinceEmit = 0
  }
}
