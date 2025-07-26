/**
 * MEGAMEAL NPC Conversation Manager
 * 
 * Core class that handles AI-powered conversations with NPCs
 * Integrates with existing Bleepy AI service and game systems
 */

import type {
  ConversationSession,
  ConversationMessage,
  ConversationContext,
  NPCPersonality,
  AIConversationRequest,
  AIConversationResponse,
  ConversationSystemConfig,
  NPCEmotion,
  ConversationEvent,
  ConversationEventHandler
} from './types'

export class ConversationManager {
  private config: ConversationSystemConfig
  private activeSessions = new Map<string, ConversationSession>()
  private sessionHistory = new Map<string, ConversationSession[]>()
  private eventHandlers = new Map<string, ConversationEventHandler[]>()
  private responseCache = new Map<string, AIConversationResponse>()
  
  constructor(config: ConversationSystemConfig) {
    this.config = config
    this.setupCleanupInterval()
  }

  // ================================
  // Session Management
  // ================================

  async startConversation(
    npcId: string, 
    personality: NPCPersonality, 
    context: ConversationContext
  ): Promise<ConversationSession> {
    const sessionId = this.generateSessionId()
    
    const session: ConversationSession = {
      id: sessionId,
      npcId,
      personality: personality,
      messages: [],
      startTime: Date.now(),
      lastInteraction: Date.now(),
      isActive: true,
      context
    }

    // Add initial greeting message
    const greetingMessage = await this.generateGreeting(personality, context)
    session.messages.push(greetingMessage)

    this.activeSessions.set(sessionId, session)
    
    this.emitEvent({
      type: 'conversation_started',
      data: { npcId, sessionId }
    })

    if (this.config.enableLogging) {
      console.log(`🗣️ Started conversation with ${personality.name} (${sessionId})`)
    }

    return session
  }

  async endConversation(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    session.isActive = false
    const duration = Date.now() - session.startTime

    // Store in history
    if (!this.sessionHistory.has(session.npcId)) {
      this.sessionHistory.set(session.npcId, [])
    }
    
    const history = this.sessionHistory.get(session.npcId)!
    history.push(session)
    
    // Limit history size
    if (history.length > this.config.maxStoredSessions) {
      history.shift()
    }

    this.activeSessions.delete(sessionId)
    
    this.emitEvent({
      type: 'conversation_ended',
      data: { npcId: session.npcId, sessionId, duration }
    })

    if (this.config.enableLogging) {
      console.log(`🏁 Ended conversation ${sessionId} (${Math.round(duration / 1000)}s)`)
    }
  }

  getActiveSession(sessionId: string): ConversationSession | undefined {
    return this.activeSessions.get(sessionId)
  }

  getSessionHistory(npcId: string): ConversationSession[] {
    return this.sessionHistory.get(npcId) || []
  }

  // ================================
  // Message Processing
  // ================================

  async sendMessage(
    sessionId: string,
    userMessage: string,
    personality: NPCPersonality
  ): Promise<ConversationMessage> {
    const session = this.activeSessions.get(sessionId)
    if (!session || !session.isActive) {
      throw new Error(`Session ${sessionId} is not active`)
    }

    // Add user message to session
    const userMsg: ConversationMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }
    
    session.messages.push(userMsg)
    session.lastInteraction = Date.now()

    this.emitEvent({
      type: 'message_sent',
      data: { sessionId, message: userMsg }
    })

    // Generate AI response
    try {
      const aiResponse = await this.getAIResponse(session, personality, userMessage)
      
      const npcMessage: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'npc',
        content: aiResponse.content,
        timestamp: Date.now(),
        metadata: {
          emotion: aiResponse.emotion,
          actionType: 'response'
        }
      }

      session.messages.push(npcMessage)

      this.emitEvent({
        type: 'message_received',
        data: { sessionId, message: npcMessage }
      })

      // Handle emotion change if needed
      if (aiResponse.metadata?.moodChange) {
        this.emitEvent({
          type: 'emotion_changed',
          data: {
            npcId: session.npcId,
            emotion: aiResponse.metadata.moodChange,
            previous: personality.behavior.defaultMood
          }
        })
      }

      // Handle memory updates
      if (aiResponse.metadata?.memoryUpdate) {
        this.emitEvent({
          type: 'memory_updated',
          data: {
            npcId: session.npcId,
            memory: aiResponse.metadata.memoryUpdate
          }
        })
      }

      return npcMessage

    } catch (error) {
      this.emitEvent({
        type: 'error',
        data: { error: error as Error, context: `Processing message in session ${sessionId}` }
      })
      
      // Return fallback message
      return {
        id: this.generateMessageId(),
        role: 'npc',
        content: this.getFallbackResponse(personality),
        timestamp: Date.now(),
        metadata: { emotion: 'confused', actionType: 'response' }
      }
    }
  }

  // ================================
  // AI Integration
  // ================================
// In ConversationManager.ts

private async getAIResponse(
  session: ConversationSession,
  personality: NPCPersonality,
  userMessage: string
): Promise<AIConversationResponse> {

  // ==================================================================
  // === THE FIX: Send the rich PERSONALITY OBJECT directly. =========
  // ==================================================================
  const payload = {
    message: userMessage,
    persona: personality, // <-- CORRECT: Pass the object, not a string.
    history: session.messages.map(msg => ({
      role: msg.role === 'npc' ? 'assistant' : 'user',
      content: msg.content
    })),
    provider: 'google', // Or this.config.aiProvider
    pageContext: `Observatory level - ${session.context.location}`
  };
  // ==================================================================
  
  // The cache logic can stay the same
  if (this.config.enableCaching) {
    const cacheKey = this.generateCacheKey(session, userMessage);
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const response = await this.callAIService(payload);

  if (this.config.enableCaching) {
    const cacheKey = this.generateCacheKey(session, userMessage);
    this.responseCache.set(cacheKey, response);
    setTimeout(() => {
      this.responseCache.delete(cacheKey)
    }, this.config.cacheTimeout);
  }

  return response;
}

// Inside callAIService function in ConversationManager.ts

private async callAIService(requestData: any): Promise<AIConversationResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

  try {
    // AI service request - verbose logging removed for performance
    const jsonPayload = JSON.stringify(requestData);

    const response = await fetch(this.config.aiServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonPayload, // Use the variable we just logged
      signal: controller.signal
    })


      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: data.response || data.choices?.[0]?.message?.content || '',
        emotion: this.detectEmotion(data.response || ''),
        confidence: data.confidence || 0.8,
        metadata: {
          topicsDiscussed: this.extractTopics(data.response || ''),
          moodChange: data.mood_change,
          relationshipDelta: data.relationship_delta || 0
        }
      }

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI service request timed out')
      }
      
      throw error
    }
  }

// In ConversationManager.ts

private buildConversationPrompt(
  session: ConversationSession,
  personality: NPCPersonality
): string {
  // FIX: Create a simple, direct persona string that the new worker can parse.
  const fireflyPersona = `You are ${personality.name}, a ${personality.species}.
  Your personality is: ${personality.personality.core}
  Your traits are: ${personality.personality.traits.join(', ')}
  Your backstory is: ${personality.knowledge.backstory}
  Your conversation style is ${personality.behavior.conversationStyle}.
  Stay in character and keep your answers concise.`;
  
  return fireflyPersona;
}

private async callAIService(requestData: any): Promise<AIConversationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

  try {
    const jsonPayload = JSON.stringify(requestData);
    // Request prepared for AI service

    const response = await fetch(this.config.aiServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonPayload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI service responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // FIX: The server now returns the message in a field called "reply".
    const content = data.reply || "I'm not sure what to say.";

    return {
      content: content,
      emotion: this.detectEmotion(content),
      confidence: 0.9,
      metadata: {},
    };

  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    throw error;
  }
}
  // ================================
  // Utility Methods
  // ================================

  private async generateGreeting(
    personality: NPCPersonality,
    context: ConversationContext
  ): Promise<ConversationMessage> {
    // Use character-specific opening statement if available
    let greeting: string
    
    if (personality.knowledge.openingStatement) {
      greeting = personality.knowledge.openingStatement
    } else {
      // Fallback to generic greetings for personalities without opening statements
      const greetings = [
        `*A gentle ${personality.species || 'creature'} glows softly as you approach*`,
        `*${personality.name} notices your presence and ${personality.behavior.greetingStyle === 'shy' ? 'shyly flickers' : 'brightens with curiosity'}*`,
        `Hello, wanderer! I'm ${personality.name}. ${personality.personality.core}`
      ]
      greeting = greetings[Math.floor(Math.random() * greetings.length)]
    }

    return {
      id: this.generateMessageId(),
      role: 'npc',
      content: greeting,
      timestamp: Date.now(),
      metadata: {
        emotion: personality.behavior.defaultMood,
        actionType: 'greeting'
      }
    }
  }

  private getFallbackResponse(personality: NPCPersonality): string {
    const fallbacks = [
      `*${personality.name} flickers thoughtfully, seeming momentarily distracted by something in the distance*`,
      "I'm sorry, something seems to have caught my attention. What were we talking about?",
      `*The light within ${personality.name} dims slightly as if processing deep thoughts*`,
      "Hmm, the magic here sometimes makes it hard to focus. Could you say that again?"
    ]
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }

  private detectEmotion(text: string): NPCEmotion {
    const emotions: Record<string, NPCEmotion> = {
      'excited': 'excited',
      'happy': 'happy',
      'curious': 'curious',
      'sad': 'sad',
      'worried': 'worried',
      'mysterious': 'mysterious',
      'playful': 'playful',
      'wise': 'wise',
      'peaceful': 'peaceful'
    }

    for (const [keyword, emotion] of Object.entries(emotions)) {
      if (text.toLowerCase().includes(keyword)) {
        return emotion
      }
    }

    return 'neutral'
  }

  private extractTopics(text: string): string[] {
    // Simple topic extraction - could be enhanced with NLP
    const topics = [
      'stars', 'magic', 'nature', 'time', 'dreams', 'memories', 
      'adventure', 'mystery', 'friendship', 'wisdom', 'light', 'darkness'
    ]
    
    return topics.filter(topic => 
      text.toLowerCase().includes(topic)
    )
  }

  private generateSessionId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCacheKey(session: ConversationSession, message: string): string {
    const contextKey = `${session.npcId}_${session.context.location}_${session.messages.length}`
    return `${contextKey}_${message.slice(0, 50)}`
  }

  // ================================
  // Event System
  // ================================

  on<T extends ConversationEvent>(
    eventType: T['type'], 
    handler: ConversationEventHandler<T>
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler as ConversationEventHandler)
  }

  off(eventType: string, handler: ConversationEventHandler): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emitEvent(event: ConversationEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in conversation event handler:`, error)
        }
      })
    }
  }

  // ================================
  // Cleanup & Maintenance
  // ================================

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredSessions()
      this.cleanupCache()
    }, 60000) // Run every minute
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredSessions: string[] = []

    this.activeSessions.forEach((session, sessionId) => {
      if (now - session.lastInteraction > this.config.sessionTimeout * 60 * 1000) {
        expiredSessions.push(sessionId)
      }
    })

    expiredSessions.forEach(sessionId => {
      this.endConversation(sessionId)
    })

    if (expiredSessions.length > 0 && this.config.enableLogging) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired conversations`)
    }
  }

  private cleanupCache(): void {
    // Cache cleanup is handled by individual timeouts
    // This could be enhanced with more sophisticated cache management
  }

  // ================================
  // Public API
  // ================================

  getActiveSessionCount(): number {
    return this.activeSessions.size
  }

  getAllActiveSessions(): ConversationSession[] {
    return Array.from(this.activeSessions.values())
  }

  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId)
  }

  updateSessionContext(sessionId: string, context: Partial<ConversationContext>): void {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.context = { ...session.context, ...context }
    }
  }

  dispose(): void {
    this.activeSessions.clear()
    this.sessionHistory.clear()
    this.eventHandlers.clear()
    this.responseCache.clear()
  }
}