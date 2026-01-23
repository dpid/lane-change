import * as THREE from 'three'

export interface BaseParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  active: boolean
}

export abstract class BaseParticleSystem<T extends BaseParticle> {
  protected particles: T[] = []
  protected nextParticleIndex: number = 0

  protected acquireParticle(): T | null {
    const startIndex = this.nextParticleIndex
    do {
      const particle = this.particles[this.nextParticleIndex]
      this.nextParticleIndex = (this.nextParticleIndex + 1) % this.particles.length
      if (!particle.active) {
        particle.active = true
        particle.mesh.visible = true
        return particle
      }
    } while (this.nextParticleIndex !== startIndex)
    return null
  }

  protected deactivateParticle(particle: T): void {
    particle.active = false
    particle.mesh.visible = false
  }

  reset(): void {
    for (const particle of this.particles) {
      this.deactivateParticle(particle)
    }
    this.nextParticleIndex = 0
  }
}
