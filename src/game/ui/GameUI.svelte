<!-- Main game UI component -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let gameStats: any = {};
  export let selectedStar: any = null;
  export let isMobile = false;
  export let currentLevel: string = 'observatory';
  export let resetView: () => void;
  
  const dispatch = createEventDispatcher();
  
  function handleReturnToObservatory() {
    dispatch('returnToObservatory');
  }
</script>

<!-- Top HUD -->
<div class="absolute top-4 left-4 z-30 font-mono">
  <div class="card-base p-4 backdrop-blur-sm">
    <div class="text-[color:var(--primary)] font-bold mb-2">STAR OBSERVATORY</div>
    <div class="text-sm text-[color:var(--text-75)] space-y-1">
      <div class="text-[color:var(--text-main)]">Location: {gameStats.currentLocation || 'Unknown'}</div>
      <div class="text-[color:var(--text-main)]">Stars Discovered: {gameStats.starsDiscovered || 0}</div>
    </div>
  </div>
</div>

<!-- Controls Info -->
<div class="absolute top-4 right-4 z-30 font-mono">
  <div class="card-base p-3 backdrop-blur-sm text-sm text-[color:var(--text-75)]">
    {#if currentLevel === 'observatory'}
      {#if isMobile}
        <div class="text-[color:var(--text-main)]">Touch & drag to explore</div>
        <div class="text-[color:var(--text-main)]">Pinch to zoom</div>
        <div class="text-[color:var(--text-main)]">Tap stars to select</div>
      {:else}
        <div class="text-[color:var(--text-main)]">Drag to rotate view</div>
        <div class="text-[color:var(--text-main)]">Scroll to zoom</div>
        <div class="text-[color:var(--text-main)]">Click stars to select</div>
      {/if}
    {:else if currentLevel === 'miranda'}
      {#if isMobile}
        <div class="text-[color:var(--text-main)]">Touch & drag to look</div>
        <div class="text-[color:var(--text-main)]">Pinch to zoom</div>
        <div class="text-[color:var(--text-main)]">Walk near objects to interact</div>
      {:else}
        <div class="text-[color:var(--text-main)]">Mouse to look around</div>
        <div class="text-[color:var(--text-main)]">WASD to move</div>
        <div class="text-[color:var(--text-main)]">Walk near objects to interact</div>
      {/if}
    {/if}
  </div>
</div>

<!-- Level Navigation -->
{#if currentLevel === 'miranda'}
  <div class="absolute bottom-4 left-4 z-30">
    <button 
      class="btn-regular p-3 rounded-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
      on:click={handleReturnToObservatory}
      title="Return to Star Observatory"
    >
      ← Return to Observatory
    </button>
  </div>
{/if}

<!-- Reset View Button - Available in observatory -->
{#if currentLevel === 'observatory'}
  <div class="absolute bottom-4 right-4 z-30">
    <button 
      class="btn-regular p-3 rounded-full font-bold text-lg hover:scale-110 transition-transform"
      on:click={resetView}
      title="Reset View"
    >
      🎯
    </button>
  </div>
{/if}