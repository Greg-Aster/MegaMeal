<!--
  ===================================================================
  MOBILE TIMELINE OVERLAY - COMPLETE COMPONENT
  ===================================================================
  
  File: src/components/client/MobileTimelineOverlay.svelte
  
  This component handles mobile-specific timeline banner interactions:
  - Disables timeline touch interactions by default on mobile
  - Provides tap-to-fullscreen functionality
  - Automatically exits fullscreen when navigating to posts
  - Uses existing CSS variables for consistency
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Props
  export let timelineBannerConfig: any = {};
  export let isTimelineBanner: boolean = false;
  
  // State management using existing store pattern
  const isFullscreen = writable(false);
  const isMobile = writable(false);
  const showOverlay = writable(false);
  const isInteractive = writable(false);
  
  // Component state
  let overlayElement: HTMLElement;
  let timelineContainer: HTMLElement | null = null;
  let bannerContainer: HTMLElement | null = null;
  let isInitialized = false;
  let touchStartY = 0;
  let scrollAttempted = false;
  
  // Use existing timing constants
  const SCROLL_THRESHOLD = 20;
  const MOBILE_BREAKPOINT = 768; // md: breakpoint from Tailwind
  
  /**
   * Initialize mobile detection and event listeners
   */
  onMount(() => {
    detectMobileDevice();
    setupEventListeners();
    findTimelineElements();
    initializeOverlayState();
    
    isInitialized = true;
    console.log('🎯 Mobile Timeline Overlay initialized');
  });
  
  /**
   * Cleanup event listeners
   */
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      removeEventListeners();
      exitFullscreenMode();
    }
  });
  
  /**
   * Detect if device is mobile based on existing breakpoint system
   */
  function detectMobileDevice() {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < MOBILE_BREAKPOINT;
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobileDevice = isMobileSize && hasTouchScreen;
      
      isMobile.set(mobileDevice);
      
      if (mobileDevice && isTimelineBanner) {
        showOverlay.set(true);
        disableTimelineInteractions();
      } else {
        showOverlay.set(false);
        enableTimelineInteractions();
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
  }
  
  /**
   * Find timeline-related DOM elements using existing selectors
   */
  function findTimelineElements() {
    if (typeof window === 'undefined') return;
    
    timelineContainer = document.querySelector('.banner-container-timeline');
    bannerContainer = document.querySelector('#banner-container');
    
    if (timelineContainer) {
      console.log('🎯 Timeline container found');
    }
  }
  
  /**
   * Setup event listeners using existing event pattern
   */
  function setupEventListeners() {
    if (typeof window === 'undefined') return;
    
    // Listen for Astro page transitions (existing pattern)
    document.addEventListener('astro:page-load', handlePageNavigation);
    document.addEventListener('astro:before-navigation', handleBeforeNavigation);
    
    // Storage changes for cross-tab communication
    window.addEventListener('storage', handleStorageChange);
    
    // Keyboard accessibility
    document.addEventListener('keydown', handleKeydown);
  }
  
  /**
   * Remove event listeners
   */
  function removeEventListeners() {
    document.removeEventListener('astro:page-load', handlePageNavigation);
    document.removeEventListener('astro:before-navigation', handleBeforeNavigation);
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('keydown', handleKeydown);
  }
  
  /**
   * Initialize overlay state
   */
  function initializeOverlayState() {
    if (!isTimelineBanner) {
      showOverlay.set(false);
      return;
    }
    
    // Check if already in fullscreen mode
    const isCurrentlyFullscreen = localStorage.getItem('timelineFullscreenActive') === 'true';
    if (isCurrentlyFullscreen) {
      enterFullscreenMode();
    }
  }
  
  /**
   * Disable timeline interactions using existing CSS class pattern
   */
  function disableTimelineInteractions() {
    if (!timelineContainer) return;
    
    timelineContainer.classList.add('timeline-interactions-disabled');
    
    const timelineElements = timelineContainer.querySelectorAll('*');
    timelineElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.pointerEvents = 'none';
        el.style.touchAction = 'none';
      }
    });
    
    isInteractive.set(false);
  }
  
  /**
   * Enable timeline interactions
   */
  function enableTimelineInteractions() {
    if (!timelineContainer) return;
    
    timelineContainer.classList.remove('timeline-interactions-disabled');
    
    const timelineElements = timelineContainer.querySelectorAll('*');
    timelineElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.pointerEvents = '';
        el.style.touchAction = '';
      }
    });
    
    isInteractive.set(true);
  }
  
  /**
   * Handle tap on overlay to enter fullscreen mode
   */
  function handleOverlayTap(event: TouchEvent | MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if ($isFullscreen) {
      exitFullscreenMode();
    } else {
      enterFullscreenMode();
    }
  }
  
  /**
   * Handle touch start for scroll detection
   */
  function handleTouchStart(event: TouchEvent) {
    touchStartY = event.touches[0].clientY;
    scrollAttempted = false;
  }
  
  /**
   * Handle touch move to detect scroll attempts
   */
  function handleTouchMove(event: TouchEvent) {
    if (!$isFullscreen) {
      const touchY = event.touches[0].clientY;
      const deltaY = Math.abs(touchY - touchStartY);
      
      if (deltaY > SCROLL_THRESHOLD) {
        scrollAttempted = true;
        return;
      }
    }
  }
  
  /**
   * Handle touch end
   */
  function handleTouchEnd(event: TouchEvent) {
    if (!scrollAttempted && !$isFullscreen) {
      handleOverlayTap(event);
    }
  }
  
  /**
   * Enter fullscreen timeline mode using existing class pattern
   */
  function enterFullscreenMode() {
    if (typeof window === 'undefined') return;
    
    console.log('🚀 Entering timeline fullscreen mode');
    
    isFullscreen.set(true);
    localStorage.setItem('timelineFullscreenActive', 'true');
    
    // Use existing class system
    document.documentElement.classList.add('timeline-fullscreen-active');
    document.body.classList.add('timeline-fullscreen-active');
    
    if (bannerContainer) {
      bannerContainer.classList.add('timeline-fullscreen');
    }
    
    enableTimelineInteractions();
    showOverlay.set(false);
    
    // Emit custom event (existing pattern)
    window.dispatchEvent(new CustomEvent('timeline-fullscreen-enter'));
  }
  
  /**
   * Exit fullscreen timeline mode
   */
  function exitFullscreenMode() {
    if (typeof window === 'undefined') return;
    
    console.log('🎯 Exiting timeline fullscreen mode');
    
    isFullscreen.set(false);
    localStorage.removeItem('timelineFullscreenActive');
    
    document.documentElement.classList.remove('timeline-fullscreen-active');
    document.body.classList.remove('timeline-fullscreen-active');
    
    if (bannerContainer) {
      bannerContainer.classList.remove('timeline-fullscreen');
    }
    
    // Re-enable overlay after transition
    if ($isMobile && isTimelineBanner) {
      setTimeout(() => {
        showOverlay.set(true);
        disableTimelineInteractions();
      }, 300); // Use existing transition timing
    }
    
    window.dispatchEvent(new CustomEvent('timeline-fullscreen-exit'));
  }
  
  /**
   * Handle page navigation (existing Astro pattern)
   */
  function handlePageNavigation() {
    console.log('📱 Page navigation detected');
    
    if ($isFullscreen) {
      exitFullscreenMode();
    }
  }
  
  /**
   * Handle before navigation
   */
  function handleBeforeNavigation() {
    if ($isFullscreen) {
      console.log('📱 Preparing to exit fullscreen for navigation');
    }
  }
  
  /**
   * Handle storage changes for cross-tab communication
   */
  function handleStorageChange(event: StorageEvent) {
    if (event.key === 'timelineFullscreenActive') {
      const isActive = event.newValue === 'true';
      isFullscreen.set(isActive);
      
      if (isActive) {
        enterFullscreenMode();
      } else {
        exitFullscreenMode();
      }
    }
  }
  
  /**
   * Handle keyboard shortcuts
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && $isFullscreen) {
      exitFullscreenMode();
    }
  }
  
  // Reactive visibility using existing store pattern
  $: isVisible = $showOverlay && $isMobile && isTimelineBanner && !$isFullscreen;
</script>

<!-- Mobile Timeline Overlay -->
{#if isVisible}
  <div
    bind:this={overlayElement}
    class="mobile-timeline-overlay"
    role="button"
    tabindex="0"
    aria-label="Tap to enter fullscreen timeline mode"
    on:touchstart|passive={handleTouchStart}
    on:touchmove|passive={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:click={handleOverlayTap}
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleOverlayTap(e);
      }
    }}
  >
    <div class="overlay-content">
      <div class="overlay-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div class="overlay-text">
        <div class="overlay-title">Timeline Interactive</div>
        <div class="overlay-subtitle">Tap to explore fullscreen</div>
      </div>
    </div>
    
    <!-- Scroll hint -->
    <div class="scroll-hint">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 5v14m7-7l-7 7-7-7"/>
      </svg>
      <span>Scroll to continue reading</span>
    </div>
  </div>
{/if}

<!-- Fullscreen exit button -->
{#if $isFullscreen && $isMobile}
  <div class="fullscreen-exit-button">
    <button
      type="button"
      class="exit-btn btn-regular-dark"
      aria-label="Exit fullscreen timeline"
      on:click={exitFullscreenMode}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      <span>Exit</span>
    </button>
  </div>
{/if}

<style>
  /* ===================================================================
   * MOBILE TIMELINE OVERLAY - USING EXISTING CSS VARIABLES
   * ===================================================================
   */
  
  .mobile-timeline-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    background-color: color-mix(in srgb, black 30%, transparent);
    backdrop-filter: blur(2px);
    
    cursor: pointer;
    user-select: none;
    
    transition: opacity var(--transition-normal), backdrop-filter var(--transition-normal);
    
    border-radius: inherit;
    overflow: hidden;
  }
  
  .mobile-timeline-overlay:hover {
    background-color: color-mix(in srgb, black 40%, transparent);
  }
  
  .mobile-timeline-overlay:active {
    background-color: color-mix(in srgb, black 50%, transparent);
  }
  
  /* Timeline interactions disabled state using existing pattern */
  :global(.timeline-interactions-disabled) {
    pointer-events: none !important;
    touch-action: none !important;
  }
  
  :global(.timeline-interactions-disabled *) {
    pointer-events: none !important;
    touch-action: none !important;
  }
  
  /* Overlay content using existing card system */
  .overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    color: white;
    text-align: center;
    
    padding: 2rem;
    border-radius: var(--radius-large);
    background-color: color-mix(in srgb, black 60%, transparent);
    backdrop-filter: blur(8px);
    border: 1px solid color-mix(in srgb, white 20%, transparent);
    
    animation: fadeInUp var(--transition-slow) ease-out;
  }
  
  .overlay-icon {
    opacity: 0.9;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
  
  .overlay-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .overlay-subtitle {
    font-size: 0.875rem;
    opacity: 0.8;
  }
  
  /* Scroll hint using existing animation timing */
  .scroll-hint {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    color: white;
    font-size: 0.75rem;
    opacity: 0.7;
    
    animation: bounce 2s infinite;
  }
  
  /* Fullscreen exit button using existing positioning */
  .fullscreen-exit-button {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 100;
  }
  
  .exit-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    padding: 0.75rem 1rem;
    border-radius: var(--radius-large);
    
    font-size: 0.875rem;
    font-weight: 500;
    
    cursor: pointer;
    user-select: none;
    
    transition: all var(--transition-fast);
    
    backdrop-filter: blur(8px);
  }
  
  .exit-btn:hover {
    transform: translateY(-1px);
  }
  
  .exit-btn:active {
    transform: translateY(0);
  }
  
  /* Animations using existing timing */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    40% {
      transform: translateX(-50%) translateY(-10px);
    }
    60% {
      transform: translateX(-50%) translateY(-5px);
    }
  }
  
  /* Accessibility using existing pattern */
  @media (prefers-reduced-motion: reduce) {
    .mobile-timeline-overlay,
    .overlay-content,
    .exit-btn {
      animation: none;
      transition: none;
    }
    
    .scroll-hint {
      animation: none;
    }
  }
  
  /* High contrast using existing pattern */
  @media (prefers-contrast: high) {
    .mobile-timeline-overlay {
      background-color: color-mix(in srgb, black 80%, transparent);
      border: 2px solid white;
    }
    
    .overlay-content {
      border: 2px solid white;
      background-color: black;
    }
    
    .exit-btn {
      border: 2px solid white;
    }
  }
</style>