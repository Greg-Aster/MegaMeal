<!-- LayoutToggleMinimal.svelte - Simplified to use SpecialPageFeatures centralized logic -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  let isOneColumn = false;
  let isTransitioning = false;
  let isReady = false;

  onMount(() => {
    // ⭐ Wait for SpecialPageFeatures to expose the global toggle function
    const checkForToggleFunction = () => {
      if ((window as any).toggleLayoutState && (window as any).getLayoutState) {
        isReady = true;
        
        // Get initial state
        const state = (window as any).getLayoutState();
        isOneColumn = state.isOneColumn;
        isTransitioning = state.isTransitioning;
        
        // ⭐ Simple polling for state changes
        const pollInterval = setInterval(() => {
          if ((window as any).getLayoutState) {
            const newState = (window as any).getLayoutState();
            isOneColumn = newState.isOneColumn;
            isTransitioning = newState.isTransitioning;
          }
        }, 100);

        console.log('LayoutToggleMinimal - Connected to SpecialPageFeatures toggle system');
        
        return () => {
          clearInterval(pollInterval);
        };
      } else {
        // Retry if not ready yet
        setTimeout(checkForToggleFunction, 100);
      }
    };

    checkForToggleFunction();
  });

  function toggleLayout() {
    if (!isReady || isTransitioning || !(window as any).toggleLayoutState) return;
    
    console.log('LayoutToggleMinimal - Calling centralized toggle function');
    const success = (window as any).toggleLayoutState();
    
    if (!success) {
      console.warn('LayoutToggleMinimal - Toggle failed (probably transitioning)');
    }
  }

  // Size variants
  $: sizeClasses = {
    'sm': 'w-8 h-8 p-1.5',
    'md': 'w-10 h-10 p-2',
    'lg': 'w-12 h-12 p-2.5'
  }[size];

  $: iconSize = {
    'sm': 'w-3 h-3',
    'md': 'w-4 h-4', 
    'lg': 'w-5 h-5'
  }[size];

  $: positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4', 
    'bottom-left': 'bottom-4 left-4'
  }[position];
</script>

<!-- Minimal Toggle Button -->
<button
  on:click={toggleLayout}
  disabled={isTransitioning || !isReady}
  class="fixed {positionClasses} z-50 {sizeClasses} bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 group"
  aria-label={isOneColumn ? 'Switch to two column layout' : 'Switch to single column layout'}
  title={isOneColumn ? 'Show sidebar' : 'Hide sidebar'}
>
  {#if isTransitioning}
    <!-- Loading spinner -->
    <svg class="{iconSize} animate-spin text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {:else if !isReady}
    <!-- System loading indicator -->
    <svg class="{iconSize} animate-pulse text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  {:else if isOneColumn}
    <!-- Single column icon -->
    <svg class="{iconSize} text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="4" width="12" height="16" rx="2" stroke-width="2"/>
    </svg>
  {:else}
    <!-- Two column icon -->
    <svg class="{iconSize} text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="7" height="16" rx="1" stroke-width="2"/>
      <rect x="14" y="4" width="7" height="16" rx="1" stroke-width="2"/>
    </svg>
  {/if}
</button>

<style>
  button {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  button:hover svg {
    transform: scale(1.1);
  }
  
  /* Subtle glow effect on hover */
  button:hover {
    box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.3);
  }
</style>