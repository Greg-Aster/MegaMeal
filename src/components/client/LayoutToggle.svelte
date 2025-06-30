<!-- LayoutToggle.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  export let defaultToOneColumn: boolean = true;
  export let showLabels: boolean = true;

  let isOneColumn = true;
  let isTransitioning = false;

  onMount(() => {
    // Initialize state
    isOneColumn = defaultToOneColumn;
    
    // Apply initial layout if defaulting to one column
    if (defaultToOneColumn) {
      applyOneColumnLayout();
    }
    
    // Listen for external layout changes (from navigation, etc.)
    const handleStorageChange = () => {
      const oneColumnMode = localStorage.getItem('oneColumnMode') === 'true';
      if (oneColumnMode !== isOneColumn) {
        isOneColumn = oneColumnMode;
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  });

  function toggleLayout() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    isOneColumn = !isOneColumn;
    
    if (isOneColumn) {
      applyOneColumnLayout();
    } else {
      applyTwoColumnLayout();
    }
    
    // Reset transition flag after animation
    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  function applyOneColumnLayout() {
    console.log('LayoutToggle - Applying one column layout');
    
    // Set localStorage flag
    localStorage.setItem('oneColumnMode', 'true');
    
    // Apply layout changes
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid) {
      // Save original classes if not already saved
      if (!mainGrid.dataset.originalClasses) {
        mainGrid.dataset.originalClasses = mainGrid.className;
      }
      
      // Apply single column
      mainGrid.className = mainGrid.className
        .replace('grid-cols-[4.5rem_1fr]', 'grid-cols-1')
        .replace('md:grid-cols-[16.5rem_auto]', '')
        .replace('gap-4', 'gap-2')
        .replace('md:gap-4', '');
    }
    
    // Hide sidebar
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    
    // Hide TOC
    const tocWrapper = document.getElementById('toc-wrapper');
    if (tocWrapper) {
      tocWrapper.style.display = 'none';
    }
  }

  function applyTwoColumnLayout() {
    console.log('LayoutToggle - Applying two column layout');
    
    // Clear localStorage flag
    localStorage.removeItem('oneColumnMode');
    
    // Restore grid layout
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid) {
      if (mainGrid.dataset.originalClasses) {
        mainGrid.className = mainGrid.dataset.originalClasses;
      } else {
        // Fallback restoration
        mainGrid.className = 'transition duration-700 w-full left-0 right-0 grid grid-cols-[4.5rem_1fr] md:grid-cols-[16.5rem_auto] grid-rows-[auto_1fr_auto] md:grid-rows-[auto] mx-auto gap-4 md:gap-4 px-2 md:px-4 relative';
      }
    }
    
    // Show sidebar
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) {
      sidebar.style.display = '';
    }
    
    // Show TOC
    const tocWrapper = document.getElementById('toc-wrapper');
    if (tocWrapper) {
      tocWrapper.style.display = '';
    }
  }

  // Position classes based on prop
  $: positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }[position];
</script>

<!-- Layout Toggle Button -->
<div class="fixed {positionClasses} z-50 flex flex-col items-end gap-2">
  <button
    on:click={toggleLayout}
    disabled={isTransitioning}
    class="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label={isOneColumn ? 'Switch to two column layout' : 'Switch to single column layout'}
    title={isOneColumn ? 'Show sidebar' : 'Hide sidebar'}
  >
    <!-- Icon container -->
    <div class="flex items-center gap-2">
      <!-- Column icon -->
      <div class="relative w-5 h-5 flex items-center justify-center">
        {#if isOneColumn}
          <!-- Single column icon -->
          <svg class="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        {:else}
          <!-- Two column icon -->
          <svg class="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="7" height="16" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
            <rect x="14" y="4" width="7" height="16" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        {/if}
      </div>
      
      <!-- Labels (optional) -->
      {#if showLabels}
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isOneColumn ? 'Show Sidebar' : 'Hide Sidebar'}
        </span>
      {/if}
    </div>
    
    <!-- Loading indicator -->
    {#if isTransitioning}
      <div class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {/if}
  </button>
  
  <!-- Keyboard shortcut hint (optional) -->
  <div class="text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
    Click to toggle layout
  </div>
</div>

<style>
  /* Ensure button stays above other content */
  button {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  /* Smooth icon transitions */
  svg {
    transition: transform 0.2s ease;
  }
  
  button:hover svg {
    transform: scale(1.1);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    button {
      padding: 0.5rem;
    }
  }
</style>