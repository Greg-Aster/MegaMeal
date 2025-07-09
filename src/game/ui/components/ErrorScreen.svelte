<script lang="ts">
  export let error: string;
  
  function restartGame() {
    window.location.reload();
  }
</script>

<div class="error-screen">
  <div class="error-content">
    <div class="error-icon">⚠️</div>
    <div class="error-title">SYSTEM ERROR</div>
    <div class="error-message">{error}</div>
    <button 
      class="error-button"
      on:click={restartGame}
    >
      🔄 RESTART SYSTEM
    </button>
  </div>
</div>

<style>
  .error-screen {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  
  .error-content {
    text-align: center;
    font-family: 'Courier New', monospace;
    max-width: 28rem;
    padding: 2rem;
  }
  
  .error-icon {
    font-size: 6rem;
    margin-bottom: 1rem;
    color: #ef4444;
  }
  
  .error-title {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #ef4444;
    font-weight: bold;
  }
  
  .error-message {
    color: #ffffff;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    line-height: 1.5;
  }
  
  .error-button {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .error-button:hover {
    transform: scale(1.05);
  }
  
  .error-button:active {
    transform: scale(0.95);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .error-button:hover,
    .error-button:active {
      transform: none !important;
    }
  }
</style>