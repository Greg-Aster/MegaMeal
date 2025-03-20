<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { TimelineEvent } from '../../services/TimelineService.client';
  import { getEraDisplayName } from '../../services/TimelineService.client';
  
  // Props
  export let event: TimelineEvent;
  export let isSelected: boolean = false;
  export let compact: boolean = false;
  export let cardWidth: number = 240; // Default value, will be overridden by parent
  export let isMobile: boolean = false;
  
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
  class="timeline-card card-base bg-[var(--card-bg)] backdrop-blur-sm shadow-lg
         p-2
         bg-opacity-90 dark:bg-opacity-90
         {isSelected ? 'border-2 border-[var(--primary)]' : 'border border-transparent'}"
  style="width: {cardWidth}px;"
>
  <div class="flex justify-between mb-1.5">
    <div class="font-bold text-75 text-sm card-title">
      {event.year}: {event.title}
    </div>
    
    {#if event.era}
      <div class="text-[0.65rem] px-1.5 py-0.5 rounded-full {getEraBadgeClass(event.era)}">
        {event.era}
      </div>
    {/if}
  </div>
  
  <div class="text-50 text-xs mb-2 line-clamp-3">
    {event.description}
  </div>
  
  <a href="/posts/{event.slug}/#post-container" class="timeline-link text-xs py-1 px-2 rounded-md bg-[oklch(0.9_0.05_var(--hue))/0.15] dark:bg-[oklch(0.3_0.05_var(--hue))/0.25] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))] hover:bg-[var(--primary)] hover:text-white">
    View Event Details →
  </a>
</div>

<style>
  /* Basic card styles */
  .timeline-card {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 0 8px rgba(var(--primary-rgb, 0 0 0), 0.3);
    border-radius: var(--radius-large, 12px);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                box-shadow 0.3s ease;
  }
  
  .timeline-card:hover {
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.15), 0 0 10px rgba(var(--primary-rgb, 0 0 0), 0.4);
  }
  
  /* Link styling */
  .timeline-link {
    display: inline-block;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
  }
  
  .timeline-link:hover {
    background-color: var(--primary) !important;
    color: white !important;
  }
</style>