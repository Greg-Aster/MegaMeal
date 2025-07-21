<!--
  StarMap System Component - Modern Threlte Implementation
  Features:
  - Interactive star components using Threlte's built-in event system
  - Integration with reactive Svelte stores (gameStateStore)
  - Automatic timeline event mapping to 3D star positions
  - Hover and click interactions without manual raycasting
  - Mobile-optimized touch interactions
-->
<script lang="ts">
import { T, useTask } from '@threlte/core'
import { onMount, createEventDispatcher } from 'svelte'
import * as THREE from 'three'
import { 
  currentLevelStore, 
  selectedStarStore, 
  gameStatsStore,
  gameActions,
  type StarData 
} from '../stores/gameStateStore'

const dispatch = createEventDispatcher()

// Props
export let timelineEvents: any[] = []
export let starCount = 200
export let heightRange = { min: 50, max: 200 }
export let radius = 400

// Star configuration
const starColors = ['#ffffff', '#ffddaa', '#aaddff', '#ffaadd', '#aaffaa', '#ffaaff', '#aaffff']
const starSizes = [0.3, 0.5, 0.8, 1.0, 1.2]

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
)

// Optimized star count for mobile
$: optimizedStarCount = isMobile ? Math.min(starCount, 100) : starCount

// Star data arrays
let stars: StarData[] = []
let starMeshRefs: THREE.Mesh[] = []

// Animation state
let animationTime = 0

// Store subscriptions for reactivity
$: currentLevel = $currentLevelStore
$: selectedStar = $selectedStarStore
$: gameStats = $gameStatsStore

onMount(() => {
  console.log('✨ StarMap: Initializing with store integration...')
  generateStars()
})

function generateStars() {
  stars = []
  
  // Generate timeline-based stars first
  timelineEvents.forEach((event, index) => {
    const star = createStarFromTimelineEvent(event, index)
    stars.push(star)
  })
  
  // Fill remaining slots with procedural stars
  const remainingStars = optimizedStarCount - stars.length
  for (let i = 0; i < remainingStars; i++) {
    const star = createProceduralStar(stars.length + i)
    stars.push(star)
  }
  
  console.log(`✅ StarMap: Generated ${stars.length} stars (${timelineEvents.length} timeline events)`)
}

function createStarFromTimelineEvent(event: any, index: number): StarData {
  // Strategic positioning based on timeline era and importance
  const angle = (index / timelineEvents.length) * Math.PI * 2
  const radiusVariation = event.isKeyEvent ? radius * 0.6 : radius * 0.8 + Math.random() * radius * 0.4
  
  const x = Math.cos(angle) * radiusVariation
  const z = Math.sin(angle) * radiusVariation
  const y = heightRange.min + (event.isKeyEvent ? 0.8 : Math.random()) * (heightRange.max - heightRange.min)
  
  return {
    uniqueId: event.id || `timeline_star_${index}`,
    position: [x, y, z] as [number, number, number],
    color: event.isKeyEvent ? '#ffaa00' : starColors[Math.floor(Math.random() * starColors.length)],
    size: event.isKeyEvent ? starSizes[4] : starSizes[Math.floor(Math.random() * starSizes.length)],
    intensity: event.isKeyEvent ? 0.8 : 0.2 + Math.random() * 0.4,
    
    // Timeline data
    title: event.title || `Star ${index + 1}`,
    description: event.description || 'A distant star in the cosmic void',
    timelineYear: event.year,
    timelineEra: event.era,
    timelineLocation: event.location,
    isKeyEvent: event.isKeyEvent || false,
    isLevel: event.isLevel || false,
    levelId: event.levelId,
    tags: event.tags || [],
    category: event.category || 'unknown',
    slug: event.slug,
    
    // Interactive data
    clickable: true,
    hoverable: true,
    unlocked: true,
    
    // Animation data
    animationOffset: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.5 + Math.random() * 1.5,
    
    // Screen position data (for UI positioning)
    screenPosition: {
      cardClass: index % 4 === 0 ? 'top' : index % 4 === 1 ? 'right' : index % 4 === 2 ? 'bottom' : 'left'
    }
  }
}

function createProceduralStar(index: number): StarData {
  const angle = Math.random() * Math.PI * 2
  const radiusPos = Math.random() * radius
  const x = Math.cos(angle) * radiusPos
  const z = Math.sin(angle) * radiusPos
  const y = heightRange.min + Math.random() * (heightRange.max - heightRange.min)
  
  return {
    uniqueId: `procedural_star_${index}`,
    position: [x, y, z] as [number, number, number],
    color: starColors[Math.floor(Math.random() * starColors.length)],
    size: starSizes[Math.floor(Math.random() * starSizes.length)],
    intensity: 0.1 + Math.random() * 0.3,
    
    // Basic data
    title: `Star ${index + 1}`,
    description: 'A distant star in the cosmic void',
    timelineYear: 2000 + Math.floor(Math.random() * 1000),
    timelineEra: 'Unknown Era',
    timelineLocation: 'Deep Space',
    isKeyEvent: false,
    isLevel: false,
    levelId: null,
    tags: ['procedural'],
    category: 'background',
    slug: `star-${index}`,
    
    // Interactive data
    clickable: true,
    hoverable: true,
    unlocked: true,
    
    // Animation data
    animationOffset: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.5 + Math.random() * 1.5,
    
    // Screen position data
    screenPosition: {
      cardClass: 'bottom'
    }
  }
}

// Star interaction handlers using Threlte's built-in events
function handleStarClick(star: StarData, event: any) {
  console.log('⭐ Star clicked:', star.title)
  
  // Update selected star in store (reactive)
  gameActions.selectStar(star)
  
  // Record interaction in game stats
  gameActions.recordInteraction('star_click', star.uniqueId)
  
  // Dispatch event for external handling
  dispatch('starSelected', {
    star: star,
    eventData: star,
    screenPosition: event.intersection?.point || star.position
  })
}

function handleStarHover(star: StarData, isHovering: boolean) {
  if (isHovering) {
    console.log('⭐ Star hovered:', star.title)
    gameActions.recordInteraction('star_hover', star.uniqueId)
  }
}

// Subtle twinkling animation
useTask((delta) => {
  animationTime += delta
  
  // Update star twinkle effects
  starMeshRefs.forEach((meshRef, index) => {
    if (!meshRef) return
    
    const star = stars[index]
    if (!star) return
    
    // Twinkling intensity animation
    const twinkle = Math.sin(animationTime * star.twinkleSpeed + star.animationOffset) * 0.3 + 0.7
    if (meshRef.material && 'emissiveIntensity' in meshRef.material) {
      (meshRef.material as any).emissiveIntensity = star.intensity * twinkle
    }
    
    // Subtle floating motion for key events
    if (star.isKeyEvent) {
      const float = Math.sin(animationTime * 0.5 + star.animationOffset) * 0.5
      meshRef.position.y = star.position[1] + float
    }
  })
})

// Reactive updates based on store changes
$: {
  // Highlight selected star
  starMeshRefs.forEach((meshRef, index) => {
    if (!meshRef) return
    
    const star = stars[index]
    const isSelected = selectedStar && selectedStar.uniqueId === star?.uniqueId
    
    if (meshRef.material && 'emissive' in meshRef.material) {
      const material = meshRef.material as THREE.MeshStandardMaterial
      if (isSelected) {
        material.emissive.setHex(0x444400) // Yellow glow for selected
        material.emissiveIntensity = 2.0
      } else {
        material.emissive.setHex(0x000000) // No glow for unselected
        material.emissiveIntensity = star?.intensity || 0.3
      }
    }
  })
}
</script>

<!-- Interactive Star Map -->
<T.Group name="starmap">
  {#each stars as star, index (star.uniqueId)}
    <T.Mesh 
      bind:ref={starMeshRefs[index]}
      position={star.position}
      userData={{
        id: star.uniqueId,
        interactable: true,
        type: 'star',
        starData: star
      }}
      on:click={(event) => handleStarClick(star, event)}
      on:pointerenter={() => handleStarHover(star, true)}
      on:pointerleave={() => handleStarHover(star, false)}
    >
      <!-- Star geometry -->
      <T.SphereGeometry args={[star.size, 8, 6]} />
      
      <!-- Star material with emissive glow -->
      <T.MeshStandardMaterial 
        color={star.color}
        emissive={star.color}
        emissiveIntensity={star.intensity}
        transparent={true}
        opacity={0.9}
        toneMapped={false}
        fog={false}
      />
      
      <!-- Point light for star illumination -->
      <T.PointLight 
        position={[0, 0, 0]}
        intensity={star.intensity * 0.5}
        color={star.color}
        distance={star.isKeyEvent ? 15 : 8}
        decay={2}
      />
      
      <!-- Enhanced glow for key events -->
      {#if star.isKeyEvent}
        <T.Mesh position={[0, 0, 0]}>
          <T.SphereGeometry args={[star.size * 2, 8, 6]} />
          <T.MeshBasicMaterial 
            color={star.color}
            transparent={true}
            opacity={0.2}
            toneMapped={false}
            fog={false}
          />
        </T.Mesh>
      {/if}
    </T.Mesh>
  {/each}
</T.Group>

<style>
/* No styles needed - all handled by Threlte components */
</style>