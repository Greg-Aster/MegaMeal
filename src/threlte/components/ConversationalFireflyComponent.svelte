<!--
  ConversationalFireflyComponent - Enhanced Firefly System with AI Conversations
  
  Extends the existing HybridFireflyComponent with:
  - AI-powered conversation system integration
  - Rich firefly personalities from fireflyPersonalities.ts
  - Modern NPC conversation interface
  - Seamless integration with existing ECS architecture
-->

<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
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
  import ConversationDialog from '../systems/conversation/ConversationDialog.svelte'
  import { 
    conversationActions,
    conversationUIState,
    isConversationActive 
  } from '../systems/conversation/conversationStores'
  import { 
    FIREFLY_PERSONALITIES,
    getRandomFireflyPersonality,
    generateFireflyPopulation,
    getObservatoryContext 
  } from '../systems/conversation/fireflyPersonalities'
  import type { NPCPersonality, NPCConversationComponent } from '../systems/conversation/types'

  // Enhanced firefly visual data with conversation support
  interface ConversationalFireflyVisual {
    id: number
    position: [number, number, number]
    color: number
    size: number
    intensity: number
    twinkleSpeed: number
    animationOffset: number
    // Enhanced interactive properties
    name: string
    species: string
    age: string
    personality: NPCPersonality
    isClickable: boolean
    isHovered: boolean
    isConversing: boolean
    conversationComponent: NPCConversationComponent
  }

  // Props (same as original HybridFireflyComponent)
  export let count = 100
  export let maxLights = 80
  export let colors = [0x87ceeb, 0x98fb98, 0xffffe0, 0xdda0dd, 0xf0e68c, 0xffa07a, 0x20b2aa, 0x9370db]
  export let emissiveIntensity = 15.0
  export let lightIntensity = 40.0
  export let lightRange = 300
  export let cycleDuration = 12.0
  export let fadeSpeed = 2.0
  export let heightRange = { min: 0.5, max: 2.5 }
  export let radius = 30
  export let size = 0.015
  export let pointSize = 25.0
  export let movement = {
    speed: 0.2,
    wanderSpeed: 0.004,
    wanderRadius: 4,
    floatAmplitude: { x: 1.5, y: 0.5, z: 1.5 },
    lerpFactor: 1.0
  }
  export let getHeightAt: ((x: number, z: number) => number) | undefined = undefined
  export let environmentReady = true
  export let interactionSystem: any = null

  // Conversation-specific props
  export let enableConversations = true
  export let conversationChance = 0.8 // 80% of fireflies are conversational
  export let personalityVariation = true // Use personality variations

  // Get level context
  const registry = getContext('systemRegistry')
  const ecsWorld = getContext('ecsWorld')
  const lightingManager = getContext('lightingManager')

  // Device optimization
  let optimizedMaxLights = maxLights
  let optimizedCount = count

  // Initialize optimization (same as original)
  if (typeof window !== 'undefined') {
    try {
      const optimizationManager = OptimizationManager.getInstance()
      const qualitySettings = optimizationManager.getQualitySettings()
      optimizedMaxLights = qualitySettings.maxFireflyLights * 2
      optimizedCount = optimizedMaxLights === 0 ? Math.min(count, 30) : count
      console.log(`🗣️ Conversational Firefly Optimization: ${optimizedCount} fireflies, ${optimizedMaxLights} max lights`)
    } catch (error) {
      console.warn('⚠️ Using fallback optimization for conversational fireflies')
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      optimizedMaxLights = isMobile ? 0 : maxLights * 2
      optimizedCount = isMobile ? Math.min(count, 30) : count
    }
  }

  // Enhanced state for conversations
  let fireflyEntities: number[] = []
  let conversationalFireflies: ConversationalFireflyVisual[] = []
  let fireflyPersonalities: NPCPersonality[] = []
  let activeLights: any[] = []
  let lightingUpdateCounter = 0
  let lightCycleTime = 0
  const lightCycleDuration = 20000

  // Conversation state
  let currentConversationalFirefly: ConversationalFireflyVisual | null = null
  
  // Sprite tracking for interaction system
  let fireflySprites = new Map<number, THREE.Sprite>()

  // Performance objects
  const tempColor = new THREE.Color()
  let targetLightIntensities = new Map<number, number>()
  let currentLightIntensities = new Map<number, number>()

  // Component system
  class ConversationalFireflySystem extends BaseLevelComponent {
    public readonly id = 'conversational-firefly-system'
    public readonly type = ComponentType.ENVIRONMENT

    protected async onInitialize(): Promise<void> {
      if (!environmentReady) {
        console.log('🗣️ ConversationalFirefly: Waiting for environment to be ready...')
        return
      }

      // Generate personalities for fireflies
      this.generateFireflyPersonalities()
      
      // Create ECS entities and enhanced visual data
      this.createConversationalFireflies()
      
      console.log(`✅ ConversationalFirefly: Created ${optimizedCount} fireflies with ${fireflyPersonalities.length} personalities`)
    }

    protected onUpdate(deltaTime: number): void {
      this.updateConversationalFireflies()
      this.updateLightingSystem(deltaTime)
    }

    protected onMessage(message: SystemMessage): void {
      // Handle any relevant system messages
      if (message.type === MessageType.USER_INTERACTION) {
        // Could handle interaction events here if needed
      }
    }

    protected onDispose(): void {
      this.endAllConversations()
      this.unregisterAllFireflies()
      console.log('✅ ConversationalFirefly: Disposed properly')
    }

    private generateFireflyPersonalities(): void {
      const conversationalCount = Math.floor(optimizedCount * conversationChance)
      
      if (personalityVariation) {
        // Generate varied population
        fireflyPersonalities = generateFireflyPopulation(conversationalCount)
      } else {
        // Use base personalities repeatedly
        fireflyPersonalities = []
        for (let i = 0; i < conversationalCount; i++) {
          fireflyPersonalities.push(getRandomFireflyPersonality())
        }
      }

      console.log(`🧠 Generated ${fireflyPersonalities.length} firefly personalities`)
    }

    private createConversationalFireflies(): void {
      if (!ecsWorld) return

      // Validate terrain function
      if (!getHeightAt) {
        console.warn('🗣️ Warning: No terrain height function - fireflies may spawn incorrectly')
      }

      fireflyEntities = []
      conversationalFireflies = []

      for (let i = 0; i < optimizedCount; i++) {
        // Position calculation (same as original)
        const angle = Math.random() * Math.PI * 2
        const radiusPos = Math.random() * radius
        const x = Math.cos(angle) * radiusPos
        const z = Math.sin(angle) * radiusPos
        const groundHeight = getHeightAt ? getHeightAt(x, z) : 0
        const safetyMargin = 1.0
        const minHeight = Math.max(groundHeight + heightRange.min, groundHeight + safetyMargin)
        const maxHeight = groundHeight + heightRange.max
        const y = minHeight + Math.random() * (maxHeight - minHeight)

        // Create ECS entity using the proper API (same as original HybridFireflyComponent)
        const position = new THREE.Vector3(x, y, z)
        const colorIndex = Math.floor(Math.random() * colors.length)
        const color = colors[colorIndex]

        const entity = ecsWorld.createFirefly(position, color, {
          lightIntensity: lightIntensity * (0.7 + Math.random() * 0.6),
          lightRange,
          cycleDuration,
          floatAmplitude: movement.floatAmplitude.y,
          wanderRadius: movement.wanderRadius,
          size,
          emissiveIntensity
        })

        fireflyEntities.push(entity)

        // Determine if this firefly is conversational
        const isConversational = i < fireflyPersonalities.length
        const personality = isConversational ? fireflyPersonalities[i] : null

        // Create enhanced visual firefly data (match original HybridFireflyComponent pattern)
        const visualFirefly: ConversationalFireflyVisual = {
          id: entity,
          position: [x, y, z],
          color: color,
          size: pointSize * 0.05, // Convert point size to sprite scale (same as original)
          intensity: 1.0, // Start with base intensity (same as original)
          twinkleSpeed: 0.8 + Math.random() * 0.4, // Random twinkle speed (same as original)
          animationOffset: Math.random() * Math.PI * 2, // Random animation offset (same as original)
          name: personality?.name || `Firefly ${i + 1}`,
          species: personality?.species || 'Common Firefly',
          age: personality?.age || `${Math.floor(Math.random() * 30) + 10} days`,
          personality: personality || this.createBasicPersonality(`Firefly ${i + 1}`),
          isClickable: isConversational,
          isHovered: false,
          isConversing: false,
          conversationComponent: this.createConversationComponent(entity, personality, isConversational)
        }

        conversationalFireflies.push(visualFirefly)

        // Register conversational fireflies with the conversation system
        if (isConversational && personality) {
          conversationActions.registerNPC(visualFirefly.conversationComponent)
        }
      }
    }

    private createBasicPersonality(name: string): NPCPersonality {
      return {
        id: `basic_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        species: 'Common Firefly',
        age: `${Math.floor(Math.random() * 30) + 10} days`,
        personality: {
          core: 'A simple firefly enjoying the magical night',
          traits: ['peaceful', 'gentle'],
          quirks: ['glows softly'],
          interests: ['flying', 'light'],
          goals: ['enjoying the night']
        },
        knowledge: {
          topics: { 'light': 'I shine in the darkness' },
          memories: ['Flying through the night sky'],
          backstory: 'A peaceful firefly in the magical observatory grounds'
        },
        behavior: {
          greetingStyle: 'gentle',
          conversationStyle: 'concise',
          emotionalRange: ['peaceful'],
          defaultMood: 'peaceful',
          speechPatterns: ['*glows softly*']
        },
        visual: {
          description: 'A gentle firefly with a warm glow'
        },
        conversation: {
          maxResponseLength: 150,
          farewellTriggers: ['goodbye'],
          topicTransitions: {}
        }
      }
    }

    private createConversationComponent(
      entityId: number, 
      personality: NPCPersonality | null, 
      isInteractable: boolean
    ): NPCConversationComponent {
      return {
        id: `firefly_${entityId}`,
        npcId: personality?.id || `basic_firefly_${entityId}`,
        personality: personality || this.createBasicPersonality(`Firefly ${entityId}`),
        isInteractable,
        entityId,
        position: [Position.x[entityId], Position.y[entityId], Position.z[entityId]],
        onConversationStart: (session) => {
          const firefly = conversationalFireflies.find(f => f.id === entityId)
          if (firefly) {
            firefly.isConversing = true
            currentConversationalFirefly = firefly
          }
        },
        onConversationEnd: (session) => {
          const firefly = conversationalFireflies.find(f => f.id === entityId)
          if (firefly) {
            firefly.isConversing = false
          }
          currentConversationalFirefly = null
        }
      }
    }



    private updateConversationalFireflies(): void {
      // Update visual firefly data from ECS (same as original logic)
      if (!ecsWorld) return
      const world = ecsWorld.getWorld()
      const entities = fireflyQuery(world)
      
      for (let i = 0; i < entities.length && i < conversationalFireflies.length; i++) {
        const entity = entities[i]
        const visual = conversationalFireflies[i]
        
        if (visual) {
          visual.position = [Position.x[entity], Position.y[entity], Position.z[entity]]
          
          // Update intensity from ECS with proper normalization (same as original)
          const baseIntensity = LightEmitter.intensity[entity]
          visual.intensity = Math.min(baseIntensity / lightIntensity, 1.0) // Normalize to 0-1 range
          
          // Update color from ECS
          visual.color = LightEmitter.color[entity]
          
          // Update conversation component position
          visual.conversationComponent.position = visual.position
        }
      }
      
      // Trigger reactivity (same as original)
      conversationalFireflies = conversationalFireflies
    }

    private updateLightingSystem(deltaTime: number): void {
      // Same lighting logic as original component
      lightingUpdateCounter++
      
      if (lightingUpdateCounter % 6 === 0) { // Update every 6 frames (10 FPS)
        if (!ecsWorld) return
        const world = ecsWorld.getWorld()
        const entities = fireflyQuery(world)
        activeLights = []
        
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i]
          activeLights.push({
            position: new THREE.Vector3(Position.x[entity], Position.y[entity], Position.z[entity]),
            color: new THREE.Color(LightEmitter.color[entity]),
            intensity: LightEmitter.intensity[entity],
            distance: LightEmitter.range[entity]
          })
        }
        
        // Update lighting system
        if (lightingManager) {
          lightingManager.updatePointLights(activeLights.slice(0, optimizedMaxLights))
        }
        
        // Send message to other systems  
        this.sendMessage(MessageType.LIGHTING_UPDATE, { lights: activeLights.slice(0, optimizedMaxLights) })
      }
    }

    private endAllConversations(): void {
      conversationalFireflies.forEach(firefly => {
        if (firefly.isConversing) {
          conversationActions.endConversation()
        }
      })
    }

    private unregisterAllFireflies(): void {
      conversationalFireflies.forEach(firefly => {
        if (firefly.isClickable) {
          conversationActions.unregisterNPC(firefly.personality.id)
          
          // Unregister from interaction system if available
          if (interactionSystem && typeof interactionSystem.unregisterObject === 'function') {
            try {
              interactionSystem.unregisterObject(`conversational_firefly_${firefly.id}`)
            } catch (error) {
              console.warn(`Failed to unregister ${firefly.name} from interaction system:`, error)
            }
          }
        }
      })
      
      // Clear sprite references
      fireflySprites.clear()
    }
  }

  // Create and initialize the component system
  let fireflySystem: ConversationalFireflySystem | null = null

  onMount(() => {
    if (registry && ecsWorld) {
      fireflySystem = new ConversationalFireflySystem()
      registry.registerComponent(fireflySystem)
      
      const context: LevelContext = {
        scene: null,
        camera: null,
        renderer: null,
        eventBus: new EventTarget(),
        ecsWorld,
        lightingManager,
        registry
      }
      
      fireflySystem.initialize(context)
    }
  })

  onDestroy(() => {
    if (fireflySystem && registry) {
      registry.unregisterComponent(fireflySystem.id)
    }
  })

  // Click and hover handlers (matching interactionSystem callback format)
  async function handleFireflyClick(data: any): Promise<void> {
    const { sprite, index, timestamp, ...firefly } = data
    
    if (!firefly.isClickable || firefly.isConversing) return

    console.log(`🗣️ ConversationalFirefly: Starting conversation with ${firefly.name}`)
    
    // Start conversation using the new system
    const context = getObservatoryContext()
    await conversationActions.startConversation(
      firefly.personality.id,
      firefly.personality,
      context
    )
    
    // Mark firefly as conversing
    const visualFirefly = conversationalFireflies.find(f => f.id === firefly.id)
    if (visualFirefly) {
      visualFirefly.isConversing = true
      currentConversationalFirefly = visualFirefly
    }
  }

  function handleFireflyHover(data: any, isHovered: boolean): void {
    if (isHovered) {
      console.log(`👆 Hovering over conversational firefly: ${data.name}`)
      // Find the visual firefly and mark it as hovered
      const visualFirefly = conversationalFireflies.find(f => f.id === data.id)
      if (visualFirefly) {
        visualFirefly.isHovered = true
        // Visual feedback for hoverable fireflies
        if (visualFirefly.isClickable) {
          const entity = visualFirefly.id
          LightEmitter.intensity[entity] *= 1.3
        }
        // Force reactivity update
        conversationalFireflies = conversationalFireflies
      }
    } else {
      // Remove hover state
      const visualFirefly = conversationalFireflies.find(f => f.id === data.id)
      if (visualFirefly) {
        visualFirefly.isHovered = false
        // Remove visual feedback
        if (visualFirefly.isClickable) {
          const entity = visualFirefly.id
          LightEmitter.intensity[entity] /= 1.3
        }
        // Force reactivity update
        conversationalFireflies = conversationalFireflies
      }
    }
  }

  // Handle sprite ready callback
  function handleSpriteReady(firefly: ConversationalFireflyVisual, sprite: THREE.Sprite): void {
    // Store sprite reference
    fireflySprites.set(firefly.id, sprite)
    console.log(`🧚 Sprite ready for ${firefly.name}, registering with interaction system`)
    
    // Register with interaction system if available and firefly is clickable
    if (interactionSystem && firefly.isClickable) {
      try {
        interactionSystem.registerObject({
          id: `conversational_firefly_${firefly.id}`,
          object: sprite,
          onClick: () => handleFireflyClick({
            sprite,
            index: firefly.id,
            timestamp: Date.now(),
            ...firefly
          }),
          onHover: (hovered: boolean) => handleFireflyHover({
            sprite,
            index: firefly.id,
            timestamp: Date.now(),
            ...firefly
          }, hovered)
        })
        console.log(`✅ Registered ${firefly.name} with interaction system`)
      } catch (error) {
        console.warn(`Failed to register ${firefly.name} with interaction system:`, error)
      }
    }
  }
</script>

<!-- Render fireflies using the existing StarSprite component -->
{#each conversationalFireflies as firefly (firefly.id)}
  <StarSprite
    position={firefly.position}
    color={firefly.color}
    size={firefly.size}
    intensity={firefly.intensity}
    twinkleSpeed={firefly.twinkleSpeed}
    animationOffset={firefly.animationOffset}
    isClickable={firefly.isClickable}
    isHovered={firefly.isHovered}
    fireflyData={firefly}
    onSpriteReady={(sprite) => handleSpriteReady(firefly, sprite)}
  />
{/each}

<!-- Conversation Dialog -->
{#if $isConversationActive}
  <ConversationDialog
    visible={$conversationUIState.isVisible}
    position={$conversationUIState.position}
    on:close={() => conversationActions.endConversation()}
  />
{/if}

<style>
  /* No additional styles needed - handled by child components */
</style>