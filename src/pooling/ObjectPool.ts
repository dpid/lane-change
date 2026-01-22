import type { PooledEntity } from './PooledEntity'

export type PoolFactory<T extends PooledEntity> = () => T

export class ObjectPool<T extends PooledEntity> {
  private pool: T[] = []
  private active: Set<T> = new Set()
  private factory: PoolFactory<T>
  private maxSize: number

  constructor(factory: PoolFactory<T>, initialSize: number = 10, maxSize: number = 0) {
    this.factory = factory
    this.maxSize = maxSize

    for (let i = 0; i < initialSize; i++) {
      const item = this.factory()
      item.deactivate()
      this.pool.push(item)
    }
  }

  acquire(): T | null {
    let item: T

    if (this.pool.length > 0) {
      item = this.pool.pop()!
    } else if (this.maxSize === 0 || this.active.size < this.maxSize) {
      item = this.factory()
    } else {
      return null
    }

    item.reset()
    item.activate()
    this.active.add(item)
    return item
  }

  release(item: T): void {
    if (!this.active.has(item)) return

    item.deactivate()
    this.active.delete(item)
    this.pool.push(item)
  }

  releaseAll(): void {
    this.active.forEach((item) => {
      item.deactivate()
      this.pool.push(item)
    })
    this.active.clear()
  }

  getStats(): { available: number; active: number; total: number } {
    return {
      available: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size
    }
  }

  forEachActive(callback: (item: T) => void): void {
    this.active.forEach(callback)
  }

  getActive(): T[] {
    return Array.from(this.active)
  }

  get activeCount(): number {
    return this.active.size
  }

  get availableCount(): number {
    return this.pool.length
  }
}
