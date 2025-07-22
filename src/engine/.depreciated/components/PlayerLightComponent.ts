import type * as THREE from 'three'
import { GameObject } from '../core/GameObject'

export interface PlayerLightConfig {
  color: number
  intensity: number
  range: number
  flickerSpeed: number
  flickerIntensity: number
  bobSpeed: number
  bobAmplitude: number
  offset: { x: number; y: number; z: number }
}

/**
 * PlayerLightComponent - Creates a firefly-like light that follows the player
 * Features:
 * - Warm, flickering light similar to fireflies
 * - Gentle bobbing animation for natural movement
 * - Automatic attachment to player object
 * - Vector/realistic mode compatibility
 */
export class PlayerLightComponent extends GameObject {
  private THREE: any
  private scene: THREE.Scene
  private config: PlayerLightConfig
  private playerObject: THREE.Object3D

  // Light components
  private light: THREE.PointLight
  private lightGroup: THREE.Group

  // Animation state
  private animationTime = 0
  private baseIntensity: number
  private flickerOffset: number
  private bobOffset: number

  // Default configuration
  private static readonly DEFAULT_CONFIG: PlayerLightConfig = {
    color: 0xffa366, // Warm firefly orange
    intensity: 6.0, // Bright enough to light the path
    range: 25, // Good coverage around player
    flickerSpeed: 4.0, // Natural firefly flicker
    flickerIntensity: 0.3, // Subtle flickering
    bobSpeed: 2.0, // Gentle bobbing motion
    bobAmplitude: 0.15, // Small vertical movement
    offset: { x: 0, y: 1.2, z: 0 }, // Position above player
  }

  constructor(
    THREE: any,
    scene: THREE.Scene,
    playerObject: THREE.Object3D,
    config: Partial<PlayerLightConfig> = {},
  ) {
    super()
    this.THREE = THREE
    this.scene = scene
    this.playerObject = playerObject
    this.config = { ...PlayerLightComponent.DEFAULT_CONFIG, ...config }

    this.baseIntensity = this.config.intensity
    this.flickerOffset = Math.random() * Math.PI * 2
    this.bobOffset = Math.random() * Math.PI * 2

    // Create light group for organization
    this.lightGroup = new this.THREE.Group()
    this.lightGroup.name = 'player_light_system'

    console.log('💡 PlayerLightComponent created')
  }

  public async initialize(): Promise<void> {
    this.validateNotDisposed()

    if (this.isInitialized) {
      console.warn('PlayerLightComponent already initialized')
      return
    }

    console.log('💡 Initializing PlayerLightComponent...')

    this.createLight()
    this.attachToPlayer()

    this.isInitialized = true
    console.log('✅ PlayerLightComponent initialized')
  }

  private createLight(): void {
    // Always use realistic mode: soft falloff lighting
    this.light = new this.THREE.PointLight(
      this.config.color,
      this.baseIntensity,
      this.config.range,
    )

    this.light.name = 'player_light'
    this.light.position.set(
      this.config.offset.x,
      this.config.offset.y,
      this.config.offset.z,
    )

    // Add light to group
    this.lightGroup.add(this.light)

    console.log('💡 Player light created (realistic mode)')
    console.log('💡 Light details:', {
      color: this.light.color.getHex(),
      intensity: this.light.intensity,
      range: this.light.distance,
      position: this.light.position,
    })
  }

  private attachToPlayer(): void {
    if (!this.playerObject) {
      console.warn('No player object provided - adding light to scene root')
      this.scene.add(this.lightGroup)
      return
    }

    // Attach light group to player
    this.playerObject.add(this.lightGroup)
    console.log('🔗 Player light attached to player object')
  }

  public update(deltaTime: number): void {
    if (!this.isInitialized || !this.light) return

    this.animationTime += deltaTime

    // Flickering animation - similar to fireflies
    const flickerTime =
      this.animationTime * this.config.flickerSpeed + this.flickerOffset
    const flickerMultiplier =
      1.0 + Math.sin(flickerTime) * this.config.flickerIntensity
    this.light.intensity = this.baseIntensity * flickerMultiplier

    // Gentle bobbing motion
    const bobTime = this.animationTime * this.config.bobSpeed + this.bobOffset
    const bobOffset = Math.sin(bobTime) * this.config.bobAmplitude
    this.light.position.y = this.config.offset.y + bobOffset

    // Add subtle horizontal drift for more organic movement
    const driftX = Math.cos(bobTime * 0.7) * 0.05
    const driftZ = Math.sin(bobTime * 0.5) * 0.05
    this.light.position.x = this.config.offset.x + driftX
    this.light.position.z = this.config.offset.z + driftZ
  }

  /**
   * Update the light's configuration at runtime
   */
  public updateConfig(newConfig: Partial<PlayerLightConfig>): void {
    Object.assign(this.config, newConfig)

    if (this.light) {
      this.light.color.setHex(this.config.color)
      this.baseIntensity = this.config.intensity
      this.light.distance = this.config.range
    }

    console.log('🔧 PlayerLightComponent configuration updated')
  }

  /**
   * Set light intensity (for fade in/out effects)
   */
  public setIntensity(intensity: number): void {
    this.baseIntensity = Math.max(0, intensity)
    console.log(`💡 Player light intensity set to: ${this.baseIntensity}`)
  }

  /**
   * Toggle the light on/off
   */
  public setEnabled(enabled: boolean): void {
    if (this.light) {
      this.light.visible = enabled
      console.log(`💡 Player light ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Get current light statistics
   */
  public getStats() {
    return {
      intensity: this.light?.intensity || 0,
      baseIntensity: this.baseIntensity,
      color: this.config.color,
      range: this.config.range,
      animationTime: this.animationTime,
      isEnabled: this.light?.visible || false,
    }
  }

  /**
   * Update the player object this light is attached to
   */
  public setPlayerObject(playerObject: THREE.Object3D | null): void {
    if (this.lightGroup && this.lightGroup.parent) {
      this.lightGroup.parent.remove(this.lightGroup)
    }

    this.playerObject = playerObject

    if (this.isInitialized) {
      this.attachToPlayer()
    }
  }

  public dispose(): void {
    console.log('🧹 Disposing PlayerLightComponent...')

    // Remove light from scene/player
    if (this.lightGroup && this.lightGroup.parent) {
      this.lightGroup.parent.remove(this.lightGroup)
    }

    // Dispose light
    if (this.light) {
      // PointLights don't have geometry/materials to dispose
      this.light = null as any
    }

    // Clear references
    this.lightGroup = null as any
    this.playerObject = null as any

    this.isInitialized = false
    console.log('✅ PlayerLightComponent disposed')
  }
}
