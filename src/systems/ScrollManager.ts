import * as THREE from 'three'
import { PhysicsConfig } from '../config'

export class ScrollManager {
  readonly worldContainer: THREE.Group
  private scrollSpeed: number = PhysicsConfig.SCROLL_SPEED
  private scrolling: boolean = false

  constructor() {
    this.worldContainer = new THREE.Group()
  }

  addToWorld(object: THREE.Object3D): void {
    this.worldContainer.add(object)
  }

  startScrolling(): void {
    this.scrolling = true
  }

  stopScrolling(): void {
    this.scrolling = false
  }

  isScrolling(): boolean {
    return this.scrolling
  }

  getScrollSpeed(): number {
    return this.scrollSpeed
  }

  update(delta: number): void {
    if (this.scrolling) {
      this.worldContainer.position.z += this.scrollSpeed * delta
    }
  }

  reset(): void {
    this.worldContainer.position.set(0, 0, 0)
    this.scrolling = false
  }
}
