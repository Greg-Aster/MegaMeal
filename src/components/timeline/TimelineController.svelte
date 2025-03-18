<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { timelineStore, timelineActions, filteredEvents, selectedEvent } from '../../stores/timelineStore';
  import type { TimelineEvent } from '../../services/TimelineService.client';
  
  // Components
  import TimelineCore from './TimelineCore.svelte';
  import ListView from './TimelineViewModes/ListView.svelte';
  import MapView from './TimelineViewModes/MapView.svelte';
  import TreeView from './TimelineViewModes/TreeView.svelte';
  
  // Props
  export let id: string = "timeline-controller";
  export let category: string = "";
  export let startYear: number | undefined = undefined;
  export let endYear: number | undefined = undefined;
  export let background: string = "/assets/banner/0001.png";
  export let compact: boolean = false;
  export let asBanner: boolean = false;
  export let bannerHeight: string = "500px";
  export let initialEvents: string = "[]"; // Serialized events

  // Local state
  let timelineCore: TimelineCore;
  let loading = true;
  let error: string | null = null;
  let eraConfig = {};
  let isInitialized = false;

  // Safe Event dispatch
  const dispatch = createEventDispatcher();
  
  // Simple safe JSON parse function that doesn't use complex revivers
  function parseEvents(jsonString: string): any[] {
    if (!jsonString || typeof jsonString !== 'string') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing events:", e);
      return [];
    }
  }
  
  // Initialize the component only after mounting
  onMount(() => {
    // Avoid double initialization
    if (isInitialized) return;
    
    try {
      // Parse events first
      const events = parseEvents(initialEvents);
      
      // Process events (ensure year is a number)
      const processedEvents = events.map(event => ({
        ...event,
        year: typeof event.year === 'string' ? parseInt(event.year, 10) : event.year
      }));
      
      // Initialize store props
      if (category) {
        timelineActions.setCategory(category);
      }
      
      if (asBanner) {
        timelineActions.setBannerMode(true);
      }
      
      if (background) {
        timelineActions.setBackground(background);
      }
      
      if (startYear || endYear) {
        timelineActions.setYearRange(
          startYear || null,
          endYear || null
        );
      }
      
      if (compact) {
        timelineActions.toggleCompact();
      }
      
      // Set initial events
      timelineActions.setInitialEvents(processedEvents);
      
      // Extract era configuration - simplified version
      const bannerEvents = processedEvents.filter(event => event.bannerData?.eraConfig);
      if (bannerEvents.length > 0 && bannerEvents[0].bannerData?.eraConfig) {
        eraConfig = bannerEvents[0].bannerData.eraConfig;
      }
      
      // Check for custom background
      const backgroundEvents = processedEvents.filter(event => event.bannerData?.background);
      if (backgroundEvents.length > 0 && backgroundEvents[0].bannerData?.background) {
        timelineActions.setBackground(backgroundEvents[0].bannerData.background);
      }
      
      // Mark as initialized
      isInitialized = true;
      
    } catch (e) {
      console.error("Error initializing timeline:", e);
      error = "Failed to initialize timeline";
    } finally {
      // Always set loading to false, even if there's an error
      loading = false;
    }
    
    // Return cleanup function
    return () => {
      // Any cleanup logic here
    };
  });
  
  // Simple handler functions
  function handleEraFilter(e) {
    try {
      const value = e.target.value;
      const era = value === 'all' ? null : value;
      
      timelineActions.setEra(era);
      
      if (era && era !== 'all-time' && eraConfig[era]) {
        timelineActions.setYearRange(
          eraConfig[era].startYear || null,
          eraConfig[era].endYear || null
        );
      } else if (era === 'all-time' || era === 'all') {
        timelineActions.setYearRange(null, null);
      }
    } catch (err) {
      console.error("Error handling era filter:", err);
    }
  }
  
  function handleResize() {
    // Simple resize handler
  }

  // Safe handlers for timeline actions
  function handleZoomIn() {
    timelineActions.zoomIn();
    if (timelineCore && typeof timelineCore.zoomIn === 'function') {
      timelineCore.zoomIn();
    }
  }
  
  function handleZoomOut() {
    timelineActions.zoomOut();
    if (timelineCore && typeof timelineCore.zoomOut === 'function') {
      timelineCore.zoomOut();
    }
  }
  
  function handlePan(x: number, y: number) {
    timelineActions.pan(x, y);
    if (timelineCore && typeof timelineCore.pan === 'function') {
      timelineCore.pan(x, y);
    }
  }
  
  function handleResetView() {
    timelineActions.resetView();
    if (timelineCore && typeof timelineCore.resetView === 'function') {
      timelineCore.resetView();
    }
  }
  
  function handleSelectEvent(e) {
    if (e && e.detail && e.detail.event && e.detail.event.slug) {
      timelineActions.selectEvent(e.detail.event.slug);
    }
  }
  
  function handleDeselectEvent() {
    timelineActions.selectEvent(null);
  }
  
  function handleSetViewMode(mode) {
    timelineActions.setViewMode(mode);
  }
</script>

<div class="flex flex-col w-full overflow-hidden relative {asBanner ? 'timeline-banner-mode' : ''}" 
     style={asBanner ? `height: ${bannerHeight};` : "height: 500px;"} 
     {id}
     on:timeline:resize={handleResize}>
  
  <!-- Top control bar -->
  <div class="timeline-controls flex items-center justify-between p-1 bg-[var(--card-bg)] border-b border-black/5 dark:border-white/5 z-10 rounded-t-[var(--radius-large)]">
    <div class="flex items-center">
      <!-- Zoom controls -->
      <button on:click={handleZoomOut}
      class="btn-plain w-8 h-8 rounded-md mr-1"
      aria-label="Zoom out">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
      </svg>
      </button>

      <button on:click={handleZoomIn}
      class="btn-plain w-8 h-8 rounded-md mr-3"
      aria-label="Zoom in">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM7.5 10.5h6m-3-3v6" />
      </svg>
    </button>
        
      <div class="h-5 border-r border-black/10 dark:border-white/10 mx-2"></div>
        
      <!-- Pan navigation buttons -->
      <div class="flex flex-col mr-2">
        <button on:click={() => handlePan(0, 30)}
        class="btn-plain w-8 h-8 rounded-md"
        aria-label="Pan up">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
        
        <button on:click={() => handlePan(0, -30)}
                class="btn-plain w-8 h-8 rounded-md"
                aria-label="Pan down">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      
      <div class="flex mr-2">
        <button on:click={() => handlePan(50, 0)}
              class="btn-plain w-8 h-8 rounded-md mr-1"
              aria-label="Pan left">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        
        <button on:click={() => handlePan(-50, 0)}
              class="btn-plain w-8 h-8 rounded-md"
              aria-label="Pan right">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      
      <div class="h-5 border-r border-black/10 dark:border-white/10 mx-2"></div>
      
      <!-- Era filter -->
      <div class="flex items-center">
        <span class="text-xs text-50 mr-2">Era:</span>
        <select on:change={handleEraFilter}
                class="bg-[var(--btn-regular-bg)] text-xs rounded-md p-1 text-[var(--btn-content)]">
          <option value="all">All Eras</option>
          <option value="all-time">All Time</option>
          {#each Object.entries(eraConfig) as [value, config]}
            <option value={value}
                    data-start-year={config.startYear}
                    data-end-year={config.endYear}>
              {config.displayName}
            </option>
          {/each}
        </select>
      </div>
      
      <div class="h-5 border-r border-black/10 dark:border-white/10 mx-2"></div>
      
      <!-- View type switcher -->
      <div class="flex items-center">
        <span class="text-xs text-50 mr-2">View:</span>
        <div class="timeline-view-switcher flex rounded-md overflow-hidden">
          <button 
            on:click={() => handleSetViewMode('timeline')}
            class="timeline-view-btn px-2 py-1 flex items-center text-xs {$timelineStore.viewMode === 'timeline' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)]'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            Timeline
          </button>
          
          <button 
            on:click={() => handleSetViewMode('list')}
            class="timeline-view-btn px-2 py-1 flex items-center text-xs {$timelineStore.viewMode === 'list' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)]'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            List
          </button>
          
          <button 
            on:click={() => handleSetViewMode('tree')}
            class="timeline-view-btn px-2 py-1 flex items-center text-xs {$timelineStore.viewMode === 'tree' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)]'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
            Tree
          </button>
          
          <button 
            on:click={() => handleSetViewMode('map')}
            class="timeline-view-btn px-2 py-1 flex items-center text-xs {$timelineStore.viewMode === 'map' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)]'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Map
          </button>
        </div>
      </div>
    </div>
    
    <!-- Compact view toggle -->
    <div class="view-controls flex items-center">
      <button on:click={() => timelineActions.toggleCompact()}
              class="btn-plain w-8 h-8 rounded-md
                     {$timelineStore.compact ? 'text-[var(--primary)]' : ''}"
              aria-label="Toggle compact view">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Main content area with different views -->
  <div class="timeline-viewport relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing">
    
    <!-- Loading state -->
    {#if loading}
      <div class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[var(--card-bg)]/80 z-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    {/if}
    
    <!-- Error state -->
    {#if error}
      <div class="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-[var(--card-bg)]/90 z-20">
        <div class="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-red-500 mx-auto mb-2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h3 class="text-lg font-bold text-75">Error loading timeline</h3>
          <p class="text-sm text-50">{error}</p>
          <button on:click={() => window.location.reload()}
                  class="mt-3 bg-[var(--primary)] text-white px-4 py-2 rounded-md text-sm">
            Retry
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Timeline View -->
    <div class="w-full h-full {$timelineStore.viewMode !== 'timeline' ? 'hidden' : ''}">
      <TimelineCore
      bind:this={timelineCore}
      events={$filteredEvents}
      {startYear}
      {endYear}
      background={$timelineStore.background}
      compact={$timelineStore.compact}
      {asBanner}
      on:select={handleSelectEvent}
      on:deselect={handleDeselectEvent}
    />
    </div>
    
    <!-- List View -->
    <div class="timeline-view pt-4 relative {$timelineStore.viewMode !== 'list' ? 'hidden' : ''}">
      <ListView 
        events={$filteredEvents} 
        background={$timelineStore.background}
        selectedEvent={$selectedEvent}
        on:select={(e) => timelineActions.selectEvent(e.detail.slug)}
      />
    </div>
    
    <!-- Tree View -->
    <div class="timeline-view pt-4 relative {$timelineStore.viewMode !== 'tree' ? 'hidden' : ''}">
      <TreeView 
        events={$filteredEvents} 
        background={$timelineStore.background}
        selectedEvent={$selectedEvent}
        on:select={(e) => timelineActions.selectEvent(e.detail.slug)}
      />
    </div>
    
    <!-- Map View -->
    <div class="timeline-view pt-4 relative {$timelineStore.viewMode !== 'map' ? 'hidden' : ''}">
      <MapView 
        events={$filteredEvents} 
        background={$timelineStore.background}
        selectedEvent={$selectedEvent}
        on:select={(e) => timelineActions.selectEvent(e.detail.slug)}
      />
    </div>
  </div>
  
<!-- Bottom control bar with year display - STYLED TO MATCH SITE -->
<div class="timeline-footer flex items-center justify-between p-2 w-full bg-[var(--card-bg)] border-t border-black/5 dark:border-white/5 z-10 rounded-b-[var(--radius-large)]">
  <div class="flex items-center">
    <span class="ml-2 text-75">
      Timeline: {startYear || '—'} to {endYear || '—'}
    </span>
  </div>
  
  <div class="flex items-center">
    <button on:click={handleResetView}
            class="bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-regular-bg-hover)] active:bg-[var(--btn-regular-bg-active)] text-[var(--btn-content)] flex items-center text-xs px-3 py-1 rounded-md transition-colors"
            aria-label="Reset view">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
      </svg>
      Reset View
    </button>
  </div>
</div>
</div>

<style>
  /* Minimal styles that can't be achieved with Tailwind */
  .timeline-viewport {
    transform: translateZ(0);
    touch-action: none;
  }
  
  .timeline-banner-mode {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
  
  @media (max-width: 768px) {
    .timeline-controls {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .timeline-view-switcher {
      overflow-x: auto;
      white-space: nowrap;
    }
  }
</style>