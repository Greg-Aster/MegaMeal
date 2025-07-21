<script lang="ts">
export const message = 'Loading...'
</script>

<div class="loading-screen">
  <div class="loading-content">
    <div class="loading-title neon-text">
      ⭐ STAR OBSERVATORY
    </div>
    <div class="loading-message">
      {message}
    </div>
    <div class="loading-bar">
      <div class="loading-progress"></div>
    </div>
  </div>
</div>

<style>
  .loading-screen {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  
  .loading-content {
    text-align: center;
    font-family: 'Courier New', monospace;
  }
  
  .loading-title {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #00ff88;
  }
  
  .loading-message {
    font-size: 1.125rem;
    color: #ffffff;
    margin-bottom: 1rem;
    opacity: 0.8;
    animation: pulse 2s infinite;
  }
  
  .loading-bar {
    width: 16rem;
    height: 0.25rem;
    background: linear-gradient(90deg, 
      rgba(0, 255, 136, 0.2) 0%, 
      rgba(0, 255, 136, 0.1) 100%);
    border-radius: 9999px;
    overflow: hidden;
    margin: 0 auto;
  }
  
  .loading-progress {
    height: 100%;
    background: linear-gradient(90deg, 
      rgb(0, 255, 136) 0%, 
      rgba(0, 255, 136, 0.8) 50%,
      rgb(0, 255, 136) 100%);
    animation: loading-slide 2s ease-in-out infinite;
  }
  
  .neon-text {
    text-shadow: 
      0 0 5px #00ff88,
      0 0 10px #00ff88,
      0 0 20px #00ff88;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  @keyframes loading-slide {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .neon-text,
    .loading-message,
    .loading-progress {
      animation: none !important;
    }
  }
</style>