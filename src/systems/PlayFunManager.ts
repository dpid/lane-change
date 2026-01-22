type SDKConstructor = new (config: PlayFunConfig) => PlayFunSDKInstance

declare global {
  interface Window {
    PlayFunSDK?: SDKConstructor
    OpenGameSDK?: SDKConstructor
  }
}

interface PlayFunConfig {
  gameId: string
  ui?: {
    usePointsWidget?: boolean
  }
}

interface PlayFunSDKInstance {
  init(): Promise<void>
  addPoints(points: number): void
  savePoints(): Promise<void>
  on(event: 'OnReady' | 'pointsSynced' | 'error', callback: (data?: unknown) => void): void
}

export class PlayFunManager {
  private sdk: PlayFunSDKInstance | null = null
  private ready: boolean = false
  private pendingPoints: number = 0

  async init(gameId: string): Promise<void> {
    const SDK = window.PlayFunSDK || window.OpenGameSDK
    if (!SDK) {
      console.warn('Play.fun SDK not loaded - integration disabled')
      return
    }

    this.sdk = new SDK({
      gameId,
      ui: { usePointsWidget: true }
    })

    this.sdk.on('OnReady', () => {
      this.ready = true
      if (this.pendingPoints > 0) {
        this.sdk!.addPoints(this.pendingPoints)
        this.pendingPoints = 0
      }
    })

    this.sdk.on('pointsSynced', (total) => {
      console.log('Play.fun points synced:', total)
    })

    this.sdk.on('error', (error) => {
      console.error('Play.fun SDK error:', error)
    })

    await this.sdk.init()
  }

  addPoints(points: number): void {
    if (!this.sdk) return

    if (this.ready) {
      this.sdk.addPoints(points)
    } else {
      this.pendingPoints += points
    }
  }

  async savePoints(): Promise<void> {
    if (!this.sdk || !this.ready) return
    await this.sdk.savePoints()
  }
}
