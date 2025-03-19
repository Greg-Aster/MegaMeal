<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props
  export let era: string | undefined = undefined;
  export let isKeyEvent: boolean = false;
  export let isSelected: boolean = false;
  export let isHovered: boolean = false;
  export let size: number = 8;
  
  // Era color mapping 
  const eraColorMap = {
    'pre-spork': '#3b82f6',      // Blue
    'spork-uprising': '#8b5cf6', // Purple
    'snuggaloid': '#ec4899',     // Pink
    'post-extinction': '#14b8a6' // Teal
  };
  
  // Full color spectrum with direct color values
  const colorSpectrum = [
    // Reds
    '#ef4444', '#f43f5e',
    // Oranges
    '#f97316', '#f59e0b',
    // Yellows
    '#eab308', '#facc15',
    // Greens
    '#22c55e', '#10b981', '#14b8a6',
    // Blues
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    // Purples
    '#8b5cf6', '#a855f7', '#d946ef',
    // Pinks
    '#ec4899', '#f43f5e'
  ];
  
  // Star types
  const starTypes = [
    'point',     // Simple point of light
    'classic',   // Classic star shape
    'sparkle',   // Star with sparkle effect
    'refraction', // Improved refraction star
    'halo',      // Star with halo
    'subtle'     // Subtle star with minimal decoration
  ];
  
  // Helper to get deterministic random values
  function hashCode(str): number {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  
  // Get a color based on era or random from spectrum
  function getStarColor(id: string): string {
    if (era && eraColorMap[era]) {
      return eraColorMap[era];
    }
    const hash = hashCode(id);
    return colorSpectrum[hash % colorSpectrum.length];
  }
  
  // Get a secondary color that's the same as primary but with different opacity
  // (instead of a complementary color from the opposite side)
  function getSecondaryColor(primaryColor: string): string {
    // Just use the same color - we'll adjust opacity in the styling
    return primaryColor;
  }
  
  // Get star type
  function getStarType(id: string): string {
    const hash = hashCode(id);
    if (isKeyEvent) {
      // Key events get more elaborate stars
      return ['classic', 'sparkle', 'refraction', 'halo'][hash % 4];
    }
    return starTypes[hash % starTypes.length];
  }
  
  // Get a size factor for the star
  function getSizeFactor(): number {
    return isKeyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
  }
  
  // Get animation duration
  function getAnimationDuration(id: string): number {
    const hash = hashCode(id);
    return 4 + (hash % 5); // 4-8 second duration
  }
  
  // Create unique ID
  $: uniqueId = `${era || 'default'}-${isKeyEvent ? 'key' : 'normal'}-${size}`;
  
  // Set reactive variables
  $: starType = getStarType(uniqueId);
  $: sizeFactor = getSizeFactor();
  $: finalSize = size * sizeFactor;
  $: mainColor = getStarColor(uniqueId);
  $: secondaryColor = getSecondaryColor(mainColor);
  $: animationDuration = getAnimationDuration(uniqueId);
  
  // For sparkle effect
  let showSparkle = false;
  let isInitialized = false;
  
  onMount(() => {
    isInitialized = true;
    
    // Add sparkle effect
    const interval = setInterval(() => {
      if (isSelected || isKeyEvent || Math.random() < 0.15) {
        showSparkle = true;
        setTimeout(() => showSparkle = false, 900);
      }
    }, 2000 + Math.random() * 1500);
    
    return () => clearInterval(interval);
  });
</script>

<div 
  class="star-wrapper"
  class:is-selected={isSelected}
  class:is-hovered={isHovered}
  class:is-key-event={isKeyEvent}
  class:is-initialized={isInitialized}
  data-star-type={starType}
  style="
    --animation-duration: {animationDuration}s; 
    --star-size: {finalSize}px;
    --star-color: {mainColor};
    --secondary-color: {mainColor};
  "
>
  <!-- Glow effect -->
  <div class="star-glow"></div>
  
  <!-- Star shape based on type -->
  <svg xmlns="http://www.w3.org/2000/svg" 
       viewBox="0 0 24 24" 
       width={finalSize * 3}
       height={finalSize * 3}
       class="star-shape">
    
    {#if starType === 'point'}
      <!-- Simple point of light - no outer circle -->
      <circle cx="12" cy="12" r="1.8" fill={mainColor} />
    {:else if starType === 'classic'}
      <!-- Classic star shape -->
      <path d="M12 5l1.5 3.5 3.5 0.5-2.5 2.5 0.5 3.5-3-1.5-3 1.5 0.5-3.5-2.5-2.5 3.5-0.5z" 
            fill={mainColor} />
    {:else if starType === 'sparkle'}
      <!-- Sparkle star with multiple points -->
      <path d="M12 5l0.7 3 2.8 0.5-2 2 0.5 3-2-1.5-2 1.5 0.5-3-2-2 2.8-0.5z" 
            fill={mainColor} />
      <path d="M12 3v18M3 12h18" 
            stroke={mainColor} 
            stroke-width="0.4" 
            opacity="0.4" />
    {:else if starType === 'refraction'}
      <!-- Improved refraction star - smaller center -->
      <circle cx="12" cy="12" r="1.5" fill={mainColor} />
      <!-- Horizontal and vertical lines -->
      <path d="M12 6v12M6 12h12" 
            stroke={mainColor} 
            stroke-width="0.7" 
            opacity="0.6" 
            class="refraction-lines" />
      <!-- Diagonal lines - very subtle -->
      <path d="M8 8l8 8M8 16l8-8" 
            stroke={mainColor} 
            stroke-width="0.3" 
            opacity="0.3" 
            class="refraction-lines" />
    {:else if starType === 'halo'}
      <!-- Star with halo - smaller circles -->
      <circle cx="12" cy="12" r="1.5" fill={mainColor} />
      <circle cx="12" cy="12" r="2.5" fill={mainColor} opacity="0.4" />
      <circle cx="12" cy="12" r="3.5" fill={mainColor} opacity="0.15" />
    {:else}
      <!-- Subtle star - no outer circle -->
      <circle cx="12" cy="12" r="1.2" fill={mainColor} />
      <path d="M10 9l4 6M9 12l6 0" 
            stroke={mainColor} 
            stroke-width="0.4" 
            opacity="0.5" />
    {/if}
    
    <!-- Inner glow for key events - same color -->
    {#if isKeyEvent}
      <circle cx="12" cy="12" r="2" 
              fill={mainColor} 
              opacity="0.5" 
              class="inner-glow" />
    {/if}
  </svg>
  
  <!-- Sparkle effect - using main color with different opacities -->
  {#if showSparkle}
    <div class="sparkles">
      <div class="sparkle sparkle-1" style="background-color: {mainColor}; opacity: 0.9;"></div>
      <div class="sparkle sparkle-2" style="background-color: {mainColor}; opacity: 0.7;"></div>
      <div class="sparkle sparkle-3" style="background-color: {mainColor}; opacity: 0.8;"></div>
      <div class="sparkle sparkle-4" style="background-color: {mainColor}; opacity: 0.6;"></div>
    </div>
  {/if}
</div>

<style>
  /* Base star styles */
  .star-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 5px var(--star-color));
    transition: transform 0.3s ease, filter 0.3s ease;
  }
  
  /* Glow effect - customized by star type */
  .star-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--star-size) * 3.5);
    height: calc(var(--star-size) * 3.5);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      var(--star-color) 0%,
      rgba(255,255,255,0) 70%
    );
    opacity: 0.5; /* Reduced opacity */
    animation: glowPulse var(--animation-duration, 4s) infinite alternate ease-in-out;
    pointer-events: none;
  }
  
  /* Star shape */
  .star-shape {
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 0 1px var(--star-color));
  }
  
  /* Inner glow animation */
  .inner-glow {
    animation: innerGlowPulse var(--animation-duration, 3s) infinite alternate ease-in-out;
  }
  
  /* Selected state */
  .is-selected {
    filter: 
      drop-shadow(0 0 10px var(--star-color))
      drop-shadow(0 0 4px var(--star-color)) !important;
    z-index: 10;
    transform: scale(1.15);
  }
  
  .is-selected .star-glow {
    opacity: 0.8;
    width: calc(var(--star-size) * 5);
    height: calc(var(--star-size) * 5);
  }
  
  /* Hovered state */
  .is-hovered {
    filter: drop-shadow(0 0 8px var(--star-color));
    z-index: 5;
  }
  
  /* Key event state */
  .is-key-event {
    filter: 
      drop-shadow(0 0 7px var(--star-color))
      drop-shadow(0 0 3px var(--star-color));
  }
  
  /* Sparkle effect */
  .sparkles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
    filter: drop-shadow(0 0 2px var(--star-color));
  }
  
  .sparkle {
    position: absolute;
    width: calc(var(--star-size) * 0.6);
    height: calc(var(--star-size) * 0.6);
    border-radius: 50%;
    animation: sparkleAnimation 1.2s ease-out forwards;
    filter: blur(1px);
  }
  
  .sparkle-1 {
    top: 25%;
    left: 25%;
    animation-delay: 0.1s;
  }
  
  .sparkle-2 {
    top: 25%;
    right: 25%;
    animation-delay: 0.2s;
  }
  
  .sparkle-3 {
    bottom: 25%;
    right: 25%;
    animation-delay: 0.3s;
  }
  
  .sparkle-4 {
    bottom: 25%;
    left: 25%;
    animation-delay: 0.4s;
  }
  
  /* Refraction animation */
  .refraction-lines {
    animation: refractionTwinkle var(--animation-duration, 4s) infinite alternate ease-in-out;
  }
  
  /* Custom glow styles for different star types */
  .star-wrapper[data-star-type="refraction"] .star-glow {
    background: radial-gradient(
      circle,
      var(--star-color) 0%,
      rgba(255,255,255,0) 80%
    ), 
    linear-gradient(
      to right,
      rgba(255,255,255,0) 35%,
      var(--star-color) 50%,
      rgba(255,255,255,0) 65%
    ),
    linear-gradient(
      to bottom,
      rgba(255,255,255,0) 35%,
      var(--star-color) 50%,
      rgba(255,255,255,0) 65%
    );
    opacity: 0.4;
    width: calc(var(--star-size) * 5);
    height: calc(var(--star-size) * 5);
  }

  .star-wrapper[data-star-type="halo"] .star-glow {
    background: radial-gradient(
      circle,
      var(--star-color) 0%,
      var(--star-color) 10%,
      rgba(255,255,255,0) 70%
    );
    opacity: 0.5;
    width: calc(var(--star-size) * 4);
    height: calc(var(--star-size) * 4);
    animation: haloBreathing var(--animation-duration, 6s) infinite alternate ease-in-out;
  }

  .star-wrapper[data-star-type="sparkle"] .star-glow {
    background: 
      radial-gradient(
        circle,
        var(--star-color) 0%,
        rgba(255,255,255,0) 60%
      ),
      linear-gradient(
        to right,
        rgba(255,255,255,0) 45%,
        var(--star-color) 50%,
        rgba(255,255,255,0) 55%
      ),
      linear-gradient(
        to bottom,
        rgba(255,255,255,0) 45%,
        var(--star-color) 50%,
        rgba(255,255,255,0) 55%
      );
    opacity: 0.4;
    width: calc(var(--star-size) * 6);
    height: calc(var(--star-size) * 6);
  }

  .star-wrapper[data-star-type="classic"] .star-glow {
    background: radial-gradient(
      circle,
      var(--star-color) 0%,
      rgba(255,255,255,0) 70%
    );
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1.2);
  }

  .star-wrapper[data-star-type="point"] .star-glow {
    background: radial-gradient(
      circle,
      var(--star-color) 0%,
      rgba(255,255,255,0) 50%
    );
    opacity: 0.4;
    width: calc(var(--star-size) * 2.5);
    height: calc(var(--star-size) * 2.5);
  }
  
  /* Animations */
  @keyframes glowPulse {
    0% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.9); }
    50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
    100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.9); }
  }
  
  @keyframes sparkleAnimation {
    0% { transform: scale(0); opacity: 0; }
    20% { transform: scale(1.5); opacity: 0.9; }
    40% { transform: scale(0.9); opacity: 0.7; }
    70% { transform: scale(1.8); opacity: 0.5; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  
  @keyframes innerGlowPulse {
    0% { opacity: 0.4; r: 2.5; }
    50% { opacity: 0.6; r: 3.2; }
    100% { opacity: 0.4; r: 2.5; }
  }
  
  @keyframes haloBreathing {
    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.6; }
    100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
  }

  @keyframes refractionTwinkle {
    0% { opacity: 0.2; }
    25% { opacity: 0.5; }
    50% { opacity: 0.3; }
    75% { opacity: 0.6; }
    100% { opacity: 0.2; }
  }
</style>