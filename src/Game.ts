import * as THREE from 'three'
import { MotorcycleController } from './controllers'
import { ItemManager } from './systems/ItemManager'
import { Background } from './systems/Background'
import { Ground } from './systems/Ground'
import { ScrollManager } from './systems/ScrollManager'
import { UI } from './ui/UI'
import { InputManager } from './input/InputManager'
import { PlayerInputProvider } from './input/PlayerInputProvider'
import { InputActionType } from './input/InputAction'
import { AssetLoader } from './loaders'
import { SmokeSystem, VoxelBurstSystem } from './effects'
import { EnvironmentColors, FogConfig } from './config'
import { PlayFunManager } from './systems/PlayFunManager'

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
  private itemManager!: ItemManager
  private background!: Background
  private ground!: Ground
  private scrollManager!: ScrollManager
  private ui!: UI
  private inputManager!: InputManager
  private smokeSystem!: SmokeSystem
  private voxelBurstSystem!: VoxelBurstSystem
  private playFun!: PlayFunManager

  private state: GameState = GameState.MENU
  private score: number = 0

  constructor() {
    const canvas = document.getElementById('game') as HTMLCanvasElement
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas || undefined,
      antialias: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(EnvironmentColors.fog)

    if (!canvas) {
      document.body.appendChild(this.renderer.domElement)
    }

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(EnvironmentColors.fog, FogConfig.near, FogConfig.far)

    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000)
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

  async init(): Promise<void> {
    await AssetLoader.getInstance().loadAll()

    this.playFun = new PlayFunManager()
    const gameId = import.meta.env.VITE_PLAYFUN_GAME_ID
    if (gameId) {
      await this.playFun.init(gameId)
    }

    this.scrollManager = new ScrollManager()
    this.scene.add(this.scrollManager.worldContainer)

    this.background = new Background(this.scene, this.scrollManager)
    this.ground = new Ground(this.scene, this.scrollManager)
    this.motorcycle = new MotorcycleController(this.scene)
    this.smokeSystem = new SmokeSystem(this.scene)
    this.smokeSystem.setMotorcycle(this.motorcycle.group)
    this.voxelBurstSystem = new VoxelBurstSystem(this.scene)
    this.itemManager = new ItemManager(this.scrollManager.worldContainer, this.scrollManager)
    this.ui = new UI()
    this.inputManager = new InputManager()

    this.motorcycle.on('dropComplete', () => {
      if (this.state === GameState.DROPPING) {
        this.state = GameState.PLAYING
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
    this.scrollManager.startScrolling()
    this.motorcycle.dropIn()
  }

  private restartGame(): void {
    this.scrollManager.reset()
    this.ground.reset()
    this.itemManager.reset()
    this.motorcycle.reset()
    this.smokeSystem.reset()
    this.voxelBurstSystem.reset()
    this.startGame()
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)

    let delta = this.clock.getDelta()
    if (delta > MAX_DELTA) {
      delta = MAX_DELTA
    }

    if (this.state === GameState.DROPPING || this.state === GameState.PLAYING) {
      this.scrollManager.update(delta)
      this.background.update(delta)
      this.ground.update(delta)
    }

    if (this.state === GameState.PLAYING || this.state === GameState.DYING || this.state === GameState.GAME_OVER) {
      this.itemManager.update(delta)
    }

    if (this.state === GameState.PLAYING) {
      this.scrollManager.updateProgression(delta)

      const motorcycleBox = this.motorcycle.getBoundingBox()
      const currentLane = this.motorcycle.getCurrentLane()
      const motorcycleZ = this.motorcycle.getPosition().z

      const result = this.itemManager.checkCollisions(motorcycleBox, currentLane, motorcycleZ)

      if (result.passedItems > 0) {
        const obstaclePoints = result.passedItems * POINTS_PER_OBSTACLE
        this.score += obstaclePoints
        this.ui.updateScore(this.score)
        this.playFun.addPoints(obstaclePoints)
      }

      if (result.scoreItems > 0) {
        const coinPoints = result.scoreItems * POINTS_PER_COIN
        this.score += coinPoints
        this.ui.updateScore(this.score)
        this.playFun.addPoints(coinPoints)
      }

      if (result.killed && !this.motorcycle.isDead()) {
        this.smokeSystem.emitCrashBurst(this.scrollManager.getScrollSpeed())
        this.motorcycle.loseHitpoint(this.scrollManager.getScrollSpeed())

        const worldMatrix = this.motorcycle.triggerVoxelBurst()
        const voxelData = AssetLoader.getInstance().getVoxelData('motorcycle')
        this.voxelBurstSystem.emitBurst(worldMatrix, voxelData, () => {
          if (this.state !== GameState.GAME_OVER) {
            this.state = GameState.GAME_OVER
            this.ui.showGameOver(this.score)
            this.playFun.savePoints()
          }
        })

        this.scrollManager.stopScrolling()
        this.scrollManager.resetProgression()
        this.itemManager.setSpawnDirection('toward_horizon')
        this.state = GameState.DYING
      }
    }

    if (this.state === GameState.DROPPING || this.state === GameState.PLAYING || this.state === GameState.DYING) {
      this.motorcycle.update(delta, this.scrollManager.getSpeedMultiplier())
    }

    const isEmitting = this.state === GameState.PLAYING
    this.smokeSystem.update(delta, isEmitting, this.scrollManager.getScrollSpeed())

    if (this.state === GameState.DYING || this.state === GameState.GAME_OVER) {
      this.voxelBurstSystem.update(delta)
    }

    this.renderer.render(this.scene, this.camera)
  }
}
