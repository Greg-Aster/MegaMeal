/**
 * Central game state management
 */
export class GameState {
  // Level state
  public currentLevel = 'observatory'
  public previousLevel: string | null = null

  // Star and timeline state
  public selectedStar: StarData | null = null
  public discoveredStars: Set<string> = new Set()
  public timelineEvents: TimelineEvent[] = []

  // Game statistics
  public gameStats: GameStats = {
    starsDiscovered: 0,
    timeExplored: 0,
    currentLocation: 'Star Observatory Alpha',
    levelsVisited: 0,
    interactionsPerformed: 0,
    secretsFound: 0,
  }

  // Progress tracking
  public completedLevels: Set<string> = new Set()
  public unlockedContent: Set<string> = new Set()
  public collectedItems: Set<string> = new Set()

  // Game settings
  public settings: GameSettings = {
    graphicsQuality: 'high',
    audioEnabled: true,
    audioVolume: 0.8,
    showDebugInfo: false,
    enableMobileControls: false,
    mouseSensitivity: 1.0,
    touchSensitivity: 1.0,
  }

  // Session data
  public sessionData: SessionData = {
    sessionStartTime: Date.now(),
    totalPlayTime: 0,
    lastSaveTime: Date.now(),
    saveVersion: '1.0.0',
  }

  /**
   * Reset game state to initial values
   */
  public reset(): void {
    this.currentLevel = 'observatory'
    this.previousLevel = null
    this.selectedStar = null
    this.discoveredStars.clear()
    this.timelineEvents = []

    this.gameStats = {
      starsDiscovered: 0,
      timeExplored: 0,
      currentLocation: 'Star Observatory Alpha',
      levelsVisited: 0,
      interactionsPerformed: 0,
      secretsFound: 0,
    }

    this.completedLevels.clear()
    this.unlockedContent.clear()
    this.collectedItems.clear()

    this.sessionData = {
      sessionStartTime: Date.now(),
      totalPlayTime: 0,
      lastSaveTime: Date.now(),
      saveVersion: '1.0.0',
    }
  }

  /**
   * Serialize state for saving
   */
  public serialize(): string {
    const saveData = {
      currentLevel: this.currentLevel,
      previousLevel: this.previousLevel,
      selectedStar: this.selectedStar,
      discoveredStars: Array.from(this.discoveredStars),
      gameStats: this.gameStats,
      completedLevels: Array.from(this.completedLevels),
      unlockedContent: Array.from(this.unlockedContent),
      collectedItems: Array.from(this.collectedItems),
      settings: this.settings,
      sessionData: this.sessionData,
    }

    return JSON.stringify(saveData)
  }

  /**
   * Deserialize state from save data
   */
  public deserialize(saveData: string): void {
    try {
      const data = JSON.parse(saveData)

      this.currentLevel = data.currentLevel || 'observatory'
      this.previousLevel = data.previousLevel || null
      this.selectedStar = data.selectedStar || null
      this.discoveredStars = new Set(data.discoveredStars || [])
      this.gameStats = { ...this.gameStats, ...data.gameStats }
      this.completedLevels = new Set(data.completedLevels || [])
      this.unlockedContent = new Set(data.unlockedContent || [])
      this.collectedItems = new Set(data.collectedItems || [])
      this.settings = { ...this.settings, ...data.settings }
      this.sessionData = { ...this.sessionData, ...data.sessionData }
    } catch (error) {
      console.error('Failed to deserialize game state:', error)
      throw new Error('Invalid save data')
    }
  }

  /**
   * Create a deep copy of the game state (optimized)
   */
  public clone(): GameState {
    const cloned = new GameState()

    // Direct assignment of primitives and shallow objects
    cloned.currentLevel = this.currentLevel
    cloned.previousLevel = this.previousLevel
    cloned.selectedStar = this.selectedStar ? { ...this.selectedStar } : null

    // Clone Sets efficiently
    cloned.discoveredStars = new Set(this.discoveredStars)
    cloned.completedLevels = new Set(this.completedLevels)
    cloned.unlockedContent = new Set(this.unlockedContent)
    cloned.collectedItems = new Set(this.collectedItems)

    // Clone arrays (timeline events are typically not modified frequently)
    cloned.timelineEvents = [...this.timelineEvents]

    // Shallow clone of nested objects (these are typically not deeply nested)
    cloned.gameStats = { ...this.gameStats }
    cloned.settings = { ...this.settings }
    cloned.sessionData = { ...this.sessionData }

    return cloned
  }

  /**
   * Create a lightweight copy for comparison (shallow clone)
   */
  public shallowClone(): GameState {
    const cloned = new GameState()
    cloned.currentLevel = this.currentLevel
    cloned.previousLevel = this.previousLevel
    cloned.selectedStar = this.selectedStar
    cloned.discoveredStars = this.discoveredStars
    cloned.completedLevels = this.completedLevels
    cloned.unlockedContent = this.unlockedContent
    cloned.collectedItems = this.collectedItems
    cloned.timelineEvents = this.timelineEvents
    cloned.gameStats = this.gameStats
    cloned.settings = this.settings
    cloned.sessionData = this.sessionData
    return cloned
  }
}

/**
 * Star data interface
 */
export interface StarData {
  title: string
  description: string
  slug: string
  uniqueId: string
  timelineYear: number
  timelineEra: string
  timelineLocation: string
  isKeyEvent: boolean
  isLevel: boolean
  levelId?: string // Add levelId field for level transitions
  tags: string[]
  category: string
  screenPosition?: {
    x: number
    y: number
    cardClass?: string
  }
}

/**
 * Timeline event interface
 */
export interface TimelineEvent {
  id: string
  title: string
  description: string
  year: number
  era: string
  location: string
  isKeyEvent: boolean
  tags: string[]
  category: string
  unlocked: boolean
}

/**
 * Game statistics interface
 */
export interface GameStats {
  starsDiscovered: number
  timeExplored: number
  currentLocation: string
  levelsVisited: number
  interactionsPerformed: number
  secretsFound: number
}

/**
 * Game settings interface
 */
export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra'
  audioEnabled: boolean
  audioVolume: number
  showDebugInfo: boolean
  enableMobileControls: boolean
  mouseSensitivity: number
  touchSensitivity: number
}

/**
 * Session data interface
 */
export interface SessionData {
  sessionStartTime: number
  totalPlayTime: number
  lastSaveTime: number
  saveVersion: string
  sessionId?: string
  gameVersion?: string
  initTime?: number
  initConfig?: any

  // Transition tracking
  lastTransitionTime?: number
  transitionFailures?: number

  // Level completion tracking
  levelCompletionTimes?: Record<string, number>

  // Interaction tracking
  selectionMethods?: { click: number; touch: number; keyboard: number }
  discoveryMethods?: {
    exploration: number
    timeline: number
    interaction: number
  }
  interactionTypes?: Record<string, number>

  // Collection tracking
  collectionStats?: Record<string, number>
  unlockReasons?: Record<string, string>

  // Save/Load tracking
  saveInProgress?: boolean
  lastSaveType?: 'manual' | 'auto' | 'checkpoint'
  lastSaveSize?: number
  lastSaveError?: string
  saveCount?: number
  saveFailures?: number
  lastLoadTime?: number
  loadedSaveVersion?: string
  migrationPerformed?: boolean

  // Game state tracking
  isPaused?: boolean
  pauseReason?: 'user' | 'system' | 'error'
  pauseTime?: number
  totalPauseTime?: number
  resumeTime?: number
  resetReason?: 'user' | 'error' | 'system'
  resetTime?: number

  // Previous session data
  previousSession?: any
}
