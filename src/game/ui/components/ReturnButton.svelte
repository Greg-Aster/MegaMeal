<!--
  ReturnButton.svelte - Reusable component for level navigation
  Replaces hardcoded return button in GameUI.svelte
-->
<script lang="ts">
import { createEventDispatcher } from 'svelte'

export const currentLevel = ''
export const targetLevel = 'observatory'
export const buttonText = 'Return to Observatory'
export const isVisible = true

const dispatch = createEventDispatcher()

// Determine if button should be shown based on level
$: showButton =
  isVisible && currentLevel !== 'observatory' && currentLevel !== ''

function handleReturn() {
  dispatch('return', { targetLevel })
}
</script>

{#if showButton}
  <div class="absolute bottom-4 left-4 z-30" style="pointer-events: auto;">
    <button 
      class="btn-regular p-3 rounded-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
      on:click={handleReturn}
      title={buttonText}
    >
      ← {buttonText}
    </button>
  </div>
{/if}

<style>
  /* Component-specific styles if needed */
  .btn-regular {
    /* This class should be defined in your global CSS */
    background: rgba(0, 255, 136, 0.9);
    color: black;
    border: none;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.3);
  }
  
  .btn-regular:hover {
    background: rgba(0, 255, 136, 1);
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.5);
  }
</style>