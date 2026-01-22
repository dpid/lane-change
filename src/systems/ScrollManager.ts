import * as THREE from 'three'
import { PhysicsConfig } from '../config'

export class ScrollManager {
  readonly worldContainer: THREE.Group
  private scrolling: boolean = false
  private elapsedTime: number = 0

  constructor() {
    this.worldContainer = new THREE.Group()
  }

  getSpeedMultiplier(): number {
    const t = this.elapsedTime / PhysicsConfig.SPEED_RAMP_DURATION
    const curve = 1 - Math.pow(Math.max(0, 1 - t), 2)
    return 1 + curve * (PhysicsConfig.MAX_SPEED_MULTIPLIER - 1)
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
    return PhysicsConfig.BASE_SCROLL_SPEED * this.getSpeedMultiplier()
  }

  getSpawnIntervalMultiplier(): number {
    return 1 / this.getSpeedMultiplier()
  }

  updateProgression(delta: number): void {
    this.elapsedTime += delta
  }

  resetProgression(): void {
    this.elapsedTime = 0
  }

  update(delta: number): void {
    if (this.scrolling) {
      this.worldContainer.position.z += this.getScrollSpeed() * delta
    }
  }

  reset(): void {
    this.worldContainer.position.set(0, 0, 0)
    this.scrolling = false
    this.elapsedTime = 0
  }
}
