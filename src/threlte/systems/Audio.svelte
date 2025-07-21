<!-- 
  Threlte Audio System Component
  Replaces AudioManager.ts with reactive audio management
-->
<script lang="ts">
import { useTask } from '@threlte/core'
import { onMount, onDestroy } from 'svelte'
import { AudioManager } from '../../engine/audio/AudioManager'

// Audio configuration
export let enabled = false // Disabled by default for performance
export let masterVolume = 0.7
export let enableSpatialAudio = true

let audioManager: AudioManager | null = null
let isInitialized = false

onMount(async () => {
  if (!enabled) {
    console.log('🔇 Audio system disabled for performance')
    return
  }

  try {
    console.log('🎵 Initializing Threlte Audio System...')
    
    // Create and initialize audio manager
    audioManager = new AudioManager()
    await audioManager.initialize()
    
    // Configure audio settings
    if (audioManager.setMasterVolume) {
      audioManager.setMasterVolume(masterVolume)
    }
    
    isInitialized = true
    console.log('✅ Threlte Audio System initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Threlte Audio System:', error)
  }
})

// Update audio system
useTask((delta) => {
  if (audioManager && isInitialized) {
    audioManager.update(delta)
  }
})

// Reactive volume changes
$: if (audioManager && audioManager.setMasterVolume) {
  audioManager.setMasterVolume(masterVolume)
}

onDestroy(() => {
  if (audioManager) {
    audioManager.dispose()
    console.log('🧹 Threlte Audio System disposed')
  }
})

// Export audio manager for external access
export { audioManager }
</script>

<!-- No visual output - this is a system component -->

{#if enabled && isInitialized}
  <!-- Audio context indicator -->
  <slot />
{/if}