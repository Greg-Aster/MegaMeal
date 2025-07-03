<!-- SpecialPageFeatures.svelte - Centralized layout toggle logic -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let currentPath: string = '';
  export let oneColumn: boolean = false; // ⭐ From frontmatter - now treated as INITIAL state

  let cookbookView = 'gallery'; // 'gallery' or 'list'
  let isOneColumn = false;
  let isTransitioning = false;

  onMount(() => {
    const isCookbookPage = currentPath.includes('cookbook');
    const isFirstContactPage = currentPath.includes('first-contact');
    const isSpecialPage = isCookbookPage || isFirstContactPage;
    
    console.log('SpecialPageFeatures - Current path:', currentPath);
    console.log('SpecialPageFeatures - frontmatter oneColumn:', oneColumn);
    console.log('SpecialPageFeatures - Is special page:', isSpecialPage);
    
    // ⭐ FIXED: Wait for DOM and determine initial layout state
    setTimeout(() => {
      // ⭐ NEW: Check fullscreen mode first (highest priority)
      const isFullscreen = localStorage.getItem('fullscreenMode') === 'true';
      
      if (isFullscreen) {
        // ⭐ Fullscreen mode always forces one column, no toggle allowed
        console.log('Fullscreen mode detected - forcing one column layout');
        isOneColumn = true;
        applyLayoutState(true, true); // true for isFullscreen parameter
      } else {
        // ⭐ Normal mode: Smart state priority system
        const savedUserPreference = localStorage.getItem('oneColumnMode');
        let targetState: boolean;
        
        if (savedUserPreference !== null) {
          // User has made a choice before - respect it (highest priority)
          targetState = savedUserPreference === 'true';
          console.log('Using saved user preference:', targetState);
        } else if (oneColumn !== undefined) {
          // Use frontmatter as initial state (not forced)
          targetState = oneColumn;
          console.log('Using frontmatter initial state:', targetState);
        } else if (isSpecialPage) {
          // Special pages default to one column
          targetState = true;
          console.log('Special page detected, defaulting to one column');
        } else {
          // Default to two column
          targetState = false;
          console.log('Using default two column layout');
        }

        // Set initial state
        isOneColumn = targetState;
        applyLayoutState(targetState, false);
      }
      
      // Handle special page features after layout is set
      if (isCookbookPage) {
        initializeCookbookView();
      }
      
      // ⭐ NEW: Expose toggle function globally for toggle components
      (window as any).toggleLayoutState = toggleLayout;
      (window as any).getLayoutState = () => ({ 
        isOneColumn, 
        isTransitioning,
        isFullscreen: localStorage.getItem('fullscreenMode') === 'true' 
      });
      
      console.log('SpecialPageFeatures - Initialization complete, toggle available globally');
    }, 100);

    // Listen for external layout changes (from other tabs) and fullscreen changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oneColumnMode' && localStorage.getItem('fullscreenMode') !== 'true') {
        // Only respond to oneColumnMode changes when not in fullscreen
        const newState = e.newValue === 'true';
        if (newState !== isOneColumn) {
          isOneColumn = newState;
          applyLayoutState(newState, false);
        }
      } else if (e.key === 'fullscreenMode') {
        // ⭐ Handle fullscreen mode changes
        const isFullscreen = e.newValue === 'true';
        console.log('Fullscreen mode changed:', isFullscreen);
        
        if (isFullscreen) {
          // Entering fullscreen - force one column
          isOneColumn = true;
          applyLayoutState(true, true);
        } else {
          // Exiting fullscreen - restore previous state
          const savedUserPreference = localStorage.getItem('oneColumnMode');
          const targetState = savedUserPreference === 'true';
          isOneColumn = targetState;
          applyLayoutState(targetState, false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // ⭐ Clean up global functions
      delete (window as any).toggleLayoutState;
      delete (window as any).getLayoutState;
    };
  });

  // ⭐ UPDATED: Centralized toggle function that respects fullscreen mode
  function toggleLayout() {
    // ⭐ NEW: Prevent toggle when in fullscreen mode
    const isFullscreen = localStorage.getItem('fullscreenMode') === 'true';
    if (isTransitioning || isFullscreen) {
      console.log('SpecialPageFeatures - Toggle blocked:', isFullscreen ? 'fullscreen mode active' : 'transitioning');
      return false;
    }
    
    console.log('SpecialPageFeatures - Toggling layout from', isOneColumn ? 'one' : 'two', 'to', isOneColumn ? 'two' : 'one', 'column');
    
    isTransitioning = true;
    isOneColumn = !isOneColumn;
    
    applyLayoutState(isOneColumn, false);
    
    // Reset transition flag
    setTimeout(() => {
      isTransitioning = false;
    }, 300);
    
    return true;
  }

  // ⭐ ENHANCED: Centralized layout application with fullscreen awareness
  function applyLayoutState(oneColumnMode: boolean, isFullscreenMode: boolean = false) {
    console.log('Applying layout state:', oneColumnMode ? 'One Column' : 'Two Column', isFullscreenMode ? '(Fullscreen)' : '(Normal)');
    
    // ⭐ Only save user preference when not in fullscreen mode
    if (!isFullscreenMode) {
      if (oneColumnMode) {
        localStorage.setItem('oneColumnMode', 'true');
      } else {
        localStorage.removeItem('oneColumnMode');
      }
    }

    if (oneColumnMode) {
      applyOneColumnLayout(isFullscreenMode);
    } else {
      applyTwoColumnLayout(isFullscreenMode);
    }
    
    // ⭐ Update body classes for CSS targeting
    document.body.setAttribute('data-layout-mode', oneColumnMode ? 'oneColumn' : 'twoColumn');
    document.body.classList.toggle('one-column-mode', oneColumnMode);
    
    // ⭐ Add fullscreen class for additional CSS targeting
    if (isFullscreenMode) {
      document.body.classList.add('fullscreen-mode');
    } else {
      document.body.classList.remove('fullscreen-mode');
    }
  }

  // ⭐ ENHANCED: Robust one column layout application with fullscreen support
  function applyOneColumnLayout(isFullscreenMode: boolean = false) {
    console.log('SpecialPageFeatures - Applying one column layout', isFullscreenMode ? '(Fullscreen)' : '(Normal)');
    
    const mainGrid = document.getElementById('main-grid');
    const sidebar = document.querySelector('#main-grid > div:first-child');
    const tocWrapper = document.getElementById('toc-wrapper');
    
    if (!mainGrid) {
      console.warn('OneColumn - main-grid not found, retrying...');
      setTimeout(() => applyOneColumnLayout(isFullscreenMode), 200);
      return;
    }
    
    // Save original classes before modifying
    if (!mainGrid.dataset.originalClasses) {
      mainGrid.dataset.originalClasses = mainGrid.className;
      console.log('OneColumn - Saved original classes:', mainGrid.className);
    }
    
    // Apply single column: grid-cols-1 and hide sidebar
    mainGrid.className = mainGrid.className
      .replace('grid-cols-[4.5rem_1fr]', 'grid-cols-1')
      .replace('md:grid-cols-[16.5rem_auto]', '')
      .replace('gap-4', 'gap-2')
      .replace('md:gap-4', '');
    
    console.log('OneColumn - Grid classes updated to:', mainGrid.className);
    
    // ⭐ Force hide sidebar with multiple methods for reliability
    if (sidebar) {
      sidebar.style.display = 'none';
      sidebar.style.visibility = 'hidden';
      sidebar.style.opacity = '0';
      sidebar.style.pointerEvents = 'none';
      sidebar.classList.add('force-hidden');
      
      // ⭐ Add additional fullscreen hiding if in fullscreen mode
      if (isFullscreenMode) {
        sidebar.classList.add('fullscreen-hidden');
      }
      
      console.log('OneColumn - Sidebar force hidden', isFullscreenMode ? '(Fullscreen)' : '(Normal)');
    }
    
    // Hide TOC in one column mode
    if (tocWrapper) {
      tocWrapper.style.display = 'none';
      if (isFullscreenMode) {
        tocWrapper.classList.add('fullscreen-hidden');
      }
      console.log('OneColumn - TOC hidden');
    }
    
    // ⭐ Hide banner when in fullscreen mode
    if (isFullscreenMode) {
      const bannerContainer = document.getElementById('banner-container');
      if (bannerContainer) {
        bannerContainer.style.display = 'none';
        bannerContainer.classList.add('fullscreen-hidden');
        console.log('OneColumn - Banner hidden for fullscreen');
      }
    }
    
    console.log('OneColumn - Layout applied successfully');
  }

  // ⭐ ENHANCED: Robust two column layout restoration with fullscreen support
  function applyTwoColumnLayout(isFullscreenMode: boolean = false) {
    console.log('SpecialPageFeatures - Applying two column layout', isFullscreenMode ? '(Fullscreen)' : '(Normal)');
    
    const mainGrid = document.getElementById('main-grid');
    const sidebar = document.querySelector('#main-grid > div:first-child');
    const tocWrapper = document.getElementById('toc-wrapper');
    
    if (!mainGrid) {
      console.warn('TwoColumn - main-grid not found, retrying...');
      setTimeout(() => applyTwoColumnLayout(isFullscreenMode), 200);
      return;
    }
    
    // ⭐ In fullscreen mode, force one column even if two column is requested
    if (isFullscreenMode) {
      console.log('TwoColumn - Overriding to one column due to fullscreen mode');
      applyOneColumnLayout(true);
      return;
    }
    
    // Restore original grid classes
    if (mainGrid.dataset.originalClasses) {
      mainGrid.className = mainGrid.dataset.originalClasses;
      console.log('TwoColumn - Restored from saved classes:', mainGrid.className);
    } else {
      // Fallback restoration
      mainGrid.className = 'transition duration-700 w-full left-0 right-0 grid grid-cols-[4.5rem_1fr] md:grid-cols-[16.5rem_auto] grid-rows-[auto_1fr_auto] md:grid-rows-[auto] mx-auto gap-4 md:gap-4 px-2 md:px-4 relative';
      console.log('TwoColumn - Restored with fallback classes');
    }
    
    // ⭐ Show sidebar with multiple methods for reliability
    if (sidebar) {
      sidebar.style.display = '';
      sidebar.style.visibility = '';
      sidebar.style.opacity = '';
      sidebar.style.pointerEvents = '';
      sidebar.classList.remove('force-hidden', 'fullscreen-hidden');
      console.log('TwoColumn - Sidebar fully restored');
    }
    
    // Show TOC
    if (tocWrapper) {
      tocWrapper.style.display = '';
      tocWrapper.classList.remove('fullscreen-hidden');
      console.log('TwoColumn - TOC restored');
    }
    
    // ⭐ Show banner
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
      bannerContainer.style.display = '';
      bannerContainer.classList.remove('fullscreen-hidden');
      console.log('TwoColumn - Banner restored');
    }
    
    console.log('TwoColumn - Layout applied successfully');
  }

  // ⭐ EXISTING: Cookbook functionality (unchanged)
  function initializeCookbookView() {
    cookbookView = localStorage.getItem('cookbookView') || 'gallery';
    updateCookbookView();
  }

  function setGalleryView() {
    cookbookView = 'gallery';
    localStorage.setItem('cookbookView', 'gallery');
    updateCookbookView();
  }

  function setListView() {
    cookbookView = 'list';
    localStorage.setItem('cookbookView', 'list');
    updateCookbookView();
  }

  function updateCookbookView() {
    const galleryView = document.getElementById('gallery-view');
    const listView = document.getElementById('list-view');
    const galleryBtn = document.getElementById('gallery-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    
    if (!galleryView || !listView || !galleryBtn || !listBtn) return;
    
    if (cookbookView === 'list') {
      galleryView.classList.add('hidden');
      listView.classList.remove('hidden');
      listBtn.className = "px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm";
      galleryBtn.className = "px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white";
    } else {
      galleryView.classList.remove('hidden');
      listView.classList.add('hidden');
      galleryBtn.className = "px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm";
      listBtn.className = "px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white";
    }
  }

  // Expose functions to global scope for external button triggers
  onMount(() => {
    const createHiddenButton = (id: string, handler: () => void) => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.style.display = 'none';
      btn.addEventListener('click', handler);
      document.body.appendChild(btn);
      return btn;
    };

    const galleryBtn = createHiddenButton('gallery-view-trigger', setGalleryView);
    const listBtn = createHiddenButton('list-view-trigger', setListView);

    return () => {
      galleryBtn.remove();
      listBtn.remove();
    };
  });

  // ⭐ ENHANCED: Reset function for debugging
  export function resetSpecialPageState() {
    localStorage.removeItem('oneColumnMode'); // ⭐ Also reset layout state
    localStorage.removeItem('cookbookView');
    localStorage.removeItem('specialPageOriginalState');
    localStorage.removeItem('fullscreenMode');
    localStorage.removeItem('fullscreenBannerOverride');
    document.body.removeAttribute('data-layout-mode');
    document.body.classList.remove('one-column-mode');
    console.log('All special page states reset. Refresh page to test.');
  }
</script>

<!-- This component doesn't render anything visible, it just manages state and behavior -->
<div style="display: none;"></div>

<style>
  /* ⭐ CSS backup for forcing sidebar hidden in oneColumn mode */
  :global(body.one-column-mode #main-grid > div:first-child) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }
  
  /* ⭐ Ensure main content takes full width in oneColumn mode */
  :global(body.one-column-mode #main-grid) {
    grid-template-columns: 1fr !important;
  }

  /* ⭐ Reliable force-hidden class */
  :global(.force-hidden) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* ⭐ NEW: Fullscreen mode overrides - highest priority */
  :global(body.fullscreen-mode #main-grid > div:first-child,
          body.fullscreen-mode #toc-wrapper,
          body.fullscreen-mode #banner-container) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }

  :global(body.fullscreen-mode #main-grid) {
    grid-template-columns: 1fr !important;
  }

  /* ⭐ Fullscreen hidden class for reliable hiding */
  :global(.fullscreen-hidden) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* ⭐ Ensure fullscreen mode takes precedence over all other layout modes */
  :global(body.fullscreen-mode.one-column-mode #main-grid),
  :global(body.fullscreen-mode #main-grid) {
    grid-template-columns: 1fr !important;
    gap: 0.5rem !important;
  }
</style>