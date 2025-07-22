import * as THREE from 'three'

/**
 * Defines the quality levels for different device types. These levels are used
 * to apply a corresponding set of `QualitySettings`.
 */
export enum OptimizationLevel {
  ULTRA_LOW = 'ultra_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

/**
 * Describes the detected capabilities of the user's device.
 */
export interface DeviceCapabilities {
  isMobile: boolean
  isLowEnd: boolean
  screenSize: { width: number; height: number }
  pixelRatio: number
  estimatedGPUTier: 'low' | 'medium' | 'high' | 'ultra'
  supportsWebGL2: boolean
  deviceMemory?: number
  hardwareConcurrency: number
  maxTextureSize: number
  deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown'
}

/**
 * A set of configuration values that define the visual quality for a given
 * `OptimizationLevel`. Game systems read these settings to adapt their behavior.
 */
export interface QualitySettings {
  oceanSegments: { width: number; height: number }
  terrainSegments: { width: number; height: number }
  maxFireflyLights: number
  enableDynamicLighting: boolean
  maxVegetationInstances: number
  enableVegetation: boolean
  textureResolution: number
  enableProceduralTextures: boolean
  enableNormalMaps: boolean
  enableReflections: boolean
  enableRefractions: boolean
  canvasScale: number
  enablePostProcessing: boolean
  enableShadows: boolean
}

/**
 * A singleton manager that detects device capabilities and provides the
 * appropriate quality settings for the entire application.
 */
export class OptimizationManager {
  private static instance: OptimizationManager | null = null

  private deviceCapabilities: DeviceCapabilities | null = null
  private currentOptimizationLevel: OptimizationLevel = OptimizationLevel.MEDIUM
  private currentQualitySettings: QualitySettings

  private readonly qualityProfiles: Record<OptimizationLevel, QualitySettings> = {
    [OptimizationLevel.ULTRA_LOW]: {
      oceanSegments: { width: 12, height: 12 },
      terrainSegments: { width: 16, height: 16 },
      maxFireflyLights: 0,
      enableDynamicLighting: false,
      maxVegetationInstances: 0,
      enableVegetation: false,
      textureResolution: 256,
      enableProceduralTextures: false,
      enableNormalMaps: false,
      enableReflections: false,
      enableRefractions: false,
      canvasScale: 0.6,
      enablePostProcessing: false,
      enableShadows: false,
    },
    [OptimizationLevel.LOW]: {
      oceanSegments: { width: 12, height: 12 },
      terrainSegments: { width: 16, height: 16 },
      maxFireflyLights: 4,
      enableDynamicLighting: true,
      maxVegetationInstances: 3,
      enableVegetation: true,
      textureResolution: 512,
      enableProceduralTextures: true,
      enableNormalMaps: false,
      enableReflections: false,
      enableRefractions: false,
      canvasScale: 0.75,
      enablePostProcessing: false,
      enableShadows: false,
    },
    [OptimizationLevel.MEDIUM]: {
      oceanSegments: { width: 24, height: 24 },
      terrainSegments: { width: 32, height: 32 },
      maxFireflyLights: 8,
      enableDynamicLighting: true,
      maxVegetationInstances: 10,
      enableVegetation: true,
      textureResolution: 1024,
      enableProceduralTextures: true,
      enableNormalMaps: true,
      enableReflections: false,
      enableRefractions: false,
      canvasScale: 0.9,
      enablePostProcessing: false,
      enableShadows: true,
    },
    [OptimizationLevel.HIGH]: {
      oceanSegments: { width: 32, height: 32 },
      terrainSegments: { width: 48, height: 48 },
      maxFireflyLights: 15,
      enableDynamicLighting: true,
      maxVegetationInstances: 15,
      enableVegetation: true,
      textureResolution: 1024,
      enableProceduralTextures: true,
      enableNormalMaps: true,
      enableReflections: true,
      enableRefractions: false,
      canvasScale: 1.0,
      enablePostProcessing: true,
      enableShadows: true,
    },
    [OptimizationLevel.ULTRA]: {
      oceanSegments: { width: 64, height: 64 },
      terrainSegments: { width: 96, height: 96 },
      maxFireflyLights: 25,
      enableDynamicLighting: true,
      maxVegetationInstances: 30,
      enableVegetation: true,
      textureResolution: 2048,
      enableProceduralTextures: true,
      enableNormalMaps: true,
      enableReflections: true,
      enableRefractions: true,
      canvasScale: 1.0,
      enablePostProcessing: true,
      enableShadows: true,
    },
  }

  private constructor() {
    this.currentQualitySettings = this.qualityProfiles[OptimizationLevel.MEDIUM]
    this.detectDeviceCapabilities()
    this.autoSetOptimizationLevel()
    console.log('🚀 OptimizationManager initialized with level:', this.currentOptimizationLevel)
  }

  public static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager()
    }
    return OptimizationManager.instance
  }

  private detectDeviceCapabilities(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.deviceCapabilities = { isMobile: false, isLowEnd: false, screenSize: { width: 1920, height: 1080 }, pixelRatio: 1, estimatedGPUTier: 'medium', supportsWebGL2: true, hardwareConcurrency: 4, maxTextureSize: 4096, deviceType: 'desktop' }
      return
    }

    const userAgent = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Tablet|PlayBook/i.test(userAgent) || (window.innerWidth > 768 && isMobile)
    const screenWidth = window.screen.width, screenHeight = window.screen.height
    const pixelRatio = window.devicePixelRatio || 1
    const hardwareConcurrency = navigator.hardwareConcurrency || 4

    let deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown' = !isMobile ? 'desktop' : isTablet ? 'tablet' : 'phone'

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const supportsWebGL2 = !!canvas.getContext('webgl2')
    const maxTextureSize = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048
    const deviceMemory = 'deviceMemory' in navigator ? (navigator as any).deviceMemory : undefined

    let estimatedGPUTier: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
    if (isMobile) {
      const totalPixels = screenWidth * screenHeight * pixelRatio, deviceYear = this.estimateDeviceYear(userAgent)
      if (totalPixels > 6e6 && deviceYear >= 2022 && hardwareConcurrency >= 8) estimatedGPUTier = 'ultra'
      else if (totalPixels > 4e6 && deviceYear >= 2020 && hardwareConcurrency >= 6) estimatedGPUTier = 'high'
      else if (totalPixels > 2e6 && deviceYear >= 2019) estimatedGPUTier = 'medium'
      else estimatedGPUTier = 'low'
    } else {
      if (maxTextureSize >= 16384 && hardwareConcurrency >= 16 && deviceMemory && deviceMemory >= 16) estimatedGPUTier = 'ultra'
      else if (maxTextureSize >= 8192 && hardwareConcurrency >= 8) estimatedGPUTier = 'high'
      else if (maxTextureSize >= 4096) estimatedGPUTier = 'medium'
      else estimatedGPUTier = 'low'
    }

    this.deviceCapabilities = { isMobile, isLowEnd: estimatedGPUTier === 'low' || hardwareConcurrency < 4 || (deviceMemory && deviceMemory < 4) || maxTextureSize < 4096, screenSize: { width: screenWidth, height: screenHeight }, pixelRatio, estimatedGPUTier, supportsWebGL2, deviceMemory, hardwareConcurrency, maxTextureSize, deviceType }
    console.log('📱 Advanced device detection:', { deviceType, estimatedGPUTier, hardwareConcurrency, maxTextureSize })
  }

  private estimateDeviceYear(userAgent: string): number {
    const currentYear = new Date().getFullYear()
    if (/iPhone/.test(userAgent)) {
      if (/iPhone1[5-9]|iPhone[2-9][0-9]/.test(userAgent)) return currentYear
      if (/iPhone1[2-4]/.test(userAgent)) return 2022
      if (/iPhone1[0-1]/.test(userAgent)) return 2019
      return 2018
    }
    if (/Android/.test(userAgent)) {
      const androidMatch = userAgent.match(/Android (\d+)/)
      if (androidMatch) {
        const version = Number.parseInt(androidMatch[1])
        if (version >= 14) return 2023; if (version >= 13) return 2022; if (version >= 12) return 2021; if (version >= 11) return 2020; if (version >= 10) return 2019
        return 2018
      }
    }
    return currentYear - 2
  }

  private autoSetOptimizationLevel(): void {
    if (!this.deviceCapabilities) return
    const { isMobile, isLowEnd, estimatedGPUTier } = this.deviceCapabilities
    let level: OptimizationLevel
    if (isMobile) {
      if (isLowEnd || estimatedGPUTier === 'low') level = OptimizationLevel.LOW
      else if (estimatedGPUTier === 'high' || estimatedGPUTier === 'ultra') level = OptimizationLevel.HIGH
      else level = OptimizationLevel.MEDIUM
    } else {
      if (estimatedGPUTier === 'ultra') level = OptimizationLevel.ULTRA
      else if (estimatedGPUTier === 'high') level = OptimizationLevel.HIGH
      else level = OptimizationLevel.MEDIUM
    }
    this.setOptimizationLevel(level)
  }

  public setOptimizationLevel(level: OptimizationLevel): void {
    this.currentOptimizationLevel = level
    this.currentQualitySettings = this.qualityProfiles[level]
    console.log(`🎛️ Optimization level set to: ${level}`)
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('optimizationLevelChanged', { detail: { level, qualitySettings: this.currentQualitySettings, deviceCapabilities: this.deviceCapabilities } }))
  }

  public getOptimizationLevel = (): OptimizationLevel => this.currentOptimizationLevel
  public getQualitySettings = (): QualitySettings => this.currentQualitySettings
  public getDeviceCapabilities = (): DeviceCapabilities | null => this.deviceCapabilities
}

export const optimizationManager = OptimizationManager.getInstance()