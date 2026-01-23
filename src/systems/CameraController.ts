import * as THREE from 'three'
import { CameraConfig } from '../config'
import { smoothstep } from '../utils/easing'

export class CameraController {
  private camera: THREE.PerspectiveCamera
  private velocityX: number = 0
  private baseZ: number = CameraConfig.BASE_Z
  private zoomProgress: number = 0
  private zoomDelayTimer: number = 0
  private wasWheelieActive: boolean = false

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
  }

  updateForAspect(aspect: number): void {
    const fovRadians = (CameraConfig.FOV * Math.PI) / 180
    const halfFovTan = Math.tan(fovRadians / 2)
    const horizontalHalfFovTan = halfFovTan * aspect

    const requiredZ = CameraConfig.MIN_VISIBLE_HALF_WIDTH / horizontalHalfFovTan
    this.baseZ = Math.max(requiredZ, CameraConfig.BASE_Z)

    const easedZoom = smoothstep(this.zoomProgress)
    this.camera.position.z = this.baseZ - CameraConfig.ZOOM_IN_AMOUNT * easedZoom
  }

  update(delta: number, targetX: number, wheelieActive: boolean): void {
    const displacement = targetX - this.camera.position.x

    const springForce = CameraConfig.SPRING_STIFFNESS * displacement
    const dampingForce = CameraConfig.SPRING_DAMPING * this.velocityX

    this.velocityX += (springForce - dampingForce) * delta
    this.camera.position.x += this.velocityX * delta
    this.camera.lookAt(this.camera.position.x, CameraConfig.LOOK_AT_Y, 0)

    if (wheelieActive && !this.wasWheelieActive) {
      this.zoomDelayTimer = 0
    }

    if (!wheelieActive && this.wasWheelieActive) {
      this.zoomDelayTimer = CameraConfig.ZOOM_OUT_DELAY
    }

    this.wasWheelieActive = wheelieActive

    if (wheelieActive) {
      this.zoomProgress = Math.min(1, this.zoomProgress + delta / CameraConfig.ZOOM_IN_DURATION)
    } else if (this.zoomDelayTimer > 0) {
      this.zoomDelayTimer -= delta
    } else if (this.zoomProgress > 0) {
      this.zoomProgress = Math.max(0, this.zoomProgress - delta / CameraConfig.ZOOM_OUT_DURATION)
    }

    const easedZoom = smoothstep(this.zoomProgress)
    this.camera.position.z = this.baseZ - CameraConfig.ZOOM_IN_AMOUNT * easedZoom
  }

  reset(): void {
    this.camera.position.x = 0
    this.camera.lookAt(0, CameraConfig.LOOK_AT_Y, 0)
    this.velocityX = 0
    this.zoomProgress = 0
    this.zoomDelayTimer = 0
    this.wasWheelieActive = false
    this.camera.position.z = this.baseZ
  }

  getBaseZ(): number {
    return this.baseZ
  }
}
