<!-- SpecialPageFeatures.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let currentPath: string = '';
  export let oneColumn: boolean = false; // ⭐ NEW: oneColumn prop

  let cookbookView = 'gallery'; // 'gallery' or 'list'

  onMount(() => {
    const isCookbookPage = currentPath.includes('cookbook');
    const isFirstContactPage = currentPath.includes('first-contact');
    const isSpecialPage = isCookbookPage || isFirstContactPage;
    
    console.log('SpecialPageFeatures - Current path:', currentPath);
    console.log('SpecialPageFeatures - oneColumn mode:', oneColumn);
    console.log('SpecialPageFeatures - Is special page:', isSpecialPage);
    
    // ⭐ FIXED: Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // ⭐ NEW: Handle oneColumn mode FIRST
      if (oneColumn) {
        console.log('OneColumn mode detected, applying single column layout');
        applyOneColumnLayout();
        
        if (isCookbookPage) {
          initializeCookbookView();
        }
        return;
      }
      
      // Handle special pages (cookbook, first-contact)
      if (isSpecialPage) {
        const pageType = isCookbookPage ? 'cookbook' : 'first-contact';
        console.log(`${pageType} page detected, enabling fullscreen features`);
        
        // Save original state if not already saved
        if (!localStorage.getItem('specialPageOriginalState')) {
          const originalState = localStorage.getItem('fullscreenMode') === 'true';
          localStorage.setItem('specialPageOriginalState', originalState.toString());
          console.log('Saved original fullscreen state:', originalState);
        }
        
        // Apply fullscreen layout
        applyFullscreenLayout();
        
        if (isCookbookPage) {
          initializeCookbookView();
        }
        return;
      }
      
      // ⭐ NEW: Default case - restore normal layout
      restoreNormalLayout();
    }, 100); // ⭐ FIXED: Small delay to ensure DOM is ready
  });

  // ⭐ NEW: Apply one column layout (different from fullscreen)
  function applyOneColumnLayout() {
    console.log('Applying one column layout');
    
    // Store that we're in oneColumn mode
    localStorage.setItem('oneColumnMode', 'true');
    
    // ⭐ FIXED: Wait for elements to be available
    const mainGrid = document.getElementById('main-grid');
    const sidebar = document.querySelector('#main-grid > div:first-child');
    const tocWrapper = document.getElementById('toc-wrapper');
    
    if (!mainGrid) {
      console.warn('OneColumn - main-grid not found, retrying...');
      setTimeout(() => applyOneColumnLayout(), 200);
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
    
    // Hide sidebar (first child of main-grid)
    if (sidebar) {
      sidebar.style.display = 'none';
      console.log('OneColumn - Sidebar hidden');
    }
    
    // Hide TOC in one column mode
    if (tocWrapper) {
      tocWrapper.style.display = 'none';
      console.log('OneColumn - TOC hidden');
    }
    
    // ⭐ NEW: Add visual indicator for debugging
    document.body.setAttribute('data-layout-mode', 'oneColumn');
    console.log('OneColumn - Layout applied successfully');
  }

  function applyFullscreenLayout() {
    // Enable special page settings
    localStorage.setItem('fullscreenMode', 'true');
    localStorage.setItem('fullscreenBannerOverride', 'true');
    document.body.classList.add('force-mobile-view');
    
    // Fix the grid layout - remove responsive classes, add single column
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid) {
      mainGrid.className = mainGrid.className
        .replace('grid-cols-[4.5rem_1fr]', 'grid-cols-1')
        .replace('md:grid-cols-[16.5rem_auto]', '')
        .replace('gap-4', 'gap-1')
        .replace('md:gap-4', '')
        .replace('md:px-4', '');
    }
    
    // Hide sidebar
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) sidebar.style.display = 'none';
  }

  // ⭐ UPDATED: Enhanced restore function to handle oneColumn mode
  function restoreNormalLayout() {
    console.log('Restoring normal layout');
    
    // Check if we were in oneColumn mode
    const wasOneColumn = localStorage.getItem('oneColumnMode') === 'true';
    
    // Clear oneColumn mode flag
    localStorage.removeItem('oneColumnMode');
    
    // Remove visual indicator
    document.body.removeAttribute('data-layout-mode');
    
    // Handle special page restoration
    const originalState = localStorage.getItem('specialPageOriginalState');
    
    if (originalState !== null) {
      const wasOriginallyFullscreen = originalState === 'true';
      
      if (!wasOriginallyFullscreen) {
        localStorage.setItem('fullscreenMode', 'false');
        localStorage.removeItem('fullscreenBannerOverride');
        document.body.classList.remove('force-mobile-view');
        console.log('Restored from fullscreen special page mode');
      } else {
        console.log('Keeping fullscreen (was original state)');
      }
    }
    
    // ⭐ NEW: Restore grid layout (handles both oneColumn and special page restoration)
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid) {
      // If we have saved original classes, restore them
      if (mainGrid.dataset.originalClasses) {
        mainGrid.className = mainGrid.dataset.originalClasses;
        delete mainGrid.dataset.originalClasses;
        console.log('Restored grid from saved classes:', mainGrid.className);
      } else {
        // Fallback: manually restore standard grid classes
        mainGrid.className = 'transition duration-700 w-full left-0 right-0 grid grid-cols-[4.5rem_1fr] md:grid-cols-[16.5rem_auto] grid-rows-[auto_1fr_auto] md:grid-rows-[auto] mx-auto gap-4 md:gap-4 px-2 md:px-4 relative';
        console.log('Restored grid with fallback classes');
      }
    }
    
    // ⭐ NEW: Always show sidebar when restoring normal layout
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) {
      sidebar.style.display = '';
      console.log('Sidebar restored');
    }
    
    // ⭐ NEW: Restore TOC
    const tocWrapper = document.getElementById('toc-wrapper');
    if (tocWrapper) {
      tocWrapper.style.display = '';
      console.log('TOC restored');
    }
    
    // ⭐ NEW: Restore main content classes
    const mainContent = document.getElementById('main');
    if (mainContent) {
      // Ensure proper column spanning
      if (!mainContent.className.includes('col-span-1')) {
        mainContent.className = mainContent.className + ' col-span-1';
      }
      console.log('Main content classes restored');
    }
  }

  function initializeCookbookView() {
    // Load saved view preference
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
    // Create hidden buttons that external elements can trigger
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

  // ⭐ NEW: Reset function for debugging - enhanced
  export function resetSpecialPageState() {
    localStorage.removeItem('specialPageOriginalState');
    localStorage.removeItem('cookbookView');
    localStorage.removeItem('oneColumnMode'); // ⭐ NEW
    localStorage.removeItem('fullscreenMode');
    localStorage.removeItem('fullscreenBannerOverride');
    document.body.removeAttribute('data-layout-mode'); // ⭐ NEW
    console.log('All special page states reset. Refresh page to test.');
  }
</script>

<!-- This component doesn't render anything visible, it just manages state and behavior -->
<div style="display: none;"></div>

<style>
  /* No styles needed for this component */
</style>