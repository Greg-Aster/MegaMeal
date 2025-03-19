<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props
  export let era: string | undefined = undefined;
  export let isKeyEvent: boolean = false;
  export let isSelected: boolean = false;
  export let isHovered: boolean = false;
  export let size: number = 8;
  
  // Color variations using OKLCH format with --hue integration - focusing on blues and purples
  const colorVariations = [
    // Blues
    { lightness: 0.65, chroma: 0.3, hueOffset: -40 },  // Deep blue
    { lightness: 0.7, chroma: 0.25, hueOffset: -30 },  // Royal blue
    { lightness: 0.6, chroma: 0.28, hueOffset: -20 },  // Sky blue
    { lightness: 0.75, chroma: 0.2, hueOffset: -10 },  // Light blue
    
    // Purples
    { lightness: 0.55, chroma: 0.32, hueOffset: 50 },  // Deep purple
    { lightness: 0.6, chroma: 0.3, hueOffset: 60 },    // Medium purple
    { lightness: 0.65, chroma: 0.28, hueOffset: 70 },  // Lavender purple
    { lightness: 0.7, chroma: 0.25, hueOffset: 80 }    // Light purple
  ];

  // Enhanced color variations by era - focusing on blues and purples
  const eraColorMap = {
    'pre-spork': { lightness: 0.65, chroma: 0.3, hueOffset: -40 }, // Deep blue
    'spork-uprising': { lightness: 0.55, chroma: 0.32, hueOffset: 50 }, // Deep purple
    'snuggaloid': { lightness: 0.65, chroma: 0.28, hueOffset: 70 }, // Lavender purple
    'post-extinction': { lightness: 0.7, chroma: 0.25, hueOffset: -10 } // Light blue
  };

  // Size variations factor with a narrower range for more consistency
  const sizeVariations = [0.8, 0.90, 1.0, 1.1, 1.15, 1.25];
  
  // Rotation options - including no rotation
  const rotationOptions = [
    'none',             // No rotation
    'rotate-slow-cw',   // Clockwise, slow
    'rotate-slow-ccw',  // Counter-clockwise, slow
    'rotate-med-cw',    // Clockwise, medium
    'rotate-med-ccw',   // Counter-clockwise, medium
  ];

  // Pulse variations - different pulse patterns
  const pulsePatterns = [
    'pulse-gentle',     // Subtle pulsing
    'pulse-wave',       // Wave-like pulse
    'pulse-throb',      // More dramatic pulse
    'pulse-double',     // Double pulse effect
    'pulse-breathe'     // Slow breathing effect
  ];

  // Generate a pseudo-random but deterministic number from a string
  function hashString(str: string): number {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  // Get an OKLCH color variation that will use the site's hue
  function getColorVariation(identifier: string): string {
    // If the event has a specific era with a color mapping, use that
    if (era && eraColorMap[era]) {
      const eraColor = eraColorMap[era];
      return `oklch(${eraColor.lightness} ${eraColor.chroma} calc(var(--hue) + ${eraColor.hueOffset}deg))`;
    }
    
    // Otherwise use the general color variations
    const variation = colorVariations[hashString(identifier) % colorVariations.length];
    return `oklch(${variation.lightness} ${variation.chroma} calc(var(--hue) + ${variation.hueOffset}deg))`;
  }
  
  // Get a size factor for the event - with more consistent sizing
  function getSizeFactor(identifier: string, isKeyEvent: boolean): number {
    // Start with a base size factor
    const variation = sizeVariations[hashString(identifier) % sizeVariations.length];
    
    // Key events get a SMALLER additional size boost (reduced from 1.5)
    if (isKeyEvent) {
      return variation * 1.2;
    }
    
    // Modify size based on era - More subtle variations
    if (era) {
      switch(era) {
        case 'snuggaloid': 
          return variation * 1.1; // Reduced from 1.2
        case 'post-extinction':
          return variation * 1.05; // Reduced from 1.1
      }
    }
    
    return variation;
  }
  
  // Get rotation class
  function getRotationClass(identifier: string): string {
    return rotationOptions[hashString(identifier) % rotationOptions.length];
  }
  
  // Get pulse pattern class
  function getPulsePatternClass(identifier: string): string {
    return pulsePatterns[hashString(identifier) % pulsePatterns.length];
  }
  
  // Generate a dynamic animation duration - slowed down
  function getAnimationDuration(identifier: string): number {
    return 4 + (hashString(identifier) % 1000) / 250; // Increased base duration and slower variation
  }
  
  // Create a unique identifier from props to ensure consistent but varied rendering
  $: identifier = `${era || 'unknown'}-${isKeyEvent ? 'key' : 'normal'}-${size}`;
  
  // Calculate final size with appropriate factor
  $: sizeFactor = getSizeFactor(identifier, isKeyEvent);
  $: finalSize = size * sizeFactor;
  
  // Reactive variables for color and animation
  $: starColor = getColorVariation(identifier);
  $: secondaryColor = getSecondaryColor(starColor);
  $: animationDuration = getAnimationDuration(identifier);
  $: rotationClass = getRotationClass(identifier);
  $: pulseClass = getPulsePatternClass(identifier);
  
  // Generate a complementary/secondary color for effects (staying in blue-purple range)
  function getSecondaryColor(primaryColor: string): string {
    // For OKLCH colors, create a harmonious color in the blue-purple range
    if (primaryColor.includes('oklch')) {
      // Extract the parts of the OKLCH color
      const match = primaryColor.match(/oklch\(([\d.]+) ([\d.]+) calc\(var\(--hue\) \+ ([-\d]+)deg\)\)/);
      if (match) {
        const lightness = parseFloat(match[1]);
        const chroma = parseFloat(match[2]);
        const hueOffset = parseInt(match[3]);
        
        // Create a new color with adjusted parameters but still in blue-purple range
        const newLightness = lightness > 0.6 ? lightness - 0.15 : lightness + 0.15;
        const newChroma = Math.min(0.35, chroma + 0.05);
        
        // Keep hue shift within blue-purple range (-40 to 80)
        const baseHueOffset = hueOffset > 20 ? hueOffset - 60 : hueOffset + 60;
        const newHueOffset = Math.max(-40, Math.min(80, baseHueOffset));
        
        return `oklch(${newLightness} ${newChroma} calc(var(--hue) + ${newHueOffset}deg))`;
      }
    }
    return primaryColor;
  }
  
  // Local state
  let isInitialized = false;
  let showSparkle = false;
  
  onMount(() => {
    isInitialized = true;
    
    // Add random sparkle effect occasionally for selected nodes
    if (isSelected || isKeyEvent) {
      const sparkleInterval = setInterval(() => {
        showSparkle = true;
        setTimeout(() => { showSparkle = false; }, 700);
      }, 3000 + Math.random() * 2000);
      
      return () => {
        clearInterval(sparkleInterval);
      };
    }
  });
</script>

<div 
  class="star-node"
  class:is-selected={isSelected}
  class:is-hovered={isHovered}
  class:is-key-event={isKeyEvent}
  class:is-initialized={isInitialized}
  style="
    --animation-duration: {animationDuration}s; 
    --star-size: {finalSize}px;
    --star-color: {starColor};
    --secondary-color: {secondaryColor};
    --size-factor: {sizeFactor};
  "
>
  <div 
    class="icon-wrapper {pulseClass}" 
    style="width: {finalSize * 3}px; height: {finalSize * 3}px;"
  >
    <!-- Star glow effect -->
    <div class="star-glow"></div>
    
    <!-- Star icon -->
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={finalSize * 3} 
      height={finalSize * 3}
      viewBox="0 0 24 24" 
      class="star-icon {rotationClass}"
      style="color: var(--star-color);"
    >
      {#if isKeyEvent}
        <!-- Orbit icon for key events -->
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8z"/>
        <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.7" />
        
        <!-- Inner glow for key events - using blue/purple instead of white -->
        <circle cx="12" cy="12" r="3" fill="var(--secondary-color)" opacity="0.3" class="inner-glow" />
      {:else}
        <!-- Simple circle icon for normal events -->
        <circle cx="12" cy="12" r="8" fill="currentColor" />
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.5" />
      {/if}
    </svg>
    
    <!-- Sparkle effect for selected or key events -->
    {#if (isSelected || isKeyEvent) && showSparkle}
      <div class="sparkle-container">
        <div class="sparkle sparkle-1" style="background-color: var(--secondary-color);"></div>
        <div class="sparkle sparkle-2" style="background-color: var(--star-color);"></div>
        <div class="sparkle sparkle-3" style="background-color: var(--secondary-color);"></div>
        <div class="sparkle sparkle-4" style="background-color: var(--star-color);"></div>
      </div>
    {/if}
    
    <!-- Orbit particle effects for key events -->
    {#if isKeyEvent}
      <div class="orbit-particles">
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .star-node {
    transform-origin: center;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0 0 calc(3px * var(--size-factor)) var(--star-color));
    position: relative;
  }
  
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center;
    position: relative;
    overflow: visible;
  }
  
  .is-selected {
    /* Reduced transform scale from 1.3 to 1.15 */
    transform: scale(1.15) !important;
    filter: 
      drop-shadow(0 0 calc(8px * var(--size-factor)) var(--star-color))
      drop-shadow(0 0 calc(16px * var(--size-factor)) var(--star-color))
    !important;
    z-index: 10;
  }
  
  .is-hovered {
    /* Remove transform scale entirely - just use the glow effect */
    transform: none;
    filter: 
      drop-shadow(0 0 calc(6px * var(--size-factor)) var(--star-color))
      drop-shadow(0 0 calc(12px * var(--size-factor)) var(--star-color)); 
    z-index: 5;
  }
  
  .is-key-event {
    filter: 
      drop-shadow(0 0 calc(5px * var(--size-factor)) var(--star-color))
      drop-shadow(0 0 calc(10px * var(--size-factor)) var(--star-color))
      drop-shadow(0 0 calc(3px * var(--size-factor)) var(--secondary-color));
  }
  
  /* Enhanced star glow effect */
  .star-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--star-size) * 2.5);
    height: calc(var(--star-size) * 2.5);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      var(--star-color) 0%,
      rgba(255,255,255,0) 70%
    );
    opacity: 0.4;
    animation: glowPulse var(--animation-duration, 4s) infinite alternate ease-in-out;
    pointer-events: none;
  }
  
  .is-selected .star-glow {
    width: calc(var(--star-size) * 3);
    height: calc(var(--star-size) * 3);
    opacity: 0.6;
  }
  
  .is-key-event .star-glow {
    background: radial-gradient(
      circle,
      var(--secondary-color) 0%,
      var(--star-color) 30%,
      rgba(255,255,255,0) 70%
    );
  }
  
  .star-icon {
    transform-origin: center;
    position: relative;
    z-index: 2; /* Make sure the star is above the glow */
  }
  
  /* Enhanced inner glow animation */
  .inner-glow {
    animation: innerGlowPulse var(--animation-duration, 3s) infinite alternate ease-in-out;
  }
  
  /* Sparkle effects */
  .sparkle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .sparkle {
    position: absolute;
    width: calc(var(--star-size) * 0.4);
    height: calc(var(--star-size) * 0.4);
    background-color: var(--star-color); /* Default, individual sparkles override this */
    border-radius: 50%;
    opacity: 0;
    animation: sparkleAnimation 1.2s ease-out forwards; /* Slower animation */
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
  
  /* Orbit particles for key events */
  .orbit-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .particle {
    position: absolute;
    width: calc(var(--star-size) * 0.3);
    height: calc(var(--star-size) * 0.3);
    background-color: var(--secondary-color);
    border-radius: 50%;
    opacity: 0.7;
  }
  
  .particle-1 {
    animation: orbit 12s linear infinite;
  }
  
  .particle-2 {
    animation: orbit 16s linear infinite;
    animation-delay: -4s;
  }
  
  .particle-3 {
    animation: orbit 20s linear infinite;
    animation-delay: -10s;
  }
  
  /* Pulse pattern variations */
  .pulse-gentle {
    animation: gentlePulse var(--animation-duration, 4s) infinite alternate ease-in-out;
  }
  
  .pulse-wave {
    animation: wavePulse var(--animation-duration, 4s) infinite alternate ease-in-out;
  }
  
  .pulse-throb {
    animation: throbPulse var(--animation-duration, 3s) infinite alternate ease-in-out;
  }
  
  .pulse-double {
    animation: doublePulse var(--animation-duration, 4s) infinite ease-in-out;
  }
  
  .pulse-breathe {
    animation: breathe var(--animation-duration, 6s) infinite ease-in-out;
  }
  
  /* Rotation animations - slowed down */
  .rotate-slow-cw {
    animation: rotateCW 35s linear infinite;
  }
  
  .rotate-slow-ccw {
    animation: rotateCCW 40s linear infinite;
  }
  
  .rotate-med-cw {
    animation: rotateCW 28s linear infinite;
  }
  
  .rotate-med-ccw {
    animation: rotateCCW 30s linear infinite;
  }
  
  /* Remove all these subtle size variations to keep sizes more consistent */
  /* This helps prevent glitching when cards appear */
  
  /* Override transformations for hover and selected states */
  .is-hovered .star-icon,
  .is-selected .star-icon {
    /* Reduced from 1.1 to 1.05 for more subtle effect */
    transform: scale(1.05) !important;
  }
  
  /* Animation keyframes */
  @keyframes glowPulse {
    0% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9); }
    50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
    100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9); }
  }
  
  @keyframes innerGlowPulse {
    0% { opacity: 0.25; r: 2.5; }
    50% { opacity: 0.4; r: 3.2; }
    100% { opacity: 0.25; r: 2.5; }
  }
  
  @keyframes sparkleAnimation {
    0% { transform: scale(0); opacity: 0; }
    20% { transform: scale(1.2); opacity: 0.7; }
    40% { transform: scale(0.9); opacity: 0.5; }
    70% { transform: scale(1.5); opacity: 0.3; }
    100% { transform: scale(2); opacity: 0; }
  }
  
  @keyframes orbit {
    from {
      transform: rotate(0deg) translateX(calc(var(--star-size) * 1.2)) rotate(0deg);
    }
    to {
      transform: rotate(360deg) translateX(calc(var(--star-size) * 1.2)) rotate(-360deg);
    }
  }
  
  @keyframes gentlePulse {
    0% { transform: scale(0.97); }
    50% { transform: scale(1.03); }
    100% { transform: scale(0.97); }
  }
  
  @keyframes wavePulse {
    0% { transform: scale(0.96); }
    33% { transform: scale(1.0); }
    66% { transform: scale(1.04); }
    100% { transform: scale(0.96); }
  }
  
  @keyframes throbPulse {
    0% { transform: scale(0.95); }
    40% { transform: scale(1.05); }
    60% { transform: scale(1.03); }
    100% { transform: scale(0.95); }
  }
  
  @keyframes doublePulse {
    0% { transform: scale(0.97); }
    25% { transform: scale(1.03); }
    35% { transform: scale(0.99); }
    50% { transform: scale(1.01); }
    100% { transform: scale(0.97); }
  }
  
  @keyframes breathe {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }
  
  @keyframes rotateCW {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes rotateCCW {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
</style>