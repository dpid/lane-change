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
  private distantLayer!: BackgroundLayer
  private midLayer!: BackgroundLayer
  private nearLayer!: BackgroundLayer
  private sky!: THREE.Mesh

  constructor(scene: THREE.Scene, worldContainer: THREE.Object3D) {
    this.scene = scene
    this.worldContainer = worldContainer
    this.createSky()
    this.createDistantLayer()
    this.createMidLayer()
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

  private createDistantLayer(): void {
    const groups: THREE.Group[] = []
    const buildingCount = 12
    const zStart = SpawnConfig.DISTANT_BUILDINGS_Z

    for (let i = 0; i < buildingCount; i++) {
      const leftBuilding = this.createBuilding(15, 30)
      leftBuilding.position.set(-SpawnConfig.DISTANT_BUILDINGS_X, 0, zStart + i * (SpawnConfig.BACKGROUND_SPAWN_RANGE / buildingCount))
      this.worldContainer.add(leftBuilding)
      groups.push(leftBuilding)

      const rightBuilding = this.createBuilding(15, 30)
      rightBuilding.position.set(SpawnConfig.DISTANT_BUILDINGS_X, 0, zStart + i * (SpawnConfig.BACKGROUND_SPAWN_RANGE / buildingCount))
      this.worldContainer.add(rightBuilding)
      groups.push(rightBuilding)
    }

    this.distantLayer = {
      groups,
      initialZ: zStart
    }
  }

  private createMidLayer(): void {
    const groups: THREE.Group[] = []
    const buildingCount = 10
    const zStart = SpawnConfig.MID_BUILDINGS_Z

    for (let i = 0; i < buildingCount; i++) {
      const leftBuilding = this.createBuilding(8, 20)
      leftBuilding.position.set(-SpawnConfig.MID_BUILDINGS_X, 0, zStart + i * (SpawnConfig.BACKGROUND_SPAWN_RANGE / buildingCount))
      this.worldContainer.add(leftBuilding)
      groups.push(leftBuilding)

      const rightBuilding = this.createBuilding(8, 20)
      rightBuilding.position.set(SpawnConfig.MID_BUILDINGS_X, 0, zStart + i * (SpawnConfig.BACKGROUND_SPAWN_RANGE / buildingCount))
      this.worldContainer.add(rightBuilding)
      groups.push(rightBuilding)
    }

    this.midLayer = {
      groups,
      initialZ: zStart
    }
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

  private createBuilding(minHeight: number, maxHeight: number): THREE.Group {
    const group = new THREE.Group()

    const buildingColors = [
      EnvironmentColors.buildingBase,
      EnvironmentColors.buildingVariant1,
      EnvironmentColors.buildingVariant2,
      EnvironmentColors.buildingVariant3
    ]

    const randomColor = buildingColors[Math.floor(Math.random() * buildingColors.length)]
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: randomColor })

    const width = 3 + Math.random() * 3
    const height = minHeight + Math.random() * (maxHeight - minHeight)
    const depth = 2 + Math.random() * 2

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      buildingMaterial
    )
    building.position.y = height / 2

    group.add(building)

    const windowSize = 0.3
    const windowSpacingY = 2.0
    const windowSpacingX = 1.0
    const windowsPerRow = Math.floor(width / windowSpacingX)
    const numRows = Math.floor(height / windowSpacingY)

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < windowsPerRow; col++) {
        const isLit = Math.random() > 0.3
        const windowMaterial = new THREE.MeshLambertMaterial({
          color: isLit ? EnvironmentColors.windowLit : EnvironmentColors.windowDark
        })

        const window = new THREE.Mesh(
          new THREE.BoxGeometry(windowSize, windowSize, 0.1),
          windowMaterial
        )
        window.position.set(
          (col - (windowsPerRow - 1) / 2) * windowSpacingX,
          row * windowSpacingY + windowSpacingY,
          depth / 2 + 0.05
        )
        group.add(window)
      }
    }

    return group
  }

  private createNearObject(sceneryFactory: SceneryFactory): THREE.Group {
    const types = [SceneryType.STREETLIGHT, SceneryType.SIGN]
    const randomType = types[Math.floor(Math.random() * types.length)]
    const geometryParts = sceneryFactory.create({ type: randomType })
    return geometryParts.root
  }

  update(_delta: number): void {
    const containerZ = (this.worldContainer as THREE.Group).position.z
    this.wrapLayer(this.distantLayer, containerZ)
    this.wrapLayer(this.midLayer, containerZ)
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
