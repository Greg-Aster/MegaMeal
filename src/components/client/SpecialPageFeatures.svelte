<!-- SpecialPageFeatures.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let currentPath: string = '';

  let cookbookView = 'gallery'; // 'gallery' or 'list'

  onMount(() => {
    const isCookbookPage = currentPath.includes('cookbook');
    const isFirstContactPage = currentPath.includes('first-contact');
    const isSpecialPage = isCookbookPage || isFirstContactPage;
    
    if (!isSpecialPage) {
      restoreNormalLayout();
      return;
    }
    
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
  });

  function applyFullscreenLayout() {
    // Enable special page settings
    localStorage.setItem('fullscreenMode', 'true');
    localStorage.setItem('fullscreenBannerOverride', 'true');
    document.body.classList.add('force-mobile-view');
    
    // Fix the grid layout - remove responsive classes, add single column
    const mainGrid = document.getElementById('main-grid');
    if (mainGrid) {
      mainGrid.className = mainGrid.className
        .replace('grid-cols-[5rem_1fr]', 'grid-cols-1')
        .replace('md:grid-cols-[16.5rem_auto]', '')
        .replace('gap-2', 'gap-1')
        .replace('md:gap-4', '')
        .replace('md:px-4', '');
    }
    
    // Hide sidebar
    const sidebar = document.querySelector('#main-grid > div:first-child');
    if (sidebar) sidebar.style.display = 'none';
  }

  function restoreNormalLayout() {
    const originalState = localStorage.getItem('specialPageOriginalState');
    
    if (originalState !== null) {
      const wasOriginallyFullscreen = originalState === 'true';
      
      if (!wasOriginallyFullscreen) {
        localStorage.setItem('fullscreenMode', 'false');
        localStorage.removeItem('fullscreenBannerOverride');
        document.body.classList.remove('force-mobile-view');
        
        // Restore normal grid layout
        const mainGrid = document.getElementById('main-grid');
        if (mainGrid) {
          mainGrid.className = mainGrid.className
            .replace('grid-cols-1', 'grid-cols-[5rem_1fr]')
            .replace('gap-1', 'gap-2')
            + ' md:grid-cols-[16.5rem_auto] md:gap-4 md:px-4';
        }
        
        // Show sidebar
        const sidebar = document.querySelector('#main-grid > div:first-child');
        if (sidebar) sidebar.style.display = '';
        
        console.log('Restored to non-fullscreen (original state)');
      } else {
        console.log('Keeping fullscreen (was original state)');
      }
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

  // Reset function for debugging
  export function resetSpecialPageState() {
    localStorage.removeItem('specialPageOriginalState');
    localStorage.removeItem('cookbookView');
    console.log('Special page state reset. Refresh page to test.');
  }
</script>

<!-- This component doesn't render anything visible, it just manages state and behavior -->
<div style="display: none;"></div>

<style>
  /* No styles needed for this component */
</style>