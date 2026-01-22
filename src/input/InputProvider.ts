import type { InputAction } from './InputAction'

export type InputActionCallback = (action: InputAction) => void

export interface InputProvider {
  enable(): void
  disable(): void
  readonly enabled: boolean
  onAction(callback: InputActionCallback): () => void
}
