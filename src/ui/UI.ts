type Screen = 'menu' | 'game' | 'gameOver'

export class UI {
  private menuElement: HTMLElement
  private scoreElement: HTMLElement
  private gameOverElement: HTMLElement
  private finalScoreElement: HTMLElement
  private currentScreen: Screen = 'menu'
  private playCallback: (() => void) | null = null
  private playAgainCallback: (() => void) | null = null
  private hideScore = false

  constructor() {
    this.menuElement = document.getElementById('menu')!
    this.scoreElement = document.getElementById('score')!
    this.gameOverElement = document.getElementById('gameOver')!
    this.finalScoreElement = document.getElementById('finalScore')!

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
    this.menuElement.addEventListener('touchstart', this.handleTouch(callback), { passive: false })
  }

  onPlayAgain(callback: () => void): void {
    this.playAgainCallback = callback
    this.gameOverElement.addEventListener('click', callback)
    this.gameOverElement.addEventListener('touchstart', this.handleTouch(callback), { passive: false })
  }
}
