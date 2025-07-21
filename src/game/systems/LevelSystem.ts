// Enhanced Level loading and management system - Data-Driven Architecture
import type { MovementConfig } from '../../engine/components/MovementTypes'

export interface TerrainConfig {
  type: 'procedural_island' | 'scifi_room' | 'heightmap' | 'flat'
  generator: string // Component class name
  parameters: Record<string, any> // Generator-specific config
}

export interface EnvironmentConfig {
  skybox?: string
  lighting: {
    type: 'atmospheric' | 'dramatic' | 'bright' | 'emergency' | 'hdri_only'
    config: Record<string, any>
  }
  effects?: Array<{
    type: 'fireflies' | 'particles' | 'fog' | 'weather'
    config: Record<string, any>
  }>
  fog?: { color: string; density: number } // Legacy support
}

export interface MovementSystemConfig {
  terrainFollowing: boolean
  boundaryType: 'circular' | 'rectangular' | 'none'
  boundaryConfig?: Record<string, any>
  spawnPoint: [number, number, number]
  movementConfig: Partial<MovementConfig>
}

export interface SystemConfig {
  type: string // Component class name
  config: Record<string, any> // System-specific configuration
}

export interface AssetConfig {
  models?: Array<{
    id: string
    path: string
    position: [number, number, number]
  }>
  textures?: Array<{ id: string; path: string }>
  audio?: Array<{ id: string; path: string }>
}

export interface PhysicsConfig {
  autoGenerate: boolean
  gravity: [number, number, number]
  customColliders?: Array<any> // TODO: Define PhysicsColliderConfig
}

export interface LevelConfig {
  // Core Identity
  id: string
  name: string
  description?: string

  // Environment Configuration
  terrain: TerrainConfig
  environment: EnvironmentConfig
  water?: {
    oceanConfig?: any
    dynamics?: {
      enableRising: boolean
      initialLevel: number
      targetLevel: number
      riseRate: number
    }
  }

  // Movement Configuration
  movement: MovementSystemConfig

  // Interactive Systems
  systems: SystemConfig[]

  // Asset References
  assets?: AssetConfig

  // Physics Configuration
  physics: PhysicsConfig

  // Legacy support
  entities?: any[]
}

export class LevelSystem {
  private currentLevel: LevelConfig | null = null
  private initializationPromise: Promise<void>

  constructor() {
    this.initializationPromise = this.initializeDefaultComponents()
  }

  /**
   * Initialize the system - components are now auto-discovered
   */
  private async initializeDefaultComponents(): Promise<void> {
    // All components are automatically discovered from /src/game/systems/ directory
    // No manual registration needed - convention over configuration
    console.log(
      '📦 Component discovery now handled by convention - all components in /src/game/systems/',
    )
  }

  /**
   * Wait for system initialization to complete
   */
  public async waitForInitialization(): Promise<void> {
    await this.initializationPromise
  }

  /**
   * Load level from configuration
   */
  public async loadLevel(config: LevelConfig): Promise<void> {
    console.log(`🎮 Loading data-driven level: ${config.name}`)

    // Wait for component registration to complete
    await this.initializationPromise

    // Validate configuration
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid level configuration: ${config.id}`)
    }

    this.currentLevel = config
    console.log(`✅ Level configuration loaded: ${config.name}`)
  }

  /**
   * Validate level configuration - simplified for modernized system
   */
  private validateConfig(config: LevelConfig): boolean {
    // Basic validation
    if (!config.id || !config.name) {
      console.error('❌ Level config missing id or name')
      return false
    }

    if (!config.terrain || !config.terrain.type) {
      console.error('❌ Level config missing terrain configuration')
      return false
    }

    if (!config.movement || !config.movement.spawnPoint) {
      console.error('❌ Level config missing movement configuration')
      return false
    }

    // Components are now auto-discovered, no need to check registration

    return true
  }

  /**
   * Get current level configuration
   */
  public getCurrentLevel(): LevelConfig | null {
    return this.currentLevel
  }

  /**
   * Dispose of the level system
   */
  public dispose(): void {
    this.currentLevel = null
    console.log('🧹 LevelSystem disposed')
  }

  // All component factory methods removed - components now use standardized interface
  // and are automatically discovered from /src/game/systems/ directory
}
