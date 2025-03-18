<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { TimelineEvent } from '../../services/TimelineService.client';
  import { getEraDisplayName } from '../../services/TimelineService.client';
  import { onMount } from 'svelte';
  
  // Props
  export let event: TimelineEvent;
  export let isSelected: boolean = false;
  export let compact: boolean = false;
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  
  // State
  let isMobile = false;
  
  // Check if we're on a mobile device
  function checkMobileView() {
    isMobile = window.innerWidth < 768; // Standard mobile breakpoint
  }
  
  // On mount, check mobile status and set up listeners
  onMount(() => {
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  });
  
  // Calculate mobile-adjusted position
  $: mobileAdjustedPosition = isMobile ? (position === 'top' || position === 'bottom' ? 'right' : position) : position;
  
  // Helper function to get CSS classes for era badges
  function getEraBadgeClass(era?: string): string {
    if (!era) return "bg-[oklch(0.9_0.05_var(--hue))/0.1] dark:bg-[oklch(0.3_0.05_var(--hue))/0.2] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))]";
    
    // Match your existing era badge classes
    switch(era) {
      case 'pre-spork':
        return "bg-[oklch(0.8_0.1_var(--hue))/0.1] dark:bg-[oklch(0.8_0.1_var(--hue))/0.2] text-[oklch(0.3_0.1_var(--hue))] dark:text-[oklch(0.8_0.1_var(--hue))]";
      case 'spork-uprising':
        return "bg-[oklch(0.7_0.2_var(--hue))/0.1] dark:bg-[oklch(0.7_0.2_var(--hue))/0.2] text-[oklch(0.3_0.2_var(--hue))] dark:text-[oklch(0.7_0.2_var(--hue))]";
      case 'snuggaloid':
        return "bg-[oklch(0.6_0.3_var(--hue))/0.1] dark:bg-[oklch(0.6_0.3_var(--hue))/0.2] text-[oklch(0.3_0.3_var(--hue))] dark:text-[oklch(0.6_0.3_var(--hue))]";
      case 'post-extinction':
        return "bg-[oklch(0.5_0.1_var(--hue))/0.1] dark:bg-[oklch(0.5_0.1_var(--hue))/0.2] text-[oklch(0.2_0.1_var(--hue))] dark:text-[oklch(0.5_0.1_var(--hue))]";
      default:
        return "bg-[oklch(0.9_0.05_var(--hue))/0.1] dark:bg-[oklch(0.3_0.05_var(--hue))/0.2] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))]";
    }
  }
</script>

<div 
  class="timeline-card card-base absolute 
         bg-[var(--card-bg)] backdrop-blur-sm shadow-lg
         {isMobile ? 'w-[160px] timeline-card-mobile' : 'w-[200px]'} 
         {compact ? 'p-2 text-sm' : 'p-3'}
         {mobileAdjustedPosition === 'top' ? 'timeline-card-top' : 
          mobileAdjustedPosition === 'bottom' ? 'timeline-card-bottom' : 
          mobileAdjustedPosition === 'left' ? 'timeline-card-left' : 
          'timeline-card-right'}
         {isSelected ? 'border-2 border-[var(--primary)]' : 'border border-transparent'}"
  in:fly="{{ y: mobileAdjustedPosition === 'top' ? 10 : mobileAdjustedPosition === 'bottom' ? -10 : 0, 
            x: mobileAdjustedPosition === 'left' ? 10 : mobileAdjustedPosition === 'right' ? -10 : 0, 
            duration: 200 }}"
  out:fly="{{ y: mobileAdjustedPosition === 'top' ? 10 : mobileAdjustedPosition === 'bottom' ? -10 : 0, 
             x: mobileAdjustedPosition === 'left' ? 10 : mobileAdjustedPosition === 'right' ? -10 : 0, 
             duration: 150 }}"
>
  <!-- Card content -->
  <div class="font-bold text-75 text-sm mb-1">
    {event.year}: {event.title}
  </div>
  
  {#if !compact}
    <div class="text-50 text-xs line-clamp-2">
      {event.description}
    </div>
  {/if}
  
  {#if event.era}
    <div class="timeline-era-badge text-[0.65rem] mt-1 inline-block py-0.5 px-1.5 rounded-full {getEraBadgeClass(event.era)}">
      {getEraDisplayName(event.era)}
    </div>
  {/if}
  
  <!-- Card arrow/pointer positioned based on card position -->
  <div class="card-pointer"></div>
</div>

<style>
  .timeline-card {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1), 0 0 5px rgba(var(--primary-rgb, 0 0 0), 0.3);
    transform: translate(-50%, 0);
    z-index: 30;
  }
  
  .timeline-era-badge {
    text-transform: capitalize;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Card positions - Desktop */
  @media (min-width: 768px) {
    .timeline-card-top {
      bottom: 30px;
    }
    
    .timeline-card-bottom {
      top: 30px;
    }
    
    /* Pointer styles - Desktop */
    .timeline-card-top .card-pointer {
      position: absolute;
      width: 8px;
      height: 8px;
      transform: rotate(45deg);
      background-color: inherit;
      border-bottom: inherit;
      border-right: inherit;
      bottom: -5px;
      left: 50%;
      margin-left: -4px;
      z-index: 1;
    }
    
    .timeline-card-bottom .card-pointer {
      position: absolute;
      width: 8px;
      height: 8px;
      transform: rotate(45deg);
      background-color: inherit;
      border-top: inherit;
      border-left: inherit;
      top: -5px;
      left: 50%;
      margin-left: -4px;
      z-index: 1;
    }
  }
  
  /* Card positions - Mobile */
  @media (max-width: 767px) {
    .timeline-card-mobile {
      /* Adjust for vertical timeline in mobile */
      transform: translateY(-50%) !important;
    }
    
    .timeline-card-left {
      right: 30px;
    }
    
    .timeline-card-right {
      left: 30px;
    }
    
    /* Pointer styles - Mobile */
    .timeline-card-left .card-pointer {
      position: absolute;
      width: 8px;
      height: 8px;
      transform: rotate(45deg);
      background-color: inherit;
      border-right: inherit;
      border-top: inherit;
      right: -5px;
      top: 50%;
      margin-top: -4px;
      z-index: 1;
    }
    
    .timeline-card-right .card-pointer {
      position: absolute;
      width: 8px;
      height: 8px;
      transform: rotate(45deg);
      background-color: inherit;
      border-left: inherit;
      border-bottom: inherit;
      left: -5px;
      top: 50%;
      margin-top: -4px;
      z-index: 1;
    }
  }
  
  /* Match card radius to site values */
  :global(.timeline-card.card-base) {
    border-radius: var(--radius-large, 12px);
  }
  
  /* Match hover states to site behavior */
  :global(.timeline-card:hover .timeline-era-badge) {
    background-color: var(--primary) !important;
    color: white !important;
  }
</style>