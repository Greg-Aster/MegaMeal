<!--
  DialogueBox.svelte - Interactive dialogue system for NPCs
  Used by the corndog mascot in RestaurantBackroom level
-->
<script lang="ts">
import { onMount } from 'svelte'
import { createEventDispatcher } from 'svelte'

export let isVisible = false
export let text = ''
export let speaker = ''
export let duration = 3000

const dispatch = createEventDispatcher()

let dialogueTimer: NodeJS.Timeout

$: if (isVisible && text) {
  showDialogue()
}

function showDialogue() {
  clearTimeout(dialogueTimer)
  dialogueTimer = setTimeout(() => {
    hideDialogue()
  }, duration)
}

function hideDialogue() {
  isVisible = false
  dispatch('close')
}

function handleClick() {
  hideDialogue()
}

onMount(() => {
  return () => {
    clearTimeout(dialogueTimer)
  }
})
</script>

{#if isVisible && text}
  <div 
    class="dialogue-box"
    on:click={handleClick}
    role="dialog"
    aria-label="Character dialogue"
  >
    <div class="dialogue-content">
      {#if speaker}
        <div class="speaker-name">{speaker}</div>
      {/if}
      <div class="dialogue-text">{text}</div>
      <div class="dialogue-hint">Click to dismiss</div>
    </div>
  </div>
{/if}

<style>
  .dialogue-box {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    border: 2px solid var(--primary, #00ff88);
    border-radius: 12px;
    padding: 20px;
    max-width: 500px;
    min-width: 300px;
    
    font-family: 'Courier New', monospace;
    color: var(--text-main, #ffffff);
    
    animation: slideUp 0.3s ease-out;
    cursor: pointer;
    
    box-shadow: 
      0 4px 20px rgba(0, 255, 136, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .dialogue-content {
    text-align: center;
  }
  
  .speaker-name {
    font-size: 14px;
    font-weight: bold;
    color: var(--primary, #00ff88);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .dialogue-text {
    font-size: 18px;
    line-height: 1.4;
    margin-bottom: 10px;
    color: var(--text-main, #ffffff);
  }
  
  .dialogue-hint {
    font-size: 12px;
    color: var(--text-75, #cccccc);
    opacity: 0.7;
    font-style: italic;
  }
  
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
  
  .dialogue-box:hover {
    border-color: var(--primary, #00ff88);
    box-shadow: 
      0 6px 25px rgba(0, 255, 136, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
</style>