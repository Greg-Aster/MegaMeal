<!-- Main game UI component -->
<script lang="ts">
  export let gameStats: any = {};
  export let selectedStar: any = null;
  export let isMobile = false;
  
  function resetView() {
    // Emit reset event
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
    {#if isMobile}
      <div class="text-[color:var(--text-main)]">Touch & drag to explore</div>
      <div class="text-[color:var(--text-main)]">Pinch to zoom</div>
      <div class="text-[color:var(--text-main)]">Tap stars to select</div>
    {:else}
      <div class="text-[color:var(--text-main)]">Drag to rotate view</div>
      <div class="text-[color:var(--text-main)]">Scroll to zoom</div>
      <div class="text-[color:var(--text-main)]">Click stars to select</div>
    {/if}
  </div>
</div>

<!-- Reset View Button -->
<div class="absolute bottom-4 right-4 z-30">
  <button 
    class="btn-regular p-3 rounded-full font-bold text-lg hover:scale-110 transition-transform"
    on:click={resetView}
    title="Reset View"
  >
    🎯
  </button>
</div>