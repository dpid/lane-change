export class UI {
  private menuElement: HTMLElement
  private scoreElement: HTMLElement
  private gameOverElement: HTMLElement
  private finalScoreElement: HTMLElement

  constructor() {
    this.menuElement = document.getElementById('menu')!
    this.scoreElement = document.getElementById('score')!
    this.gameOverElement = document.getElementById('gameOver')!
    this.finalScoreElement = document.getElementById('finalScore')!
  }

  showMenu(): void {
    this.menuElement.style.display = 'block'
    this.scoreElement.style.display = 'none'
    this.gameOverElement.style.display = 'none'
  }

  showGame(): void {
    this.menuElement.style.display = 'none'
    this.scoreElement.style.display = 'block'
    this.gameOverElement.style.display = 'none'
  }

  showGameOver(finalScore: number): void {
    this.menuElement.style.display = 'none'
    this.scoreElement.style.display = 'none'
    this.gameOverElement.style.display = 'block'
    this.finalScoreElement.textContent = `Score: ${finalScore}`
  }

  updateScore(score: number): void {
    this.scoreElement.textContent = `Score: ${score}`
  }

  onPlay(callback: () => void): void {
    const playBtn = document.getElementById('playBtn')!
    playBtn.addEventListener('click', callback)
  }

  onPlayAgain(callback: () => void): void {
    const playAgainBtn = document.getElementById('playAgainBtn')!
    playAgainBtn.addEventListener('click', callback)
  }
}
