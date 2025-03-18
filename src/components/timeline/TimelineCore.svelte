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
  let isMobile = false; // Track if we're in mobile view
  
  // Svelte store for animated values
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
  
  // Calculate position for each event - now handles both horizontal and vertical layouts
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
    
    // For mobile: keep the range smaller to prevent elements from going off-screen
    if (isMobile) {
      verticalOffset = Math.sign(verticalOffset) * Math.min(Math.abs(verticalOffset), 80);
    }
    
    // Ensure stars stay within reasonable bounds
    verticalOffset = Math.max(-140, Math.min(140, verticalOffset));
    
    return {
      event,
      horizontalPosition: posPercentage,
      verticalPosition: verticalOffset
    };
  });
  
  /**
   * DIRECT DOM EVENT HANDLERS
   * Using these instead of Svelte's event bindings for more reliable behavior
   */
  function setupDirectEventHandlers() {
    if (!timelineContainer) return;
    
    // Handle clicks on event elements using event delegation
    timelineContainer.addEventListener('click', (e) => {
      // Find if we clicked on an event node
      const target = e.target as HTMLElement;
      const eventNode = target.closest('.event-node');
      
      if (eventNode) {
        // Get the event slug from the data attribute
        const slug = eventNode.getAttribute('data-slug');
        if (!slug) return;
        
        // Stop event propagation
        e.stopPropagation();
        
        // Find the corresponding event
        const event = events.find(evt => evt.slug === slug);
        if (!event) return;
        
        console.log("DOM Click on event:", event.title, "Slug:", slug);
        
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
          updateSelectionState();
        }
      } else if (target === timelineContainer || target.classList.contains('timeline-container')) {
        // Click on background
        console.log("Click on background, clearing selection");
        selectedEvent = null;
        hoveredEvent = null;
        dispatch('deselect');
        
        // Update UI
        updateSelectionState();
      }
    });
    
    // Handle hover events
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
  
  function startDrag(e: MouseEvent) {
    // Ignore drags that start on event elements
    if ((e.target as HTMLElement).closest('.event-node')) {
      return;
    }
    
    isDragging = true;
    startDragX = e.clientX;
    startDragY = e.clientY;
    startOffsetX = $offsetX;
    startOffsetY = $offsetY;
    document.body.style.cursor = 'grabbing';
    
    // Add class for styling
    if (timelineContainer) {
      timelineContainer.classList.add('dragging');
    }
  }
  
  function drag(e: MouseEvent) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startDragX;
    const deltaY = e.clientY - startDragY;
    
    offsetX.set(startOffsetX + deltaX);
    offsetY.set(startOffsetY + deltaY);
  }
  
  function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    document.body.style.cursor = '';
    
    // Remove dragging class
    if (timelineContainer) {
      timelineContainer.classList.remove('dragging');
    }
  }
  
  // Check if we're in mobile view
  function checkMobileView() {
    isMobile = window.innerWidth < 768; // Standard mobile breakpoint
    handleResize();
  }
  
  // Set up and tear down event listeners
  onMount(() => {
    if (timelineContainer) {
      // Set up direct DOM event handlers
      setupDirectEventHandlers();
    }
    
    // Check mobile view
    checkMobileView();
    
    // Attach global mouse event handlers
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
    
    // Initial resize
    handleResize();
    
    // Handle resize events
    window.addEventListener('resize', () => {
      checkMobileView();
      handleResize();
    });
    
    // Expose the control functions to the global scope
    if (typeof window !== 'undefined') {
      window.timelineControls = window.timelineControls || {};
      window.timelineControls.zoomIn = zoomIn;
      window.timelineControls.zoomOut = zoomOut;
      window.timelineControls.resetView = resetView;
      window.timelineControls.pan = pan;
    }
    
    return () => {
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('resize', handleResize);
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
  });
  
  // Update functions exposed to parent components
  export function zoomIn() {
    scale.update(s => Math.min(5, s + 0.2));
  }
  
  export function zoomOut() {
    scale.update(s => Math.max(0.5, s - 0.2));
  }
  
  export function resetView() {
    scale.set(1);
    offsetX.set(0);
    offsetY.set(0);
    selectedEvent = null;
  }
  
  export function pan(deltaX: number, deltaY: number) {
    offsetX.update(x => x + deltaX);
    offsetY.update(y => y + deltaY);
  }
</script>

<div class="card-base relative overflow-hidden {asBanner ? 'h-full rounded-none' : 'h-[300px] md:h-[300px]'} {compact ? 'compact-mode' : ''}" 
     data-start-year={startYear} 
     data-end-year={endYear}>

  <!-- Background with parallax effect -->
  <div class="absolute inset-0 z-0 overflow-hidden">
    <img 
      src={background} 
      alt="Timeline background" 
      class="w-full h-full object-cover transition-transform duration-300 ease-out mobile-rotate-bg"
      style="transform: scale({1.05 + 0.05 * $scale}) translate({-$offsetX * 0.05}px, {-$offsetY * 0.05}px);"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-[oklch(0.25_0.05_var(--hue))] to-[oklch(0.15_0.05_var(--hue))] opacity-20 dark:opacity-20 backdrop-blur-[2px]"></div>
  </div>
  
  <!-- Starfield effect -->
  <div class="absolute inset-0 z-0">
    <div class="w-full h-full" style="
      background-image: 
        radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.2) 100%, transparent),
        radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.2) 100%, transparent),
        radial-gradient(1px 1px at 75% 75%, rgba(255, 255, 255, 0.2) 100%, transparent),
        radial-gradient(2px 2px at 40% 60%, rgba(255, 255, 255, 0.3) 100%, transparent),
        radial-gradient(2px 2px at 10% 90%, rgba(255, 255, 255, 0.3) 100%, transparent);
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
       role="application"
       aria-label="Interactive timeline visualization"
       tabindex="0"
       style="transform: scale({$scale}) translate({$offsetX/$scale}px, {$offsetY/$scale}px);">
    
    <!-- Center line - horizontal for desktop, vertical for mobile -->
    <div class="timeline-center-line absolute"></div>
    
    <!-- Year markers -->
    <div class="timeline-start-marker absolute"></div>
    <div class="timeline-end-marker absolute"></div>

    <!-- Events - we use a wrapper div for mobile view rotation -->
    <div class="timeline-events-wrapper">
      {#each eventPositions as { event, horizontalPosition, verticalPosition }, i}
        <!-- Event container -->
        <div 
          class="timeline-event absolute transform"
          style="
            --event-h-pos: {horizontalPosition}%;
            --event-v-pos: {verticalPosition}px;
            z-index: {selectedEvent?.slug === event.slug ? 5 : 1};
          "
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
              compact={compact}
              position={verticalPosition < 0 ? 'top' : 'bottom'}
            />
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Era labels -->
    {#if events.length > 0}
      <div class="timeline-start-label absolute font-bold text-75">
        {startYear}
      </div>
      <div class="timeline-end-label absolute font-bold text-75">
        {endYear}
      </div>
    {/if}
  </div>
  
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
  /* Base timeline styles */
  .timeline-event {
    transition: transform 0.3s ease, opacity 0.5s ease;
  }
  
  .timeline-container {
    transform-origin: center;
    transition: transform 0.3s ease;
    will-change: transform;
  }
  
  /* Desktop layout (horizontal timeline) */
  @media (min-width: 768px) {
    .timeline-events-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }
    
    .timeline-event {
      left: var(--event-h-pos);
      top: calc(50% + var(--event-v-pos));
      transform: translateX(-50%);
    }
    
    .timeline-center-line {
      left: 0;
      right: 0;
      height: 0.5px;
      top: 50%;
      transform: translateY(-50%);
      background-color: var(--primary);
      opacity: 0.2;
    }
    
    .timeline-start-marker {
      left: 15%;
      top: 50%;
      width: 0.5px;
      height: 3px;
      transform: translateY(-50%);
      background-color: var(--primary);
      opacity: 0.3;
    }
    
    .timeline-end-marker {
      left: 85%;
      top: 50%;
      width: 0.5px;
      height: 3px;
      transform: translateY(-50%);
      background-color: var(--primary);
      opacity: 0.3;
    }
    
    .timeline-start-label {
      top: 0;
      left: 15%;
      padding: 0.5rem;
      font-size: 1.125rem;
    }
    
    .timeline-end-label {
      top: 0;
      right: 15%;
      padding: 0.5rem;
      font-size: 1.125rem;
    }
  }
  
  /* Mobile layout (vertical timeline) */
  @media (max-width: 767px) {
    /* Make timeline container taller on mobile */
    .card-base:not(.h-full) {
      height: 450px !important;
    }
    
    /* Rotate the background image */
    .mobile-rotate-bg {
      transform-origin: center;
      transform: rotate(90deg) scale(1.5) !important;
    }
    
    .timeline-events-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      transform: rotate(90deg);
      transform-origin: center;
    }
    
    .timeline-event {
      /* We're rotating 90 degrees, so we swap X and Y positioning */
      left: 50%;
      top: var(--event-h-pos);
      transform: translate(-50%, -50%);
    }
    
    /* Position the info cards so they're readable in vertical mode */
    .timeline-event .timeline-card {
      transform: rotate(-90deg);
      transform-origin: center;
      /* Adjust card positioning for vertical layout */
      position: absolute;
      left: calc(var(--event-v-pos) * -1);
    }
    
    /* Rotate the center line to vertical */
    .timeline-center-line {
      top: 0;
      bottom: 0;
      width: 0.5px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--primary);
      opacity: 0.2;
    }
    
    /* Rotate the markers */
    .timeline-start-marker {
      top: 15%;
      left: 50%;
      height: 0.5px;
      width: 3px;
      transform: translateX(-50%);
      background-color: var(--primary);
      opacity: 0.3;
    }
    
    .timeline-end-marker {
      top: 85%;
      left: 50%;
      height: 0.5px;
      width: 3px;
      transform: translateX(-50%);
      background-color: var(--primary);
      opacity: 0.3;
    }
    
    /* Rotate the year labels */
    .timeline-start-label {
      left: 0;
      top: 15%;
      padding: 0.5rem;
      font-size: 1rem;
      transform: rotate(-90deg);
    }
    
    .timeline-end-label {
      right: 0;
      top: 85%;
      padding: 0.5rem;
      font-size: 1rem;
      transform: rotate(-90deg);
    }
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
</style>