import { SpawnConfig } from '../config'

export function shouldDespawn(worldZ: number): boolean {
  return worldZ > SpawnConfig.NEAR_BOUND_Z
}

export function getLocalSpawnZ(containerZ: number): number {
  return SpawnConfig.FAR_BOUND_Z - containerZ
}

export function getWorldZ(localZ: number, containerZ: number): number {
  return localZ + containerZ
}
