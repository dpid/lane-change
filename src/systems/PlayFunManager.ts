import { OGPConfig } from '../config'

declare const OpenGameSDK: new (options: {
  gameId?: string
  baseUrl?: string
  ui?: { usePointsWidget?: boolean; theme?: string }
  logLevel?: number
}) => {
  init(options: { gameId: string }): void
  on(event: string, callback: () => void): void
  addPoints(amount: number): void
  savePoints(score: number): Promise<void>
}

export class PlayFunManager {
  private sdk: ReturnType<typeof OpenGameSDK.prototype.constructor> | null = null
  private ready = false
  private pendingPoints = 0

  init(): void {
    if (typeof OpenGameSDK === 'undefined') {
      console.warn('OpenGameSDK not loaded - integration disabled')
      return
    }

    if (!OGPConfig.GAME_ID) {
      console.warn('GAME_ID not configured - integration disabled')
      return
    }

    this.sdk = new OpenGameSDK({
      gameId: OGPConfig.GAME_ID,
      baseUrl: OGPConfig.BASE_URL,
      ui: {
        usePointsWidget: OGPConfig.USE_POINTS_WIDGET,
        theme: OGPConfig.THEME,
      },
      logLevel: OGPConfig.LOG_LEVEL,
    })

    this.sdk.on('OnReady', () => {
      console.log('OpenGameSDK ready')
      this.ready = true
      if (this.pendingPoints > 0) {
        this.sdk!.addPoints(this.pendingPoints)
        this.pendingPoints = 0
      }
    })

    this.sdk.on('SavePointsSuccess', () => {
      console.log('Points saved successfully')
    })

    this.sdk.on('SavePointsFailed', () => {
      console.log('Failed to save points')
    })

    this.sdk.init({
      gameId: OGPConfig.GAME_ID,
    })
  }

  addPoints(points: number): void {
    if (!this.sdk) return

    if (this.ready) {
      this.sdk.addPoints(points)
    } else {
      this.pendingPoints += points
    }
  }

  savePoints(score: number): void {
    if (!this.sdk || !this.ready || score <= 0) return
    this.sdk.savePoints(score)
  }
}
