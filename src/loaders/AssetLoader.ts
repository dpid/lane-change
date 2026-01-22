import * as THREE from 'three'
import { VOXLoader, buildMesh } from 'three/addons/loaders/VOXLoader.js'

export type ModelType =
  | 'motorcycle'
  | 'car'
  | 'truck'
  | 'semi-truck'

export interface VoxelData {
  position: THREE.Vector3
  color: THREE.Color
}

interface CachedModel {
  group: THREE.Group
  voxels: VoxelData[]
}

const MODEL_PATHS: Record<ModelType, string> = {
  'motorcycle': './models/motorcycle.vox',
  'car': './models/car-grey.vox',
  'truck': './models/truck.vox',
  'semi-truck': './models/semi-truck.vox'
}

export class AssetLoader {
  private static instance: AssetLoader | null = null
  private loader: VOXLoader
  private cache: Map<ModelType, CachedModel> = new Map()
  private loaded = false

  private constructor() {
    this.loader = new VOXLoader()
  }

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader()
    }
    return AssetLoader.instance
  }

  async loadAll(): Promise<void> {
    if (this.loaded) return

    const modelTypes = Object.keys(MODEL_PATHS) as ModelType[]
    const loadPromises = modelTypes.map((type) => this.loadModel(type))

    await Promise.all(loadPromises)
    this.loaded = true
  }

  private async loadModel(type: ModelType): Promise<void> {
    const path = MODEL_PATHS[type]

    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (result) => {
          const group = new THREE.Group()
          const voxels: VoxelData[] = []

          for (const chunk of result.chunks) {
            const mesh = buildMesh(chunk)
            mesh.castShadow = true
            mesh.receiveShadow = true
            group.add(mesh)

            this.extractVoxelData(chunk, voxels)
          }

          this.cache.set(type, { group, voxels })
          resolve()
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load model ${type}: ${error}`))
        }
      )
    })
  }

  private extractVoxelData(chunk: { size: { x: number, y: number, z: number }, data: Uint8Array, palette: number[] }, voxels: VoxelData[]): void {
    const { size, data, palette } = chunk
    const hw = size.x / 2
    const hh = size.y / 2
    const hd = size.z / 2

    for (let i = 0; i < data.length; i += 4) {
      const x = data[i] - hw
      const y = data[i + 1] - hh
      const z = data[i + 2] - hd
      const colorIndex = data[i + 3]

      const colorValue = palette[colorIndex]
      const r = (colorValue & 0xff) / 255
      const g = ((colorValue >> 8) & 0xff) / 255
      const b = ((colorValue >> 16) & 0xff) / 255

      voxels.push({
        position: new THREE.Vector3(x, z, -y),
        color: new THREE.Color(r, g, b)
      })
    }
  }

  getModel(type: ModelType): THREE.Group {
    const cached = this.cache.get(type)
    if (!cached) {
      throw new Error(`Model ${type} not loaded. Call loadAll() first.`)
    }
    return cached.group.clone()
  }

  getVoxelData(type: ModelType): VoxelData[] {
    const cached = this.cache.get(type)
    if (!cached) {
      throw new Error(`Model ${type} not loaded. Call loadAll() first.`)
    }
    return cached.voxels
  }

  isLoaded(): boolean {
    return this.loaded
  }
}
