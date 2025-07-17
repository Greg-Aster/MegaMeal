<!-- 
  Refactored Game.svelte using the new architecture
  Much simpler and focused on UI concerns only
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GameManager } from './GameManager';
  import { GameState } from './state/GameState';
  import GameUI from './ui/GameUI.svelte';
  import LoadingScreen from './ui/components/LoadingScreen.svelte';
  import ErrorScreen from './ui/components/ErrorScreen.svelte';
  import TimelineCard from './ui/components/TimelineCard.svelte';
  import MobileControls from './ui/MobileControls.svelte';
  import DebugPanel from './ui/DebugPanel.svelte';
  import DialogueBox from './ui/components/DialogueBox.svelte';

  // Props
  export let timelineEvents: string = '[]';

  // Game manager
  let gameManager: GameManager;
  let gameContainer: HTMLElement;
  
  // UI state
  let isLoading = true;
  let loadingMessage = 'Initializing Star Observatory...';
  let isInitialized = false;
  let error: string | null = null;
  
  // Game state (reactive)
  let gameState: GameState = new GameState();
  let isMobile = false;
  let showDebugPanel = false;
  
  // Dialogue state
  let dialogueVisible = false;
  let dialogueText = '';
  let dialogueSpeaker = '';
  let dialogueDuration = 3000;
  
  // Reactive values derived from game state
  $: currentLevel = gameState.currentLevel;
  $: selectedStar = gameState.selectedStar;
  $: gameStats = gameState.gameStats;
  
  /**
   * Convert cardClass string to position type
   */
  function getPositionFromCardClass(cardClass?: string): 'top' | 'bottom' | 'left' | 'right' | undefined {
    if (!cardClass) return undefined;
    
    if (cardClass.includes('top')) return 'top';
    if (cardClass.includes('bottom')) return 'bottom';
    if (cardClass.includes('left')) return 'left';
    if (cardClass.includes('right')) return 'right';
    
    return undefined;
  }
  
  // Convert StarData to TimelineEvent for the TimelineCard
  $: selectedEvent = selectedStar ? {
    id: selectedStar.uniqueId,
    title: selectedStar.title,
    description: selectedStar.description,
    slug: selectedStar.slug,
    year: selectedStar.timelineYear,
    era: selectedStar.timelineEra,
    location: selectedStar.timelineLocation,
    isKeyEvent: selectedStar.isKeyEvent,
    isLevel: selectedStar.isLevel,
    tags: selectedStar.tags,
    category: selectedStar.category,
    unlocked: true,
    screenPosition: selectedStar.screenPosition
  } : null;
  
  /**
   * Initialize the game
   */
  async function initializeGame() {
    try {
      if (!gameContainer) {
        throw new Error('Game container not found');
      }

      loadingMessage = 'Setting up game engine...';
      
      // Create game manager
      gameManager = new GameManager(gameContainer);
      
      // Detect mobile
      isMobile = gameManager.isMobileDevice();
      
      loadingMessage = 'Loading game systems...';
      
      // Initialize game
      await gameManager.initialize(timelineEvents);
      
      // Set up reactive state updates
      setupStateUpdates();
      
      // Set up window resize handler
      window.addEventListener('resize', handleResize);
      
      isLoading = false;
      isInitialized = true;
      loadingMessage = 'Welcome to the Star Observatory!';
      
      // console.log('✅ Game initialized successfully');
      
    } catch (err) {
      console.error('❌ Failed to initialize game:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      isLoading = false;
    }
  }
  
  /**
   * Set up reactive state updates
   */
  function setupStateUpdates() {
    const eventBus = gameManager.getEngine().getEventBus();
    
    // Update game state reactively
    const updateGameState = () => {
      gameState = gameManager.getGameState();
    };
    
    // Listen for the unified game state change event
    eventBus.on('game.state.changed', updateGameState);
    
    // Listen for dialogue events
    eventBus.on('dialogue.show', (data: any) => {
      dialogueText = data.text;
      dialogueSpeaker = data.speaker;
      dialogueDuration = data.duration || 3000;
      dialogueVisible = true;
    });
    
    eventBus.on('dialogue.hide', () => {
      dialogueVisible = false;
    });
    
    // Initial state update
    updateGameState();
    
    // Set up event-driven updates instead of polling
    eventBus.on('time.updated', updateGameState);
    eventBus.on('gamestate.time.updated', updateGameState);
  }
  
  /**
   * Handle window resize
   */
  function handleResize() {
    if (!gameManager) return;
    
    const engine = gameManager.getEngine();
    const camera = engine.getCamera();
    const renderer = engine.getRenderer();
    
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  
  /**
   * Handle level transition requests
   */
  function handleLevelTransition(event: CustomEvent) {
    const { levelType } = event.detail;
    
    // Map level types to level IDs
    const levelMap = {
      'miranda-ship-level': 'miranda',
      'restaurant-backroom-level': 'restaurant',
      'infinite-library-level': 'infinite_library'
    };
    
    const levelId = levelMap[levelType as keyof typeof levelMap];
    if (levelId) {
      gameManager.transitionToLevel(levelId);
    }
  }
  
  /**
   * Handle return to observatory
   */
  function handleReturnToObservatory() {
    gameManager.transitionToLevel('observatory');
  }
  
  /**
   * Handle mobile movement
   */
  function handleMobileMovement(event: CustomEvent) {
    const { x, z } = event.detail;
    gameManager.getEngine().getEventBus().emit('mobile.movement', { x, z });
  }
  
  /**
   * Handle mobile actions
   */
  function handleMobileAction(event: CustomEvent) {
    const action = event.detail;
    gameManager.getEngine().getEventBus().emit('mobile.action', action);
  }
  
  /**
   * Reset view
   */
  function resetView() {
    gameManager.resetView();
  }
  
  /**
   * Toggle debug panel
   */
  function toggleDebugPanel() {
    showDebugPanel = !showDebugPanel;
  }
  
  // Lifecycle
  onMount(async () => {
    // console.log('🎮 Starting MEGAMEAL Game with new architecture...');
    await initializeGame();
  });

  onDestroy(() => {
    // console.log('🧹 Cleaning up Game...');
    
    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    
    // Dispose game manager
    if (gameManager) {
      gameManager.dispose();
    }
    
    // console.log('✅ Game cleaned up');
  });
</script>

<!-- Game Container -->
<div class="w-full h-full relative bg-black overflow-hidden">
  <!-- 3D Game Canvas Container -->
  <div bind:this={gameContainer} class="w-full h-full absolute inset-0"></div>

  <!-- Loading Screen -->
  {#if isLoading}
    <LoadingScreen message={loadingMessage} />
  {/if}

  <!-- Error Screen -->
  {#if error}
    <ErrorScreen {error} />
  {/if}

  <!-- Game UI -->
  {#if isInitialized && !isLoading && !error}
    <GameUI 
      {gameStats} 
      {selectedStar} 
      {isMobile} 
      {currentLevel} 
      {resetView} 
      on:returnToObservatory={handleReturnToObservatory}
      on:toggleDebug={toggleDebugPanel}
    />
    
    <!-- Debug Panel -->
    {#if showDebugPanel}
      <DebugPanel {gameManager} />
    {/if}

    <!-- Star Information Card -->
    {#if selectedEvent}
      <TimelineCard 
        event={selectedEvent}
        isSelected={true}
        position={getPositionFromCardClass(selectedEvent.screenPosition?.cardClass) || 'bottom'}
        {isMobile}
        on:levelTransition={handleLevelTransition}
      />
    {/if}
    
    <!-- Mobile Controls -->
    {#if isMobile}
      <MobileControls 
        visible={isInitialized && !isLoading && !error}
        on:movement={handleMobileMovement}
        on:action={handleMobileAction}
      />
    {/if}
    
    <!-- Dialogue Box -->
    <DialogueBox
      isVisible={dialogueVisible}
      text={dialogueText}
      speaker={dialogueSpeaker}
      duration={dialogueDuration}
      on:close={() => dialogueVisible = false}
    />
  {/if}
</div>

<style>
  /* Minimal styles - most styling is handled by components */
  .game-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: black;
  }
  
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>