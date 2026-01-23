type Screen = 'menu' | 'game' | 'gameOver'

export class UI {
  private menuElement: HTMLElement
  private scoreElement: HTMLElement
  private gameOverElement: HTMLElement
  private finalScoreElement: HTMLElement
  private muteBtn: HTMLElement
  private soundOnPath: HTMLElement
  private soundOffPath: HTMLElement
  private currentScreen: Screen = 'menu'
  private playCallback: (() => void) | null = null
  private playAgainCallback: (() => void) | null = null
  private hideScore = false

  constructor() {
    this.menuElement = document.getElementById('menu')!
    this.scoreElement = document.getElementById('score')!
    this.gameOverElement = document.getElementById('gameOver')!
    this.finalScoreElement = document.getElementById('finalScore')!
    this.muteBtn = document.getElementById('muteBtn')!
    this.soundOnPath = document.getElementById('soundOn')!
    this.soundOffPath = document.getElementById('soundOff')!

    window.addEventListener('keydown', this.handleKeydown)
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.code !== 'Space') return

    if (this.currentScreen === 'menu' && this.playCallback) {
      e.preventDefault()
      this.playCallback()
    } else if (this.currentScreen === 'gameOver' && this.playAgainCallback) {
      e.preventDefault()
      this.playAgainCallback()
    }
  }

  private handleTouch = (callback: () => void) => (e: TouchEvent): void => {
    e.preventDefault()
    callback()
  }

  setHideScore(hide: boolean): void {
    this.hideScore = hide
  }

  showMenu(): void {
    this.currentScreen = 'menu'
    this.menuElement.style.display = 'block'
    this.scoreElement.style.display = 'none'
    this.gameOverElement.style.display = 'none'
  }

  showGame(): void {
    this.currentScreen = 'game'
    this.menuElement.style.display = 'none'
    this.scoreElement.style.display = this.hideScore ? 'none' : 'block'
    this.gameOverElement.style.display = 'none'
  }

  showGameOver(finalScore: number): void {
    this.currentScreen = 'gameOver'
    this.menuElement.style.display = 'none'
    this.scoreElement.style.display = 'none'
    this.gameOverElement.style.display = 'flex'
    this.finalScoreElement.textContent = `Score: ${finalScore}`
  }

  updateScore(score: number): void {
    this.scoreElement.textContent = `Score: ${score}`
  }

  onPlay(callback: () => void): void {
    this.playCallback = callback
    this.menuElement.addEventListener('click', callback)
    this.menuElement.addEventListener('touchend', this.handleTouch(callback), { passive: false })
  }

  onPlayAgain(callback: () => void): void {
    this.playAgainCallback = callback
    this.gameOverElement.addEventListener('click', callback)
    this.gameOverElement.addEventListener('touchend', this.handleTouch(callback), { passive: false })
  }

  onMuteToggle(callback: () => void): void {
    this.muteBtn.addEventListener('click', callback)
    this.muteBtn.addEventListener('touchend', this.handleTouch(callback), { passive: false })
  }

  setMuteIcon(muted: boolean): void {
    this.soundOnPath.style.display = muted ? 'none' : 'block'
    this.soundOffPath.style.display = muted ? 'block' : 'none'
  }
}
