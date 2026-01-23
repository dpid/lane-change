import * as THREE from 'three'
import { PhysicsConfig } from '../config'

export class ScrollManager {
  readonly worldContainer: THREE.Group
  private scrolling: boolean = false
  private coinStreak: number = 0
  private completedBoosts: number = 0
  private onStreakCompleteCallback: (() => void) | null = null

  constructor() {
    this.worldContainer = new THREE.Group()
  }

  onStreakComplete(callback: () => void): void {
    this.onStreakCompleteCallback = callback
  }

  getSpeedMultiplier(): number {
    const progress = this.completedBoosts / PhysicsConfig.STREAKS_TO_MAX_SPEED
    return 1 + progress * (PhysicsConfig.MAX_SPEED_MULTIPLIER - 1)
  }

  isAtMaxSpeed(): boolean {
    return this.completedBoosts >= PhysicsConfig.STREAKS_TO_MAX_SPEED
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

  onCoinCollected(): number {
    this.coinStreak++
    const points = this.coinStreak * PhysicsConfig.BASE_COIN_POINTS

    const completedStreak = this.coinStreak % PhysicsConfig.COINS_PER_BOOST === 0
    if (completedStreak) {
      if (this.completedBoosts < PhysicsConfig.STREAKS_TO_MAX_SPEED) {
        this.completedBoosts++
      }
      this.onStreakCompleteCallback?.()
    }

    return points
  }

  onCoinMissed(): void {
    this.coinStreak = 0
  }

  resetProgression(): void {
    this.coinStreak = 0
    this.completedBoosts = 0
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
    this.completedBoosts = 0
  }
}
