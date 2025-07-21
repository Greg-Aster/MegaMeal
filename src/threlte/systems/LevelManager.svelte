<!-- 
  Threlte Level Management System
  Handles level transitions and loading in the new architecture
-->
<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import { writable, derived } from 'svelte/store'

const dispatch = createEventDispatcher()

// Level management stores
export const currentLevelStore = writable<string>('observatory')
export const availableLevelsStore = writable<string[]>([
  'observatory', 'miranda', 'restaurant', 'infinite_library', 'jerrys_room'
])
export const levelHistoryStore = writable<string[]>(['observatory'])
export const isTransitioningStore = writable<boolean>(false)

// Level metadata
const levelMetadata = {
  observatory: {
    name: 'Star Observatory',
    description: 'Navigate the cosmic timeline',
    camera: { position: [0, -3.4, 50], fov: 60 }
  },
  miranda: {
    name: 'The Miranda Incident',
    description: 'Investigate the debris field',
    camera: { position: [40, 8, 15], fov: 60 }
  },
  restaurant: {
    name: 'The Hamburgler\'s Kitchen',
    description: 'Explore the cosmic horror backroom',
    camera: { position: [0, 1.7, 8], fov: 75 }
  },
  infinite_library: {
    name: 'The Infinite Library',
    description: 'Repository of all timelines',
    camera: { position: [0, 1.7, 8], fov: 75 }
  },
  jerrys_room: {
    name: 'Jerry\'s Room',
    description: 'A mysterious dark room',
    camera: { position: [0, 1.6, 2], fov: 75 }
  }
}

// Derived stores
export const currentLevelMetadata = derived(
  currentLevelStore, 
  $level => levelMetadata[$level] || null
)

let isInitialized = false
let transitionTimeout: number | null = null

// Props
export let initialLevel = 'observatory'

onMount(() => {
  console.log('🏗️ Initializing Threlte Level Manager...')
  
  // Set initial level
  currentLevelStore.set(initialLevel)
  levelHistoryStore.set([initialLevel])
  
  isInitialized = true
  console.log('✅ Threlte Level Manager initialized')
})

/**
 * Transition to a new level
 */
export async function transitionToLevel(levelId: string, immediate = false): Promise<boolean> {
  if (!isInitialized) {
    console.warn('Level Manager not initialized')
    return false
  }
  
  const currentLevel = getCurrentLevel()
  if (currentLevel === levelId) {
    console.log(`Already in level: ${levelId}`)
    return true
  }
  
  if (!isLevelAvailable(levelId)) {
    console.error(`Level not available: ${levelId}`)
    return false
  }
  
  try {
    console.log(`🔄 Transitioning from ${currentLevel} to ${levelId}`)
    
    if (!immediate) {
      isTransitioningStore.set(true)
      dispatch('transitionStart', { from: currentLevel, to: levelId })
      
      // Simulate loading time for smooth transitions
      await new Promise(resolve => {
        transitionTimeout = window.setTimeout(resolve, 500)
      })
    }
    
    // Update stores
    currentLevelStore.set(levelId)
    levelHistoryStore.update(history => [...history, levelId])
    
    // Dispatch events
    dispatch('levelChanged', { 
      from: currentLevel, 
      to: levelId,
      metadata: levelMetadata[levelId]
    })
    
    if (!immediate) {
      isTransitioningStore.set(false)
      dispatch('transitionComplete', { 
        from: currentLevel, 
        to: levelId,
        metadata: levelMetadata[levelId]
      })
    }
    
    console.log(`✅ Successfully transitioned to ${levelId}`)
    return true
    
  } catch (error) {
    console.error(`❌ Failed to transition to ${levelId}:`, error)
    isTransitioningStore.set(false)
    dispatch('transitionError', { levelId, error })
    return false
  }
}

/**
 * Go back to previous level
 */
export async function goBack(): Promise<boolean> {
  const history = getCurrentHistory()
  if (history.length < 2) {
    console.warn('No previous level to return to')
    return false
  }
  
  const previousLevel = history[history.length - 2]
  
  // Remove current level from history
  levelHistoryStore.update(history => history.slice(0, -1))
  
  return await transitionToLevel(previousLevel)
}

/**
 * Reset to initial level
 */
export async function resetToInitial(): Promise<boolean> {
  levelHistoryStore.set([initialLevel])
  return await transitionToLevel(initialLevel)
}

/**
 * Check if level is available
 */
export function isLevelAvailable(levelId: string): boolean {
  const available = getAvailableLevels()
  return available.includes(levelId)
}

/**
 * Get current level
 */
export function getCurrentLevel(): string {
  let current = 'observatory'
  currentLevelStore.subscribe(level => current = level)()
  return current
}

/**
 * Get available levels
 */
export function getAvailableLevels(): string[] {
  let levels = []
  availableLevelsStore.subscribe(l => levels = l)()
  return levels
}

/**
 * Get level history
 */
export function getCurrentHistory(): string[] {
  let history = []
  levelHistoryStore.subscribe(h => history = h)()
  return history
}

/**
 * Get level metadata
 */
export function getLevelMetadata(levelId: string) {
  return levelMetadata[levelId] || null
}

/**
 * Add new level to available levels
 */
export function addAvailableLevel(levelId: string, metadata?: any) {
  if (metadata) {
    levelMetadata[levelId] = metadata
  }
  
  availableLevelsStore.update(levels => {
    if (!levels.includes(levelId)) {
      return [...levels, levelId]
    }
    return levels
  })
  
  dispatch('levelAdded', { levelId, metadata })
}

/**
 * Remove level from available levels
 */
export function removeAvailableLevel(levelId: string) {
  availableLevelsStore.update(levels => 
    levels.filter(level => level !== levelId)
  )
  
  delete levelMetadata[levelId]
  dispatch('levelRemoved', { levelId })
}

/**
 * Get transition status
 */
export function isTransitioning(): boolean {
  let transitioning = false
  isTransitioningStore.subscribe(t => transitioning = t)()
  return transitioning
}

/**
 * Force immediate level change (no transition)
 */
export function setLevelImmediate(levelId: string) {
  if (!isLevelAvailable(levelId)) {
    console.error(`Level not available: ${levelId}`)
    return false
  }
  
  const currentLevel = getCurrentLevel()
  currentLevelStore.set(levelId)
  levelHistoryStore.update(history => [...history, levelId])
  
  dispatch('levelChanged', { 
    from: currentLevel, 
    to: levelId,
    metadata: levelMetadata[levelId],
    immediate: true
  })
  
  return true
}

onDestroy(() => {
  if (transitionTimeout) {
    clearTimeout(transitionTimeout)
  }
  console.log('🧹 Threlte Level Manager disposed')
})

// Export level manager functions
export const levelManager = {
  transitionToLevel,
  goBack,
  resetToInitial,
  isLevelAvailable,
  getCurrentLevel,
  getAvailableLevels,
  getCurrentHistory,
  getLevelMetadata,
  addAvailableLevel,
  removeAvailableLevel,
  isTransitioning,
  setLevelImmediate
}
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}