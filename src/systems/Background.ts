import * as THREE from 'three'
import { EnvironmentColors, SpawnConfig, PoolConfig } from '../config'
import { SceneryFactory, SceneryType } from '../factories/SceneryFactory'
import { ObjectPool, type PooledEntity } from '../pooling'
import type { ScrollManager } from './ScrollManager'
import { shouldDespawn, getLocalSpawnZ, getWorldZ } from '../utils/spawnable'

class RoadsideSign implements PooledEntity {
  private group: THREE.Group
  private _active: boolean = false

  get active(): boolean {
    return this._active
  }

  get object(): THREE.Group {
    return this.group
  }

  constructor(factory: SceneryFactory) {
    const parts = factory.create({ type: SceneryType.SIGN })
    this.group = parts.root
  }

  activate(): void {
    this._active = true
    this.group.visible = true
  }

  deactivate(): void {
    this._active = false
    this.group.visible = false
  }

  reset(): void {
    this.group.position.set(0, 0, 0)
  }
}

export class Background {
  private scene: THREE.Scene
  private worldContainer: THREE.Object3D
  private scrollManager: ScrollManager
  private sky!: THREE.Mesh
  private signPool: ObjectPool<RoadsideSign>
  private signSpawnTimer: number = 0
  private sceneryFactory: SceneryFactory

  constructor(scene: THREE.Scene, scrollManager: ScrollManager) {
    this.scene = scene
    this.scrollManager = scrollManager
    this.worldContainer = scrollManager.worldContainer
    this.sceneryFactory = new SceneryFactory()

    this.signPool = this.createSignPool()

    this.createSky()
    this.spawnInitialSign()
  }

  private createSignPool(): ObjectPool<RoadsideSign> {
    return new ObjectPool<RoadsideSign>(
      () => {
        const sign = new RoadsideSign(this.sceneryFactory)
        sign.deactivate()
        this.worldContainer.add(sign.object)
        return sign
      },
      PoolConfig.SIGN_POOL_SIZE
    )
  }

  private createSky(): void {
    const skyGeometry = new THREE.PlaneGeometry(200, 100)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...THREE.UniformsLib.fog,
        topColor: { value: new THREE.Color(EnvironmentColors.skyTop) },
        bottomColor: { value: new THREE.Color(EnvironmentColors.skyBottom) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vFogDepth;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        varying vec2 vUv;
        varying float vFogDepth;
        void main() {
          vec3 skyColor = mix(bottomColor, topColor, vUv.y);
          float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
          gl_FragColor = vec4(mix(skyColor, fogColor, fogFactor), 1.0);
        }
      `,
      fog: true,
      side: THREE.DoubleSide
    })
    this.sky = new THREE.Mesh(skyGeometry, skyMaterial)
    this.sky.position.set(0, 50, -130)
    this.scene.add(this.sky)
  }

  private spawnInitialSign(): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z
    this.spawnSignAt(getLocalSpawnZ(containerZ))
  }

  private spawnSignAt(localZ: number): void {
    const sign = this.signPool.acquire()
    if (!sign) return

    const isLeft = Math.random() < 0.5
    const xPos = isLeft ? -SpawnConfig.NEAR_OBJECTS_X : SpawnConfig.NEAR_OBJECTS_X
    sign.object.position.set(xPos, 0, localZ)
  }

  update(delta: number): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z

    this.signSpawnTimer += delta
    const signInterval = SpawnConfig.SIGN_SPAWN_INTERVAL * this.scrollManager.getSpawnIntervalMultiplier()
    if (this.signSpawnTimer >= signInterval) {
      this.spawnSignAt(getLocalSpawnZ(containerZ))
      this.signSpawnTimer = 0
    }

    for (const sign of this.signPool.getActive()) {
      if (shouldDespawn(getWorldZ(sign.object.position.z, containerZ))) {
        this.signPool.release(sign)
      }
    }
  }

  reset(): void {
    this.signPool.releaseAll()
    this.signSpawnTimer = 0
    this.spawnInitialSign()
  }
}
