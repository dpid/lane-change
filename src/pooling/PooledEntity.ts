export interface PooledEntity {
  readonly active: boolean
  activate(): void
  deactivate(): void
  reset(): void
}
