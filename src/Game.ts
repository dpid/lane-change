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
import { SmokeSystem, VoxelBurstSystem, CelebrationSystem, WindSystem } from './effects'
import { EnvironmentColors, FogConfig, CameraConfig } from './config'
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
  private celebrationSystem!: CelebrationSystem
  private windSystem!: WindSystem
  private playFun!: PlayFunManager
  private audioManager!: AudioManager

  private state: GameState = GameState.MENU
  private score: number = 0
  private cameraVelocityX: number = 0
  private cameraBaseZ: number = CameraConfig.BASE_Z
  private cameraZoomProgress: number = 0
  private cameraZoomDelayTimer: number = 0
  private wasWheelieActive: boolean = false

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
    this.updateCameraForAspect(aspect)
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
      this.updateCameraForAspect(aspect)
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  private updateCameraForAspect(aspect: number): void {
    const fovRadians = (CameraConfig.FOV * Math.PI) / 180
    const halfFovTan = Math.tan(fovRadians / 2)
    const horizontalHalfFovTan = halfFovTan * aspect

    const requiredZ = CameraConfig.MIN_VISIBLE_HALF_WIDTH / horizontalHalfFovTan
    this.cameraBaseZ = Math.max(requiredZ, CameraConfig.BASE_Z)

    const p = this.cameraZoomProgress
    const easedZoom = p * p * (3 - 2 * p)
    this.camera.position.z = this.cameraBaseZ - CameraConfig.ZOOM_IN_AMOUNT * easedZoom
  }

  private updateCamera(delta: number): void {
    const targetX = this.motorcycle.group.position.x
    const displacement = targetX - this.camera.position.x

    const springForce = CameraConfig.SPRING_STIFFNESS * displacement
    const dampingForce = CameraConfig.SPRING_DAMPING * this.cameraVelocityX

    this.cameraVelocityX += (springForce - dampingForce) * delta
    this.camera.position.x += this.cameraVelocityX * delta
    this.camera.lookAt(this.camera.position.x, CameraConfig.LOOK_AT_Y, 0)

    const wheelieActive = this.motorcycle.isWheelieActive()

    if (wheelieActive && !this.wasWheelieActive) {
      this.cameraZoomDelayTimer = 0
    }

    if (!wheelieActive && this.wasWheelieActive) {
      this.cameraZoomDelayTimer = CameraConfig.ZOOM_OUT_DELAY
    }

    this.wasWheelieActive = wheelieActive

    if (wheelieActive) {
      this.cameraZoomProgress = Math.min(1, this.cameraZoomProgress + delta / CameraConfig.ZOOM_IN_DURATION)
    } else if (this.cameraZoomDelayTimer > 0) {
      this.cameraZoomDelayTimer -= delta
    } else if (this.cameraZoomProgress > 0) {
      this.cameraZoomProgress = Math.max(0, this.cameraZoomProgress - delta / CameraConfig.ZOOM_OUT_DURATION)
    }

    const p = this.cameraZoomProgress
    const easedZoom = p * p * (3 - 2 * p)
    this.camera.position.z = this.cameraBaseZ - CameraConfig.ZOOM_IN_AMOUNT * easedZoom
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
      }
    })

    this.scrollManager.onStreakComplete(() => {
      if (this.state === GameState.PLAYING) {
        this.motorcycle.triggerWheelie()
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
    this.scrollManager.reset()
    this.ground.reset()
    this.itemManager.reset()
    this.motorcycle.reset()
    this.smokeSystem.reset()
    this.voxelBurstSystem.reset()
    this.celebrationSystem.reset()
    this.windSystem.reset()
    this.camera.position.x = 0
    this.camera.lookAt(0, CameraConfig.LOOK_AT_Y, 0)
    this.cameraVelocityX = 0
    this.cameraZoomProgress = 0
    this.cameraZoomDelayTimer = 0
    this.wasWheelieActive = false
    this.camera.position.z = this.cameraBaseZ
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
        for (let i = 0; i < result.scoreItems; i++) {
          this.scrollManager.onCoinCollected()
        }
        const coinPoints = result.scoreItems * POINTS_PER_COIN
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

      if (result.killed && !this.motorcycle.isDead()) {
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
      this.updateCamera(delta)
    }

    const isEmitting = this.state === GameState.PLAYING
    this.smokeSystem.update(delta, isEmitting, this.scrollManager.getScrollSpeed())
    this.celebrationSystem.update(delta)

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
