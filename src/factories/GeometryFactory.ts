import * as THREE from 'three'

export interface GeometryParts {
  root: THREE.Group
  parts: Map<string, THREE.Object3D>
}

export interface GeometryFactory<TOptions = void> {
  create(options?: TOptions): GeometryParts
  dispose(geometry: GeometryParts): void
}

export function disposeGeometryParts(geometry: GeometryParts): void {
  geometry.root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
  geometry.parts.clear()
}
