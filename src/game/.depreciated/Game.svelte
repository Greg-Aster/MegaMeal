<!-- 
  Game.svelte - Integrated with Threlte
  This component now manages the UI and hosts the Threlte <Canvas>.
  The old GameManager initialization has been removed to prevent conflicts.
-->
<script lang="ts">
import { onDestroy, onMount } from 'svelte'
import { Canvas, T } from '@threlte/core'
import { World } from '@threlte/rapier'

// Import your new Threlte components
import Performance from '../threlte/systems/Performance.svelte'
import InfiniteLibrary from '../threlte/levels/InfiniteLibrary.svelte'
import PerformancePanel from '../threlte/ui/PerformancePanel.svelte'

// Import existing UI components
import { GameState, type StarData } from './state/GameState'
import DebugPanel from './ui/DebugPanel.svelte'
import GameUI from './ui/GameUI.svelte'
import MobileControls from './ui/MobileControls.svelte'
import DialogueBox from './ui/components/DialogueBox.svelte'
import ErrorScreen from './ui/components/ErrorScreen.svelte'
import LoadingScreen from './ui/components/LoadingScreen.svelte'
import TimelineCard from './ui/components/TimelineCard.svelte'

// UI state
let isLoading = true
let loadingMessage = 'Initializing Star Observatory...'
let isInitialized = false
let error: string | null = null

// Game state (reactive)
let gameState: GameState = new GameState()
let isMobile = false
let showDebugPanel = false
let showPerformancePanel = false

// Dialogue state
let dialogueVisible = false
let dialogueText = ''
let dialogueSpeaker = ''
let dialogueDuration = 3000

// Threlte state
let currentLevel = 'infinite_library' // Start with a Threlte level

// Reactive values derived from game state
$: currentLevel = gameState.currentLevel
$: selectedStar = gameState.selectedStar
$: gameStats = gameState.gameStats

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
      levelId: selectedStar.levelId, // Now properly available from StarData
      tags: selectedStar.tags,
      category: selectedStar.category,
      unlocked: true,
      screenPosition: selectedStar.screenPosition,
    }
  : null

/**
 * Initialize the Threlte-based game
 */
async function initializeThrelteGame() {
  try {
    loadingMessage = 'Setting up Threlte foundation...'
    
    // Detect mobile
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    // Simulate loading, as Threlte handles its own async setup
    setTimeout(() => {
      isLoading = false
      isInitialized = true
      loadingMessage = 'Welcome to the Infinite Library!'
      console.log('✅ Threlte game initialized successfully')
    }, 1500)
  } catch (err) {
    console.error('❌ Failed to initialize Threlte game:', err)
    error = err instanceof Error ? err.message : 'Unknown error'
    isLoading = false
  }
}

function handleLevelTransition() {
  // TODO: Implement level transitions using Svelte stores
  console.warn('Level transition requested, but not yet implemented in Threlte.')
}

function handleReturnToObservatory() {
  // TODO: Implement return to observatory
  currentLevel = 'observatory'
}

function handleMobileMovement(event: CustomEvent) {
  // TODO: Wire up mobile controls to Threlte player movement
}

function handleMobileAction(event: CustomEvent) {
  // TODO: Wire up mobile actions
}

function resetView() {
  // TODO: Implement view reset for Threlte camera
}

function toggleDebugPanel() {
  showDebugPanel = !showDebugPanel
}

function togglePerformancePanel() {
  showPerformancePanel = !showPerformancePanel
}

// Lifecycle
onMount(async () => {
  console.log('🎮 Starting MEGAMEAL Game with Threlte...')
  await initializeThrelteGame()
})

onDestroy(() => {
  console.log('🧹 Cleaning up Threlte Game...')
  // Threlte handles its own cleanup automatically
  console.log('✅ Threlte Game cleaned up')
})
</script>

<!-- Game Container -->
<div class="w-full h-full relative bg-black overflow-hidden">
  <!-- The Threlte component now manages its own canvas -->
  {#if isInitialized && !isLoading && !error}
    <Canvas>
      <!-- Basic lighting to ensure the scene is visible -->
      <T.AmbientLight intensity={0.5} />
      <T.DirectionalLight position={[10, 10, 5]} intensity={1.5} />

      <!-- Camera is now provided by Player component -->

      <!-- Headless component to calculate performance metrics -->
      <Performance />

      <World>
        <!-- Render the current level -->
        {#if currentLevel === 'infinite_library'}
          <InfiniteLibrary />
        {/if}
        <!-- TODO: Add other level components here -->
      </World>
    </Canvas>
  {/if}

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
      gameStats={null}
      selectedStar={null}
      {isMobile} 
      {currentLevel} 
      {resetView} 
      on:returnToObservatory={handleReturnToObservatory}
      on:toggleDebug={toggleDebugPanel}
      on:togglePerformance={togglePerformancePanel}
    />
    
    <!-- Debug Panel -->
    {#if showDebugPanel}
      <DebugPanel {gameManager} />
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
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>