<!--
  HybridFireflyComponent - Modern ECS Architecture with Performant Glow Effect

  This component uses the full ECS architecture and combines it with a high-performance,
  shader-based rendering method for a soft "bloom" effect on each firefly.

  - ECS entities for high-performance firefly management
  - Shader-based Points rendering for a fuzzy glow (replaces InstancedMesh)
  - Perfect legacy visual parameters preserved
  - Device-aware optimization with OptimizationManager
  - Modern component lifecycle management
-->
<script lang="ts">
  import { onMount, getContext } from 'svelte'
  import { T, useTask, useThrelte } from '@threlte/core'
  import * as THREE from 'three'
  import { OptimizationManager } from '../optimization/OptimizationManager'
  import {
    BaseLevelComponent,
    ComponentType,
    MessageType,
    type LevelContext,
    type SystemMessage
  } from '../core/LevelSystem'
  import {
    fireflyQuery,
    Position,
    LightEmitter,
    LightCycling
  } from '../core/ECSIntegration'
  import StarSprite from './StarSprite.svelte'
  import { gameActions } from '../stores/gameStateStore'
  
  // Import our rich AI personality system
  import { 
    FIREFLY_PERSONALITIES, 
    getRandomFireflyPersonality, 
    generateFireflyPopulation,
    getObservatoryContext 
  } from '../systems/conversation/fireflyPersonalities'
  
  // Import conversation system
  import ConversationDialog from '../systems/conversation/ConversationDialog.svelte';
  import {
    conversationActions,
    isConversationActive,
  } from '../systems/conversation/conversationStores'

  // Enhanced FireflyVisual interface with rich AI personality data
  interface FireflyVisual {
    id: number
    position: [number, number, number]
    color: number
    size: number
    intensity: number
    twinkleSpeed: number
    animationOffset: number
    // Enhanced interactive properties with AI personality
    name: string
    species: string
    age: number // Keep as number for consistency with ECS system
    personality: string // Simple personality for basic dialog
    fullPersonality?: typeof FIREFLY_PERSONALITIES[0] | null // Full AI personality data
    isClickable: boolean
    isHovered?: boolean
    isConversational: boolean // New: indicates if this firefly supports AI conversations
  }

  // Props with perfect legacy visual parameters
  export let count = 100
  export let maxLights = 80
  export let colors = [0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]
  export let emissiveIntensity = 15.0 // Kept for logic, but not directly used by new material
  export let lightIntensity = 40.0
  export let lightRange = 300
  export let cycleDuration = 12.0
  export let fadeSpeed = 2.0
  export let heightRange = { min: 0.5, max: 2.5 }
  export let radius = 30
  export let size = 0.015 // Kept for ECS logic
  export let pointSize = 25.0 // Controls the visual size of the firefly glow
  // Removed unused shader-related props - now handled by StarSprite component
  export let movement = {
    speed: 0.2,
    wanderSpeed: 0.004,
    wanderRadius: 4,
    floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 },
    lerpFactor: 1.0
  }
  export let getHeightAt: ((x: number, z: number) => number) | undefined = undefined
  export let environmentReady = true // Allow external control of when to create fireflies
  export let interactionSystem: any = null // Centralized interaction system from Game
  
  // AI Conversation enhancement props
  export let enableAIConversations = false // Enable AI-powered conversations
  export let conversationChance = 0.8 // Percentage of fireflies that are conversational (0.0 - 1.0)

  // Get level context (modern component architecture)
  const registry = getContext('systemRegistry')
  const ecsWorld = getContext('ecsWorld')
  const lightingManager = getContext('lightingManager')

  // Device optimization
  let optimizedMaxLights = maxLights
  let optimizedCount = count

  // Initialize optimization
  if (typeof window !== 'undefined') {
    try {
      const optimizationManager = OptimizationManager.getInstance()
      const qualitySettings = optimizationManager.getQualitySettings()
      optimizedMaxLights = qualitySettings.maxFireflyLights * 2 // Double the available lights
      optimizedCount = optimizedMaxLights === 0 ? Math.min(count, 30) : count
      console.log(`🎯 Firefly Optimization: ${optimizedCount} fireflies, ${optimizedMaxLights} max lights (level: ${optimizationManager.getOptimizationLevel()})`)
    } catch (error) {
      console.warn('⚠️ Using fallback optimization')
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      optimizedMaxLights = isMobile ? 0 : maxLights * 2 // Double fallback lights too
      optimizedCount = isMobile ? Math.min(count, 30) : count
    }
  }

  // ECS entities (modern architecture)
  let fireflyEntities: number[] = []
  
  // Visual firefly data for StarSprite rendering
  let visualFireflies: FireflyVisual[] = []
  let fireflySprites: THREE.Sprite[] = [] // Track sprites for interaction system

  // Performance objects
  const tempColor = new THREE.Color()
  let activeLights: any[] = []
  let lightingUpdateCounter = 0
  let lightCycleTime = 0
  const lightCycleDuration = 20000 // 20 seconds for a full cycle (much slower)
  let initialLightsSet = false // Track if we've set initial lights yet
  
  // Smooth transition system
  let targetLightIntensities = new Map<number, number>() // Target intensities for smooth fading
  let currentLightIntensities = new Map<number, number>() // Current intensities for interpolation

  /**
   * Ultra-optimized firefly selection - minimal calculations
   */
  function updateLightTargets(allLights: any[], maxLights: number, time: number) {
    if (allLights.length === 0 || maxLights === 0) return
    
    // Even less frequent changes - every 10 seconds
    const timeSeed = Math.floor(time / 10000)
    const step = Math.max(1, Math.floor(allLights.length / maxLights))
    const offset = timeSeed % step
    
    // Pre-calculate random values to avoid Math.random() in loop
    const randomValues = new Float32Array(maxLights)
    for (let j = 0; j < maxLights; j++) {
      randomValues[j] = 0.7 + Math.random() * 0.6 // Pre-compute random multipliers
    }
    
    targetLightIntensities.clear()
    
    let randomIndex = 0
    for (let i = offset; i < allLights.length && targetLightIntensities.size < maxLights; i += step) {
      const light = allLights[i]
      if (!light) continue
      
      // Use pre-computed random value
      const baseIntensity = light.intensity * randomValues[randomIndex % maxLights]
      targetLightIntensities.set(i, baseIntensity)
      randomIndex++
    }
  }
  
  /**
   * Get current smoothly interpolated lights
   */
  function getCurrentLights(allLights: any[], delta: number): any[] {
    const smoothedLights: any[] = []
    
    for (let index = 0; index < allLights.length; index++) {
      const light = allLights[index]
      if (!light) continue
      
      const targetIntensity = targetLightIntensities.get(index) || 0
      const currentIntensity = currentLightIntensities.get(index) || 0
      
      // Smooth interpolation using fadeSpeed prop
      const newIntensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, delta * fadeSpeed)
      currentLightIntensities.set(index, newIntensity)
      
      // Only include lights with meaningful intensity
      if (newIntensity > 0.01) {
        smoothedLights.push({
          ...light,
          intensity: newIntensity
        })
      }
    }
    
    return smoothedLights
  }

  /**
   * Modern Component Class following documented architecture
   */
  class HybridFireflyComponent extends BaseLevelComponent {
    readonly id = 'hybrid-firefly-component'
    readonly type = ComponentType.PARTICLE_SYSTEM

    protected async onInitialize(): Promise<void> {
      console.log('✅ HybridFirefly: Initializing with modern ECS architecture...')
      if (!ecsWorld) {
        console.error('❌ ECS World required for modern architecture')
        return
      }
      
      // Set up terrain following
      if (getHeightAt && ecsWorld.setTerrainHeightFunction) {
        ecsWorld.setTerrainHeightFunction(getHeightAt)
        console.log('✅ HybridFirefly: Terrain following enabled')
      }
      
      // Create ECS entities for logic and visual data for rendering
      this.createECSFireflies()
      this.setupVisualFireflies()
      console.log(`✅ HybridFirefly: Created ${optimizedCount} ECS entities with StarSprite visuals`)
    }

    protected onUpdate(deltaTime: number): void {
      // Update visual firefly data from ECS
      this.updateVisualFireflies()
    }

    protected onMessage(message: SystemMessage): void {
      // ... (no changes needed here)
    }

    protected onDispose(): void {
      // StarSprite components handle their own disposal
      console.log('✅ HybridFirefly: Disposed properly')
    }

    private createECSFireflies(): void {
      if (!ecsWorld) return
      
      // Validate terrain function before creating fireflies
      if (!getHeightAt) {
        console.warn('🧚 Warning: No terrain height function available - fireflies may spawn below ground')
      } else {
        // Test the terrain function at center
        const testHeight = getHeightAt(0, 0)
        console.log(`🧚 Firefly spawn: Terrain function working, center height = ${testHeight.toFixed(2)}`)
      }
      
      fireflyEntities = []
      
      for (let i = 0; i < optimizedCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const radiusPos = Math.random() * radius
        const x = Math.cos(angle) * radiusPos
        const z = Math.sin(angle) * radiusPos
        // Ensure fireflies spawn above ground with safety margin
        const groundHeight = getHeightAt ? getHeightAt(x, z) : 0
        const safetyMargin = 1.0 // Extra buffer to ensure above ground
        const minHeight = Math.max(groundHeight + heightRange.min, groundHeight + safetyMargin)
        const maxHeight = groundHeight + heightRange.max
        const y = minHeight + Math.random() * (maxHeight - minHeight)
        
        // Spawn position validation in development only
        if (import.meta.env.DEV && i < 2 && y < groundHeight) {
          console.warn(`⚠️ Firefly ${i} spawned below ground: y=${y.toFixed(2)}, ground=${groundHeight.toFixed(2)}`)
        }
        const position = new THREE.Vector3(x, y, z)
        const color = colors[Math.floor(Math.random() * colors.length)]

        // ECS firefly creation - debug logs removed for performance
        
        const entity = ecsWorld.createFirefly(position, color, {
            lightIntensity, lightRange, cycleDuration,
            floatAmplitude: movement.floatAmplitude.y,
            wanderRadius: movement.wanderRadius,
            size, emissiveIntensity
        });
        fireflyEntities.push(entity)
      }
    }

    public setupVisualFireflies(): void {
      // Generate rich AI personalities if conversations are enabled
      let aiPersonalities: typeof FIREFLY_PERSONALITIES = []
      if (enableAIConversations) {
        const conversationalCount = Math.floor(optimizedCount * conversationChance)
        aiPersonalities = generateFireflyPopulation(conversationalCount)
        if (import.meta.env.DEV) console.log(`🧠 Generated ${aiPersonalities.length} AI firefly personalities for conversations`)
      }
      
      // Fallback personalities for basic dialog (preserved from original)
      const basicPersonalities = [
        'a gentle wanderer who loves collecting dewdrops',
        'a curious explorer who chases moonbeams', 
        'a wise storyteller who remembers ancient summers',
        'a playful dancer who creates light patterns',
        'a peaceful dreamer who whispers to flowers',
        'an adventurous spirit who guides lost travelers',
        'a magical being who paints the night with gold',
        'a friendly companion who brings joy to darkness'
      ]
      
      visualFireflies = fireflyEntities.map((eid, i) => {
        // Determine if this firefly gets AI personality or basic personality
        const hasAIPersonality = enableAIConversations && i < aiPersonalities.length
        const aiPersonality = hasAIPersonality ? aiPersonalities[i] : null
        
        // Use AI personality data if available, otherwise use basic system
        const species = aiPersonality?.species || 'Common Eastern Firefly'
        const name = aiPersonality?.name || `${species} ${i + 1}`
        const age = aiPersonality?.age ? (typeof aiPersonality.age === 'string' ? parseInt(aiPersonality.age.split(' ')[0]) : aiPersonality.age) : Math.floor(Math.random() * 30) + 10
        const basicPersonality = aiPersonality?.personality.core || 
          basicPersonalities[Math.floor(Math.random() * basicPersonalities.length)]
        
        return {
          id: eid,
          position: [Position.x[eid], Position.y[eid], Position.z[eid]] as [number, number, number],
          color: LightEmitter.color[eid],
          size: pointSize * 0.05, // Convert point size to sprite scale
          intensity: 1.0,
          twinkleSpeed: 0.8 + Math.random() * 0.4,
          animationOffset: Math.random() * Math.PI * 2,
          // Enhanced interactive properties
          name: name,
          species: species,
          age: age,
          personality: basicPersonality, // For basic dialog compatibility
          fullPersonality: aiPersonality, // Full AI personality for conversations
          isClickable: true,
          isHovered: false,
          isConversational: hasAIPersonality // New flag
        }
      })
      
      if (import.meta.env.DEV) console.log(`✨ Created ${visualFireflies.length} fireflies (${aiPersonalities.length} with AI personalities)`)
    }

    private updateVisualFireflies(): void {
      if (!ecsWorld || typeof ecsWorld.getWorld !== 'function') return
      
      const world = ecsWorld.getWorld()
      const entities = fireflyQuery(world)
      
      // Pre-calculate normalization factor
      const intensityNorm = 1.0 / lightIntensity

      for (let i = 0; i < entities.length && i < visualFireflies.length; i++) {
        const eid = entities[i]
        const visual = visualFireflies[i]
        
        if (!visual) continue
        
        // Update position from ECS
        visual.position[0] = Position.x[eid]
        visual.position[1] = Position.y[eid]
        visual.position[2] = Position.z[eid]

        // Update intensity from ECS with light cycling
        const baseIntensity = LightEmitter.intensity[eid]
        const fadeProgress = LightCycling.fadeProgress[eid]
        visual.intensity = Math.min(baseIntensity * intensityNorm, 1.0) * fadeProgress
        
        // Update color from ECS
        visual.color = LightEmitter.color[eid]
      }
      
      // Trigger reactivity
      visualFireflies = visualFireflies
    }

    public getActiveLightsFromECS() {
      if (!ecsWorld || typeof ecsWorld.getActiveLights !== 'function') return []
      try {
        return ecsWorld.getActiveLights()
      } catch (error) {
        console.warn('Error getting active lights from ECS:', error)
        return []
      }
    }

    public handleDiscovery(): void {
      // ... (no changes needed here)
    }
  }

  // Create and register the component
  let component: HybridFireflyComponent
  onMount(async () => {
    if (registry && typeof registry.registerComponent === 'function') {
      component = new HybridFireflyComponent()
      registry.registerComponent(component)
      const levelContext = getContext('levelContext')
      if (levelContext) {
        await component.initialize(levelContext)
      }
    }
  })

  // Get camera from Threlte context
  const { camera } = useThrelte()

  useTask((delta) => {
    if (!component) return
    
    lightingUpdateCounter++
    
    // Only get lights when we actually need them (much less frequent)
    if (lightingUpdateCounter % 6 === 0) { // Every 6 frames (~10fps)
      const allLights = component.getActiveLightsFromECS()
      
      // Set initial lights immediately on first run
      if (!initialLightsSet && allLights.length > 0) {
        if (import.meta.env.DEV) console.log(`🌟 Setting initial lights: ${allLights.length} fireflies available`)
        updateLightTargets(allLights, optimizedMaxLights, 0)
        activeLights = getCurrentLights(allLights, delta * 6)
        initialLightsSet = true
      }
      
      // Update cycle time for distributed lighting
      lightCycleTime += delta * 1000 * 6 // Account for reduced frequency
      if (lightCycleTime > lightCycleDuration) {
        lightCycleTime = 0
      }
      
      // Update light targets much less frequently (but not on first run)
      if (initialLightsSet && lightingUpdateCounter % 3600 === 0) { // Every 60 seconds
        updateLightTargets(allLights, optimizedMaxLights, lightCycleTime)
        
        // Debug info only in development
        if (import.meta.env.DEV && lightingUpdateCounter % 7200 === 0) {
          console.log(`🌟 Lights: ${activeLights.length}/${allLights.length} active (max: ${optimizedMaxLights})`)
        }
      }
      
      // Update actual light intensities less frequently
      if (lightingUpdateCounter % 18 === 0) { // Every 18 frames (~3fps)
        activeLights = getCurrentLights(allLights, delta * 6) // Compensate for reduced frequency
      }
      
      // Send to lighting system much less frequently
      if (lightingManager && activeLights.length > 0 && lightingUpdateCounter % 60 === 0) { // Every second
        const pointLights = activeLights.map(light => ({
          position: new THREE.Vector3(light.position.x, light.position.y, light.position.z),
          color: new THREE.Color(light.color),
          intensity: light.intensity,
          range: lightRange
        }))
        
        if (lightingManager && typeof lightingManager.updatePointLights === 'function') {
          lightingManager.updatePointLights(pointLights)
        }
      }
    }
  })

  // Update visual fireflies when count changes
  $: if (component && visualFireflies.length !== optimizedCount) {
    console.log(`🔄 Firefly count changed: recreating ${optimizedCount} visual fireflies`)
    component.setupVisualFireflies()
  }

  // Reactive handling of prop changes for maintainability
  $: if (component && ecsWorld) {
    // When count changes, we need to recreate fireflies
    if (fireflyEntities.length !== optimizedCount) {
      console.log(`🔄 Firefly count changed: recreating ${optimizedCount} fireflies`)
      // Clear existing fade states
      targetLightIntensities.clear()
      currentLightIntensities.clear()
      // The component will recreate fireflies on next update
    }
  }

  // Handle optimization level changes reactively
  $: {
    try {
      const optimizationManager = OptimizationManager.getInstance()
      const qualitySettings = optimizationManager.getQualitySettings()
      const newMaxLights = qualitySettings.maxFireflyLights * 2
      
      if (newMaxLights !== optimizedMaxLights) {
        optimizedMaxLights = newMaxLights
        console.log(`🎯 Max lights updated: ${optimizedMaxLights} (level: ${optimizationManager.getOptimizationLevel()})`)
      }
    } catch (error) {
      // Fallback handled above
    }
  }

  // REMOVED: Broken reactive system that violates ECS principles

  // --- FIREFLY AI CONVERSATION SYSTEM (based on CuppyWidget) ---
  
  // Conversation state (similar to CuppyWidget)
  let activeConversationFirefly: any = null
  let conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  let isConversationDialogOpen = false
  let conversationInput = ''
  let isThinking = false
  
  function openFireflyConversationDialog(firefly: any) {
    activeConversationFirefly = firefly
    conversationHistory = []
    isConversationDialogOpen = true
    isThinking = false
    
      if (import.meta.env.DEV) {
        console.log('🔍 Opening conversation for:', firefly.name);
      }
    
    // Add initial greeting from the firefly
    const personality = firefly.fullPersonality
    const greeting = `✨ *${personality.visual.description}*\n\nHello! I'm ${personality.name}, a ${personality.species}. I'm feeling quite ${personality.behavior.defaultMood} tonight. What would you like to talk about?`
    
    conversationHistory.push({ role: 'assistant', content: greeting })
    conversationHistory = conversationHistory // Trigger reactivity
    
    if (import.meta.env.DEV) console.log('🔍 Conversation history:', conversationHistory.length, 'messages')
  }
  
  function closeConversationDialog() {
    isConversationDialogOpen = false
    activeConversationFirefly = null
    conversationHistory = []
    conversationInput = ''
    isThinking = false
  }
  
  async function sendMessageToFirefly() {
    if (!conversationInput.trim() || !activeConversationFirefly || isThinking) return
    
    const userMessage = conversationInput.trim()
    conversationInput = ''
    isThinking = true
    
    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage })
    conversationHistory = conversationHistory // Trigger reactivity
    
    try {
      const personality = activeConversationFirefly.fullPersonality
      
      // Create firefly-specific persona string (like CuppyWidget)
      const fireflyPersona = `You are ${personality.name}, a ${personality.species} firefly with the following characteristics:
        
        Personality: ${personality.personality.core}
        Traits: ${personality.personality.traits.join(', ')}
        Quirks: ${personality.personality.quirks.join(', ')}
        Interests: ${personality.personality.interests.join(', ')}
        Goals: ${personality.personality.goals.join(', ')}
        
        Background: ${personality.knowledge.backstory}
        Current mood: ${personality.behavior.defaultMood}
        Age: ${activeConversationFirefly.age} days old
        
        Speech style: ${personality.behavior.conversationStyle}
        Speech patterns: ${personality.behavior.speechPatterns.join(', ')}
        
        You are in a magical observatory at night, surrounded by other fireflies and starlight. Keep responses conversational and in character. Speak as a wise, magical firefly who has lived in this mystical place.`
      
      // Create payload (same structure as CuppyWidget)
      const payload = {
        message: userMessage,
        persona: fireflyPersona,
        history: [...conversationHistory],
        provider: 'gemini', // Use same provider as CuppyWidget
        pageContext: 'Observatory level - magical firefly conversation in a mystical starlit environment'
      }
      
      // Use same API as CuppyWidget
      const response = await fetch('https://my-mascot-worker-service.greggles.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        const data = await response.json()
        const fireflyReply = data.reply || "I'm not sure how to respond to that."
        
        conversationHistory.push({ role: 'assistant', content: fireflyReply })
        conversationHistory = conversationHistory // Trigger reactivity
      } else {
        console.error('Firefly AI response not ok:', response.status, response.statusText)
        conversationHistory.push({ 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        })
        conversationHistory = conversationHistory
      }
    } catch (error) {
      console.error('Firefly AI Error:', error)
      conversationHistory.push({ 
        role: 'assistant', 
        content: 'Could not connect to the AI service.' 
      })
      conversationHistory = conversationHistory
    } finally {
      isThinking = false
    }
  }

  // --- FIREFLY INTERACTION HANDLERS ---
  
  async function handleFireflyClick(data: any) {
  const { sprite, index, timestamp, ...firefly } = data;
  console.log('✨ Firefly clicked:', firefly.name);

  // Check if this firefly has the full personality data needed for a conversation
  if (enableAIConversations && firefly.isConversational && firefly.fullPersonality) {
    // It's a conversational firefly. Use the MODERN system.
    console.log(`🤖 Starting AI conversation with ${firefly.name} using the modern system.`);

    await conversationActions.startConversation(
      firefly.fullPersonality.id,
      firefly.fullPersonality,
      getObservatoryContext()
    );

    gameActions.recordInteraction('firefly_ai_conversation', firefly.id || 'unknown');

  } else {
    // It's a basic firefly. Use the original basic dialog.
    showBasicFireflyDialog(firefly);
  }

  // This part can remain for other effects
  if (typeof triggerDiscovery === 'function') {
    triggerDiscovery();
  }

    
    if (import.meta.env.DEV) console.log(`✨ Clicked firefly: ${firefly.name}`)
  }
  
  function showRichFireflyDialog(firefly: any) {
    // Use existing working dialog system with rich AI personality content
    const personality = firefly.fullPersonality
    const age = typeof firefly.age === 'number' ? `${firefly.age} days` : firefly.age
    
    // Create rich dialog content using the AI personality data
    let richMessage = `✨ *${personality.visual.description}*\n\n`
    richMessage += `Hello there! I'm ${personality.name}, a ${personality.species} from the ${personality.knowledge.backstory}. `
    richMessage += `I'm ${age} old and I'm feeling quite ${personality.behavior.defaultMood} tonight.\n\n`
    
    // Add personality-specific content
    if (personality.personality.quirks && personality.personality.quirks.length > 0) {
      richMessage += `You might notice that I ${personality.personality.quirks[0]}. `
    }
    
    if (personality.personality.interests && personality.personality.interests.length > 0) {
      richMessage += `I'm particularly fascinated by ${personality.personality.interests.slice(0, 2).join(' and ')}. `
    }
    
    // Add a memory or topic
    if (personality.knowledge.memories && personality.knowledge.memories.length > 0) {
      richMessage += `\n\n💭 "${personality.knowledge.memories[0]}"`
    }
    
    richMessage += `\n\nWould you like to know more about the magical secrets of this observatory?`
    
    // Use the working dialog system with rich content
    gameActions.showDialogue(
      richMessage,
      `${personality.name} the ${personality.species}`,
      12000 // 12 seconds for richer content
    )
  }
  
  function showBasicFireflyDialog(firefly: any) {
    // Original basic dialog system
    gameActions.showDialogue(
      `Hello! I'm ${firefly.name}, a ${firefly.species}. ${firefly.personality}. I'm about ${firefly.age} ${typeof firefly.age === 'number' ? 'days' : ''} old and have been dancing in this magical place for quite some time. Would you like to hear more stories of the night?`,
      firefly.name,
      8000 // 8 seconds
    )
    
    // Record basic interaction
    gameActions.recordInteraction('firefly_click', firefly.id || 'unknown')
  }
  
  function handleFireflyHover(data: any, hovered: boolean) {
    if (hovered) {
      // Find the visual firefly and mark it as hovered
      const visualFirefly = visualFireflies.find(f => f.id === data.id)
      if (visualFirefly) {
        visualFirefly.isHovered = true
        // Force reactivity update
        visualFireflies = visualFireflies
      }
    } else {
      // Remove hover state from all fireflies
      visualFireflies.forEach(f => f.isHovered = false)
      // Force reactivity update
      visualFireflies = visualFireflies
    }
  }
  
  // Function to handle sprite registration
  function handleSpriteReady(sprite: THREE.Sprite, firefly: FireflyVisual, index: number) {
    // console.log(`🧚‍♀️ Firefly sprite ready: ${firefly.name} (clickable: ${firefly.isClickable})`)
    fireflySprites[index] = sprite
    
    // Register with interaction system if available
    if (interactionSystem && firefly.isClickable) {
      // console.log(`🎯 Registering firefly ${firefly.name} with InteractionSystem`)
      interactionSystem.registerInteractiveObject({
        id: `firefly_${firefly.id}`,
        sprite: sprite,
        type: 'firefly',
        data: firefly,
        index: index,
        handlers: {
          onClick: handleFireflyClick,
          onHover: (data: any, hovered: boolean) => handleFireflyHover(data, hovered)
        }
      })
    } else {
      console.warn(`⚠️ Failed to register firefly: interactionSystem=${!!interactionSystem}, clickable=${firefly.isClickable}`)
    }
  }

  // API functions (no changes needed)
  export function triggerDiscovery() { /* ... */ }
  export function setEmotionalState(wonder: number, melancholy: number, hope: number, discovery: number) { /* ... */ }
  export function setIntensity(intensity: number) { /* ... */ }
  export function getStats() { /* ... */ }
  export function getActiveLights() { /* ... */ }
</script>

<!-- Beautiful StarSprite fireflies with star-like appearance and centralized interaction -->
{#each visualFireflies as firefly, index (firefly.id)}
  <StarSprite
    position={firefly.position}
    color={firefly.color}
    size={firefly.size}
    intensity={firefly.intensity}
    twinkleSpeed={firefly.twinkleSpeed}
    animationOffset={firefly.animationOffset}
    enableTwinkle={true}
    opacity={1.0}
    isClickable={firefly.isClickable}
    isHovered={firefly.isHovered || false}
    fireflyData={firefly}
    onSpriteReady={(sprite) => handleSpriteReady(sprite, firefly, index)}
  />
{/each}

<!-- Actual Three.js lights - smoothly animated intensity -->
{#if optimizedMaxLights > 0}
  {#each activeLights as light, index (light.position.x + light.position.y + light.position.z)}
    <T.PointLight
      position={[light.position.x, light.position.y, light.position.z]}
      intensity={light.intensity}
      color={light.color}
      distance={lightRange}
      decay={2}
      castShadow={false}
    />
  {/each}
{/if}

<!-- AI Conversation Dialog (based on CuppyWidget design) -->
<!-- Debug: Check reactive values -->
{@debug isConversationDialogOpen, activeConversationFirefly}

{#if isConversationDialogOpen && activeConversationFirefly}
  <div class="firefly-conversation-overlay" on:click={closeConversationDialog}>
    <div class="firefly-conversation-dialog" on:click|stopPropagation>
      <!-- Header -->
      <div class="conversation-header">
        <div class="firefly-info">
          <h3>{activeConversationFirefly.fullPersonality.name}</h3>
          <p>{activeConversationFirefly.fullPersonality.species}</p>
        </div>
        <button class="close-btn" on:click={closeConversationDialog}>×</button>
      </div>
      
      <!-- Messages -->
      <div class="conversation-messages">
        {#each conversationHistory as message}
          <div class="message {message.role}">
            <div class="message-content">{message.content}</div>
          </div>
        {/each}
        {#if isThinking}
          <div class="message assistant thinking">
            <div class="message-content">✨ *thinking...*</div>
          </div>
        {/if}
      </div>
      
      <!-- Input -->
      <div class="conversation-input">
        <input 
          type="text" 
          placeholder="Ask {activeConversationFirefly.fullPersonality.name}..." 
          bind:value={conversationInput}
          disabled={isThinking}
          on:keypress={(e) => e.key === 'Enter' && sendMessageToFirefly()}
        />
        <button on:click={sendMessageToFirefly} disabled={isThinking || !conversationInput.trim()}>
          Send
        </button>
      </div>
    </div>
  </div>
{/if}
