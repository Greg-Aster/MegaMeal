<!-- 
  Refactored Game.svelte using the new engine architecture
  Preserves original StarVisuals functionality with modern FPS controls
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { StarVisuals, type StarData } from './systems/StarVisuals';
  import { StarObservatory } from './levels/StarObservatory';
  import { Engine } from '../engine/core/Engine';
  import { HybridControls } from '../engine/input/HybridControls';
  import TimelineCard from './ui/components/TimelineCard.svelte';
  import GameUI from './ui/GameUI.svelte';
  import DebugPanel from './ui/DebugPanel.svelte';

  // Props
  export let timelineEvents: string = '[]';

  // State
  let gameContainer: HTMLElement;
  let isLoading = true;
  let loadingMessage = 'Initializing Star Observatory...';
  let isInitialized = false;
  let error: string | null = null;

  // Engine and game systems
  let engine: Engine;
  let starVisuals: StarVisuals;
  let starObservatory: StarObservatory;
  let hybridControls: HybridControls;
  let THREE: any; // Store THREE reference for use in click handlers

  // Game data
  let selectedStar: any = null;
  let gameStats = {
    starsDiscovered: 0,
    timeExplored: 0,
    currentLocation: 'Star Observatory Alpha'
  };

  // Mobile detection
  let isMobile = false;

  // Initialize the game with new engine architecture
  async function initializeGame() {
    try {
      if (!gameContainer) {
        throw new Error('Game container not found');
      }

      loadingMessage = 'Setting up game engine...';

      // Initialize the new engine
      engine = Engine.getInstance({
        container: gameContainer,
        enablePhysics: true,
        enableAudio: false,
        enableDebug: false, // DISABLED for clean gameplay
        enablePerformanceMonitoring: false // DISABLED for clean gameplay
      });

      await engine.initialize();

      loadingMessage = 'Creating star field...';

      // Get engine systems
      const scene = engine.getScene();
      const camera = engine.getCamera();

      // Store THREE reference for later use
      THREE = await import('three');
      
      // Initialize game systems using the new engine
      const physicsWorld = engine.getPhysicsWorld();
      const engineCamera = engine.getCamera();
      starObservatory = new StarObservatory(THREE, scene, physicsWorld, engineCamera, gameContainer);
      await starObservatory.initialize();

      starVisuals = new StarVisuals(THREE, scene);
      
      // Parse and pass timeline events (same as before)
      try {
        const events = JSON.parse(timelineEvents);
        console.log(`Game: Parsed ${events.length} timeline events`);
        starVisuals.setTimelineEvents(events);
      } catch (error) {
        console.warn('Failed to parse timeline events, using defaults:', error);
      }
      
      await starVisuals.initialize();

      loadingMessage = 'Setting up interactions...';

      // Connect star visuals to observatory
      starObservatory.setStarVisuals(starVisuals);
      
      // Set up star selection callback from observatory
      starObservatory.onStarSelected((star) => {
        selectedStar = star;
        if (star) {
          gameStats.starsDiscovered++;
        }
      });

      // Initialize hybrid controls (OrbitControls + WASD)
      await setupHybridControls();

      // Set up event listeners for star interactions (now handled by observatory)
      setupStarInteractions();

      // Set up engine update loop
      engine.getEventBus().on('engine.update', (data) => {
        // Update game systems
        starVisuals?.update();
        starObservatory?.update();
        gameStats.timeExplored = data.totalTime;
      });

      // Start the engine
      engine.start();

      isLoading = false;
      isInitialized = true;
      loadingMessage = 'Welcome to the Star Observatory!';

      console.log('✅ Star Observatory initialized with new engine');

    } catch (err) {
      console.error('❌ Failed to initialize game:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      isLoading = false;
    }
  }

  async function setupHybridControls() {
    try {
      const camera = engine.getCamera();
      const renderer = engine.getRenderer();
      const inputManager = engine.getInputManager();
      const eventBus = engine.getEventBus();
      const physicsWorld = engine.getPhysicsWorld(); // Get physics world from engine
      
      // Initialize hybrid controls with contemplative stargazing feel + WASD movement
      hybridControls = new HybridControls(
        THREE,
        camera,
        renderer.getDomElement(),
        eventBus,
        inputManager,
        physicsWorld, // Add physics world for gravity and collision
        {
          moveSpeed: 50, // Units per second
          orbitControls: {
            enableDamping: true,
            dampingFactor: 0.2,
            rotateSpeed: 0.1,
            zoomSpeed: 1.0, // Increased from 0.3 for faster zoom
            enablePan: false,
            minDistance: 50,
            maxDistance: 300,
            autoRotate: false,
            autoRotateSpeed: 0.05,
            // Mobile/touch optimizations
            enableTouch: true,
            touchRotateSpeed: 0.15,
            touchZoomSpeed: 1.2 // Faster zoom on mobile
          }
        }
      );
      
      await hybridControls.initialize();
      
      // Set initial camera position on the ground, slightly away from center
      camera.position.set(0, -3.4, 50); // Ground level (-3.4), back from hill center
      
      // Look straight ahead with slight upward angle for stargazing
      const lookUpAngle = THREE.MathUtils.degToRad(15); // Much less dramatic - just 15 degrees up
      camera.rotation.x = -lookUpAngle;
      
      console.log('✅ Hybrid controls initialized');
    } catch (error) {
      console.warn('Failed to initialize hybrid controls:', error);
    }
  }

  function setupStarInteractions() {
    // Star interactions are now handled by StarObservatory
    // Set up mouse interaction for star selection
    const renderer = engine.getRenderer();
    const canvas = renderer.getDomElement();
    
    // Use mouseup instead of click to avoid conflicts with orbit controls
    canvas.addEventListener('mouseup', (event) => {
      // Only handle left mouse button and short clicks (not drags)
      if (event.button === 0) {
        // Check if this was a quick click (not a drag)
        const mouseDownTime = event.timeStamp - (window as any).lastMouseDownTime || 0;
        if (mouseDownTime < 200) { // Less than 200ms = click, not drag
          event.stopPropagation();
          handleStarClick(event);
        }
      }
    });
    
    // Track mouse down time to distinguish clicks from drags
    canvas.addEventListener('mousedown', (event) => {
      (window as any).lastMouseDownTime = event.timeStamp;
    });
  }

  function handleStarClick(event: MouseEvent) {
    if (!starVisuals || !engine) {
      console.log('❌ Missing starVisuals or engine');
      return;
    }
    
    console.log('🖱️ Star click detected');
    
    // Use the stored THREE reference
    if (!THREE) {
      console.log('❌ THREE not loaded yet');
      return;
    }
    
    // Get intersections using the interaction system
    const camera = engine.getCamera();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const rect = gameContainer.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    console.log('🎯 Mouse coordinates:', mouse.x.toFixed(3), mouse.y.toFixed(3));
    
    raycaster.setFromCamera(mouse, camera);
    const starSprites = Array.from(starVisuals.getStarSprites().values());
    console.log(`🌟 Checking ${starSprites.length} stars for intersection`);
    
    if (starSprites.length === 0) {
      console.log('❌ No star sprites found!');
      return;
    }
    
    // Add more debugging info
    console.log('📷 Camera position:', camera.position);
    console.log('📷 Camera rotation:', camera.rotation);
    console.log('🔫 Ray origin:', raycaster.ray.origin);
    console.log('🔫 Ray direction:', raycaster.ray.direction);
    
    const intersections = raycaster.intersectObjects(starSprites);
    console.log(`✨ Found ${intersections.length} intersections`);
    
    if (intersections.length > 0 && intersections[0].object.userData?.uniqueId) {
      console.log('⭐ Star selected:', intersections[0].object.userData.title);
      starVisuals.handleStarClick(intersections[0].object);
    } else {
      console.log('🌌 No star selected');
      starVisuals.handleStarClick(null);
    }
  }

  // Screen position calculation moved to StarObservatory.ts

  function resetView() {
    // Reset camera to default position using hybrid controls
    if (hybridControls) {
      hybridControls.resetView();
    }
    selectedStar = null;
  }

  // Handle window resize
  function handleResize() {
    if (!engine) return;
    
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    
    const camera = engine.getCamera();
    const renderer = engine.getRenderer();
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Lifecycle
  onMount(async () => {
    console.log('🎮 Starting Star Observatory Game with new engine...');
    
    // Detect mobile device
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set up resize listener
    window.addEventListener('resize', handleResize);
    
    await initializeGame();
  });

  onDestroy(() => {
    console.log('🧹 Cleaning up Star Observatory Game...');
    
    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    
    // Dispose of game systems
    try {
      starVisuals?.dispose();
      starObservatory?.dispose();
      hybridControls?.dispose();
      engine?.dispose();
    } catch (err) {
      console.warn('Warning during cleanup:', err);
    }
    
    console.log('✅ Star Observatory Game cleaned up');
  });
</script>

<!-- Game Container -->
<div class="w-full h-full relative bg-black overflow-hidden">
  <!-- 3D Game Canvas Container -->
  <div bind:this={gameContainer} class="w-full h-full absolute inset-0"></div>

  <!-- Loading Screen -->
  {#if isLoading}
    <div class="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="text-center font-mono">
        <div class="text-4xl mb-4 text-primary neon-text">
          ⭐ STAR OBSERVATORY
        </div>
        <div class="text-lg text-75 mb-4 animate-pulse">
          {loadingMessage}
        </div>
        <div class="loading-bar w-64 h-1 bg-25 rounded-full overflow-hidden">
          <div class="loading-progress h-full bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Error Screen -->
  {#if error}
    <div class="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
      <div class="text-center font-mono max-w-md p-8">
        <div class="text-6xl mb-4 text-red-400">⚠️</div>
        <div class="text-2xl mb-4 text-red-400 font-bold">SYSTEM ERROR</div>
        <div class="text-75 mb-6">{error}</div>
        <button 
          class="btn-regular px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
          on:click={() => window.location.reload()}
        >
          🔄 RESTART SYSTEM
        </button>
      </div>
    </div>
  {/if}

  <!-- Game UI -->
  {#if isInitialized && !isLoading && !error}
    <GameUI {gameStats} {selectedStar} {isMobile} {resetView} />
    
    <!-- Debug Panel - DISABLED for clean gameplay -->
    <!-- <DebugPanel {engine} /> -->

    <!-- Floating Star Info Card - CLEAN VERSION with positioning -->
    {#if selectedStar}
      <div 
        class="absolute z-40 pointer-events-auto"
        style="left: {selectedStar.screenPosition?.x || 100}px; top: {selectedStar.screenPosition?.y || 100}px;"
      >
        <TimelineCard 
          event={selectedStar}
          position={selectedStar.screenPosition?.cardClass?.replace('timeline-card-', '') || 'bottom'}
          {isMobile}
          isVisible={true}
        />
      </div>
    {/if}
  {/if}
</div>

<style>
  .neon-text {
    text-shadow: 
      0 0 5px #00ff88,
      0 0 10px #00ff88,
      0 0 20px #00ff88;
  }
  
  .loading-bar {
    background: linear-gradient(90deg, 
      rgba(var(--primary-rgb), 0.2) 0%, 
      rgba(var(--primary-rgb), 0.1) 100%);
  }
  
  .loading-progress {
    background: linear-gradient(90deg, 
      rgb(var(--primary-rgb)) 0%, 
      rgba(var(--primary-rgb), 0.8) 50%,
      rgb(var(--primary-rgb)) 100%);
    animation: loading-slide 2s ease-in-out infinite;
  }
  
  @keyframes loading-slide {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .neon-text,
    .animate-pulse,
    .loading-progress {
      animation: none !important;
    }
    
    .hover\:scale-105:hover {
      transform: none !important;
    }
  }
</style>