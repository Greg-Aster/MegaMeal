import * as THREE from 'three'
import type { EventBus } from '../core/EventBus'
import {
  OptimizationLevel,
  OptimizationManager,
} from '../optimization/OptimizationManager'
import { OceanSystem } from './OceanSystem'
import type { OceanConfig } from './OceanSystem'

/**
 * Global environmental effects system that handles immersive environmental feedback
 * including underwater detection, visual effects, and atmospheric changes.
 *
 * Integrates with the existing engine architecture and optimization systems.
 */

export interface WaterSource {
  id: string
  mesh: THREE.Mesh
  getCurrentLevel(): number
  isActive: boolean
}

export interface UnderwaterEffectConfig {
  visualTint: number
  tintOpacity: number
  fogDensity: number
  movementMultiplier: number
  audioFilter: boolean
  bubbleEffects: boolean
}

export interface EnvironmentalState {
  isUnderwater: boolean
  waterDepth: number
  currentWaterSource: string | null
  effectsActive: boolean
}

export interface WaterConfiguration {
  id: string
  oceanConfig: Partial<OceanConfig>
  dynamics?: {
    enableRising: boolean
    initialLevel: number
    targetLevel: number
    riseRate: number
  }
}

export class EnvironmentalEffectsSystem {
  private static instance: EnvironmentalEffectsSystem | null = null

  private camera: THREE.Camera | null = null
  private scene: THREE.Scene | null = null
  private eventBus: EventBus

  // Water sources management
  private registeredWaterSources: Map<string, WaterSource> = new Map()

  // Global water management
  private managedOceans: Map<string, OceanSystem> = new Map()
  private waterConfigurations: Map<string, WaterConfiguration> = new Map()

  // Underwater effect state
  private currentState: EnvironmentalState = {
    isUnderwater: false,
    waterDepth: 0,
    currentWaterSource: null,
    effectsActive: true,
  }

  // Effect configuration
  private underwaterConfig: UnderwaterEffectConfig = {
    visualTint: 0x006994, // Deep ocean blue
    tintOpacity: 0.3,
    fogDensity: 0.02,
    movementMultiplier: 0.6, // Slower movement underwater
    audioFilter: true,
    bubbleEffects: false, // Disabled for performance by default
  }

  // Visual effects
  private underwaterOverlay: HTMLElement | null = null
  private originalFog: THREE.Fog | null = null
  private underwaterFog: THREE.Fog | null = null

  // Performance optimization
  private checkInterval = 100 // Check every 100ms
  private lastCheck = 0
  private optimizationLevel: OptimizationLevel = OptimizationLevel.DESKTOP_HIGH

  private constructor(eventBus: EventBus) {
    this.eventBus = eventBus
    this.setupOptimizationListeners()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(eventBus?: EventBus): EnvironmentalEffectsSystem {
    if (!EnvironmentalEffectsSystem.instance) {
      if (!eventBus) {
        throw new Error(
          'EventBus required for first initialization of EnvironmentalEffectsSystem',
        )
      }
      EnvironmentalEffectsSystem.instance = new EnvironmentalEffectsSystem(
        eventBus,
      )
    }
    return EnvironmentalEffectsSystem.instance
  }

  /**
   * Initialize the system with core engine components
   */
  public initialize(camera: THREE.Camera, scene: THREE.Scene): void {
    this.camera = camera
    this.scene = scene

    // Create underwater visual overlay
    this.createUnderwaterOverlay()

    // Setup underwater fog effect
    this.setupUnderwaterFog()

    console.log('🌊 EnvironmentalEffectsSystem initialized')
  }

  /**
   * Create and manage water systems for levels - PHASE 2: Quality-based configuration
   */
  public createWaterSystem(
    waterConfig: WaterConfiguration,
    levelGroup: THREE.Group,
  ): void {
    if (this.managedOceans.has(waterConfig.id)) {
      console.warn(`🌊 Water system ${waterConfig.id} already exists`)
      return
    }

    if (!this.scene) {
      console.error('🌊 Cannot create water system - scene not initialized')
      return
    }

    // PHASE 2: Treat level JSON as "maximum quality" - OptimizationManager decides final quality
    const maxQualityConfig = waterConfig.oceanConfig
    const requestedReflections = maxQualityConfig?.enableReflection ?? true
    const requestedRefractions = maxQualityConfig?.enableRefraction ?? true

    console.log(
      `🌊 EnvironmentalEffectsSystem: Creating water system with quality-based config`,
      {
        levelRequests: {
          reflections: requestedReflections,
          refractions: requestedRefractions,
        },
        note: 'OptimizationManager will override based on device capabilities',
      },
    )

    // Create OceanSystem with provided configuration (OptimizationManager will override expensive effects)
    const oceanSystem = new OceanSystem(THREE, this.scene, {
      size: { width: 10000, height: 10000 }, // Default large size
      segments: { width: 128, height: 128 },
      position: new THREE.Vector3(
        0,
        waterConfig.dynamics?.initialLevel || 0,
        0,
      ),
      waterLevel: waterConfig.dynamics?.initialLevel || 0,
      color: 0x006994,
      opacity: 0.95,
      metalness: 0.02,
      roughness: 0.1,
      waves: [],
      // PHASE 2: Pass level's maximum quality requests - OceanSystem will apply device-appropriate limits
      enableReflection: requestedReflections,
      enableRefraction: requestedRefractions,
      enableAnimation: true,
      animationSpeed: 1.0,
      enableFog: false,
      fogColor: 0x87ceeb,
      fogDensity: 0.01,
      enableLOD: true,
      maxDetailDistance: 500,
      ...maxQualityConfig, // Override with provided config
    })

    // Initialize the ocean system
    oceanSystem.initialize()

    // Store the systems
    this.managedOceans.set(waterConfig.id, oceanSystem)
    this.waterConfigurations.set(waterConfig.id, waterConfig)

    // Auto-register as water source for underwater detection
    const oceanMesh = oceanSystem.getOceanMesh()
    if (oceanMesh) {
      this.registerWaterSource({
        id: waterConfig.id,
        mesh: oceanMesh,
        getCurrentLevel: () => {
          const config = this.waterConfigurations.get(waterConfig.id)
          return (
            config?.dynamics?.initialLevel ||
            waterConfig.dynamics?.initialLevel ||
            0
          )
        },
        isActive: true,
      })
    }

    // Add to scene/level group
    const oceanGroup = oceanSystem.getOceanGroup()
    if (oceanGroup) {
      levelGroup.add(oceanGroup)
    }

    console.log(`🌊 Created global water system: ${waterConfig.id}`)
  }

  /**
   * Remove a water system
   */
  public removeWaterSystem(id: string): void {
    const oceanSystem = this.managedOceans.get(id)
    if (oceanSystem) {
      oceanSystem.dispose()
      this.managedOceans.delete(id)
      this.waterConfigurations.delete(id)
      this.unregisterWaterSource(id)
      console.log(`🌊 Removed water system: ${id}`)
    }
  }

  /**
   * Process level configuration and create water systems if needed - PHASE 2: Quality-aware processing
   */
  public processLevelConfiguration(
    levelConfig: any,
    levelGroup: THREE.Group,
  ): void {
    // Look for water configuration in level
    if (levelConfig.water) {
      console.log(
        `🌊 EnvironmentalEffectsSystem: Processing water config for level ${levelConfig.id}`,
        {
          requestedEffects: {
            reflections: levelConfig.water.oceanConfig?.enableReflection,
            refractions: levelConfig.water.oceanConfig?.enableRefraction,
          },
          approach:
            'Level JSON specifies maximum quality - OptimizationManager will apply device limits',
        },
      )

      const waterConfig: WaterConfiguration = {
        id: `${levelConfig.id}_water`,
        oceanConfig: levelConfig.water.oceanConfig || {},
        dynamics: levelConfig.water.dynamics,
      }

      this.createWaterSystem(waterConfig, levelGroup)
      console.log(`🌊 Auto-created water system for level: ${levelConfig.id}`)
    }
  }

  /**
   * Clean up all water systems for level transition
   */
  public cleanupLevel(levelId: string): void {
    const waterSystemId = `${levelId}_water`
    this.removeWaterSystem(waterSystemId)
  }

  /**
   * Register a water source for underwater detection
   */
  public registerWaterSource(waterSource: WaterSource): void {
    this.registeredWaterSources.set(waterSource.id, waterSource)
    console.log(`🌊 Registered water source: ${waterSource.id}`)
  }

  /**
   * Unregister a water source
   */
  public unregisterWaterSource(id: string): void {
    if (this.registeredWaterSources.delete(id)) {
      console.log(`🌊 Unregistered water source: ${id}`)

      // If we were underwater in this source, exit underwater state
      if (this.currentState.currentWaterSource === id) {
        this.exitUnderwaterState()
      }
    }
  }

  /**
   * Update environmental effects (called from main engine loop)
   */
  public update(deltaTime: number): void {
    if (!this.camera || !this.currentState.effectsActive) return

    this.lastCheck += deltaTime * 1000

    // Update dynamic water levels (rising water effect)
    this.updateDynamicWaterLevels(deltaTime)

    // Throttle underwater checks based on optimization level
    if (this.lastCheck >= this.checkInterval) {
      this.checkUnderwaterState()
      this.lastCheck = 0
    }
  }

  /**
   * Update dynamic water levels for all managed water systems
   */
  private updateDynamicWaterLevels(deltaTime: number): void {
    for (const [id, oceanSystem] of this.managedOceans) {
      const config = this.waterConfigurations.get(id)
      if (!config?.dynamics?.enableRising) continue

      const dynamics = config.dynamics

      // Check if water should still be rising
      if (dynamics.initialLevel < dynamics.targetLevel) {
        // Update the water level
        dynamics.initialLevel = Math.min(
          dynamics.initialLevel + dynamics.riseRate * deltaTime,
          dynamics.targetLevel,
        )

        // Update the ocean system position
        const oceanMesh = oceanSystem.getOceanMesh()
        if (oceanMesh) {
          oceanMesh.position.y = dynamics.initialLevel

          // Update the water source for underwater detection
          const waterSource = this.registeredWaterSources.get(id)
          if (waterSource) {
            // The getCurrentLevel function will now return the updated level
            // because it reads from config.dynamics.initialLevel
          }
        }
      }
    }
  }

  /**
   * Check if camera is underwater in any registered water source
   */
  private checkUnderwaterState(): void {
    if (!this.camera) return

    const cameraPosition = this.camera.position
    let foundWaterSource: WaterSource | null = null
    let maxWaterLevel = Number.NEGATIVE_INFINITY

    // Check all registered water sources
    for (const [id, waterSource] of this.registeredWaterSources) {
      if (!waterSource.isActive) continue

      const waterLevel = waterSource.getCurrentLevel()

      // Check if camera is below this water level
      if (cameraPosition.y < waterLevel) {
        // Use the highest water level if multiple sources overlap
        if (waterLevel > maxWaterLevel) {
          maxWaterLevel = waterLevel
          foundWaterSource = waterSource
        }
      }
    }

    // Update underwater state
    if (foundWaterSource && !this.currentState.isUnderwater) {
      this.enterUnderwaterState(
        foundWaterSource,
        maxWaterLevel - cameraPosition.y,
      )
    } else if (!foundWaterSource && this.currentState.isUnderwater) {
      this.exitUnderwaterState()
    } else if (foundWaterSource && this.currentState.isUnderwater) {
      // Update depth if still underwater
      this.currentState.waterDepth = maxWaterLevel - cameraPosition.y
    }
  }

  /**
   * Enter underwater state with visual and audio effects
   */
  private enterUnderwaterState(waterSource: WaterSource, depth: number): void {
    this.currentState = {
      isUnderwater: true,
      waterDepth: depth,
      currentWaterSource: waterSource.id,
      effectsActive: true,
    }

    // Apply visual effects
    this.applyUnderwaterVisuals()

    // Apply fog effects
    this.applyUnderwaterFog()

    // Emit event for other systems
    this.eventBus.emit('environmentalState.underwater.enter', {
      waterSource: waterSource.id,
      depth: depth,
      config: this.underwaterConfig,
    })

    console.log(
      `🌊 Entered underwater state in ${waterSource.id} at depth ${depth.toFixed(2)}`,
    )
  }

  /**
   * Exit underwater state and restore normal effects
   */
  private exitUnderwaterState(): void {
    const previousSource = this.currentState.currentWaterSource

    this.currentState = {
      isUnderwater: false,
      waterDepth: 0,
      currentWaterSource: null,
      effectsActive: true,
    }

    // Remove visual effects
    this.removeUnderwaterVisuals()

    // Restore original fog
    this.restoreOriginalFog()

    // Emit event for other systems
    this.eventBus.emit('environmentalState.underwater.exit', {
      previousWaterSource: previousSource,
    })

    console.log('🌊 Exited underwater state')
  }

  /**
   * Create underwater visual overlay
   */
  private createUnderwaterOverlay(): void {
    if (this.underwaterOverlay) return

    this.underwaterOverlay = document.createElement('div')
    this.underwaterOverlay.id = 'underwater-overlay'
    this.underwaterOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(
        to bottom,
        rgba(0, 105, 148, 0.1) 0%,
        rgba(0, 105, 148, 0.3) 50%,
        rgba(0, 70, 100, 0.5) 100%
      );
      pointer-events: none;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
      mix-blend-mode: multiply;
    `

    document.body.appendChild(this.underwaterOverlay)
  }

  /**
   * Setup underwater fog effect
   */
  private setupUnderwaterFog(): void {
    if (!this.scene) return

    // Store original fog if it exists
    this.originalFog = this.scene.fog

    // Create underwater fog
    this.underwaterFog = new THREE.Fog(
      this.underwaterConfig.visualTint,
      1, // near
      50, // far - reduced visibility underwater
    )
  }

  /**
   * Apply underwater visual effects
   */
  private applyUnderwaterVisuals(): void {
    if (this.underwaterOverlay) {
      this.underwaterOverlay.style.opacity =
        this.underwaterConfig.tintOpacity.toString()
    }
  }

  /**
   * Remove underwater visual effects
   */
  private removeUnderwaterVisuals(): void {
    if (this.underwaterOverlay) {
      this.underwaterOverlay.style.opacity = '0'
    }
  }

  /**
   * Apply underwater fog effect
   */
  private applyUnderwaterFog(): void {
    if (this.scene && this.underwaterFog) {
      this.scene.fog = this.underwaterFog
    }
  }

  /**
   * Restore original fog
   */
  private restoreOriginalFog(): void {
    if (this.scene) {
      this.scene.fog = this.originalFog
    }
  }

  /**
   * Setup optimization listeners
   */
  private setupOptimizationListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('optimizationLevelChanged', (event: any) => {
        const { level } = event.detail
        this.optimizationLevel = level

        // Adjust effect quality based on optimization level
        if (
          level.includes('mobile') ||
          level === OptimizationLevel.MOBILE_LOW
        ) {
          this.checkInterval = 200 // Less frequent checks on mobile
          this.underwaterConfig.bubbleEffects = false // Disable heavy effects
        } else {
          this.checkInterval = 100 // More frequent checks on desktop
          this.underwaterConfig.bubbleEffects = false // Keep disabled for now
        }
      })
    }
  }

  /**
   * Get current environmental state
   */
  public getCurrentState(): EnvironmentalState {
    return { ...this.currentState }
  }

  /**
   * Update underwater configuration
   */
  public updateUnderwaterConfig(config: Partial<UnderwaterEffectConfig>): void {
    Object.assign(this.underwaterConfig, config)

    // Re-apply effects if currently underwater
    if (this.currentState.isUnderwater) {
      this.applyUnderwaterVisuals()
      this.applyUnderwaterFog()
    }
  }

  /**
   * Enable/disable environmental effects
   */
  public setEffectsEnabled(enabled: boolean): void {
    this.currentState.effectsActive = enabled

    if (!enabled && this.currentState.isUnderwater) {
      this.removeUnderwaterVisuals()
      this.restoreOriginalFog()
    }
  }

  /**
   * Dispose system resources
   */
  public dispose(): void {
    // Remove DOM elements
    if (this.underwaterOverlay && this.underwaterOverlay.parentNode) {
      this.underwaterOverlay.parentNode.removeChild(this.underwaterOverlay)
      this.underwaterOverlay = null
    }

    // Clear registered water sources
    this.registeredWaterSources.clear()

    // Reset state
    this.currentState = {
      isUnderwater: false,
      waterDepth: 0,
      currentWaterSource: null,
      effectsActive: false,
    }

    console.log('🌊 EnvironmentalEffectsSystem disposed')
  }
}

/**
 * Global instance getter
 */
export const environmentalEffects = EnvironmentalEffectsSystem.getInstance
