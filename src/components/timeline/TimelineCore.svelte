<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import StarNode from './StarNode.svelte';
  import TimelineCard from './TimelineCard.svelte';
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
  let isMobile = false;
  let isAndroid = false;
  
  // Svelte store for animated values - reduce animation duration on mobile
  const scale = tweened(1, {
    duration: 300,
    easing: cubicOut
  });
  const offsetX = tweened(0, {
    duration: 300,
    easing: cubicOut
  });
  const offsetY = tweened(0, {
    duration: 300,
    easing: cubicOut
  });
  
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
  
  // Calculate position for each event
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
    const posPercentage = getPositionPercentage(event.year);
    
    // Generate a consistent vertical position based on event properties
    // Using both slug and index for better distribution
    const seed = (event.slug.charCodeAt(0) + index) * 11 + event.year % 100;
    const randomFactor = ((seed * 9301 + 49297) % 233280) / 233280;
    
    // Position between -120px and +120px with bell curve distribution
    let verticalOffset = (randomFactor * 2 - 1) * 240;
    verticalOffset = Math.sign(verticalOffset) * Math.pow(Math.abs(verticalOffset) / 120, 1.5) * 120;
    
    // Ensure stars stay within reasonable bounds
    verticalOffset = Math.max(-140, Math.min(140, verticalOffset));

    // On mobile, use a simplified positioning approach
    if (isMobile) {
      // Reduce the vertical spread for better visibility
      verticalOffset = verticalOffset * 0.7;
    }
    
    return {
      event,
      horizontalPosition: posPercentage,
      verticalPosition: verticalOffset
    };
  });

  // Limit number of events shown on mobile
  $: displayEvents = isMobile ? eventPositions.slice(0, 15) : eventPositions;
  
  /**
   * DIRECT DOM EVENT HANDLERS
   * Using these instead of Svelte's event bindings for more reliable behavior
   */
  function setupDirectEventHandlers() {
    if (!timelineContainer) return;
    
    // Use a single handler for both touch and mouse events
    const handleEventSelection = (e) => {
      // Prevent default action for touch events
      if (e.type.includes('touch')) {
        e.preventDefault();
      }
      
      // Get correct target regardless of event type
      const targetEvent = e.type.includes('touch') ? e.changedTouches[0] : e;
      const target = document.elementFromPoint(
        targetEvent.clientX, 
        targetEvent.clientY
      ) as HTMLElement;
      
      // Find if we clicked on an event node
      const eventNode = target?.closest('.event-node');
      
      if (eventNode) {
        // Get the event slug from the data attribute
        const slug = eventNode.getAttribute('data-slug');
        if (!slug) return;
        
        // Stop event propagation
        e.stopPropagation();
        
        // Find the corresponding event
        const event = events.find(evt => evt.slug === slug);
        if (!event) return;
        
        console.log("DOM interaction on event:", event.title, "Slug:", slug);
        
        // If already selected, navigate to post
        if (selectedEvent && selectedEvent.slug === slug) {
          console.log("Navigating to:", `/posts/${slug}/`);
          window.location.href = `/posts/${slug}/`;
        } else {
          // Otherwise, select this event
          console.log("Selecting event:", event.title);
          selectedEvent = event;
          dispatch('select', { event });
          
          // Update UI to reflect selection
          setTimeout(() => updateSelectionState(), 0);
        }
      } else if (
        target === timelineContainer || 
        target?.classList.contains('timeline-container') ||
        target?.closest('.timeline-container')
      ) {
        // Click on background
        console.log("Click on background, clearing selection");
        selectedEvent = null;
        hoveredEvent = null;
        dispatch('deselect');
        
        // Update UI
        setTimeout(() => updateSelectionState(), 0);
      }
    };
    
    // Add click handler for non-touch devices
    timelineContainer.addEventListener('click', handleEventSelection);
    
    // Add touch handler for touch devices
    timelineContainer.addEventListener('touchend', handleEventSelection, { passive: false });
    
    // Handle hover events - only on non-mobile
    if (!isMobile) {
      timelineContainer.addEventListener('mouseover', (e) => {
        const target = e.target as HTMLElement;
        const eventNode = target.closest('.event-node');
        
        if (eventNode) {
          const slug = eventNode.getAttribute('data-slug');
          if (!slug) return;
          
          const event = events.find(evt => evt.slug === slug);
          if (!event || (selectedEvent && selectedEvent.slug === slug)) return;
          
          hoveredEvent = event;
          updateHoverState();
        }
      });
      
      timelineContainer.addEventListener('mouseout', (e) => {
        const target = e.target as HTMLElement;
        const eventNode = target.closest('.event-node');
        
        if (eventNode) {
          const slug = eventNode.getAttribute('data-slug');
          if (!slug) return;
          
          if (hoveredEvent && hoveredEvent.slug === slug) {
            hoveredEvent = null;
            updateHoverState();
          }
        }
      });
    }
  }
  
  // Update DOM to reflect selection state
  function updateSelectionState() {
    if (!timelineContainer) return;
    
    // First, remove all selection states
    const allEventNodes = timelineContainer.querySelectorAll('.event-node');
    allEventNodes.forEach(node => {
      // Find the corresponding StarNode component
      const starNode = node.querySelector('.star-node');
      if (starNode) {
        starNode.classList.remove('is-selected');
      }
      
      // Find any card elements
      const card = node.nextElementSibling;
      if (card && card.classList.contains('timeline-card')) {
        card.classList.add('hidden');
      }
    });
    
    // Then set the selection state for the selected event
    if (selectedEvent) {
      const selectedNode = timelineContainer.querySelector(`.event-node[data-slug="${selectedEvent.slug}"]`);
      if (selectedNode) {
        // Find the StarNode
        const starNode = selectedNode.querySelector('.star-node');
        if (starNode) {
          starNode.classList.add('is-selected');
        }
        
        // Find the card and show it
        const card = selectedNode.nextElementSibling;
        if (card && card.classList.contains('timeline-card')) {
          card.classList.remove('hidden');
        }
      }
    }
  }
  
  // Update DOM to reflect hover state
  function updateHoverState() {
    if (!timelineContainer) return;
    
    // First, remove all hover states
    const allEventNodes = timelineContainer.querySelectorAll('.event-node');
    allEventNodes.forEach(node => {
      const starNode = node.querySelector('.star-node');
      if (starNode) {
        starNode.classList.remove('is-hovered');
      }
      
      // Find any card elements that aren't for selected events
      const slug = node.getAttribute('data-slug');
      if (slug && (!selectedEvent || selectedEvent.slug !== slug)) {
        const card = node.nextElementSibling;
        if (card && card.classList.contains('timeline-card')) {
          card.classList.add('hidden');
        }
      }
    });
    
    // Then set the hover state for the hovered event
    if (hoveredEvent) {
      const hoveredNode = timelineContainer.querySelector(`.event-node[data-slug="${hoveredEvent.slug}"]`);
      if (hoveredNode) {
        const starNode = hoveredNode.querySelector('.star-node');
        if (starNode) {
          starNode.classList.add('is-hovered');
        }
        
        // Only show card if not selected
        if (!selectedEvent || selectedEvent.slug !== hoveredEvent.slug) {
          const card = hoveredNode.nextElementSibling;
          if (card && card.classList.contains('timeline-card')) {
            card.classList.remove('hidden');
          }
        }
      }
    }
  }
  
  // Simple drag handling for panning
  let isDragging = false;
  let startDragX = 0;
  let startDragY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;
  
  function startDrag(e) {
    // Handle both mouse and touch events
    const isTouch = e.type.includes('touch');
    
    // Get coordinates
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    // Ignore drags that start on event elements
    if (isTouch) {
      const touchTarget = document.elementFromPoint(clientX, clientY);
      if (touchTarget?.closest('.event-node')) {
        return;
      }
    } else if ((e.target as HTMLElement).closest('.event-node')) {
      return;
    }
    
    isDragging = true;
    startDragX = clientX;
    startDragY = clientY;
    startOffsetX = $offsetX;
    startOffsetY = $offsetY;
    
    if (!isTouch) {
      document.body.style.cursor = 'grabbing';
    }
    
    // Add class for styling
    if (timelineContainer) {
      timelineContainer.classList.add('dragging');
    }
    
    // Prevent default for touch events
    if (isTouch) {
      e.preventDefault();
    }
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    // Handle both mouse and touch events
    const isTouch = e.type.includes('touch');
    if (isTouch && e.touches.length === 0) return;
    
    // Get coordinates
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startDragX;
    const deltaY = clientY - startDragY;
    
    // Use direct DOM transforms for smoother performance on mobile
    if (isMobile && timelineContainer) {
      const currentScale = $scale;
      const newX = startOffsetX + deltaX;
      const newY = startOffsetY + deltaY;
      
      // Apply transform directly for better performance
      timelineContainer.style.transform = `scale(${currentScale}) translate(${newX/currentScale}px, ${newY/currentScale}px)`;
    } else {
      // Use Svelte's tweened store for smoother animations on desktop
      offsetX.set(startOffsetX + deltaX);
      offsetY.set(startOffsetY + deltaY);
    }
    
    // Prevent default for touch events
    if (isTouch) {
      e.preventDefault();
    }
  }
  
  function endDrag(e) {
    if (!isDragging) return;
    
    const isTouch = e.type.includes('touch');
    
    isDragging = false;
    
    if (!isTouch) {
      document.body.style.cursor = '';
    }
    
    // On mobile, update the tweened stores to match the current position
    if (isMobile && timelineContainer) {
      const transform = timelineContainer.style.transform;
      const match = transform.match(/translate\(([^p]+)px, ([^p]+)px\)/);
      
      if (match) {
        const currentScale = $scale;
        const x = parseFloat(match[1]) * currentScale;
        const y = parseFloat(match[2]) * currentScale;
        
        offsetX.set(x);
        offsetY.set(y);
      }
    }
    
    // Remove dragging class
    if (timelineContainer) {
      timelineContainer.classList.remove('dragging');
    }
    
    // Prevent default for touch events
    if (isTouch) {
      e.preventDefault();
    }
  }
  
  // Set up and tear down event listeners
  onMount(() => {
    // Detect if we're on a mobile device
    isMobile = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect Android specifically
    isAndroid = /Android/i.test(navigator.userAgent);
    
    if (timelineContainer) {
      // Set up direct DOM event handlers
      setupDirectEventHandlers();
      
      // Set up drag handlers
      timelineContainer.addEventListener('mousedown', startDrag);
      timelineContainer.addEventListener('touchstart', startDrag, { passive: false });
    }
    
    // Attach global mouse/touch event handlers
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag, { passive: false });
    
    // Initial resize
    handleResize();
    
    // Handle resize events
    window.addEventListener('resize', handleResize);
    
    // Expose the control functions to the global scope
    if (typeof window !== 'undefined') {
      window.timelineControls = window.timelineControls || {};
      window.timelineControls.zoomIn = zoomIn;
      window.timelineControls.zoomOut = zoomOut;
      window.timelineControls.resetView = resetView;
      window.timelineControls.pan = pan;
    }
    
    // On Android, simplify the timeline further
    if (isAndroid) {
      // Set a lightweight initial state
      scale.set(1, { duration: 0 });
      offsetX.set(0, { duration: 0 });
      offsetY.set(0, { duration: 0 });
    }
    
    return () => {
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('touchmove', drag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchend', endDrag);
      window.removeEventListener('resize', handleResize);
    };
  });
  
  // Handle window resize
  function handleResize() {
    if (timelineContainer) {
      containerWidth = timelineContainer.offsetWidth;
      containerHeight = timelineContainer.offsetHeight;
      
      // Update mobile detection
      isMobile = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
  }
  
  // Reset state when component updates
  onDestroy(() => {
    selectedEvent = null;
    hoveredEvent = null;
  });
  
  // Update functions exposed to parent components
  export function zoomIn() {
    // Smaller zoom increments on mobile
    const increment = isMobile ? 0.1 : 0.2;
    scale.update(s => Math.min(3, s + increment));
  }
  
  export function zoomOut() {
    // Smaller zoom increments on mobile
    const increment = isMobile ? 0.1 : 0.2;
    scale.update(s => Math.max(0.5, s - increment));
  }
  
  export function resetView() {
    scale.set(1);
    offsetX.set(0);
    offsetY.set(0);
    selectedEvent = null;
  }
  
  export function pan(deltaX: number, deltaY: number) {
    // Reduce panning distance on mobile for more precise control
    const factor = isMobile ? 0.5 : 1;
    offsetX.update(x => x + deltaX * factor);
    offsetY.update(y => y + deltaY * factor);
  }
</script>

<div class="card-base relative overflow-hidden {asBanner ? 'h-full rounded-none' : 'h-[300px]'} {compact ? 'compact-mode' : ''} {isMobile ? 'mobile-mode' : ''} {isAndroid ? 'android-mode' : ''}" 
     data-start-year={startYear} 
     data-end-year={endYear}>

  <!-- Background with parallax effect -->
  <div class="absolute inset-0 z-0 overflow-hidden">
    <img 
      src={background} 
      alt="Timeline background" 
      class="w-full h-full object-cover transition-transform duration-300 ease-out"
      style="transform: scale({isMobile ? 1.02 : 1.05 + 0.05 * $scale}) translate({-$offsetX * (isMobile ? 0.01 : 0.05)}px, {-$offsetY * (isMobile ? 0.01 : 0.05)}px);"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-[oklch(0.25_0.05_var(--hue))] to-[oklch(0.15_0.05_var(--hue))] opacity-20 dark:opacity-20 backdrop-blur-[2px]"></div>
  </div>
  
  <!-- Starfield effect - simplified on mobile -->
  <div class="absolute inset-0 z-0">
    <div class="w-full h-full" style="
      background-image: 
        {isMobile ? 
          'radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.2) 100%, transparent), radial-gradient(1px 1px at 75% 75%, rgba(255, 255, 255, 0.2) 100%, transparent)' :
          'radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.2) 100%, transparent), radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.2) 100%, transparent), radial-gradient(1px 1px at 75% 75%, rgba(255, 255, 255, 0.2) 100%, transparent), radial-gradient(2px 2px at 40% 60%, rgba(255, 255, 255, 0.3) 100%, transparent), radial-gradient(2px 2px at 10% 90%, rgba(255, 255, 255, 0.3) 100%, transparent)'
        };
      background-repeat: repeat;
      background-size: 300px 300px, 200px 200px, 250px 250px, 300px 300px, 350px 350px;
      background-position: 0 0, 40px 60px, 130px 270px, 70px 100px, 0 300px;
      mix-blend-mode: overlay;
      opacity: 0.3;
    "></div>
  </div>
  
  <!-- Timeline container -->
  <div class="timeline-container relative z-10 w-full h-full cursor-grab active:cursor-grabbing"
       bind:this={timelineContainer}
       on:mousedown={startDrag}
       on:touchstart={startDrag}
       role="application"
       aria-label="Interactive timeline visualization"
       tabindex="0"
       style={!isMobile ? 
        `transform: scale(${$scale}) translate(${$offsetX/$scale}px, ${$offsetY/$scale}px);` : 
        '/* Mobile transforms applied directly in JS for better performance */'}>
    
    <!-- Center line -->
    <div class="absolute left-0 right-0 h-0.5 top-1/2 -translate-y-1/2 bg-[var(--primary)] opacity-20"></div>
    
    <!-- Year markers -->
    <div class="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[var(--primary)] opacity-30" style="left: {padding}%"></div>
    <div class="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-[var(--primary)] opacity-30" style="left: {100 - padding}%"></div>

    <!-- Events - limit number shown on mobile -->
    {#each displayEvents as { event, horizontalPosition, verticalPosition }, i}
      <!-- Event container -->
      <div 
        class="timeline-event absolute transform -translate-x-1/2"
        style="left: {horizontalPosition}%; top: calc(50% + {verticalPosition}px); z-index: {selectedEvent?.slug === event.slug ? 5 : 1};"
      >
        <!-- Star node - Using data attribute for DOM event handling -->
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
            size={event.isKeyEvent ? 10 : 8}
          />
        </div>
        
        <!-- Event information card -->
        <div class="timeline-card {selectedEvent?.slug === event.slug || hoveredEvent?.slug === event.slug ? '' : 'hidden'}">
          <TimelineCard 
            {event} 
            isSelected={selectedEvent?.slug === event.slug}
            compact={compact || isMobile}
            position={verticalPosition < 0 ? 'top' : 'bottom'}
          />
        </div>
      </div>
    {/each}
    
    <!-- Era labels -->
    {#if events.length > 0}
      <div class="absolute top-0 left-[15%] p-2 text-lg font-bold text-75">
        {startYear}
      </div>
      <div class="absolute top-0 right-[15%] p-2 text-lg font-bold text-75">
        {endYear}
      </div>
    {/if}
  </div>
  
  <!-- Error state for Android -->
  {#if isAndroid && displayEvents.length === 0}
    <div class="android-error-state absolute inset-0 z-20 flex items-center justify-center bg-[var(--card-bg)] bg-opacity-90">
      <div class="text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-[var(--primary)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-xl font-bold text-75">Timeline Unavailable</p>
        <p class="text-sm text-50 mb-4">The timeline visualization is not available on this device.</p>
        <a href="/timeline-list" class="bg-[var(--primary)] text-white px-4 py-2 rounded-md inline-block">
          View Timeline as List
        </a>
      </div>
    </div>
  {/if}
  
  <!-- Empty state -->
  {#if events.length === 0 && !isAndroid}
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
  /* Base timeline styles */
  .timeline-event {
    transition: transform 0.3s ease, opacity 0.5s ease;
  }
  
  .timeline-container {
    transform-origin: center;
    transition: transform 0.3s ease;
    will-change: transform;
  }
  
  /* Disable animations during dragging for better performance */
  .dragging .timeline-event,
  .dragging .timeline-container {
    transition: none !important;
  }
  
  /* Starfield effect */
  .starfield-overlay {
    background-image: 
      radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.2) 100%, transparent),
      radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.2) 100%, transparent),
      radial-gradient(1px 1px at 75% 75%, rgba(255, 255, 255, 0.2) 100%, transparent),
      radial-gradient(2px 2px at 40% 60%, rgba(255, 255, 255, 0.3) 100%, transparent),
      radial-gradient(2px 2px at 10% 90%, rgba(255, 255, 255, 0.3) 100%, transparent);
    background-repeat: repeat;
    background-size: 300px 300px, 200px 200px, 250px 250px, 300px 300px, 350px 350px;
    background-position: 0 0, 40px 60px, 130px 270px, 70px 100px, 0 300px;
    animation: twinkle 10s ease-in-out infinite alternate;
    mix-blend-mode: overlay;
  }
  
  @keyframes twinkle {
    0% { opacity: 0.2; }
    50% { opacity: 0.4; }
    100% { opacity: 0.3; }
  }
  
  /* Optimization for mobile devices */
  .mobile-mode .timeline-event {
    transition: opacity 0.3s ease;
  }
  
  .mobile-mode .timeline-container {
    will-change: auto;
    transition: none;
  }
  
  /* Special Android optimizations */
  .android-mode .timeline-container {
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 1000;
    transition: none;
  }
  
  .android-mode .timeline-event {
    transition: none;
  }
  
  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .timeline-container {
      touch-action: pan-x pan-y;
    }
    
    .timeline-card {
      width: 150px !important;
      padding: 0.5rem !important;
    }
    
    /* Reduce parallax effect on mobile */
    .mobile-mode .absolute.inset-0 img {
      transition: none !important;
    }
  }
</style>