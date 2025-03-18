<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  
  // Props
  export let era: string | undefined = undefined;
  export let isKeyEvent: boolean = false;
  export let isSelected: boolean = false;
  export let isHovered: boolean = false;
  export let size: number = 8;
  
  // More sophisticated sci-fi themed icons
  const scifiIcons = [
    // Add your preferred icons here
/*     'carbon:light',
    'mdi:orbit',
    'carbon:satellite',
    'carbon:network-3',
    'tabler:satellite',
    'mdi:space-station',
    'mdi:hubble' */
  ];
  
  // Special icons for key events - more dramatic or significant
  const keyEventIcons = [
    'mdi:orbit',
    'carbon:light',
 //   'carbon:data-enrichment',
 //   'mdi:black-hole'
  ];
  
  // Color variations using OKLCH format with --hue integration
  const colorVariations = [
    // Blues
    { lightness: 0.65, chroma: 0.2, hueOffset: -40 },  // Cooler blue
    { lightness: 0.7, chroma: 0.15, hueOffset: -20 },  // Lighter blue
    
    // Purples
    { lightness: 0.6, chroma: 0.25, hueOffset: 60 },   // Purple
    { lightness: 0.5, chroma: 0.2, hueOffset: 80 },    // Deep purple
    
    // Pinks
    { lightness: 0.7, chroma: 0.3, hueOffset: 100 },   // Pink
    { lightness: 0.8, chroma: 0.2, hueOffset: 110 },   // Light pink
    
    // Reds
    { lightness: 0.6, chroma: 0.3, hueOffset: 140 },   // Red
    { lightness: 0.5, chroma: 0.25, hueOffset: 150 }   // Deep red
  ];

  // Size variations factor - how much to vary sizes
  const sizeVariations = [0.7, 0.85, 1.0, 1.15, 1.3, 1.5];
  
  // Rotation options - including no rotation
  const rotationOptions = [
    'none',             // No rotation
    'rotate-slow-cw',   // Clockwise, slow
    'rotate-slow-ccw',  // Counter-clockwise, slow
    'rotate-med-cw',    // Clockwise, medium
    'rotate-med-ccw',   // Counter-clockwise, medium
    //'none'               Add another 'none' to increase chance of no rotation
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
  
  // Get an icon name based on an identifier
  function getIconName(identifier: string, isKeyEvent: boolean): string {
    const iconSet = isKeyEvent ? keyEventIcons : scifiIcons;
    if (iconSet.length === 0) return 'mdi:orbit'; // Default if no icons are specified
    return iconSet[hashString(identifier) % iconSet.length];
  }
  
  // Get an OKLCH color variation that will use the site's hue
  function getColorVariation(identifier: string): string {
    const variation = colorVariations[hashString(identifier) % colorVariations.length];
    return `oklch(${variation.lightness} ${variation.chroma} calc(var(--hue) + ${variation.hueOffset}deg))`;
  }
  
  // Get a size factor for the event - for visual variety
  function getSizeFactor(identifier: string, isKeyEvent: boolean): number {
    // Start with a base size factor
    const variation = sizeVariations[hashString(identifier) % sizeVariations.length];
    
    // Key events get an additional size boost
    if (isKeyEvent) {
      return variation * 1.5;
    }
    
    // Modify size based on era - an example of how to vary by property
    if (era) {
      switch(era) {
        case 'snuggaloid': 
          return variation * 1.2; // Larger for this era
        case 'post-extinction':
          return variation * 1.1; // Slightly larger for this era
      }
    }
    
    return variation;
  }
  
  // Get rotation class
  function getRotationClass(identifier: string): string {
    return rotationOptions[hashString(identifier) % rotationOptions.length];
  }
  
  // Generate a dynamic animation duration
  function getAnimationDuration(identifier: string): number {
    return 2.5 + (hashString(identifier) % 1000) / 500;
  }
  
  // Create a unique identifier from props to ensure consistent but varied rendering
  $: identifier = `${era || 'unknown'}-${isKeyEvent ? 'key' : 'normal'}-${size}`;
  
  // Calculate final size with appropriate factor
  $: sizeFactor = getSizeFactor(identifier, isKeyEvent);
  $: finalSize = size * sizeFactor;
  
  // Reactive variables for icon, color, and rotation
  $: iconName = getIconName(identifier, isKeyEvent);
  $: starColor = getColorVariation(identifier);
  $: animationDuration = getAnimationDuration(identifier);
  $: rotationClass = getRotationClass(identifier);
</script>

<div 
  class="star-node"
  class:is-selected={isSelected}
  class:is-hovered={isHovered}
  class:is-key-event={isKeyEvent}
  style="
    --animation-duration: {animationDuration}s; 
    --star-size: {finalSize}px;
    --star-color: {starColor};
    --size-factor: {sizeFactor};
  "
>
  <div 
    class="icon-wrapper" 
    style="width: {finalSize * 3}px; height: {finalSize * 3}px;"
  >
    <Icon 
      icon={iconName} 
      color="var(--star-color)" 
      width={finalSize * 3} 
      height={finalSize * 3}
      class="star-icon {rotationClass}"
    />
  </div>
</div>

<style>
  .star-node {
    transform-origin: center;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0 0 calc(3px * var(--size-factor)) var(--star-color));
  }
  
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center;
    position: relative;
  }
  
  .is-selected {
    transform: scale(1.3) !important;
    filter: drop-shadow(0 0 calc(8px * var(--size-factor)) var(--star-color)) !important;
    z-index: 10;
  }
  
  .is-hovered {
    transform: scale(1.1);
    filter: drop-shadow(0 0 calc(6px * var(--size-factor)) var(--star-color));
    z-index: 5;
  }
  
  .is-key-event {
    filter: drop-shadow(0 0 calc(5px * var(--size-factor)) var(--star-color)) 
           drop-shadow(0 0 calc(8px * var(--size-factor)) white);
  }
  
  .star-icon {
    transform-origin: center;
    animation: techPulse var(--animation-duration, 4s) infinite alternate ease-in-out;
  }
  
  /* Rotation animations */
  .rotate-slow-cw {
    animation: techPulse var(--animation-duration, 4s) infinite alternate ease-in-out,
               rotateCW 25s linear infinite;
  }
  
  .rotate-slow-ccw {
    animation: techPulse var(--animation-duration, 4s) infinite alternate ease-in-out,
               rotateCCW 30s linear infinite;
  }
  
  .rotate-med-cw {
    animation: techPulse var(--animation-duration, 4s) infinite alternate ease-in-out,
               rotateCW 18s linear infinite;
  }
  
  .rotate-med-ccw {
    animation: techPulse var(--animation-duration, 4s) infinite alternate ease-in-out,
               rotateCCW 20s linear infinite;
  }
  
  /* These extra size variations are now less significant since we have more deliberate sizing */
  /* But keeping them for subtle additional variation within each main size category */
  :global(.timeline-event:nth-child(3n+1)) .star-icon {
    transform: scale(0.95);
  }
  
  :global(.timeline-event:nth-child(7n+2)) .star-icon {
    transform: scale(1.05);
  }
  
  :global(.timeline-event:nth-child(5n+3)) .star-icon {
    transform: scale(0.97);
  }
  
  :global(.timeline-event:nth-child(11n+4)) .star-icon {
    transform: scale(1.02);
  }
  
  /* Override transformations for hover and selected states */
  .is-hovered .star-icon,
  .is-selected .star-icon {
    transform: scale(1.1) !important;
  }
  
  @keyframes techPulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1.1); opacity: 0.9; }
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