<!-- LayoutToggleMinimal.svelte - Compact version for less visual noise -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  export let defaultToOneColumn: boolean = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  let isOneColumn = true;
  let isTransitioning = false;
  let isFullscreenActive = false; // ⭐ NEW: Track fullscreen state
  let isSpecialPage = false; // ⭐ NEW: Track special pages (cookbook, first-contact)
  let isVisible = true; // ⭐ NEW: Control button visibility

  onMount(() => {
    isOneColumn = defaultToOneColumn;
    isFullscreenActive = localStorage.getItem('fullscreenMode') === 'true'; // ⭐ NEW: Check fullscreen state
    
    // ⭐ NEW: Check if we're on a special page
    const currentPath = window.location.pathname;
    isSpecialPage = currentPath.includes('cookbook') || currentPath.includes('first-contact');
    
    // ⭐ NEW: Update visibility based on fullscreen and special page state
    updateVisibility();
    
    if (defaultToOneColumn && !isFullscreenActive && !isSpecialPage) { // ⭐ NEW: Don't apply if fullscreen or special page is active
      applyOneColumnLayout();
    }

    // ⭐ NEW: Listen for fullscreen state changes
    const handleStorageChange = () => {
      const fullscreenMode = localStorage.getItem('fullscreenMode') === 'true';
      
      if (fullscreenMode !== isFullscreenActive) {
        isFullscreenActive = fullscreenMode;
        updateVisibility();
        
        // If fullscreen becomes active and we're in oneColumn, disable oneColumn
        if (fullscreenMode && isOneColumn) {
          isOneColumn = false;
          applyTwoColumnLayout();
        }
      }
    };
    
    // ⭐ NEW: Listen for DOM changes that might indicate state changes
    const observer = new MutationObserver(() => {
      const currentFullscreen = localStorage.getItem('fullscreenMode') === 'true';
      if (currentFullscreen !== isFullscreenActive) {
        isFullscreenActive = currentFullscreen;
        updateVisibility();
      }
    });
    
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  });

  // ⭐ NEW: Update button visibility based on fullscreen state and special pages
  function updateVisibility() {
    isVisible = !isFullscreenActive && !isSpecialPage;
    console.log('LayoutToggleMinimal visibility updated:', isVisible, 'Fullscreen active:', isFullscreenActive, 'Special page:', isSpecialPage);
  }

  function toggleLayout() {
    if (isTransitioning || isFullscreenActive || isSpecialPage) return; // ⭐ NEW: Prevent toggle if fullscreen is active or on special pages
    
    isTransitioning = true;
    isOneColumn = !isOneColumn;
    
    if (isOneColumn) {
      applyOneColumnLayout();
    } else {
      applyTwoColumnLayout();
    }
    
    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  function applyOneColumnLayout() {
    localStorage.setItem('oneColumnMode', 'true');
    
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid) {
      if (!mainGrid.dataset.originalClasses) {
        mainGrid.dataset.originalClasses = mainGrid.className;
      }
      
      mainGrid.className = mainGrid.className
        .replace('grid-cols-[4.5rem_1fr]', 'grid-cols-1')
        .replace('md:grid-cols-[16.5rem_auto]', '')
        .replace('gap-4', 'gap-2')
        .replace('md:gap-4', '');
    }
    
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) sidebar.style.display = 'none';
    
    const tocWrapper = document.getElementById('toc-wrapper');
    if (tocWrapper) tocWrapper.style.display = 'none';
  }

  function applyTwoColumnLayout() {
    localStorage.removeItem('oneColumnMode');
    
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid && mainGrid.dataset.originalClasses) {
      mainGrid.className = mainGrid.dataset.originalClasses;
    }
    
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) sidebar.style.display = '';
    
    const tocWrapper = document.getElementById('toc-wrapper');
    if (tocWrapper) tocWrapper.style.display = '';
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

<!-- ⭐ NEW: Only render button when visible (not in fullscreen mode) -->
{#if isVisible}
  <!-- Minimal Toggle Button -->
  <button
    on:click={toggleLayout}
    disabled={isTransitioning || isFullscreenActive || isSpecialPage}
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
{/if}

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