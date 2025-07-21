<!-- 
  Threlte Time System Component
  Replaces Time.ts with reactive time management
-->
<script lang="ts">
import { useTask } from '@threlte/core'
import { onMount, createEventDispatcher } from 'svelte'
import { writable } from 'svelte/store'
import { Time } from '../../engine/core/Time'

const dispatch = createEventDispatcher()

// Reactive stores for time data
export const deltaTimeStore = writable(0)
export const totalTimeStore = writable(0)
export const fpsStore = writable(60)
export const frameCountStore = writable(0)

let timeManager: Time
let isInitialized = false

// Export time values for external access
export let deltaTime = 0
export let totalTime = 0
export let fps = 60
export let frameCount = 0

onMount(() => {
  console.log('⏰ Initializing Threlte Time System...')
  
  // Create Time manager
  timeManager = new Time()
  timeManager.start()
  
  isInitialized = true
  console.log('✅ Threlte Time System initialized')
})

// Update time system every frame
useTask(() => {
  if (!timeManager || !isInitialized) return
  
  // Update time manager
  timeManager.update()
  
  // Get current time values
  deltaTime = timeManager.deltaTime
  totalTime = timeManager.totalTime
  fps = timeManager.fps
  frameCount = timeManager.frameCount
  
  // Update reactive stores
  deltaTimeStore.set(deltaTime)
  totalTimeStore.set(totalTime)
  fpsStore.set(fps)
  frameCountStore.set(frameCount)
  
  // Dispatch time update events
  dispatch('timeUpdate', {
    deltaTime,
    totalTime,
    fps,
    frameCount
  })
})

/**
 * Pause time system
 */
export function pause() {
  if (timeManager) {
    timeManager.pause()
    dispatch('timePaused')
  }
}

/**
 * Resume time system
 */
export function resume() {
  if (timeManager) {
    timeManager.resume()
    dispatch('timeResumed')
  }
}

/**
 * Stop time system
 */
export function stop() {
  if (timeManager) {
    timeManager.stop()
    dispatch('timeStopped')
  }
}

/**
 * Reset time system
 */
export function reset() {
  if (timeManager) {
    timeManager.reset()
    dispatch('timeReset')
  }
}

// Export time manager for external access
export { timeManager }
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}