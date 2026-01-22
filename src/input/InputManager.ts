import type { InputProvider, InputActionCallback } from './InputProvider'
import type { InputAction } from './InputAction'

export class InputManager {
  private providers: InputProvider[] = []
  private handlers: Set<InputActionCallback> = new Set()
  private unsubscribers: Map<InputProvider, () => void> = new Map()

  addProvider(provider: InputProvider): void {
    if (this.providers.includes(provider)) return

    this.providers.push(provider)
    const unsubscribe = provider.onAction((action) => this.handleAction(action))
    this.unsubscribers.set(provider, unsubscribe)
  }

  removeProvider(provider: InputProvider): void {
    const index = this.providers.indexOf(provider)
    if (index === -1) return

    this.providers.splice(index, 1)
    const unsubscribe = this.unsubscribers.get(provider)
    if (unsubscribe) {
      unsubscribe()
      this.unsubscribers.delete(provider)
    }
  }

  onAction(handler: InputActionCallback): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  enableAll(): void {
    this.providers.forEach((provider) => provider.enable())
  }

  disableAll(): void {
    this.providers.forEach((provider) => provider.disable())
  }

  private handleAction(action: InputAction): void {
    this.handlers.forEach((handler) => handler(action))
  }

  dispose(): void {
    this.disableAll()
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers.clear()
    this.providers = []
    this.handlers.clear()
  }
}
