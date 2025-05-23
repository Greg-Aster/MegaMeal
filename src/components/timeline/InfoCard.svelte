<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import type { TimelineFact } from '../../config/timelineFacts'; // Import TimelineFact type
  
  export let fact: TimelineFact = { text: "Did you know? MegaMeal is nutritious!", type: 'fact' }; // Changed prop
  export let isVisible: boolean = false;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch('dismiss');
  }
</script>

{#if isVisible}
  <div
    class="info-card-wrapper card-base absolute bottom-8 right-4 md:bottom-20 md:right-6 p-3 backdrop-blur-sm shadow-lg rounded-[var(--radius-large,12px)] w-full max-w-[280px] sm:w-11/12 sm:max-w-xs md:w-auto z-[100] {fact.bgColorClass || 'bg-[var(--card-bg)]'} {fact.textColorClass || 'text-[var(--text-color)]'} {fact.fontFamilyClass || 'font-sriracha'}"
    transition:fly={{ y: 20, duration: 300, easing: quintOut }}
  >
    <button
      on:click={handleClose}
      class="absolute top-1 right-1 opacity-60 hover:opacity-90 transition-opacity p-1 {fact.textColorClass || 'text-[var(--text-color)]'}"
      aria-label="Dismiss fact"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    {#if fact.headline}
      <h3 class="{fact.headlineSizeClass || 'text-sm sm:text-md'} font-bold mb-1 pr-4 {fact.headlineColorClass || 'text-[var(--primary)]'}">{fact.headline}</h3>
    {/if}
    <p class="text-xs pr-4 mb- leading-snug">{fact.text}</p>
    
    {#if fact.ctaText && fact.link}
      <a
        href={`/posts/${fact.link}/`}
        target="_blank" rel="noopener noreferrer"
        class="mt-2 inline-block text-xs font-bold py-1 px-3 rounded-md hover:bg-opacity-80 transition-colors duration-200 text-center w-full {fact.ctaButtonClass || 'bg-[var(--primary)] text-white'}"
      >
        {fact.ctaText}
      </a>
    {:else if fact.link}
      <a
        href={`/posts/${fact.link}/`}
        class="text-xs text-[var(--primary)] hover:underline font-semibold mt-1 inline-block"
        target="_blank" rel="noopener noreferrer"
      >
        Learn More &rarr;
      </a>
    {/if}
  </div>
{/if}

<style>
  .info-card-wrapper {
    /* Mimicking .timeline-card box-shadow from TimelineCard.svelte */
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1), 0 0 5px rgba(var(--primary-rgb, 0 0 0), 0.3);
    /* Ensure text color variable is available or fallback */
    color: var(--text-color, oklch(0.15 0.02 var(--hue))); /* Fallback to --deep-text if --text-color not global */
    border: 2px solid var(--primary-dimmed); /* Explicit border style */
  }

  /* Fallback for --text-color if not globally defined, using a common text color from variables.styl */
  :root {
    --text-color: oklch(0.25 0.02 var(--hue)); /* Default from --deep-text for light mode */
  }
  :root.dark {
     /* Assuming --deep-text is for light mode, need a dark mode equivalent or use a general one */
    --text-color: oklch(0.95 0.01 var(--hue)); /* Default from --page-bg (light text on dark bg) for dark mode */
  }

  .info-card-wrapper p {
     color: var(--text-color); /* Ensure p tag inherits the color */
  }
</style>