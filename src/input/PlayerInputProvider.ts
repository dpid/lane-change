import type { InputProvider, InputActionCallback } from './InputProvider'
import { InputActionType, createAction } from './InputAction'

const DEBOUNCE_WINDOW_MS = 50

export class PlayerInputProvider implements InputProvider {
  private _enabled: boolean = false
  private callbacks: Set<InputActionCallback> = new Set()
  private lastActionTime: number = 0

  private handleClick: () => void
  private handleTouchStart: (e: TouchEvent) => void
  private handleKeyDown: (e: KeyboardEvent) => void

  constructor() {
    this.handleClick = () => this.emitSwitchLane()
    this.handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      this.emitSwitchLane()
    }
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        this.emitSwitchLane()
      } else if (e.code === 'Enter') {
        e.preventDefault()
        this.emitStart()
      }
    }
  }

  get enabled(): boolean {
    return this._enabled
  }

  enable(): void {
    if (this._enabled) return
    this._enabled = true

    window.addEventListener('click', this.handleClick)
    window.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
  }

  disable(): void {
    if (!this._enabled) return
    this._enabled = false

    window.removeEventListener('click', this.handleClick)
    window.removeEventListener('touchstart', this.handleTouchStart)
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  onAction(callback: InputActionCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  private emitSwitchLane(): void {
    if (!this.shouldEmit()) return

    const action = createAction(InputActionType.SWITCH_LANE)
    this.callbacks.forEach((callback) => callback(action))
  }

  private emitStart(): void {
    if (!this.shouldEmit()) return

    const action = createAction(InputActionType.START)
    this.callbacks.forEach((callback) => callback(action))
  }

  private shouldEmit(): boolean {
    const now = Date.now()
    if (now - this.lastActionTime < DEBOUNCE_WINDOW_MS) {
      return false
    }
    this.lastActionTime = now
    return true
  }

  dispose(): void {
    this.disable()
    this.callbacks.clear()
  }
}
