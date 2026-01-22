import * as THREE from 'three'
import { EnvironmentColors, SpawnConfig } from '../config'
import { SceneryFactory, SceneryType } from '../factories/SceneryFactory'

interface BackgroundLayer {
  groups: THREE.Group[]
  initialZ: number
}

export class Background {
  private scene: THREE.Scene
  private worldContainer: THREE.Object3D
  private nearLayer!: BackgroundLayer
  private sky!: THREE.Mesh

  constructor(scene: THREE.Scene, worldContainer: THREE.Object3D) {
    this.scene = scene
    this.worldContainer = worldContainer
    this.createSky()
    this.createNearLayer()
  }

  private createSky(): void {
    const skyGeometry = new THREE.PlaneGeometry(200, 100)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(EnvironmentColors.skyTop) },
        bottomColor: { value: new THREE.Color(EnvironmentColors.skyBottom) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
        }
      `,
      side: THREE.DoubleSide
    })
    this.sky = new THREE.Mesh(skyGeometry, skyMaterial)
    this.sky.position.set(0, 20, -80)
    this.scene.add(this.sky)
  }

  private createNearLayer(): void {
    const groups: THREE.Group[] = []
    const sceneryFactory = new SceneryFactory()
    const objectCount = 16
    const zStart = SpawnConfig.NEAR_OBJECTS_Z

    for (let i = 0; i < objectCount; i++) {
      const leftObject = this.createNearObject(sceneryFactory)
      leftObject.position.set(-SpawnConfig.NEAR_OBJECTS_X, 0, zStart + i * (SpawnConfig.BACKGROUND_SPAWN_RANGE / objectCount))
      this.worldContainer.add(leftObject)
      groups.push(leftObject)

      const rightObject = this.createNearObject(sceneryFactory)
      rightObject.position.set(SpawnConfig.NEAR_OBJECTS_X, 0, zStart + i * (SpawnConfig.BACKGROUND_SPAWN_RANGE / objectCount))
      this.worldContainer.add(rightObject)
      groups.push(rightObject)
    }

    this.nearLayer = {
      groups,
      initialZ: zStart
    }
  }

  private createNearObject(sceneryFactory: SceneryFactory): THREE.Group {
    const geometryParts = sceneryFactory.create({ type: SceneryType.SIGN })
    return geometryParts.root
  }

  update(_delta: number): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z
    this.wrapLayer(this.nearLayer, containerZ)
  }

  private wrapLayer(layer: BackgroundLayer, containerZ: number): void {
    const threshold = SpawnConfig.BACKGROUND_WRAP_DISTANCE / 2

    for (const group of layer.groups) {
      while (group.position.z + containerZ > threshold) {
        group.position.z -= SpawnConfig.BACKGROUND_WRAP_DISTANCE
      }
    }
  }
}
