import * as THREE from 'three'
import type { InputAction } from '../input/InputAction'

export interface LostGeometryData {
  geometry: THREE.Group
  worldPosition: THREE.Vector3
  worldQuaternion: THREE.Quaternion
}

export enum CharacterState {
  IDLE = 'IDLE',
  DROPPING = 'DROPPING',
  RUNNING = 'RUNNING',
  JUMPING = 'JUMPING',
  DYING = 'DYING'
}

export type CharacterEvent = 'dropComplete' | 'land' | 'dieComplete' | 'loseGeometry'

export type CharacterEventCallback = (data?: unknown) => void

export interface CharacterController {
  readonly state: CharacterState
  readonly group: THREE.Group

  handleAction(action: InputAction): void
  spawn(): void
  dropIn(): void
  update(delta: number): void
  getBoundingBox(): THREE.Box3
  on(event: CharacterEvent, callback: CharacterEventCallback): () => void
  off(event: CharacterEvent, callback: CharacterEventCallback): void
  loseHitpoint(scrollSpeed: number): void
  isDead(): boolean
  jumpSuccess(): void
}

export class CharacterEventEmitter {
  private listeners: Map<CharacterEvent, Set<CharacterEventCallback>> = new Map()

  on(event: CharacterEvent, callback: CharacterEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => this.off(event, callback)
  }

  off(event: CharacterEvent, callback: CharacterEventCallback): void {
    this.listeners.get(event)?.delete(callback)
  }

  protected emit(event: CharacterEvent, data?: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data))
  }
}
