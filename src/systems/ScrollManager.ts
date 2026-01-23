import * as THREE from 'three'
import { PhysicsConfig } from '../config'

export class ScrollManager {
  readonly worldContainer: THREE.Group
  private scrolling: boolean = false
  private coinStreak: number = 0
  private completedStreaks: number = 0

  constructor() {
    this.worldContainer = new THREE.Group()
  }

  getSpeedMultiplier(): number {
    const progress = this.completedStreaks / PhysicsConfig.STREAKS_TO_MAX_SPEED
    return 1 + progress * (PhysicsConfig.MAX_SPEED_MULTIPLIER - 1)
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

  onCoinCollected(): void {
    this.coinStreak++
    if (this.coinStreak >= PhysicsConfig.COINS_PER_STREAK) {
      if (this.completedStreaks < PhysicsConfig.STREAKS_TO_MAX_SPEED) {
        this.completedStreaks++
      }
      this.coinStreak = 0
    }
  }

  onCoinMissed(): void {
    this.coinStreak = 0
  }

  resetProgression(): void {
    this.coinStreak = 0
    this.completedStreaks = 0
  }

  update(delta: number): void {
    if (this.scrolling) {
      this.worldContainer.position.z += this.getScrollSpeed() * delta
    }
  }

  reset(): void {
    this.worldContainer.position.set(0, 0, 0)
    this.scrolling = false
    this.coinStreak = 0
    this.completedStreaks = 0
  }
}
