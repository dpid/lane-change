export enum GeometryType {
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  SEMI_TRUCK = 'SEMI_TRUCK',
  COIN = 'COIN',
  NONE = 'NONE'
}

export enum EffectType {
  KILL = 'kill',
  SCORE = 'score',
  NONE = 'none'
}

export interface ItemDefinition {
  geometryType: GeometryType
  effectType: EffectType
  cardCount: number
  yOffset: number
  collisionModifier: number
  rotates: boolean
}

const RIDER_HEIGHT = 0.8

export const ItemDefinitions: Record<GeometryType, ItemDefinition> = {
  [GeometryType.CAR]: {
    geometryType: GeometryType.CAR,
    effectType: EffectType.KILL,
    cardCount: 50,
    yOffset: 0,
    collisionModifier: -0.1,
    rotates: false
  },
  [GeometryType.TRUCK]: {
    geometryType: GeometryType.TRUCK,
    effectType: EffectType.KILL,
    cardCount: 15,
    yOffset: 0,
    collisionModifier: -0.1,
    rotates: false
  },
  [GeometryType.SEMI_TRUCK]: {
    geometryType: GeometryType.SEMI_TRUCK,
    effectType: EffectType.KILL,
    cardCount: 10,
    yOffset: 0,
    collisionModifier: -0.1,
    rotates: false
  },
  [GeometryType.COIN]: {
    geometryType: GeometryType.COIN,
    effectType: EffectType.SCORE,
    cardCount: 30,
    yOffset: RIDER_HEIGHT,
    collisionModifier: 0.5,
    rotates: true
  },
  [GeometryType.NONE]: {
    geometryType: GeometryType.NONE,
    effectType: EffectType.NONE,
    cardCount: 20,
    yOffset: 0,
    collisionModifier: 0,
    rotates: false
  }
} as const
