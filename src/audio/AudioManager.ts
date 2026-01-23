import { AudioConfig } from '../config'

export class AudioManager {
  private audio: HTMLAudioElement
  private fadeInterval: number | null = null
  private _muted: boolean

  constructor() {
    this.audio = new Audio('./soundtrack.mp3')
    this.audio.loop = true
    this.audio.preload = 'auto'
    this._muted = localStorage.getItem(AudioConfig.STORAGE_KEY) === 'true'
    this.audio.muted = this._muted
  }

  play(): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }

    this.audio.currentTime = 0
    this.audio.volume = 1

    const playPromise = this.audio.play()
    if (playPromise) {
      playPromise.catch(() => {})
    }
  }

  fadeOut(duration = 1000): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval)
    }

    const steps = duration / AudioConfig.FADE_INTERVAL_MS
    const volumeStep = this.audio.volume / steps

    this.fadeInterval = window.setInterval(() => {
      const newVolume = this.audio.volume - volumeStep
      if (newVolume <= 0) {
        this.audio.volume = 0
        this.audio.pause()
        if (this.fadeInterval !== null) {
          clearInterval(this.fadeInterval)
          this.fadeInterval = null
        }
      } else {
        this.audio.volume = newVolume
      }
    }, AudioConfig.FADE_INTERVAL_MS)
  }

  setMuted(muted: boolean): void {
    this._muted = muted
    this.audio.muted = muted
    localStorage.setItem(AudioConfig.STORAGE_KEY, String(muted))
  }

  isMuted(): boolean {
    return this._muted
  }
}
