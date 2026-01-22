export enum InputActionType {
  SWITCH_LANE = 'SWITCH_LANE',
  START = 'START',
  RESTART = 'RESTART'
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
