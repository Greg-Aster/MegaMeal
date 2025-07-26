# MEGAMEAL NPC Conversation System

A modular AI-powered conversation system for interactive NPCs in the MEGAMEAL game. This system enables rich, personality-driven conversations with game characters using your existing Bleepy AI service.

## Features

- 🤖 **AI-Powered Conversations**: Integrates with your existing Bleepy AI worker service
- 🧠 **Rich Personalities**: Each NPC has unique personality, knowledge, and backstory
- 🎭 **Emotional Responses**: NPCs express emotions and adapt their conversation style  
- 💾 **Conversation Memory**: NPCs remember previous conversations with the player
- 📱 **Responsive UI**: Beautiful conversation dialog with mobile support
- ⚡ **High Performance**: Built on your existing ECS architecture
- 🔧 **Modular Design**: Easy to extend for new NPC types beyond fireflies

## Quick Start

### 1. Using Conversational Fireflies

The system enhances the existing `HybridFireflyComponent` with AI conversation capabilities. Simply add the conversation props:

```svelte
<!-- Enhanced HybridFireflyComponent with AI conversations -->
<HybridFireflyComponent 
  count={100}
  {interactionSystem}
  {getHeightAt}
  enableAIConversations={true}
  conversationChance={0.8}
/>
```

### 2. Creating Custom NPCs

```typescript
import { conversationActions } from '@/threlte/systems/conversation'

// 1. Define NPC personality
const myNPCPersonality: NPCPersonality = {
  id: 'wise_owl',
  name: 'Athena',
  species: 'Great Horned Owl',
  personality: {
    core: 'A wise old owl who has observed the forest for decades',
    traits: ['wise', 'patient', 'observant'],
    quirks: ['hoots softly when thinking'],
    interests: ['ancient knowledge', 'forest lore', 'night sky']
  },
  // ... more personality details
}

// 2. Register NPC with conversation system
conversationActions.registerNPC({
  id: 'owl_npc',
  npcId: 'wise_owl',
  personality: myNPCPersonality,
  isInteractable: true
})

// 3. Start conversation on interaction
await conversationActions.startConversation(
  'wise_owl',
  myNPCPersonality,
  context
)
```

### 3. Add Conversation UI to Your Level

```svelte
<script>
  import { ConversationDialog, conversationUIState, isConversationActive, conversationActions } from '@/threlte/systems/conversation'
</script>

{#if $isConversationActive}
  <ConversationDialog 
    visible={$conversationUIState.isVisible}
    on:close={() => conversationActions.endConversation()}
  />
{/if}
```

## Pre-Built Firefly Personalities

The system includes 5 unique firefly personalities:

- **Luna** - The wise observer with ancient wisdom
- **Spark** - The energetic young explorer  
- **Whisper** - The shy poet who speaks in metaphors
- **Zap** - The mischievous trickster with clever humor
- **Echo** - The memory keeper who tells stories of the past

Each has unique:
- Conversation style and emotional range
- Rich backstory and personal knowledge
- Speech patterns and quirks
- Specialized topics of interest

## Configuration

### AI Service Configuration

The system uses your existing Bleepy AI worker service:

```typescript
const config: ConversationSystemConfig = {
  aiServiceUrl: 'https://my-mascot-worker-service.greggles.workers.dev',
  aiProvider: 'gemini', // or 'deepseek'
  maxRetries: 3,
  timeout: 10000
}
```

### UI Customization

```typescript
conversationActions.updateUIConfig({
  showTypingIndicator: true,
  autoCloseDelay: 30000,
  maxMessagesVisible: 10,
  showEmotions: true
})
```

## Architecture

```
NPCConversationSystem/
├── types.ts                    # TypeScript interfaces
├── ConversationManager.ts      # Core AI integration
├── conversationStores.ts       # Svelte state management
├── ConversationDialog.svelte   # UI component
├── fireflyPersonalities.ts     # Firefly personality definitions
└── index.ts                   # Main exports
```

### Key Components

- **ConversationManager**: Handles AI API calls and session management
- **Conversation Stores**: Reactive state management with Svelte stores
- **ConversationDialog**: Rich UI component with emotion display
- **Personality System**: Rich NPC personality definitions with knowledge and backstory

## Integration Points

### With Existing Systems

- **ECS Architecture**: NPCs integrate seamlessly with your existing BitECS system
- **Interaction System**: Uses your existing click/hover interaction system
- **AI Service**: Leverages your existing Bleepy AI worker service
- **State Management**: Built on Svelte stores like your existing game state

### Performance

- **Optimized for Mobile**: Automatic quality adjustment for mobile devices
- **Memory Efficient**: Conversation history limits and cleanup
- **Caching**: AI responses cached to reduce API calls
- **Batched Updates**: Efficient rendering and state updates

## Extending the System

### Adding New NPC Types

1. Create personality definitions (follow `fireflyPersonalities.ts` as example)
2. Create NPC component extending the conversation system
3. Register NPCs with the conversation system
4. Add conversation UI to your level

### Custom Conversation Flows

The system supports:
- Custom greeting and farewell messages
- Topic-based conversation branching
- Conditional responses based on player history
- Emotional state changes during conversation

## Troubleshooting

### Common Issues

1. **Conversations not starting**: Check that NPCs are registered and have `isInteractable: true`
2. **AI responses failing**: Verify AI service URL and API key configuration
3. **UI not showing**: Ensure `ConversationDialog` is added to your level
4. **Performance issues**: Adjust conversation limits and caching settings

### Debug Mode

Enable debug logging in development:

```typescript
conversationActions.updateConfig({
  enableLogging: true,
  enableDebugUI: true
})
```

## Future Enhancements

- Voice synthesis for NPC speech
- Visual NPC expressions synchronized with emotions
- Branching conversation trees with choices
- Quest integration and story progression
- Multiplayer conversation support

---

*This conversation system was designed to integrate seamlessly with the MEGAMEAL game's existing architecture while providing a foundation for rich, AI-powered NPC interactions throughout the game world.*