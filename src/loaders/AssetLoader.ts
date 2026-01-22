import * as THREE from 'three'
import { VOXLoader, buildMesh } from 'three/addons/loaders/VOXLoader.js'

export type ModelType =
  | 'motorcycle'
  | 'car'
  | 'truck'
  | 'semi-truck'

const MODEL_PATHS: Record<ModelType, string> = {
  'motorcycle': '/models/motorcycle.vox',
  'car': '/models/car-grey.vox',
  'truck': '/models/truck.vox',
  'semi-truck': '/models/semi-truck.vox'
}

export class AssetLoader {
  private static instance: AssetLoader | null = null
  private loader: VOXLoader
  private cache: Map<ModelType, THREE.Group> = new Map()
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

          for (const chunk of result.chunks) {
            const mesh = buildMesh(chunk)
            mesh.castShadow = true
            mesh.receiveShadow = true
            group.add(mesh)
          }

          this.cache.set(type, group)
          resolve()
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load model ${type}: ${error}`))
        }
      )
    })
  }

  getModel(type: ModelType): THREE.Group {
    const cached = this.cache.get(type)
    if (!cached) {
      throw new Error(`Model ${type} not loaded. Call loadAll() first.`)
    }
    return cached.clone()
  }

  isLoaded(): boolean {
    return this.loaded
  }
}
