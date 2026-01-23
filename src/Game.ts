import * as THREE from 'three'
import { MotorcycleController } from './controllers'
import { ItemManager } from './systems/ItemManager'
import { Background } from './systems/Background'
import { Ground } from './systems/Ground'
import { ScrollManager } from './systems/ScrollManager'
import { CameraController } from './systems/CameraController'
import { UI } from './ui/UI'
import { InputManager } from './input/InputManager'
import { PlayerInputProvider } from './input/PlayerInputProvider'
import { InputActionType } from './input/InputAction'
import { AssetLoader } from './loaders'
import { SmokeSystem, VoxelBurstSystem, CelebrationSystem, WindSystem, ScorePopupSystem } from './effects'
import { EnvironmentColors, FogConfig, CameraConfig, PhysicsConfig } from './config'
import { PlayFunManager } from './systems/PlayFunManager'
import { AudioManager } from './audio/AudioManager'

export enum GameState {
  MENU,
  DROPPING,
  PLAYING,
  DYING,
  GAME_OVER
}

const POINTS_PER_OBSTACLE = 1
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
  private celebrationSystem!: CelebrationSystem
  private windSystem!: WindSystem
  private scorePopupSystem!: ScorePopupSystem
  private playFun!: PlayFunManager
  private audioManager!: AudioManager
  private cameraController!: CameraController

  private state: GameState = GameState.MENU
  private score: number = 0
  private invincibilityEndTime: number = 0

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
    this.camera = new THREE.PerspectiveCamera(CameraConfig.FOV, aspect, CameraConfig.NEAR, CameraConfig.FAR)
    this.camera.position.set(0, CameraConfig.BASE_Y, CameraConfig.BASE_Z)
    this.cameraController = new CameraController(this.camera)
    this.cameraController.updateForAspect(aspect)
    this.camera.lookAt(0, CameraConfig.LOOK_AT_Y, 0)

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
      this.cameraController.updateForAspect(aspect)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  async init(): Promise<void> {
    await AssetLoader.getInstance().loadAll()

    this.playFun = new PlayFunManager()
    this.playFun.init()

    this.scrollManager = new ScrollManager()
    this.scene.add(this.scrollManager.worldContainer)

    this.background = new Background(this.scene, this.scrollManager)
    this.ground = new Ground(this.scene, this.scrollManager)
    this.motorcycle = new MotorcycleController(this.scene)
    this.smokeSystem = new SmokeSystem(this.scene)
    this.smokeSystem.setMotorcycle(this.motorcycle.group)
    this.voxelBurstSystem = new VoxelBurstSystem(this.scene)
    this.celebrationSystem = new CelebrationSystem(this.scene)
    this.scorePopupSystem = new ScorePopupSystem(this.scene)
    this.windSystem = new WindSystem(this.scene)
    this.windSystem.setMotorcycle(this.motorcycle.group)
    this.itemManager = new ItemManager(this.scrollManager.worldContainer, this.scrollManager)
    this.itemManager.setSpawnDirection('toward_horizon')
    this.ui = new UI()
    this.ui.setHideScore(this.playFun.isActive())
    this.audioManager = new AudioManager()
    this.ui.setMuteIcon(this.audioManager.isMuted())
    this.inputManager = new InputManager()

    this.motorcycle.on('dropComplete', () => {
      if (this.state === GameState.DROPPING) {
        this.state = GameState.PLAYING
        this.invincibilityEndTime = Date.now() + PhysicsConfig.INVINCIBILITY_DURATION_MS
      }
    })

    this.scrollManager.onStreakComplete(() => {
      if (this.state === GameState.PLAYING) {
        this.motorcycle.triggerWheelie()
        if (this.scrollManager.isAtMaxSpeed()) {
          this.invincibilityEndTime = Date.now() + PhysicsConfig.INVINCIBILITY_DURATION_MS
        }
      }
    })

    this.ui.onPlay(() => this.startGame())
    this.ui.onPlayAgain(() => this.restartGame())
    this.ui.onMuteToggle(() => {
      const newMuted = !this.audioManager.isMuted()
      this.audioManager.setMuted(newMuted)
      this.ui.setMuteIcon(newMuted)
    })

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

  private isInvincible(): boolean {
    return Date.now() < this.invincibilityEndTime
  }

  private startGame(): void {
    this.score = 0
    this.ui.updateScore(0)
    this.ui.showGame()
    this.itemManager.setSpawnDirection('toward_camera')
    this.state = GameState.DROPPING
    this.scrollManager.startScrolling()
    this.motorcycle.dropIn()
    this.audioManager.play()
  }

  private restartGame(): void {
    const containerZ = this.scrollManager.worldContainer.position.z
    this.itemManager.compensateForContainerReset(containerZ)
    this.scrollManager.reset()
    this.ground.reset()
    this.motorcycle.reset()
    this.smokeSystem.reset()
    this.voxelBurstSystem.reset()
    this.celebrationSystem.reset()
    this.scorePopupSystem.reset()
    this.windSystem.reset()
    this.cameraController.reset()
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

    if (this.state === GameState.MENU || this.state === GameState.PLAYING || this.state === GameState.DYING || this.state === GameState.GAME_OVER) {
      this.itemManager.update(delta)
    }

    if (this.state === GameState.PLAYING) {
      const motorcycleBox = this.motorcycle.getBoundingBox()
      const motorcycleZ = this.motorcycle.getPosition().z

      const result = this.itemManager.checkCollisions(motorcycleBox, motorcycleZ)

      if (result.passedItems > 0) {
        const obstaclePoints = result.passedItems * POINTS_PER_OBSTACLE
        this.score += obstaclePoints
        this.ui.updateScore(this.score)
        this.playFun.addPoints(obstaclePoints)
        this.scorePopupSystem.show(this.motorcycle.getPosition(), obstaclePoints, false)
      }

      if (result.scoreItems > 0) {
        let coinPoints = 0
        for (let i = 0; i < result.scoreItems; i++) {
          const singleCoinPoints = this.scrollManager.onCoinCollected()
          coinPoints += singleCoinPoints
          this.scorePopupSystem.show(this.motorcycle.getPosition(), singleCoinPoints, true)
        }
        this.score += coinPoints
        this.ui.updateScore(this.score)
        this.playFun.addPoints(coinPoints)
        for (const pos of result.collectedPositions) {
          this.celebrationSystem.emitBurst(pos)
        }
      }

      if (result.missedCoins > 0) {
        this.scrollManager.onCoinMissed()
      }

      if (result.killed && !this.motorcycle.isDead() && !this.isInvincible()) {
        this.smokeSystem.emitCrashBurst(this.scrollManager.getScrollSpeed())
        this.motorcycle.loseHitpoint(this.scrollManager.getScrollSpeed())

        const worldMatrix = this.motorcycle.triggerVoxelBurst()
        const voxelData = AssetLoader.getInstance().getVoxelData('motorcycle')
        this.voxelBurstSystem.emitBurst(worldMatrix, voxelData, () => {
          if (this.state !== GameState.GAME_OVER) {
            this.state = GameState.GAME_OVER
            this.ui.showGameOver(this.score)
            this.playFun.savePoints(this.score)
          }
        })

        this.scrollManager.stopScrolling()
        this.scrollManager.resetProgression()
        this.itemManager.setSpawnDirection('toward_horizon')
        this.audioManager.fadeOut()
        this.state = GameState.DYING
      }
    }

    if (this.state === GameState.DROPPING || this.state === GameState.PLAYING || this.state === GameState.DYING) {
      this.motorcycle.update(delta, this.scrollManager.getSpeedMultiplier())
      this.cameraController.update(delta, this.motorcycle.group.position.x, this.motorcycle.isWheelieActive())
    }

    if (this.state === GameState.PLAYING) {
      if (this.isInvincible()) {
        const elapsed = Date.now() - (this.invincibilityEndTime - PhysicsConfig.INVINCIBILITY_DURATION_MS)
        const progress = elapsed / PhysicsConfig.INVINCIBILITY_DURATION_MS
        this.motorcycle.updateInvincibilityFlicker(progress, delta)
      } else {
        this.motorcycle.updateInvincibilityFlicker(1, delta)
      }
    }

    const isEmitting = this.state === GameState.PLAYING
    this.smokeSystem.update(delta, isEmitting, this.scrollManager.getScrollSpeed())
    this.celebrationSystem.update(delta)
    this.scorePopupSystem.update(delta)

    if (this.state === GameState.PLAYING && this.motorcycle.isWheelieActive()) {
      this.windSystem.startEffect()
    } else {
      this.windSystem.stopEffect()
    }
    this.windSystem.update(delta)

    if (this.state === GameState.DYING || this.state === GameState.GAME_OVER) {
      this.voxelBurstSystem.update(delta)
    }

    this.renderer.render(this.scene, this.camera)
  }
}
