import * as THREE from 'three'
import { MotorcycleController } from './controllers'
import { ObstacleManager } from './systems/ObstacleManager'
import { PowerupManager } from './systems/PowerupManager'
import { Background } from './systems/Background'
import { Ground } from './systems/Ground'
import { UI } from './ui/UI'
import { InputManager } from './input/InputManager'
import { PlayerInputProvider } from './input/PlayerInputProvider'
import { PhysicsConfig } from './config'
import { InputActionType } from './input/InputAction'

export enum GameState {
  MENU,
  DROPPING,
  PLAYING,
  DYING,
  GAME_OVER
}

const POINTS_PER_OBSTACLE = 1
const POINTS_PER_COIN = 5
const MAX_DELTA = 0.1

export class Game {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private clock: THREE.Clock

  private motorcycle!: MotorcycleController
  private obstacleManager!: ObstacleManager
  private powerupManager!: PowerupManager
  private background!: Background
  private ground!: Ground
  private ui!: UI
  private inputManager!: InputManager

  private state: GameState = GameState.MENU
  private score: number = 0
  private scrollSpeed: number = PhysicsConfig.SCROLL_SPEED

  constructor() {
    const canvas = document.getElementById('game') as HTMLCanvasElement
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas || undefined,
      antialias: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x87ceeb)

    if (!canvas) {
      document.body.appendChild(this.renderer.domElement)
    }

    this.scene = new THREE.Scene()

    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
    this.camera.position.set(0, 3, 8)
    this.camera.lookAt(0, 1, 0)

    this.clock = new THREE.Clock()

    this.setupLighting()
    this.setupResizeHandler()
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      const aspect = window.innerWidth / window.innerHeight
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  init(): void {
    this.background = new Background(this.scene)
    this.ground = new Ground(this.scene)
    this.motorcycle = new MotorcycleController(this.scene)
    this.obstacleManager = new ObstacleManager(this.scene)
    this.powerupManager = new PowerupManager(this.scene)
    this.ui = new UI()
    this.inputManager = new InputManager()

    this.motorcycle.on('dropComplete', () => {
      if (this.state === GameState.DROPPING) {
        this.state = GameState.PLAYING
      }
    })

    this.motorcycle.on('dieComplete', () => {
      if (this.state !== GameState.GAME_OVER) {
        this.state = GameState.GAME_OVER
        this.ui.showGameOver(this.score)
      }
    })

    this.ui.onPlay(() => this.startGame())
    this.ui.onPlayAgain(() => this.restartGame())

    this.setupInput()
    this.animate()
  }

  private setupInput(): void {
    const playerInput = new PlayerInputProvider()
    this.inputManager.addProvider(playerInput)
    playerInput.enable()

    this.inputManager.onAction((action) => {
      if (action.type === InputActionType.SWITCH_LANE && this.state === GameState.PLAYING) {
        this.motorcycle.handleAction(action)
      }
    })
  }

  private startGame(): void {
    this.score = 0
    this.ui.updateScore(0)
    this.ui.showGame()
    this.state = GameState.DROPPING
    this.motorcycle.dropIn()
  }

  private restartGame(): void {
    this.obstacleManager.reset()
    this.powerupManager.reset()
    this.motorcycle.reset()
    this.startGame()
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)

    let delta = this.clock.getDelta()
    if (delta > MAX_DELTA) {
      delta = MAX_DELTA
    }

    if (this.state === GameState.PLAYING) {
      this.background.update(delta, this.scrollSpeed)
      this.ground.update(delta, this.scrollSpeed)
    }

    const obstacleScrollSpeed = this.scrollSpeed * PhysicsConfig.OBSTACLE_SCROLL_FACTOR

    if (this.state === GameState.PLAYING || this.state === GameState.DYING || this.state === GameState.GAME_OVER) {
      this.obstacleManager.update(delta, obstacleScrollSpeed)
      this.powerupManager.update(delta, obstacleScrollSpeed)
    }

    if (this.state === GameState.PLAYING) {
      const motorcycleBox = this.motorcycle.getBoundingBox()
      const currentLane = this.motorcycle.getCurrentLane()

      const passedObstacles = this.obstacleManager.getPassedObstacles(this.motorcycle.getPosition().z)
      if (passedObstacles > 0) {
        this.score += passedObstacles * POINTS_PER_OBSTACLE
        this.ui.updateScore(this.score)
      }

      const collectedCoins = this.powerupManager.checkCollection(motorcycleBox, currentLane)
      if (collectedCoins > 0) {
        this.score += collectedCoins * POINTS_PER_COIN
        this.ui.updateScore(this.score)
      }

      const hasCollision = this.obstacleManager.checkCollision(motorcycleBox, currentLane)
      if (hasCollision && !this.motorcycle.isDead()) {
        this.motorcycle.loseHitpoint(this.scrollSpeed)
        this.state = GameState.DYING
      }
    }

    if (this.state === GameState.DROPPING || this.state === GameState.PLAYING || this.state === GameState.DYING) {
      this.motorcycle.update(delta)
    }

    this.renderer.render(this.scene, this.camera)
  }
}
