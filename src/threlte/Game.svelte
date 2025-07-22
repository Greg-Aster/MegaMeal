<!-- 
  Threlte-based Game.svelte - Phase 1 Foundation
  Replaces Three.js with Threlte declarative components
-->
<script lang="ts">
import { onDestroy, onMount, createEventDispatcher } from 'svelte'
import { Canvas } from '@threlte/core'
import { Environment } from '@threlte/extras'
import { World } from '@threlte/rapier'

// Import existing UI components (preserve them during migration)
import DebugPanel from '../game/ui/DebugPanel.svelte'
import GameUI from '../game/ui/GameUI.svelte'
import MobileControls from '../game/ui/MobileControls.svelte'
import DialogueBox from '../game/ui/components/DialogueBox.svelte'
import ErrorScreen from '../game/ui/components/ErrorScreen.svelte'
import LoadingScreen from '../game/ui/components/LoadingScreen.svelte'
import TimelineCard from '../game/ui/components/TimelineCard.svelte'

// Import Threlte systems
import Player from './components/Player.svelte'
import Renderer from './systems/Renderer.svelte'
import SimplePostProcessing from './systems/SimplePostProcessing.svelte'
import Physics from './systems/Physics.svelte'
import Optimization from './systems/Optimization.svelte'
import Audio from './systems/Audio.svelte'
import EventBus from './systems/EventBus.svelte'
import Time from './systems/Time.svelte'
import AssetLoader from './systems/AssetLoader.svelte'
// Input and Interaction now handled by Player component
// StateManager removed - was conflicting with Player component rotation control
import Performance from './systems/Performance.svelte'
import LOD from './systems/LOD.svelte'

// Post-processing effects temporarily disabled due to library compatibility issues

// Import stores for reactive configuration
import { postProcessingStore } from './stores/postProcessingStore'

// Import level components - Modern Architecture Only
import HybridObservatory from './levels/HybridObservatory.svelte'

// Import UI components
import PerformancePanel from './ui/PerformancePanel.svelte'

// Import modern Threlte stores for reactive state management
import { 
  currentLevelStore, 
  selectedStarStore, 
  gameStatsStore, 
  isMobileStore, 
  isLoadingStore, 
  errorStore,
  dialogueStore,
  gameActions,
  loadGameState,
  type StarData 
} from './stores/gameStateStore'

const dispatch = createEventDispatcher()

// Props
export let timelineEvents = []

// Parse timeline events if they come as JSON string from Astro
$: parsedTimelineEvents = (() => {
  if (typeof timelineEvents === 'string') {
    try {
      const parsed = JSON.parse(timelineEvents)
      console.log(`🎮 Game.svelte: Parsed ${parsed.length} timeline events from JSON string`)
      return parsed
    } catch (error) {
      console.error('Failed to parse timeline events:', error)
      return []
    }
  }
  const events = Array.isArray(timelineEvents) ? timelineEvents : []
  console.log(`🎮 Game.svelte: Using ${events.length} timeline events directly`)
  return events
})()
// Game state - fully migrated to reactive Threlte stores

// UI state (local)
let loadingMessage = 'Initializing Threlte...'
let isInitialized = false
let showDebugPanel = false
let showPerformancePanel = false

// Level loading state - start with true to avoid loading loop
let levelReady = true

// Reactive store subscriptions (these are reactive by default)
$: currentLevel = $currentLevelStore
$: selectedStar = $selectedStarStore
$: gameStats = $gameStatsStore
$: isMobile = $isMobileStore
$: isLoading = $isLoadingStore
$: error = $errorStore
$: dialogue = $dialogueStore

// Debug: Log level changes
$: if (currentLevel) {
  console.log('🎮 Current level:', currentLevel)
}

// Backwards compatibility getters
$: dialogueVisible = dialogue.visible
$: dialogueText = dialogue.text
$: dialogueSpeaker = dialogue.speaker
$: dialogueDuration = dialogue.duration

/**
 * Convert cardClass string to position type
 */
function getPositionFromCardClass(
  cardClass?: string,
): 'top' | 'bottom' | 'left' | 'right' | undefined {
  if (!cardClass) return undefined

  if (cardClass.includes('top')) return 'top'
  if (cardClass.includes('bottom')) return 'bottom'
  if (cardClass.includes('left')) return 'left'
  if (cardClass.includes('right')) return 'right'

  return undefined
}

// Convert StarData to TimelineEvent for the TimelineCard
$: selectedEvent = selectedStar
  ? {
      id: selectedStar.uniqueId,
      title: selectedStar.title,
      description: selectedStar.description,
      slug: selectedStar.slug,
      year: selectedStar.timelineYear,
      era: selectedStar.timelineEra,
      location: selectedStar.timelineLocation,
      isKeyEvent: selectedStar.isKeyEvent,
      isLevel: selectedStar.isLevel,
      levelId: selectedStar.levelId,
      tags: selectedStar.tags,
      category: selectedStar.category,
      unlocked: true,
      screenPosition: selectedStar.screenPosition,
    }
  : null

/**
 * Initialize Threlte-based game
 */
async function initializeThrelte() {
  try {
    loadingMessage = 'Setting up Threlte foundation...'
    gameActions.setLoading(true)
    
    // Detect mobile and update store
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    gameActions.setMobile(isMobileDevice)

    loadingMessage = 'Loading Threlte scene...'

    // Load saved game state
    loadGameState()
    
    // Set default level to observatory if none is set
    if (!$currentLevelStore || $currentLevelStore === '') {
      gameActions.transitionToLevel('observatory')
    }
    
    // Set up Threlte-based state management
    setupStateUpdates()

    gameActions.setLoading(false)
    isInitialized = true
    loadingMessage = 'Welcome to Threlte Observatory!'

    console.log('✅ Threlte game initialized successfully with reactive stores')
  } catch (err) {
    console.error('❌ Failed to initialize Threlte game:', err)
    gameActions.setError(err instanceof Error ? err.message : 'Unknown error')
    gameActions.setLoading(false)
  }
}

/**
 * Set up reactive state updates using modern stores
 */
function setupStateUpdates() {
  console.log('🔄 Setting up reactive Threlte store-based state management')
  
  // All state is now managed by reactive stores
  // No need for manual initialization - stores handle their own state
  
  console.log('✅ Reactive store-based state management ready')
}

/**
 * Handle level transition requests - Pure Threlte store-based implementation
 */
function handleLevelTransition(event: CustomEvent) {
  const { levelType } = event.detail

  // Map level types to level IDs
  const levelMap = {
    'miranda-ship-level': 'miranda',
    'restaurant-backroom-level': 'restaurant',
    'infinite-library-level': 'infinite_library',
  }

  const levelId = levelMap[levelType as keyof typeof levelMap] || levelType

  // Reset level ready state for new level
  levelReady = false
  
  // Update current level using store action (automatically reactive)
  gameActions.transitionToLevel(levelId)
  console.log(`🎮 Threlte store-based level transition: ${levelId}`)
}

/**
 * Handle return to observatory - Store-based implementation
 */
function handleReturnToObservatory() {
  // Reset level ready state for observatory reload
  levelReady = false
  gameActions.transitionToLevel('observatory')
  console.log('🎮 Threlte store: Returned to observatory')
}

/**
 * Handle mobile movement - Handled directly by Player component
 */
function handleMobileMovement(event: CustomEvent) {
  // Mobile movement is now handled directly by the Player component
  // via the EventBus system - no GameManager needed
  console.log('📱 Mobile movement:', event.detail)
}

/**
 * Handle mobile actions - Handled directly by Player component
 */
function handleMobileAction(event: CustomEvent) {
  // Mobile actions are now handled directly by the Player component
  // via the EventBus system - no GameManager needed
  console.log('📱 Mobile action:', event.detail)
}

/**
 * Reset view - Handled by Player component
 */
function resetView() {
  // View reset is now handled by the Player component's camera controls
  console.log('🎮 View reset requested - handled by Player component')
}

/**
 * Toggle debug panel
 */
function toggleDebugPanel() {
  showDebugPanel = !showDebugPanel
}

function togglePerformancePanel() {
  showPerformancePanel = !showPerformancePanel
}

/**
 * Handle level ready notification
 */
function handleLevelReady() {
  levelReady = true
  console.log('🎮 Level is ready - player can spawn safely')
}

// Lifecycle
onMount(async () => {
  console.log('🎮 Starting MEGAMEAL Game with Threlte...')
  await initializeThrelte()
})

onDestroy(() => {
  console.log('🧹 Cleaning up Threlte Game...')
  // All cleanup is now handled by individual Threlte components
  console.log('✅ Threlte Game cleaned up')
})
</script>

<!-- Game Container - Allow input to pass through to Player component -->
<div class="w-full h-full relative bg-black overflow-hidden" style="pointer-events: none;">
  
  <!-- Threlte Canvas - Enable input for 3D scene -->
  {#if isInitialized && !isLoading && !error}
    <div style="pointer-events: auto; width: 100%; height: 100%;">
      <Canvas>
      <!-- Core Systems -->
      <EventBus 
        on:levelTransition={handleLevelTransition}
        on:starSelected={(e) => { gameActions.selectStar(e.detail); dispatch('starSelected', e.detail) }}
        on:starDeselected={(e) => { gameActions.deselectStar(); dispatch('starDeselected', e.detail) }}
        on:dialogueShow={(e) => gameActions.showDialogue(e.detail.text, e.detail.speaker, e.detail.duration)}
        on:dialogueHide={() => gameActions.hideDialogue()}
      />
      
      <Time on:timeUpdate={(e) => dispatch('timeUpdate', e.detail)} />
      
      <Performance 
        enablePerformanceMonitoring={true}
        enableAutomaticOptimization={true}
        targetFPS={60}
        on:performanceUpdate={(e) => {
          dispatch('performanceUpdate', e.detail)
          // Automatically adjust post-processing quality based on performance
          if (e.detail.averageFPS) {
            import('./stores/postProcessingStore').then(({ adjustQualityForPerformance }) => {
              adjustQualityForPerformance(e.detail.averageFPS, 60)
            })
          }
        }}
        on:qualityChanged={(e) => dispatch('qualityChanged', e.detail)}
      />
      
      <LOD 
        enableLOD={true}
        maxDistance={100}
        updateFrequency={0.1}
        enableCulling={true}
        on:lodLevelChanged={(e) => dispatch('lodLevelChanged', e.detail)}
      />
      
      <!-- StateManager removed - was causing camera control conflicts with Player component -->
      
      <AssetLoader />
      
      <!-- Renderer Configuration -->
      <Renderer />
      
      <!-- Simple Post-Processing using Native Threlte -->
      <SimplePostProcessing 
        enableGlow={true}
        enableAmbientLight={true}
        toneMappingExposure={1.0}
      />
      
      <!-- Audio System -->
      <Audio enabled={false} />
      
      <!-- Physics World -->
      <Physics>
        <!-- 
          Player Component Setup - First-Person Controller
          Only spawn player after level is ready to prevent falling through ground
        -->
        {#if levelReady}
          <Player
            position={[0, 15, 10]}
            speed={5}
            jumpForce={8}
            on:lock={() => console.log('🔒 Pointer locked')}
            on:unlock={() => console.log('🔓 Pointer unlocked')}
            on:interaction={(e) => { gameActions.recordInteraction('click', e.detail.type); dispatch('objectClick', e.detail) }}
          />
        {/if}
        <!-- Environment -->
        <Environment 
          path="/textures/environment/"
          files="environment.hdr"
        />
        
        <!-- Modern MEGAMEAL Architecture - Single Level -->
        <HybridObservatory 
          timelineEvents={parsedTimelineEvents}
          onLevelReady={handleLevelReady}
          on:starSelected={(e) => dispatch('starSelected', e.detail)}
          on:telescopeInteraction={(e) => dispatch('telescopeInteraction', e.detail)}
        />
        
        <!-- Optimization System -->
        <Optimization />
      </Physics>
      
      </Canvas>
    </div>
  {/if}

  <!-- Legacy container removed - Player component now handles all input -->

  <!-- Loading Screen -->
  {#if isLoading}
    <LoadingScreen message={loadingMessage} />
  {:else if !levelReady}
    <LoadingScreen message="Loading Observatory environment..." />
  {/if}

  <!-- Error Screen -->
  {#if error}
    <ErrorScreen {error} />
  {/if}

  <!-- Game UI (preserve existing UI) -->
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
    
    <!-- Debug Panel - Pure Threlte Implementation -->
    {#if showDebugPanel}
      <div class="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded" style="pointer-events: auto;">
        <h3 class="font-bold">🔧 Threlte Debug Info</h3>
        <p>Game State: {isInitialized ? 'Ready' : 'Loading'}</p>
        <p>Current Level: {currentLevel}</p>
        <p>Mobile: {isMobile ? 'Yes' : 'No'}</p>
        <p class="text-yellow-400 text-sm mt-2">Legacy debug panel disabled - GameManager removed</p>
      </div>
    {/if}
    
    <!-- Performance Panel -->
    {#if showPerformancePanel}
      <PerformancePanel 
        visible={true}
        position="top-left"
        compact={isMobile}
      />
    {/if}

    <!-- Star Information Card -->
    {#if selectedEvent}
      <div style="pointer-events: auto;">
        <TimelineCard 
          event={selectedEvent}
          isSelected={true}
          position={getPositionFromCardClass(selectedEvent.screenPosition?.cardClass) || 'bottom'}
          {isMobile}
          on:levelTransition={handleLevelTransition}
        />
      </div>
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
    <div style="pointer-events: auto;">
      <DialogueBox
        isVisible={dialogueVisible}
        text={dialogueText}
        speaker={dialogueSpeaker}
        duration={dialogueDuration}
        on:close={() => dialogueVisible = false}
      />
    </div>
  {/if}
</div>

<style>
  /* Minimal styles - most styling is handled by components */
  
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>