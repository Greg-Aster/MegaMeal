<!--
  TimelineCard.svelte - Refactored to be DRY and rely on global CSS.
  This version removes the duplicated, hardcoded styles from the previous fix
  and uses the classes and variables from your imported stylesheets as intended.
-->

<style>
  /*
    This component now relies entirely on your globally defined styles.
    The @import statements will pull in main.css and timeline-styles.css.
    All variables (--hue, --card-bg) and classes (.card-base, .text-75)
    are expected to be available from these files.
  */
  @import '../../../styles/main.css';
  @import '../../../styles/timeline-styles.css';

  /*
    Adaptive card styling for both light and dark modes
    Ensures readability on any background
  */
  .timeline-card {
    /* Strong background with good contrast */
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.9);
  }
  
  :global(.timeline-card .text-75) {
    color: rgba(0, 0, 0, 0.75);
  }
  :global(.timeline-card .text-50) {
    color: rgba(0, 0, 0, 0.5);
  }

  @media (prefers-color-scheme: dark) {
    .timeline-card {
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }
    
    :global(.timeline-card .text-75) {
      color: rgba(255, 255, 255, 0.75);
    }
    :global(.timeline-card .text-50) {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  
  /* Force high contrast for the game overlay - always use dark theme for better visibility */
  .timeline-card {
    background: rgba(0, 0, 0, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    color: rgba(255, 255, 255, 0.9) !important;
  }
  
  :global(.timeline-card .text-75) {
    color: rgba(255, 255, 255, 0.75) !important;
  }
  :global(.timeline-card .text-50) {
    color: rgba(255, 255, 255, 0.5) !important;
  }
</style>

<script lang="ts">
import { createEventDispatcher } from 'svelte'
import type { TimelineEvent } from '../../../services/TimelineService.client'

export let event: TimelineEvent
export const isSelected = false
export const compact = false
export const position: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
export const isMobile = false
export const isVisible = true

const dispatch = createEventDispatcher()

// This helper function is defined but not used in the template below.
// The link style is hardcoded in the <a> tag.
function getEraBadgeClass(era?: string): string {
  if (!era)
    return 'bg-[oklch(0.9_0.05_var(--hue))/0.1] dark:bg-[oklch(0.3_0.05_var(--hue))/0.2] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))]'
  switch (era) {
    case 'pre-spork':
      return 'bg-[oklch(0.8_0.1_var(--hue))/0.1] dark:bg-[oklch(0.8_0.1_var(--hue))/0.2] text-[oklch(0.3_0.1_var(--hue))] dark:text-[oklch(0.8_0.1_var(--hue))]'
    case 'spork-uprising':
      return 'bg-[oklch(0.7_0.2_var(--hue))/0.1] dark:bg-[oklch(0.7_0.2_var(--hue))/0.2] text-[oklch(0.3_0.2_var(--hue))] dark:text-[oklch(0.7_0.2_var(--hue))]'
    case 'snuggaloid':
      return 'bg-[oklch(0.6_0.3_var(--hue))/0.1] dark:bg-[oklch(0.6_0.3_var(--hue))/0.2] text-[oklch(0.3_0.3_var(--hue))] dark:text-[oklch(0.6_0.3_var(--hue))]'
    case 'post-extinction':
      return 'bg-[oklch(0.5_0.1_var(--hue))/0.1] dark:bg-[oklch(0.5_0.1_var(--hue))/0.2] text-[oklch(0.2_0.1_var(--hue))] dark:text-[oklch(0.5_0.1_var(--hue))]'
    default:
      return 'bg-[oklch(0.9_0.05_var(--hue))/0.1] dark:bg-[oklch(0.3_0.05_var(--hue))/0.2] text-[oklch(0.4_0.05_var(--hue))] dark:text-[oklch(0.9_0.05_var(--hue))]'
  }
}

const cardId = `timeline-card-${event.slug}-${Math.random().toString(36).substring(2, 9)}`

let initialX = 0
let initialY = 0

if (isMobile) {
  initialY = 20
} else {
  if (position === 'top') initialY = 10
  else if (position === 'bottom') initialY = -10
  else if (position === 'left') initialX = 10
  else if (position === 'right') initialX = -10
}

let cardElement: HTMLElement

// Get positioning styles for the card
function getPositioningStyles() {
  if (event.screenPosition && !isMobile) {
    return `left: ${event.screenPosition.x}px; top: ${event.screenPosition.y}px;`
  }
  return ''
}

// Fly-in animation
function triggerAnimation() {
  if (cardElement && isVisible) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (cardElement && cardElement.style) {
          cardElement.style.opacity = '1'
          cardElement.style.transform = 'translate(0px, 0px)'
        }
      }, 20)
    })
  }
}

$: if (cardElement && isVisible) {
  triggerAnimation()
}

function handleViewEvent(clickEvent: Event) {
  // This is only called for level transitions now
  clickEvent.preventDefault()
  console.log('🎮 TimelineCard: Button clicked for level:', event.levelId)
  // Dispatch with the correct levelId, but using the 'levelType' key
  // that the parent component expects from the original implementation.
  dispatch('levelTransition', { levelType: event.levelId })
  console.log(
    '🎮 TimelineCard: Dispatched levelTransition event with levelType:',
    event.levelId,
  )
}
</script>

{#if isVisible}
  <div
    bind:this={cardElement}
    id={cardId}
    class="timeline-card card-base bg-[var(--card-bg)] backdrop-blur-sm shadow-lg"
    class:fixed-position={isMobile}
    class:mobile-card={isMobile}
    class:w-[280px]={isMobile}
    class:h-auto={isMobile}
    class:absolute={!isMobile}
    class:z-30={!isMobile}
    class:w-[200px]={!isMobile}
    class:p-2={compact}
    class:text-sm={compact}
    class:p-3={!compact}
    class:timeline-card-top={!isMobile && position === 'top'}
    class:timeline-card-bottom={!isMobile && position === 'bottom'}
    class:timeline-card-left={!isMobile && position === 'left'}
    class:timeline-card-right={!isMobile && position === 'right'}
    style="opacity: 0; transform: translate({initialX}px, {initialY}px); {getPositioningStyles()}"
  >
    <div class="font-bold text-75 text-sm mb-1 card-title">
      {event.title}
    </div>

    {#if (!compact || isMobile)}
      <div class="text-50 text-xs card-description" class:line-clamp-3={isMobile} class:line-clamp-2={!isMobile}>
        {event.description}
      </div>
    {/if}

    {#if event.isLevel}
      <button class="timeline-link text-[0.65rem] mt-1 inline-block py-0.5 px-1.5 rounded-full bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors" on:click={handleViewEvent}>
        Enter Level &rarr;
      </button>
    {:else}
      <a href="/posts/{event.slug}/#post-container" class="timeline-link text-[0.65rem] mt-1 inline-block py-0.5 px-1.5 rounded-full bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors">
        View Event &rarr;
      </a>
    {/if}

    {#if !isMobile}
      <div class="card-pointer absolute bg-inherit"></div>
    {/if}
  </div>
{/if}
