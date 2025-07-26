/**
 * MEGAMEAL NPC Conversation System - Main Entry Point
 * 
 * Modular AI-powered conversation system for NPCs
 * Integrates with existing Bleepy AI service and game architecture
 */

// Core types and interfaces
export type * from './types'

// Main conversation manager
export { ConversationManager } from './ConversationManager'

// Reactive stores and state management
export {
  // Store exports
  conversationStores,
  
  // Individual stores
  activeConversationSession,
  conversationUIState,
  conversationUIConfig,
  availableNPCs,
  nearbyNPCs,
  isProcessingResponse,
  conversationHistory,
  conversationConfig,
  currentMessages,
  isConversationActive,
  currentNPCPersonality,
  conversationStats,
  
  // Actions
  conversationActions,
  
  // Persistence
  saveConversationHistory,
  loadConversationHistory,
  
  // Manager getter
  getConversationManager
} from './conversationStores'

// Firefly personality system
export {
  FIREFLY_SPECIES,
  FIREFLY_PERSONALITIES,
  getRandomFireflyPersonality,
  getFireflyPersonalityById,
  createFireflyPersonalityVariant,
  generateFireflyPopulation,
  getObservatoryContext,
  getFireflyConversationPrompts
} from './fireflyPersonalities'

// UI Component
export { default as ConversationDialog } from './ConversationDialog.svelte'

// Enhanced Firefly Component  
export { default as ConversationalFireflyComponent } from '../components/ConversationalFireflyComponent.svelte'

// Re-export commonly used types for convenience
export type {
  ConversationSession,
  ConversationMessage,
  NPCPersonality,
  NPCConversationComponent,
  ConversationUIState,
  NPCEmotion,
  ConversationEvent,
  ConversationSystemConfig
} from './types'

/**
 * Quick Setup Guide for New NPCs:
 * 
 * 1. Create NPC personality:
 *    ```typescript
 *    const myNPCPersonality: NPCPersonality = {
 *      id: 'my_npc',
 *      name: 'My NPC',
 *      // ... other properties
 *    }
 *    ```
 * 
 * 2. Register NPC with conversation system:
 *    ```typescript
 *    import { conversationActions } from '@/threlte/systems/conversation'
 *    
 *    conversationActions.registerNPC({
 *      id: 'my_npc_component',
 *      npcId: 'my_npc',
 *      personality: myNPCPersonality,
 *      isInteractable: true
 *    })
 *    ```
 * 
 * 3. Start conversation on interaction:
 *    ```typescript
 *    await conversationActions.startConversation(
 *      'my_npc',
 *      myNPCPersonality,
 *      context
 *    )
 *    ```
 * 
 * 4. Add ConversationDialog to your level:
 *    ```svelte
 *    <ConversationDialog 
 *      visible={$conversationUIState.isVisible}
 *      on:close={() => conversationActions.endConversation()}
 *    />
 *    ```
 */