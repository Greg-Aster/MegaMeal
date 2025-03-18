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
      offsetPosition = (randomFactor * 2 - 1) * 120;
    }
    
    // Ensure values stay within reasonable bounds
    offsetPosition = Math.max(-120, Math.min(120, offsetPosition));
    
    return {
      event,
      timelinePosition: posPercentage, // % along the primary timeline axis
      offsetPosition    // px offset from the timeline
    };
  });
  
  // Handler events for clicks and interactions
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
        
        // If already selected, navigate to post
        if (selectedEvent && selectedEvent.slug === slug) {
          window.location.href = `/posts/${slug}/`;
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
        }
      }
    });
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
  
  // Calculate background transform based on mobile state
  $: backgroundTransform = isMobile 
    ? `scale(${1.05 + 0.05 * $scale}) translate(${-$offsetX * 0.05}px, ${-$offsetY * 0.05}px) rotate(90deg) scale(1.5)` 
    : `scale(${1.05 + 0.05 * $scale}) translate(${-$offsetX * 0.05}px, ${-$offsetY * 0.05}px)`;
</script>

<div class="card-base relative overflow-hidden {asBanner ? 'h-full rounded-none' : 'h-[300px] md:h-[300px]'} {compact ? 'compact-mode' : ''}" 
     data-start-year={startYear} 
     data-end-year={endYear}>

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
  <div class="timeline-container relative z-10 w-full h-full cursor-grab active:cursor-grabbing"
       bind:this={timelineContainer}
       on:mousedown={startDrag}
       role="application"
       aria-label="Interactive timeline visualization"
       tabindex="0"
       style="transform: scale({$scale}) translate({$offsetX/$scale}px, {$offsetY/$scale}px);">
    
    <!-- Center line - horizontal for desktop, vertical for mobile -->
    <div class="timeline-center-line absolute {isMobile ? 'h-full w-[2px] left-1/2 bg-gradient-to-b' : 'w-full h-[2px] top-1/2 bg-gradient-to-r'} from-transparent via-[oklch(0.7_0.08_var(--hue))] to-transparent opacity-50"></div>
    
    <!-- Year markers -->
    <div class="timeline-start-marker absolute {isMobile ? 'top-[15%] h-[4px] left-[40%] right-[60%]' : 'left-[15%] w-[4px] top-[40%] bottom-[60%]'} bg-[oklch(0.7_0.2_var(--hue))] opacity-60 rounded-full"></div>
    <div class="timeline-end-marker absolute {isMobile ? 'bottom-[15%] h-[4px] left-[40%] right-[60%]' : 'right-[15%] w-[4px] top-[40%] bottom-[60%]'} bg-[oklch(0.7_0.2_var(--hue))] opacity-60 rounded-full"></div>

    <!-- Events -->
    {#each eventPositions as { event, timelinePosition, offsetPosition }, i}
      <!-- Event container with positioning for both desktop and mobile -->
      <div 
        class="timeline-event absolute {isMobile ? 'timeline-event-mobile' : 'timeline-event-desktop'}"
        style={isMobile ? 
          `top: ${timelinePosition}%; left: 50%; transform: translate(${offsetPosition}px, 0) scale(${1/$scale});` : 
          `left: ${timelinePosition}%; top: 50%; transform: translate(0, ${offsetPosition}px) scale(${1/$scale});`
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
            size={event.isKeyEvent ? 10 : 8}
          />
        </div>
        
        <!-- Only show card if this event is selected or hovered -->
        {#if selectedEvent?.slug === event.slug || hoveredEvent?.slug === event.slug}
          <TimelineCard 
            {event} 
            isSelected={selectedEvent?.slug === event.slug}
            compact={compact}
            position={isMobile ? 
              (offsetPosition < 0 ? 'left' : 'right') : 
              (offsetPosition < 0 ? 'top' : 'bottom')
            }
            isMobile={isMobile}
          />
        {/if}
      </div>
    {/each}
    
    <!-- Era labels positioned for mobile/desktop -->
    {#if events.length > 0}
      <div class="{isMobile ? 'absolute top-[12%] left-[30%] transform -translate-y-full' : 'absolute left-[12%] bottom-[30%] transform -translate-x-1/2'} text-lg font-bold text-75">
        {startYear}
      </div>
      <div class="{isMobile ? 'absolute bottom-[12%] left-[30%] transform translate-y-full' : 'absolute right-[12%] bottom-[30%] transform translate-x-1/2'} text-lg font-bold text-75">
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