<script>
  import { onMount } from 'svelte';
  
  let mounted = false;
  let hydrationError = null;
  
  onMount(() => {
    console.log('[DebugHydration] Component mounted successfully');
    mounted = true;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('[DebugHydration] Browser environment detected');
      console.log('[DebugHydration] Svelte version:', window.__svelte?.version || 'Unknown');
    }
    
    return () => {
      console.log('[DebugHydration] Component unmounting');
    };
  });
  
  // Try to catch hydration errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      if (e.message && e.message.includes('hydrat')) {
        hydrationError = e.message;
        console.error('[DebugHydration] Caught hydration error:', e);
      }
    });
  }
</script>

<div class="debug-hydration p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
  <h3 class="font-bold">Hydration Debug Info</h3>
  <p>Component mounted: {mounted ? 'Yes' : 'No'}</p>
  {#if hydrationError}
    <p class="text-red-600">Hydration error: {hydrationError}</p>
  {/if}
  <p>Time: {new Date().toLocaleTimeString()}</p>
</div>

<style>
  .debug-hydration {
    margin: 1rem 0;
    font-family: monospace;
  }
</style>