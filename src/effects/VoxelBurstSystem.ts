import * as THREE from 'three'
import { VoxelBurstConfig } from '../config'
import type { VoxelData } from '../loaders/AssetLoader'

interface VoxelParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
  life: number
  active: boolean
}

export class VoxelBurstSystem {
  private particles: VoxelParticle[] = []
  private geometry: THREE.BoxGeometry
  private activeBurst = false
  private onCompleteCallback: (() => void) | null = null

  constructor(private scene: THREE.Scene) {
    this.geometry = new THREE.BoxGeometry(
      VoxelBurstConfig.VOXEL_SIZE,
      VoxelBurstConfig.VOXEL_SIZE,
      VoxelBurstConfig.VOXEL_SIZE
    )

    for (let i = 0; i < VoxelBurstConfig.POOL_SIZE; i++) {
      const material = new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 1
      })

      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.visible = false
      scene.add(mesh)

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(),
        life: 0,
        active: false
      })
    }
  }

  emitBurst(
    worldMatrix: THREE.Matrix4,
    voxelData: VoxelData[],
    onComplete: () => void
  ): void {
    this.onCompleteCallback = onComplete
    this.activeBurst = true

    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    worldMatrix.decompose(position, quaternion, scale)

    const center = new THREE.Vector3()
    let particleIndex = 0

    for (const voxel of voxelData) {
      if (particleIndex >= VoxelBurstConfig.POOL_SIZE) break

      const particle = this.particles[particleIndex]
      particleIndex++

      const localPos = voxel.position.clone().multiply(scale)
      localPos.applyQuaternion(quaternion)
      localPos.add(position)

      particle.mesh.position.copy(localPos)
      particle.mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )

      const material = particle.mesh.material as THREE.MeshLambertMaterial
      material.color.copy(voxel.color)
      material.opacity = 1

      const direction = localPos.clone().sub(position)
      if (direction.lengthSq() < 0.001) {
        direction.set(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
      }
      direction.normalize()

      const speed = VoxelBurstConfig.BURST_BASE_SPEED +
        (Math.random() - 0.5) * VoxelBurstConfig.BURST_SPEED_VARIANCE * 2

      particle.velocity.copy(direction).multiplyScalar(speed)
      particle.velocity.y += VoxelBurstConfig.BURST_UPWARD_BIAS

      particle.angularVelocity.set(
        (Math.random() - 0.5) * VoxelBurstConfig.ANGULAR_VELOCITY_MAX * 2,
        (Math.random() - 0.5) * VoxelBurstConfig.ANGULAR_VELOCITY_MAX * 2,
        (Math.random() - 0.5) * VoxelBurstConfig.ANGULAR_VELOCITY_MAX * 2
      )

      particle.life = 0
      particle.active = true
      particle.mesh.visible = true

      center.add(localPos)
    }
  }

  update(delta: number): void {
    if (!this.activeBurst) return

    let anyActive = false

    for (const particle of this.particles) {
      if (!particle.active) continue

      anyActive = true

      particle.velocity.y -= VoxelBurstConfig.GRAVITY * delta

      particle.mesh.position.x += particle.velocity.x * delta
      particle.mesh.position.y += particle.velocity.y * delta
      particle.mesh.position.z += particle.velocity.z * delta

      particle.mesh.rotation.x += particle.angularVelocity.x * delta
      particle.mesh.rotation.y += particle.angularVelocity.y * delta
      particle.mesh.rotation.z += particle.angularVelocity.z * delta

      particle.life += delta
      const lifeRatio = particle.life / VoxelBurstConfig.LIFETIME

      if (lifeRatio >= VoxelBurstConfig.FADE_START) {
        const fadeProgress = (lifeRatio - VoxelBurstConfig.FADE_START) /
          (1 - VoxelBurstConfig.FADE_START)
        const material = particle.mesh.material as THREE.MeshLambertMaterial
        material.opacity = 1 - fadeProgress
      }

      if (particle.life >= VoxelBurstConfig.LIFETIME) {
        this.deactivateParticle(particle)
      }
    }

    if (!anyActive && this.activeBurst) {
      this.activeBurst = false
      if (this.onCompleteCallback) {
        this.onCompleteCallback()
        this.onCompleteCallback = null
      }
    }
  }

  reset(): void {
    for (const particle of this.particles) {
      this.deactivateParticle(particle)
    }
    this.activeBurst = false
    this.onCompleteCallback = null
  }

  private deactivateParticle(particle: VoxelParticle): void {
    particle.active = false
    particle.mesh.visible = false
  }
}
