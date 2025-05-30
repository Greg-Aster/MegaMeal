<script>
  // Simple Svelte 4-compatible component without any Svelte 5 features
  import { onMount } from 'svelte';
  
  let message = 'Component not mounted';
  
  onMount(() => {
    message = 'Component mounted successfully!';
    console.log('[SimpleSvelteTest] Component mounted');
    
    // Log Svelte version if available
    if (typeof window !== 'undefined' && window.__svelte) {
      console.log('[SimpleSvelteTest] Svelte version:', window.__svelte.version);
    }
  });
</script>

<div style="padding: 1rem; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 0.5rem; margin: 1rem 0;">
  <strong>Simple Svelte Test:</strong> {message}
</div>