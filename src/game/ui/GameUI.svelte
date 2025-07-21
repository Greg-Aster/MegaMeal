<!-- Main game UI component -->
<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte'
import ReturnButton from './components/ReturnButton.svelte'

export const gameStats: any = {}
export const selectedStar: any = null
export const isMobile = false
export const currentLevel = 'observatory'
export let resetView: () => void

const dispatch = createEventDispatcher()

// Level name mapping
const levelNames: { [key: string]: string } = {
  observatory: 'STAR OBSERVATORY',
  miranda: 'MIRANDA SHIP',
  restaurant: 'RESTAURANT BACKROOM',
}

// Auto-fade functionality
let hudVisible = true
let fadeTimer: NodeJS.Timeout

function showHUD() {
  hudVisible = true
  clearTimeout(fadeTimer)
  fadeTimer = setTimeout(() => {
    hudVisible = false
  }, 15000) // Fade out after 15 seconds
}

function handleReturnToObservatory() {
  dispatch('returnToObservatory')
}

// Show HUD when level changes
$: if (currentLevel) {
  showHUD()
}

onMount(() => {
  showHUD()

  return () => {
    clearTimeout(fadeTimer)
  }
})
</script>

<!-- Top HUD -->
<div class="absolute top-4 left-4 z-30 font-mono transition-opacity duration-1000 {hudVisible ? 'opacity-100' : 'opacity-0'}" style="pointer-events: auto;">
  <div class="card-base p-4 backdrop-blur-sm">
    <div class="text-[color:var(--primary)] font-bold mb-2">{levelNames[currentLevel] || 'UNKNOWN LEVEL'}</div>
    {#if currentLevel === 'observatory'}
      <div class="text-sm text-[color:var(--text-75)] space-y-1">
        <div class="text-[color:var(--text-main)]">Location: {gameStats.currentLocation || 'Star Observatory Alpha'}</div>
        <div class="text-[color:var(--text-main)]">Stars Discovered: {gameStats.starsDiscovered || 0}</div>
      </div>
    {/if}
  </div>
</div>

<!-- Controls Info -->
<!-- <div class="absolute top-4 right-4 z-30 font-mono">
  <div class="card-base p-3 backdrop-blur-sm text-sm text-[color:var(--text-75)]">
    {#if currentLevel === 'observatory'}
      {#if isMobile}
        <div class="text-[color:var(--text-main)]">Touch & drag to look around</div>
        <div class="text-[color:var(--text-main)]">Joystick to move, ↑ to jump</div>
        <div class="text-[color:var(--text-main)]">Tap stars to select</div>
      {:else}
        <div class="text-[color:var(--text-main)]">Drag to rotate view</div>
        <div class="text-[color:var(--text-main)]">WASD/Arrow keys to move</div>
        <div class="text-[color:var(--text-main)]">Click stars to select</div>
      {/if}
    {:else if currentLevel === 'miranda'}
      {#if isMobile}
        <div class="text-[color:var(--text-main)]">Touch & drag to look</div>
        <div class="text-[color:var(--text-main)]">Joystick to move</div>
        <div class="text-[color:var(--text-main)]">↑ to jump, E to interact</div>
      {:else}
        <div class="text-[color:var(--text-main)]">Mouse to look around</div>
        <div class="text-[color:var(--text-main)]">WASD/Arrow keys, Space to jump</div>
        <div class="text-[color:var(--text-main)]">Walk near objects to interact</div>
      {/if}
    {:else if currentLevel === 'restaurant'}
      {#if isMobile}
        <div class="text-[color:var(--text-main)]">Touch & drag to look</div>
        <div class="text-[color:var(--text-main)]">Joystick to move</div>
        <div class="text-[color:var(--text-main)]">↑ to jump, E to interact</div>
      {:else}
        <div class="text-[color:var(--text-main)]">Mouse to look around</div>
        <div class="text-[color:var(--text-main)]">WASD/Arrow keys, Space to jump</div>
        <div class="text-[color:var(--text-main)]">Walk near objects to interact</div>
      {/if}
    {/if}
  </div>
</div> -->

<!-- Level Navigation -->
<ReturnButton 
  {currentLevel}
  on:return={handleReturnToObservatory}
/>

<!-- Reset View Button - Available in observatory -->
<!-- {#if currentLevel === 'observatory'}
  <div class="absolute bottom-4 right-4 z-30">
    <button 
      class="btn-regular p-3 rounded-full font-bold text-lg hover:scale-110 transition-transform"
      on:click={resetView}
      title="Reset View"
    >
      🎯
    </button>
  </div>
{/if} -->