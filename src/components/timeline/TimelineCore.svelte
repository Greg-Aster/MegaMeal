<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import StarNode from './StarNode.svelte';
  import TimelineCard from './TimelineCard.svelte';
  import TimelineNavigation from './TimelineNavigation.svelte';
  import type { TimelineEvent } from '../../services/TimelineService.client';

  // Props
  export let events: TimelineEvent[] = [];
  export let startYear: number | undefined = undefined;
  export let endYear: number | undefined = undefined;
  export let background: string = '/assets/banner/0001.png';
  export let compact: boolean = false;
  export let asBanner: boolean = false;
  
  // Internal state
  let timelineContainer: HTMLElement;
  let selectedEvent: TimelineEvent | null = null;
  let hoveredEvent: TimelineEvent | null = null;
  let containerWidth: number = 0;
  let containerHeight: number = 0;
  let padding = 15; // percentage padding on timeline edges
  let isMobile = false; // Track if we're in mobile view
  let isNavigating = false; // Track if we're navigating to a new page
  let fadeOverlayVisible = true; // Start with fade overlay visible
  let isTouchActive = false;
  let hoverTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const hoverOutDelay = 300; // Delay in ms before hiding the card
  
  // Navigation state bound from the TimelineNavigation component
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  
  // Component references
  let navigation: TimelineNavigation;
  
  const dispatch = createEventDispatcher();
  
  // Calculate actual time range from events
  $: {
    if (!startYear || !endYear) {
      if (events.length > 0) {
        const years = events.map(event => event.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        // Add padding
        const yearPadding = Math.max(5, Math.ceil((maxYear - minYear) * 0.1));
        
        if (!startYear) startYear = minYear - yearPadding;
        if (!endYear) endYear = maxYear + yearPadding;
      } else {
        startYear = startYear || 2000;
        endYear = endYear || 2100;
      }
    }
  }
  
  // Calculate timespan - ensure it has a non-zero value
  $: timespan = Math.max(1, (endYear || 2100) - (startYear || 2000));
  
  // Calculate horizontal/vertical position for each event
  function getPositionPercentage(year: number): number {
    if (timespan === 0) return 50;
    
    // Clamp year to our display range
    const clampedYear = Math.max(startYear || 0, Math.min(endYear || 3000, year));
    
    // Calculate base percentage
    const basePercentage = ((clampedYear - (startYear || 0)) / timespan) * 100;
    
    // Apply padding to spread events away from edges
    return padding + (basePercentage * (100 - (2 * padding)) / 100);
  }
  
  // Generate positions for events on the timeline
  $: eventPositions = events.map((event, index) => {
    // For timeline position (horizontal in desktop, vertical in mobile)
    const posPercentage = getPositionPercentage(event.year);
    
    // Create deterministic but varied vertical offset
    // This ensures the same event always has the same position
    const seed = (event.slug.charCodeAt(0) + index) * 11 + event.year % 100;
    const randomFactor = ((seed * 9301 + 49297) % 233280) / 233280;
    
    // For mobile, distribute horizontally instead of vertically
    // For desktop, distribute vertically from the center line
    let offsetPosition;
    
    if (isMobile) {
      // In mobile: horizontal distribution across the width
      // Distribute events to both sides of the center vertical line
      offsetPosition = (randomFactor * 2 - 1) * 100;
    } else {
      // In desktop: vertical distribution from the center line
      offsetPosition = (randomFactor * 2 - 1) * 100;
    }
    
    // Ensure values stay within reasonable bounds
    offsetPosition = Math.max(-100, Math.min(100, offsetPosition));
    
    // Assign one of the 5 float animation classes (based on hash of slug for consistency)
    const floatClass = `floating-animation-${(seed % 5) + 1}`;
    
    return {
      event,
      timelinePosition: posPercentage, // % along the primary timeline axis
      offsetPosition,   // px offset from the timeline (initial position)
      floatClass        // Animation class for floating effect
    };
  });
  
  // Setup direct event handlers
  function setupDirectEventHandlers() {
    if (!timelineContainer) return;
    
    // Handle clicks on event elements using event delegation
    timelineContainer.addEventListener('click', (e) => {
      // Find if we clicked on an event node
      const target = e.target as HTMLElement;
      const eventNode = target.closest('.event-node');
      
      if (eventNode) {
        // Don't process click events on mobile - handled by touch
        if (isMobile) return;
        
        // Get the event slug from the data attribute
        const slug = eventNode.getAttribute('data-slug');
        if (!slug) return;
        
        // Stop event propagation
        e.stopPropagation();
        
        // Find the corresponding event
        const event = events.find(evt => evt.slug === slug);
        if (!event) return;
        
        // If already selected, navigate to post
        if (selectedEvent && selectedEvent.slug === slug) {
          navigateToPost(slug);
        } else {
          // Otherwise, select this event
          selectedEvent = event;
          dispatch('select', { event });
        }
      } else if (target === timelineContainer || target.classList.contains('timeline-container')) {
        // Click on background
        selectedEvent = null;
        hoveredEvent = null;
        dispatch('deselect');
      }
    });
    
    // Handle hover events with delay
    timelineContainer.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const eventNode = target.closest('.event-node');
      
      if (eventNode) {
        const slug = eventNode.getAttribute('data-slug');
        if (!slug) return;
        
        const event = events.find(evt => evt.slug === slug);
        if (!event || (selectedEvent && selectedEvent.slug === slug)) return;
        
        // Cancel any pending hide timeout
        if (hoverTimeoutId) {
          clearTimeout(hoverTimeoutId);
          hoverTimeoutId = null;
        }
        
        hoveredEvent = event;
      }
    });
    
    timelineContainer.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      const eventNode = target.closest('.event-node');
      
      if (eventNode) {
        const slug = eventNode.getAttribute('data-slug');
        if (!slug) return;
        
        if (hoveredEvent && hoveredEvent.slug === slug) {
          // Set timeout to hide the card after delay
          if (hoverTimeoutId) {
            clearTimeout(hoverTimeoutId);
          }
          
          hoverTimeoutId = setTimeout(() => {
            hoveredEvent = null;
            hoverTimeoutId = null;
          }, hoverOutDelay);
        }
      }
    });
  }
  
  // Navigate to a post with fade transition
  function navigateToPost(slug: string) {
    // Show the fade overlay
    isNavigating = true;
    fadeOverlayVisible = true;
    
    // Wait for the fade-in animation to complete before navigating
    setTimeout(() => {
      window.location.href = `/posts/${slug}/`;
    }, 300); // Match this to the CSS transition duration
  }
  
  // Event handlers for mouse/touch events that delegate to the navigation component
  
  function startDrag(e: MouseEvent) {
    // Ignore drags that start on event elements
    if ((e.target as HTMLElement).closest('.event-node')) {
      return;
    }
    
    const result = navigation.handleMouseDown(e.clientX, e.clientY);
    if (result) {
      document.body.style.cursor = 'grabbing';
      
      // Add class for styling
      if (timelineContainer) {
        timelineContainer.classList.add('dragging');
      }
    }
  }
  
  function drag(e: MouseEvent) {
    navigation.handleMouseMove(e.clientX, e.clientY);
  }
  
  function endDrag() {
    const result = navigation.handleMouseUp();
    if (result) {
      document.body.style.cursor = '';
      
      // Remove dragging class
      if (timelineContainer) {
        timelineContainer.classList.remove('dragging');
      }
    }
  }
  
  // Handle double-click to zoom
  function handleDoubleClick(e: MouseEvent) {
    // Ignore double-clicks on event elements
    if ((e.target as HTMLElement).closest('.event-node')) {
      return;
    }
    
    // Prevent default browser behavior
    e.preventDefault();
    
    // Get the position of the double-click relative to the container
    const rect = timelineContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    navigation.handleDoubleClick(clickX, clickY);
  }
  
  // Touch handlers
  function handleTouchStart(e: TouchEvent) {
    // Store the target element
    const touchTarget = e.target as HTMLElement;
    
    // Check if touch is on an event node
    const isOnEventNode = !!touchTarget.closest('.event-node');
    
    // Only prevent default if not touching on an event node
    if (!isOnEventNode) {
      e.preventDefault();
    }
    
    // Delegate to navigation
    const touchActive = navigation.handleTouchStart(e.touches, isOnEventNode);
    
    // Add dragging class only if not touching an event node
    if (timelineContainer && !isOnEventNode && touchActive) {
      timelineContainer.classList.add('dragging');
    }
  }
  
  function handleTouchMove(e: TouchEvent) {
    // Check if touch is on an event node
    const touchTarget = e.target as HTMLElement;
    const isOnEventNode = !!touchTarget.closest('.event-node');
    
    // Only prevent default if not on an event node
    if (!isOnEventNode) {
      e.preventDefault();
    }
    
    // Delegate to navigation
    navigation.handleTouchMove(e.touches, isOnEventNode);
  }
  
  function handleTouchEnd(e: TouchEvent) {
    // Delegate to navigation
    const result = navigation.handleTouchEnd(e.touches);
    
    // If it was a tap
    if (result.wasTap) {
      // Check if we tapped on an event node
      const touchTarget = e.target as HTMLElement;
      const eventNode = touchTarget.closest('.event-node');
      
      if (eventNode) {
        // Get the event slug from the data attribute
        const slug = eventNode.getAttribute('data-slug');
        if (slug) {
          // Find the corresponding event
          const event = events.find(evt => evt.slug === slug);
          if (event) {
            e.preventDefault(); // Prevent any default browser handling
            
            // Check if this is the same event that's already selected
            if (selectedEvent && selectedEvent.slug === slug) {
              // Double tap detection
              if (result.wasDoubleTap) {
                navigateToPost(slug);
              }
            } else {
              // First tap on this event - just select it
              selectedEvent = event;
              dispatch('select', { event });
            }
          }
        }
      } else if (touchTarget === timelineContainer || touchTarget.classList.contains('timeline-container')) {
        // Tap on background - deselect current selection if any
        if (selectedEvent) {
          selectedEvent = null;
          hoveredEvent = null;
          dispatch('deselect');
        }
      }
    }
    
    // Remove dragging class
    if (timelineContainer) {
      timelineContainer.classList.remove('dragging');
    }
  }
  
  // Handle touch active state changes
  function handleTouchActiveChange(e) {
    isTouchActive = e.detail.isTouchActive;
  }
  
  // Check if we're in mobile view
  function checkMobileView() {
    isMobile = window.innerWidth < 768; // Standard mobile breakpoint
    handleResize();
  }
  
  // Define a named function for orientation change handling
  function handleOrientationChange() {
    // Show fade overlay during orientation change
    fadeOverlayVisible = true;
    
    // Recalculate dimensions and update mobile state
    checkMobileView();
    handleResize();
    
    // After orientation change completes, hide overlay and update dimensions again
    setTimeout(() => {
      fadeOverlayVisible = false;
      checkMobileView();
      handleResize();
    }, 600); // Slightly longer than the CSS transition
  }
  
  // Define a named function for resize handling
  function handleResizeEvent() {
    checkMobileView();
    handleResize();
  }
  
  // Set up and tear down event listeners
  onMount(() => {
    if (timelineContainer) {
      // Set up direct DOM event handlers
      setupDirectEventHandlers();
      
      // Add touch event listeners
      timelineContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      timelineContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      timelineContainer.addEventListener('touchend', handleTouchEnd);
      timelineContainer.addEventListener('touchcancel', handleTouchEnd);
      // Add double-click handler for desktop zoom
      timelineContainer.addEventListener('dblclick', handleDoubleClick);
      
      // Add orientation change listener with named function
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    // Check mobile view
    checkMobileView();
    
    // Attach global mouse event handlers
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
    
    // Initial resize
    handleResize();
    
    // Handle resize events with named function
    window.addEventListener('resize', handleResizeEvent);
    
    // Expose the control functions to the global scope via the navigation component
    if (typeof window !== 'undefined') {
      window.timelineControls = window.timelineControls || {};
      window.timelineControls.zoomIn = () => navigation.zoomIn();
      window.timelineControls.zoomOut = () => navigation.zoomOut();
      window.timelineControls.resetView = () => {
        navigation.resetView();
        selectedEvent = null;
      };
      window.timelineControls.pan = (deltaX, deltaY) => navigation.pan(deltaX, deltaY);
    }
    
    // Fade in the content after initial load
    setTimeout(() => {
      fadeOverlayVisible = false;
    }, 300);
    
    return () => {
      // Remove event listeners with proper references to the handler functions
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('resize', handleResizeEvent);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (timelineContainer) {
        timelineContainer.removeEventListener('touchstart', handleTouchStart);
        timelineContainer.removeEventListener('touchmove', handleTouchMove);
        timelineContainer.removeEventListener('touchend', handleTouchEnd);
        timelineContainer.removeEventListener('touchcancel', handleTouchEnd);
        timelineContainer.removeEventListener('dblclick', handleDoubleClick);
      }
    };
  });
  
  // Handle window resize
  function handleResize() {
    if (timelineContainer) {
      containerWidth = timelineContainer.offsetWidth;
      containerHeight = timelineContainer.offsetHeight;
    }
  }
  
  // Reset state when component updates
  onDestroy(() => {
    selectedEvent = null;
    hoveredEvent = null;
    
    // Clear any pending hover timeout
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      hoverTimeoutId = null;
    }
  });
  
  // Public methods exposed to parent
  export function zoomIn() {
    navigation.zoomIn();
  }
  
  export function zoomOut() {
    navigation.zoomOut();
  }
  
  export function resetView() {
    navigation.resetView();
    selectedEvent = null;
  }
  
  export function pan(deltaX: number, deltaY: number) {
    navigation.pan(deltaX, deltaY);
  }
  
  // Calculate background transform using navigation helper
  $: backgroundTransform = navigation ? navigation.getBackgroundTransform() : '';
</script>

<div class="card-base relative overflow-hidden {asBanner ? 'h-full rounded-none' : 'h-[300px] md:h-[300px]'} {compact ? 'compact-mode' : ''}" 
     data-start-year={startYear} 
     data-end-year={endYear}>

  <!-- TimelineNavigation component (no UI) -->
  <TimelineNavigation 
    bind:this={navigation}
    bind:scale
    bind:offsetX
    bind:offsetY
    bind:isMobile
    bind:containerWidth
    bind:containerHeight
    on:touchActiveChange={handleTouchActiveChange}
  />

  <!-- Fade overlay for transitions -->
  {#if fadeOverlayVisible || isNavigating}
    <div class="fade-overlay absolute inset-0 bg-black z-50 {fadeOverlayVisible ? 'opacity-100' : 'opacity-0'}" 
         style="transition: opacity 400ms ease-in-out;"></div>
  {/if}

  <!-- Background with parallax effect -->
  <div class="absolute inset-0 z-0 overflow-hidden">
    <img 
      src={background} 
      alt="Timeline background" 
      class="w-full h-full object-cover transition-transform duration-300 ease-out"
      style="transform: {backgroundTransform};"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-[oklch(0.25_0.05_var(--hue))] to-[oklch(0.15_0.05_var(--hue))] opacity-20 dark:opacity-20 backdrop-blur-[2px]"></div>
  </div>
  
  <!-- Starfield effect -->
  <div class="absolute inset-0 z-0">
    <div class="w-full h-full starfield-overlay"></div>
  </div>
  
  <!-- Timeline container -->
  <div class="timeline-container relative z-10 w-full h-full cursor-grab active:cursor-grabbing {isTouchActive ? 'touch-active' : ''}"
       bind:this={timelineContainer}
       on:mousedown={startDrag}
       role="application"
       aria-label="Interactive timeline visualization"
       tabindex="0"
       style="transform: scale({scale}) translate({offsetX/scale}px, {offsetY/scale}px);">
    
    <!-- Center line - horizontal for desktop, vertical for mobile -->
    <div class="timeline-center-line absolute {isMobile ? 'h-full w-[2px] left-1/2 bg-gradient-to-b' : 'w-full h-[2px] top-1/2 bg-gradient-to-r'} from-transparent via-[oklch(0.7_0.08_var(--hue))] to-transparent opacity-50"></div>
    
    <!-- Year markers -->
    <div class="timeline-start-marker absolute {isMobile ? 'top-[15%] h-[4px] left-[40%] right-[60%]' : 'left-[15%] w-[4px] top-[40%] bottom-[60%]'} bg-[oklch(0.7_0.2_var(--hue))] opacity-60 rounded-full"></div>
    <div class="timeline-end-marker absolute {isMobile ? 'bottom-[15%] h-[4px] left-[40%] right-[60%]' : 'right-[15%] w-[4px] top-[40%] bottom-[60%]'} bg-[oklch(0.7_0.2_var(--hue))] opacity-60 rounded-full"></div>

    <!-- Events -->
    {#each eventPositions as { event, timelinePosition, offsetPosition, floatClass }, i}
      <!-- Event container with positioning for both desktop and mobile -->
      <div 
        class="timeline-event absolute {isMobile ? 'timeline-event-mobile' : 'timeline-event-desktop'} {!isMobile ? floatClass : ''}"
        style={isMobile ? 
          `top: ${timelinePosition}%; left: 50%; transform: translate(${offsetPosition}px, 0) scale(${1/scale});` : 
          `left: ${timelinePosition}%; top: 50%; transform: translate(0, ${offsetPosition}px) scale(${1/scale});`
        }
      >
        <!-- Star node with data attributes for DOM event handling -->
        <div 
          class="event-node absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          data-slug={event.slug}
          data-year={event.year}
          data-era={event.era}
        >
        <StarNode 
        era={event.era} 
        isKeyEvent={event.isKeyEvent} 
        isSelected={selectedEvent?.slug === event.slug}
        isHovered={hoveredEvent?.slug === event.slug}
        size={event.isKeyEvent ? 5 : 4}
      />
    </div>
        
        <!-- Only show card if this event is selected or hovered AND NOT in mobile mode -->
        {#if (selectedEvent?.slug === event.slug || hoveredEvent?.slug === event.slug) && !isMobile}
          <TimelineCard 
            {event} 
            isSelected={selectedEvent?.slug === event.slug}
            compact={compact}
            position={offsetPosition < 0 ? 'top' : 'bottom'}
            isMobile={false}
          />
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Fixed mobile card container - now uses fixed positioning instead of being inside the scrollable area -->
  {#if isMobile && (selectedEvent || hoveredEvent)}
    <div class="fixed-mobile-card-container">
      <TimelineCard 
        event={selectedEvent || hoveredEvent}
        isSelected={!!selectedEvent}
        {compact}
        position="bottom"
        isMobile={true}
      />
    </div>
  {/if}
  
  <!-- Empty state -->
  {#if events.length === 0}
    <div class="flex flex-col items-center justify-center py-10 text-center">
      <div class="text-6xl text-[var(--primary)] mb-4">
        <svg viewBox="0 0 24 24" class="w-16 h-16">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                fill="currentColor" stroke="white" stroke-width="1" />
        </svg>
      </div>
      <div class="text-75 font-bold">No timeline events found</div>
      <div class="text-50 text-sm mt-2">
        Add timelineYear property to your post frontmatter to create timeline events
      </div>
      <div class="card-base bg-[var(--btn-plain-bg-hover)] p-4 mt-4 max-w-md">
        <code class="text-xs">
          ---<br>
          title: "My Timeline Event"<br>
          timelineYear: 2025<br>
          timelineEra: "your-era"<br>
          isKeyEvent: true<br>
          ---
        </code>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Optimization for mobile */
  @media (max-width: 767px) {
    .timeline-container {
      will-change: transform;
      backface-visibility: hidden;
    }
    
    .timeline-event {
      will-change: transform;
    }
    
    /* Fix flickering on iOS */
    .fixed-mobile-card-container {
      transform: translateZ(0);
    }
  }
  
  /* During touch, make transitions immediate */
  .touch-active {
    transition: none !important;
  }
  
  .touch-active * {
    transition: none !important;
  }
  
  /* Prevent outline on focus */
  .timeline-container:focus {
    outline: none;
  }
  
  /* Add smooth transition for timeline cards (for hover delay) */
  :global(.timeline-card) {
    transition: opacity 0.2s ease-in, transform 0.25s ease-out;
  }

  /* Add floating animation classes */
  .floating-animation-1 {
    animation: float1 35s infinite ease-in-out;
  }

  .floating-animation-2 {
    animation: float2 40s infinite ease-in-out;
    animation-delay: -8s;
  }

  .floating-animation-3 {
    animation: float3 45s infinite ease-in-out;
    animation-delay: -15s;
  }

  .floating-animation-4 {
    animation: float4 50s infinite ease-in-out;
    animation-delay: -22s;
  }

  .floating-animation-5 {
    animation: float5 55s infinite ease-in-out;
    animation-delay: -30s;
  }

  /* Keyframes with larger Y movements */
  @keyframes float1 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(44px); }
  }

  @keyframes float2 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-60px); }
  }

  @keyframes float3 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(52px); }
  }

  @keyframes float4 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-48px); }
  }

  @keyframes float5 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(36px); }
  }
</style>