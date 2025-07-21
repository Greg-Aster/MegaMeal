<!-- 
  Threlte State Management Integration
  Bridges Threlte components with existing GameStateManager
-->
<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import { writable, derived } from 'svelte/store'
import { GameStateManager } from '../../game/state/GameStateManager'
import { GameActions } from '../../game/state/GameActions'
import type { GameState, StarData, TimelineEvent } from '../../game/state/GameState'

const dispatch = createEventDispatcher()

// Reactive stores for game state
export const gameStateStore = writable<GameState | null>(null)
export const currentLevelStore = writable<string>('observatory')
export const selectedStarStore = writable<StarData | null>(null)
export const timelineEventsStore = writable<TimelineEvent[]>([])
export const gameStatsStore = writable<any>({})

// Derived stores for specific state slices
export const isLoadingStore = derived(gameStateStore, $state => 
  $state?.ui?.isLoading || false
)

export const errorStore = derived(gameStateStore, $state => 
  $state?.ui?.error || null
)

export const playerPositionStore = derived(gameStateStore, $state => 
  $state?.player?.position || { x: 0, y: 0, z: 0 }
)

let gameStateManager: GameStateManager | null = null
let eventBus: any = null
let isInitialized = false

// Props
export let initialTimelineEvents: TimelineEvent[] = []

onMount(() => {
  console.log('🎮 Initializing Threlte State Management...')
  
  // Initialize with timeline events
  if (initialTimelineEvents.length > 0) {
    timelineEventsStore.set(initialTimelineEvents)
  }
  
  isInitialized = true
  console.log('✅ Threlte State Management initialized')
})

/**
 * Initialize with existing GameStateManager and EventBus
 */
export function initializeWithGameManager(manager: GameStateManager, bus: any) {
  gameStateManager = manager
  eventBus = bus
  
  if (gameStateManager) {
    // Set up reactive sync with game state
    setupGameStateSync()
    console.log('🔗 GameStateManager connected to Threlte State')
  }
}

/**
 * Set up bidirectional sync between GameStateManager and Threlte stores
 */
function setupGameStateSync() {
  if (!gameStateManager || !eventBus) return
  
  // Sync game state changes to Threlte stores
  eventBus.on('game.state.changed', () => {
    const state = gameStateManager!.getState()
    gameStateStore.set(state)
    currentLevelStore.set(state.currentLevel)
    selectedStarStore.set(state.selectedStar)
    gameStatsStore.set(state.gameStats)
    
    dispatch('stateChanged', state)
  })
  
  // Initial state sync
  const initialState = gameStateManager.getState()
  gameStateStore.set(initialState)
  currentLevelStore.set(initialState.currentLevel)
  selectedStarStore.set(initialState.selectedStar)
  gameStatsStore.set(initialState.gameStats)
  
  // Listen for specific events
  eventBus.on('starmap.star.selected', (data: any) => {
    selectedStarStore.set(data.eventData)
    dispatch('starSelected', data)
  })
  
  eventBus.on('starmap.star.deselected', () => {
    selectedStarStore.set(null)
    dispatch('starDeselected')
  })
  
  eventBus.on('level.transition.success', (data: any) => {
    currentLevelStore.set(data.newLevel)
    dispatch('levelChanged', data.newLevel)
  })
}

/**
 * Dispatch action to GameStateManager
 */
export function dispatchAction(action: any) {
  if (gameStateManager) {
    gameStateManager.dispatch(action)
  } else {
    console.warn('GameStateManager not connected to Threlte State')
  }
}

/**
 * Level transition helpers for Threlte components
 */
export function transitionToLevel(levelId: string) {
  if (eventBus) {
    eventBus.emit('level.transition.request', { levelId })
  }
  currentLevelStore.set(levelId)
  dispatch('levelTransitionRequested', { levelId })
}

/**
 * Star selection helpers for Threlte components
 */
export function selectStar(starData: StarData) {
  if (gameStateManager) {
    gameStateManager.dispatch(GameActions.starSelected(starData))
  }
  selectedStarStore.set(starData)
  dispatch('starSelected', starData)
}

export function deselectStar() {
  if (gameStateManager) {
    const currentStar = gameStateManager.getState().selectedStar
    if (currentStar) {
      gameStateManager.dispatch(GameActions.starDeselected(currentStar))
    }
  }
  selectedStarStore.set(null)
  dispatch('starDeselected')
}

/**
 * Interaction recording for Threlte components
 */
export function recordInteraction(type: string, objectId: string, position: any, data?: any) {
  if (gameStateManager) {
    gameStateManager.dispatch(
      GameActions.interactionRecorded(type, objectId, position, data)
    )
  }
  dispatch('interactionRecorded', { type, objectId, position, data })
}

/**
 * Time tracking helpers
 */
export function updatePlayTime(deltaTime: number) {
  if (gameStateManager) {
    // Update through game state manager
    const currentState = gameStateManager.getState()
    gameStateManager.dispatch(GameActions.updateGameStats({
      ...currentState.gameStats,
      timeExplored: currentState.gameStats.timeExplored + deltaTime
    }))
  }
}

/**
 * Error handling
 */
export function reportError(error: Error, context: string) {
  const errorData = {
    error,
    context,
    timestamp: Date.now(),
    level: currentLevelStore
  }
  
  if (eventBus) {
    eventBus.emit('game.error', errorData)
  }
  
  dispatch('errorReported', errorData)
}

/**
 * Get current state snapshot
 */
export function getCurrentState(): GameState | null {
  if (gameStateManager) {
    return gameStateManager.getState()
  }
  return null
}

/**
 * Save game state
 */
export async function saveGame() {
  if (gameStateManager) {
    try {
      await gameStateManager.saveGame()
      dispatch('gameSaved')
    } catch (error) {
      dispatch('saveError', error)
    }
  }
}

/**
 * Load game state
 */
export async function loadGame() {
  if (gameStateManager) {
    try {
      await gameStateManager.loadGame()
      const state = gameStateManager.getState()
      gameStateStore.set(state)
      dispatch('gameLoaded', state)
    } catch (error) {
      dispatch('loadError', error)
    }
  }
}

onDestroy(() => {
  if (eventBus && gameStateManager) {
    // Clean up event listeners
    console.log('🧹 Threlte State Management disposed')
  }
})

// Export stores and manager for external access
export { gameStateManager }
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}