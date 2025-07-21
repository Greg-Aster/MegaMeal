<!-- 
  Threlte EventBus System Component
  Integrates existing EventBus with Threlte reactive context
-->
<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import { writable } from 'svelte/store'
import { EventBus } from '../../engine/core/EventBus'

// Create event dispatcher for Svelte component communication
const dispatch = createEventDispatcher()

// Create reactive stores for key game events
export const gameStateStore = writable(null)
export const levelTransitionStore = writable(null)
export const interactionStore = writable(null)
export const errorStore = writable(null)

let eventBus: EventBus
let isInitialized = false

onMount(() => {
  console.log('📡 Initializing Threlte EventBus System...')
  
  // Create EventBus instance
  eventBus = new EventBus()
  
  // Set up reactive bridges between EventBus and Svelte stores
  setupEventBridges()
  
  isInitialized = true
  console.log('✅ Threlte EventBus System initialized')
})

/**
 * Bridge EventBus events to Svelte reactive stores
 */
function setupEventBridges() {
  // Game state changes
  eventBus.on('game.state.changed', (data) => {
    gameStateStore.set(data)
    dispatch('gameStateChanged', data)
  })
  
  // Level transitions
  eventBus.on('level.transition.request', (data) => {
    levelTransitionStore.set(data)
    dispatch('levelTransition', data)
  })
  
  eventBus.on('level.transition.success', (data) => {
    dispatch('levelTransitionSuccess', data)
  })
  
  // Interactions
  eventBus.on('interaction.performed', (data) => {
    interactionStore.set(data)
    dispatch('interaction', data)
  })
  
  // Star selection events
  eventBus.on('starmap.star.selected', (data) => {
    dispatch('starSelected', data)
  })
  
  eventBus.on('starmap.star.deselected', (data) => {
    dispatch('starDeselected', data)
  })
  
  // Mobile controls
  eventBus.on('mobile.movement', (data) => {
    dispatch('mobileMovement', data)
  })
  
  eventBus.on('mobile.action', (data) => {
    dispatch('mobileAction', data)
  })
  
  // Error handling
  eventBus.on('game.error', (data) => {
    errorStore.set(data)
    dispatch('gameError', data)
  })
  
  eventBus.on('ui.error', (data) => {
    dispatch('uiError', data)
  })
  
  // Engine events
  eventBus.on('engine.initialized', () => {
    dispatch('engineInitialized')
  })
  
  eventBus.on('engine.update', (data) => {
    dispatch('engineUpdate', data)
  })
  
  // Dialogue events
  eventBus.on('dialogue.show', (data) => {
    dispatch('dialogueShow', data)
  })
  
  eventBus.on('dialogue.hide', () => {
    dispatch('dialogueHide')
  })
  
  console.log('🔗 EventBus bridges to Svelte stores established')
}

/**
 * Emit event through EventBus
 */
export function emit(event: string, data?: any) {
  if (eventBus) {
    eventBus.emit(event, data)
  }
}

/**
 * Listen to EventBus events
 */
export function on(event: string, callback: (data?: any) => void) {
  if (eventBus) {
    eventBus.on(event, callback)
  }
}

/**
 * Remove EventBus listener
 */
export function off(event: string, callback: (data?: any) => void) {
  if (eventBus) {
    eventBus.off(event, callback)
  }
}

onDestroy(() => {
  if (eventBus) {
    // Note: EventBus doesn't have a dispose method, but we can clear listeners
    console.log('🧹 Threlte EventBus System cleaned up')
  }
})

// Export eventBus for external access
export { eventBus }
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}