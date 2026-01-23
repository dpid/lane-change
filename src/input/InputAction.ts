export enum InputActionType {
  SWITCH_LANE = 'SWITCH_LANE'
}

export interface InputAction {
  type: InputActionType
  timestamp: number
}

export function createAction(type: InputActionType): InputAction {
  return {
    type,
    timestamp: Date.now()
  }
}
