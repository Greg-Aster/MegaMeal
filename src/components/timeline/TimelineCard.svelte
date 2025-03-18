<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { TimelineEvent } from '../../services/TimelineService.client';
  import { getEraDisplayName } from '../../services/TimelineService.client';
  
  // Props
  export let event: TimelineEvent;
  export let isSelected: boolean = false;
  export let compact: boolean = false;
  export let position: 'top' | 'bottom' = 'bottom';
  
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
  class="timeline-card card-base absolute w-[200px] p-3 transform -translate-x-1/2 z-30
         bg-[var(--card-bg)] backdrop-blur-sm shadow-lg
         {position === 'top' ? 'bottom-[30px]' : 'top-[30px]'}
         {compact ? 'w-[150px] p-2 text-sm' : ''}
         {isSelected ? 'border-2 border-[var(--primary)]' : 'border border-transparent'}"
  in:fly="{{ y: position === 'top' ? 10 : -10, duration: 200 }}"
  out:fly="{{ y: position === 'top' ? 10 : -10, duration: 150 }}"
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
  
  <!-- Card arrow/pointer -->
  <div 
    class="absolute w-3 h-3 transform rotate-45 bg-inherit border-inherit
           {position === 'top' ? 'border-b border-r -bottom-[6px] left-1/2 -translate-x-1/2' : 
                               'border-t border-l -top-[6px] left-1/2 -translate-x-1/2'}"
  ></div>
</div>

<style>
  .timeline-card {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1), 0 0 5px rgba(var(--primary-rgb, 0 0 0), 0.3);
  }
  
  .timeline-era-badge {
    text-transform: capitalize;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Fix the card pointer z-index */
  .timeline-card > div:last-child {
    z-index: 1;
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