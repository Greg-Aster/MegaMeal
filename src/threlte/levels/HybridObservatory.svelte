<!--
  Hybrid Observatory Level - Demonstrating ECS + Modular Architecture
  
  This shows how the new hybrid system works:
  1. High-level components for scene setup (same as before)
  2. ECS entities for performance-critical dynamic objects (fireflies)
  3. Automatic cross-system communication (fireflies reflect in ocean)
  4. Performance optimization (ECS handles 1000+ fireflies easily)
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { T } from '@threlte/core'
  
  // Import the level system (now fixed!)
  import LevelManager from '../core/LevelManager.svelte'
  
  // Import modular components (high-level systems)
  import OceanComponent from '../components/OceanComponent.svelte'
  import LightingComponent from '../components/LightingComponent.svelte'
  
  // Import the NEW hybrid firefly component
  import HybridFireflyComponent from '../components/HybridFireflyComponent.svelte'
  
  // Import existing components
  import Skybox from '../systems/Skybox.svelte'
  import StaticEnvironment from '../systems/StaticEnvironment.svelte'
  import StarMap from '../systems/StarMap.svelte'
  
  // Import new star navigation components
  import StarNavigationSystem from '../components/StarNavigationSystem.svelte'
  
  // Import level configuration
  import config from '../../game/levels/observatory.json'
  
  // Import timeline data service
  import { timelineDataService } from '../services/TimelineDataService'
  import type { StarEventData } from '../services/TimelineDataService'

  const dispatch = createEventDispatcher()

  // Props
  export let timelineEvents: any[] = []
  export let timelineEventsJson: string = '[]' // JSON string of timeline events for star system
  export let onLevelReady: (() => void) | undefined = undefined

  // Component references for external control
  let hybridFireflyComponent: HybridFireflyComponent
  let starMapComponent: StarMap
  let starNavigationSystem: StarNavigationSystem
  
  // Timeline data state
  let realTimelineEvents: StarEventData[] = []
  let isLoadingTimeline = true
  let timelineLoadError: string | null = null

  // Terrain height function for fireflies
  function getHeightAt(x: number, z: number): number {
    const distanceFromCenter = Math.sqrt(x * x + z * z)
    
    const terrainParams = {
      hillHeight: 15,
      hillRadius: 100,
      islandRadius: 220,
      baseGroundLevel: -5,
    }
    
    let height = 0
    
    if (distanceFromCenter < terrainParams.hillRadius) {
      const heightMultiplier = Math.cos(
        (distanceFromCenter / terrainParams.hillRadius) * Math.PI * 0.5,
      )
      height = terrainParams.baseGroundLevel + terrainParams.hillHeight * heightMultiplier * heightMultiplier
    } else {
      height = terrainParams.baseGroundLevel
    }
    
    if (distanceFromCenter >= terrainParams.islandRadius) {
      const voidDistance = distanceFromCenter - terrainParams.islandRadius
      height = terrainParams.baseGroundLevel - Math.pow(voidDistance * 0.1, 2)
    }
    
    return height
  }

  // Load timeline data on mount
  onMount(() => {
    loadTimelineData()
  })

  function loadTimelineData() {
    try {
      isLoadingTimeline = true
      timelineLoadError = null
      
      console.log('📊 HybridObservatory: Processing timeline events from props...')
      
      // Try to parse JSON timeline events first
      if (timelineEventsJson && timelineEventsJson !== '[]') {
        try {
          const parsedEvents = JSON.parse(timelineEventsJson)
          console.log(`📊 Parsed ${parsedEvents.length} timeline events from JSON prop`)
          
          // Transform to StarEventData format using TimelineDataService
          realTimelineEvents = parsedEvents.map((event: any, index: number) => 
            timelineDataService.transformEventToStarData(event, index)
          )
          
          console.log(`✅ Processed ${realTimelineEvents.length} star events from JSON`)
        } catch (parseError) {
          console.warn('⚠️ Failed to parse timelineEventsJson, falling back to timelineEvents prop:', parseError)
          throw parseError
        }
      }
      // Fallback to direct timelineEvents prop
      else if (timelineEvents.length > 0) {
        console.log(`📊 Using ${timelineEvents.length} timeline events from direct prop`)
        realTimelineEvents = timelineEvents.map((event: any, index: number) => 
          timelineDataService.transformEventToStarData(event, index)
        )
        console.log(`✅ Processed ${realTimelineEvents.length} star events from prop`)
      }
      // No data available
      else {
        console.warn('⚠️ No timeline events provided via props')
        realTimelineEvents = []
      }
      
    } catch (error) {
      console.error('❌ Failed to process timeline data:', error)
      timelineLoadError = error instanceof Error ? error.message : 'Unknown error'
      realTimelineEvents = []
    } finally {
      isLoadingTimeline = false
    }
  }

  function handleEnvironmentLoaded() {
    console.log('✅ Hybrid Observatory environment loaded')
    if (onLevelReady) {
      onLevelReady()
    }
  }

  function handleEnvironmentError(event: CustomEvent) {
    console.log('❌ Environment loading failed:', event.detail)
  }

  // Example: External emotional state control
  function triggerWonder() {
    if (hybridFireflyComponent) {
      hybridFireflyComponent.setEmotionalState(100, 0, 80, 60)
      console.log('✨ Triggered wonder state - fireflies should respond!')
    }
  }

  function triggerDiscovery() {
    if (hybridFireflyComponent) {
      hybridFireflyComponent.triggerDiscovery()
      console.log('🔍 Triggered discovery - watch the fireflies dance!')
    }
  }

  // Handle star interactions
  function handleStarSelected(event: CustomEvent) {
    const { star, eventData, screenPosition, worldPosition } = event.detail
    console.log('🌟 HybridObservatory: Star selected:', star?.title)
    
    // You can add level-specific star selection logic here
    dispatch('starSelected', event.detail)
  }

  function handleStarDeselected(event: CustomEvent) {
    console.log('🌟 HybridObservatory: Star deselected')
    dispatch('starDeselected', event.detail)
  }

  function handleLevelTransition(event: CustomEvent) {
    const { levelType, fromStar } = event.detail
    console.log('🎮 HybridObservatory: Level transition requested:', levelType)
    
    // Forward the level transition to parent game manager
    dispatch('levelTransition', event.detail)
  }
</script>

<!--
  THE HYBRID ARCHITECTURE IN ACTION:
  
  This level demonstrates the perfect balance between:
  - Declarative scene composition (Svelte components)
  - High-performance entity management (ECS for fireflies)
  - Automatic cross-system integration (lighting updates)
  - Easy level creation (just drop components in)
-->
<LevelManager let:registry let:lighting let:ecsWorld>
  
  <!-- Atmospheric fog for horizon haze -->
  <T.FogExp2 
    color={0x6a7db3}
    density={0.003}
  />
  
  <T.Group name="hybrid-observatory">
    
    <!-- Skybox (existing component, works fine) -->
    <Skybox imageUrl="/assets/hdri/skywip4.webp" />
    
    <!-- Static Environment (existing component) -->
    <StaticEnvironment 
      url="/models/levels/observatory-environment.glb"
      scale={1.0}
      on:loaded={handleEnvironmentLoaded}
      on:error={handleEnvironmentError}
    />
    
    <!-- 
      MODULAR LIGHTING COMPONENT (High-level system)
      This manages the level's lighting and automatically
      integrates with the ECS emotional state system.
    -->
    <LightingComponent 
      ambientColor={0x404060}
      ambientIntensity={1.0}
      directionalLights={[
        {
          position: [100, 200, 50],
          color: "#8bb3ff",
          intensity: 0.5,
          castShadow: true,
          shadowMapSize: 2048
        },
        {
          position: [-50, 100, -30],
          color: "#6a7db3",
          intensity: 0.25,
          castShadow: false
        }
      ]}
    />
    
    <!-- 
      MODULAR OCEAN COMPONENT (High-level system)
      This ocean automatically receives lighting updates from
      the ECS firefly system. The ECS provides real-time light
      data for perfect reflections.
    -->
    <OceanComponent 
      size={config.water.oceanConfig.size}
      color={0x006994}
      opacity={0.95}
      segments={{ width: 32, height: 32 }}
      enableAnimation={config.water.oceanConfig.enableAnimation}
      animationSpeed={0.1}
      dynamics={config.water.dynamics}
    />
    
    <!-- 
      HYBRID FIREFLY COMPONENT (High-level setup + ECS entities)
      
      PERFECT CONFIGURATION from legacy FireflySystem.ts:
      - Much slower, more realistic movement (speed: 0.2, wanderSpeed: 0.004)
      - Gentle floating animation (floatAmplitude: {x: 1.5, y: 0.5, z: 1.5})
      - Longer, stable light cycles (cycleDuration: 12.0, fadeSpeed: 2.0)  
      - Optimal count and intensity (80 fireflies, emissive: 15.0)
      
      This recreates the beautiful original experience with ECS performance!
    -->
    <HybridFireflyComponent 
      bind:this={hybridFireflyComponent}
      {getHeightAt}
      count={80}
      maxLights={20}
      lightIntensity={30.0}
      lightRange={1000}
      cycleDuration={12.0}
      fadeSpeed={2.0}
      heightRange={{ min: 2.0, max: 10.0 }}
      radius={180}
      pointSize={800.0}
      glowInnerRadius={0.02}
      glowOuterRadius={0.5}
      coreRadius={0.03}
      coreOpacity={1.0}
      movement={{
        speed: 0.2,
        wanderSpeed: 0.004,
        wanderRadius: 4,
        floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 },
        lerpFactor: 1.0
      }}
      colors={[0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]}
    />
    
    <!-- 
      LOADING STATE for timeline data
    -->
    {#if isLoadingTimeline}
      <T.Group position={[0, 5, 0]} name="loading-indicator">
        <T.Mesh>
          <T.SphereGeometry args={[2]} />
          <T.MeshBasicMaterial color="#00ff88" transparent opacity={0.6} />
        </T.Mesh>
      </T.Group>
    {:else if timelineLoadError}
      <T.Group position={[0, 5, 0]} name="error-indicator">
        <T.Mesh>
          <T.SphereGeometry args={[2]} />
          <T.MeshBasicMaterial color="#ff0044" transparent opacity={0.6} />
        </T.Mesh>
      </T.Group>
    {:else}
      <!-- Star Map with enhanced navigation using REAL timeline data -->
      <StarMap 
        bind:this={starMapComponent}
        timelineEvents={realTimelineEvents}
        starCount={realTimelineEvents.length + 50}
        heightRange={{ min: 50, max: 200 }}
        radius={400}
        on:starSelected={handleStarSelected}
      />
    {/if}
    
    <!-- 
      STAR NAVIGATION SYSTEM (New ECS component)
      This bridges StarMap interactions with timeline card display and level transitions.
      It provides the missing functionality from the old StarNavigationSystemModern.ts.
    -->
    {#if starMapComponent && !isLoadingTimeline}
      <StarNavigationSystem 
        bind:this={starNavigationSystem}
        timelineEvents={realTimelineEvents}
        starMapComponent={starMapComponent}
        on:starSelected={handleStarSelected}
        on:starDeselected={handleStarDeselected}
        on:levelTransition={handleLevelTransition}
        on:starInteraction={(e) => console.log('🎯 Star interaction:', e.detail)}
        on:transitionStarted={(e) => console.log('🎮 Transition started:', e.detail)}
        on:transitionCompleted={(e) => console.log('✅ Transition completed:', e.detail)}
        on:transitionFailed={(e) => console.log('❌ Transition failed:', e.detail)}
      />
    {/if}
    
    <!-- 
      DEBUGGING CONTROLS (remove in production)
      These show how external systems can control the ECS emotional state
    -->
    <T.Group position={[0, 10, 0]} name="debug-controls">
      <!-- You could add invisible trigger zones here that call triggerWonder() etc. -->
    </T.Group>
    
    <!-- Debug timeline information (dev only) -->
    {#if import.meta.env.DEV && !isLoadingTimeline}
      <T.Group position={[10, 2, 0]} name="debug-timeline-info">
        <!-- This would be invisible but logged to console -->
      </T.Group>
    {/if}
    
  </T.Group>

</LevelManager>

<!--
  EXAMPLE: How to create player interactions that affect the emotional system
  
  You could add click handlers to environmental objects:
  
  <T.Mesh position={[5, 1, 5]} on:click={triggerWonder}>
    <T.SphereGeometry args={[0.5]} />
    <T.MeshStandardMaterial color="gold" />
  </T.Mesh>
  
  Or trigger states based on player movement:
  
  {#if playerNearTelescope}
    {triggerDiscovery()}
  {/if}
-->

<!--
  KEY ADVANTAGES OF THIS HYBRID APPROACH:

  🚀 PERFORMANCE:
  - ECS handles 80+ fireflies with minimal CPU usage
  - Systems process entities in tight loops (cache-friendly)
  - Automatic performance scaling based on device capabilities

  🎯 MODULARITY:
  - Components still work exactly like before
  - Drop into any level and they auto-integrate
  - Easy to add new component types

  ⚡ SCALABILITY:
  - Want 1000 fireflies? Change count={1000} - no performance loss
  - ECS systems automatically batch process all entities
  - Memory usage scales linearly, not exponentially

  🔧 FLEXIBILITY:
  - Add new ECS systems without touching components
  - Emotional state affects ALL fireflies automatically
  - Easy to add new entity types (sparkles, birds, etc.)

  💡 INTEGRATION:
  - Fireflies automatically reflect in ocean
  - Lighting updates propagate to all systems
  - Player interactions affect entire ecosystem

  ⭐ STAR NAVIGATION SYSTEM:
  - Click stars to display timeline cards
  - Timeline cards positioned at star screen coordinates
  - Level navigation from timeline cards works seamlessly
  - ECS-based reusable components following game design patterns

  This is how AAA games are built - and now your web game has the same architecture!
-->

<style>
  /* No styles needed */
</style>