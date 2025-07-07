<!-- 
  /src/game/Game.svelte 
  MegaMeal Navigator - Clean 3D Star Observatory Game
  Based on StarMapView.astro - using Tailwind CSS and Three.js
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { StarControls } from './StarControls';
  import { StarVisuals } from './StarVisuals';
  import { StarObservatory } from './StarObservatory';
  import TimelineCard from './TimelineCard.svelte';

  // Props
  export let timelineEvents: string = '[]';

  // Game state
  let gameContainer: HTMLElement;
  let isLoading = true;
  let loadingMessage = 'Initializing Star Observatory...';
  let isInitialized = false;
  let error: string | null = null;

  // Game systems
  let starControls: StarControls;
  let starVisuals: StarVisuals;
  let starObservatory: StarObservatory;

  // Three.js core (loaded dynamically)
  let THREE: any;
  let scene: any;
  let camera: any;
  let renderer: any;

  // Game data
  let selectedStar: any = null;
  let gameStats = {
    starsDiscovered: 0,
    timeExplored: 0,
    currentLocation: 'Star Observatory Alpha'
  };

  // Mobile detection (client-side only)
  let isMobile = false;

  // Load Three.js dynamically
  async function loadThreeJS(): Promise<any> {
    if ((window as any).THREE) {
      return (window as any).THREE;
    }

    loadingMessage = 'Loading 3D Engine...';
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        loadingMessage = 'Loading Controls...';
        const controlsScript = document.createElement('script');
        controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
        controlsScript.onload = () => resolve((window as any).THREE);
        controlsScript.onerror = reject;
        document.head.appendChild(controlsScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize the game
  async function initializeGame() {
    try {
      if (!gameContainer) {
        throw new Error('Game container not found');
      }

      // Load Three.js
      THREE = await loadThreeJS();
      if (!THREE) {
        throw new Error('Failed to load Three.js');
      }

      loadingMessage = 'Creating 3D Scene...';

      // Create Three.js scene
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, gameContainer.clientWidth / gameContainer.clientHeight, 0.1, 2000);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      gameContainer.appendChild(renderer.domElement);

      loadingMessage = 'Initializing Star Observatory...';

      // Initialize game systems
      starObservatory = new StarObservatory(THREE, scene);
      await starObservatory.initialize();

      loadingMessage = 'Setting up Controls...';
      
      starControls = new StarControls(THREE, camera, renderer.domElement);
      starControls.initialize();

      loadingMessage = 'Generating Stars...';
      
      starVisuals = new StarVisuals(THREE, scene);
      
      // Parse and pass timeline events
      try {
        const events = JSON.parse(timelineEvents);
        console.log(`Game.svelte: Parsed ${events.length} timeline events from props`);
        console.log('Game.svelte: First few events:', events.slice(0, 3));
        starVisuals.setTimelineEvents(events);
      } catch (error) {
        console.warn('Failed to parse timeline events, using defaults:', error);
      }
      
      await starVisuals.initialize();
      

      loadingMessage = 'Finalizing...';

      // Set up event listeners
      setupEventListeners();

      // Mark as initialized before starting animation
      isLoading = false;
      isInitialized = true;
      loadingMessage = 'Welcome to the Star Observatory!';


      // Start animation loop
      animate();


    } catch (err) {
      console.error('❌ Failed to initialize game:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      isLoading = false;
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', handleResize);

    // Star selection events
    starVisuals.onStarSelected((starData) => {
      if (starData) {
        // Get the sprite for screen position calculation
        const starSprite = starVisuals.getStarSprites().get(starData.uniqueId);
        if (starSprite) {
          const screenPosition = starControls.getScreenPosition(starSprite);
          selectedStar = {
            ...starData,
            screenPosition: calculateOptimalCardPosition(screenPosition, gameContainer)
          };
        } else {
          selectedStar = starData;
        }
        gameStats.starsDiscovered++;
      } else {
        selectedStar = null;
      }
    });

    // Controls events
    starControls.onViewChange(() => {
      // Update any UI elements that depend on camera position
    });

    // Set up mouse/touch interaction between controls and visuals
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleMouseClick);
    if (isMobile) {
      renderer.domElement.addEventListener('touchend', handleTouchEnd);
    }
  }

  // Mouse interaction handlers
  function handleMouseMove(event: MouseEvent) {
    if (!starControls || !starVisuals) return;
    
    const intersections = starControls.checkIntersections(Array.from(starVisuals.getStarSprites().values()));
    
    if (intersections.length > 0 && intersections[0].object.userData?.uniqueId) {
      starVisuals.handleStarHover(intersections[0].object, true);
      starControls.updateCursor(true);
    } else {
      starVisuals.handleStarHover(null, false);
      starControls.updateCursor(false);
    }
  }

  function handleMouseClick(event: MouseEvent) {
    if (!starControls || !starVisuals) return;
    
    const intersections = starControls.checkIntersections(Array.from(starVisuals.getStarSprites().values()));
    
    if (intersections.length > 0 && intersections[0].object.userData?.uniqueId) {
      starVisuals.handleStarClick(intersections[0].object);
    } else {
      // Clicked empty space - deselect
      starVisuals.handleStarClick(null);
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!starControls || !starVisuals) return;
    
    const intersections = starControls.checkIntersections(Array.from(starVisuals.getStarSprites().values()));
    
    if (intersections.length > 0 && intersections[0].object.userData?.uniqueId) {
      starVisuals.handleStarClick(intersections[0].object);
    } else {
      starVisuals.handleStarClick(null);
    }
  }

  // Handle window resize
  function handleResize() {
    if (!camera || !renderer || !gameContainer) return;
    
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Main animation loop
  function animate() {
    if (!isInitialized) return;
    
    requestAnimationFrame(animate);
    
    try {
      // Update game systems
      starControls?.update();
      starVisuals?.update();
      starObservatory?.update();
      
      // Render the scene
      renderer.render(scene, camera);
      
      // Update game stats
      gameStats.timeExplored = Date.now();
      
    } catch (err) {
      console.error('Error in animation loop:', err);
    }
  }

  // Calculate optimal card position based on star screen position
  function calculateOptimalCardPosition(screenPosition: {x: number, y: number, isInFront: boolean}, container: HTMLElement) {
    if (!screenPosition.isInFront || !container) {
      return { x: 100, y: 100, cardClass: 'timeline-card-bottom' };
    }

    const rect = container.getBoundingClientRect();
    const cardWidth = 200;
    const cardHeight = 100;
    const margin = 20;
    
    let cardX = screenPosition.x;
    let cardY = screenPosition.y;
    let cardClass = 'timeline-card-bottom'; // Default
    
    // Determine optimal position and pointer direction
    const spaceRight = rect.width - screenPosition.x;
    const spaceLeft = screenPosition.x;
    const spaceBelow = rect.height - screenPosition.y;
    const spaceAbove = screenPosition.y;
    
    // Choose position with most available space
    if (spaceBelow >= cardHeight + margin && spaceBelow >= spaceAbove) {
      // Position below star
      cardX = screenPosition.x - cardWidth / 2;
      cardY = screenPosition.y + margin;
      cardClass = 'timeline-card-top';
    } else if (spaceAbove >= cardHeight + margin) {
      // Position above star
      cardX = screenPosition.x - cardWidth / 2;
      cardY = screenPosition.y - cardHeight - margin;
      cardClass = 'timeline-card-bottom';
    } else if (spaceRight >= cardWidth + margin) {
      // Position to the right of star
      cardX = screenPosition.x + margin;
      cardY = screenPosition.y - cardHeight / 2;
      cardClass = 'timeline-card-left';
    } else if (spaceLeft >= cardWidth + margin) {
      // Position to the left of star
      cardX = screenPosition.x - cardWidth - margin;
      cardY = screenPosition.y - cardHeight / 2;
      cardClass = 'timeline-card-right';
    }
    
    // Clamp to viewport boundaries
    cardX = Math.max(margin, Math.min(cardX, rect.width - cardWidth - margin));
    cardY = Math.max(margin, Math.min(cardY, rect.height - cardHeight - margin));
    
    return { x: cardX, y: cardY, cardClass };
  }

  // Handle star interaction
  function handleStarClick(event: CustomEvent) {
    const starData = event.detail;
    selectedStar = starData;
    gameStats.starsDiscovered++;
  }

  // Reset view
  function resetView() {
    starControls?.resetView();
    selectedStar = null;
  }

  // Lifecycle
  onMount(async () => {
    console.log('🎮 Starting Star Observatory Game...');
    
    // Detect mobile device (client-side only)
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    await initializeGame();
  });

  onDestroy(() => {
    console.log('🧹 Cleaning up Star Observatory Game...');
    
    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    
    // Dispose of game systems
    try {
      starVisuals?.dispose();
      starControls?.dispose();
      starObservatory?.dispose();
      renderer?.dispose();
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

  <!-- Game UI Overlay -->
  {#if isInitialized && !isLoading && !error}
    <!-- Top HUD -->
    <div class="absolute top-4 left-4 z-30 font-mono">
      <div class="card-base p-4 backdrop-blur-sm">
        <div class="text-[color:var(--primary)] font-bold mb-2">STAR OBSERVATORY</div>
        <div class="text-sm text-[color:var(--text-75)] space-y-1">
          <div class="text-[color:var(--text-main)]">Location: {gameStats.currentLocation}</div>
          <div class="text-[color:var(--text-main)]">Stars Discovered: {gameStats.starsDiscovered}</div>
        </div>
      </div>
    </div>

    <!-- Controls Info -->
    <div class="absolute top-4 right-4 z-30 font-mono">
      <div class="card-base p-3 backdrop-blur-sm text-sm text-[color:var(--text-75)]">
        {#if isMobile}
          <div class="text-[color:var(--text-main)]">Touch & drag to explore</div>
          <div class="text-[color:var(--text-main)]">Pinch to zoom</div>
          <div class="text-[color:var(--text-main)]">Tap stars to select</div>
        {:else}
          <div class="text-[color:var(--text-main)]">Mouse to look around</div>
          <div class="text-[color:var(--text-main)]">Scroll to zoom</div>
          <div class="text-[color:var(--text-main)]">Click stars to select</div>
        {/if}
      </div>
    </div>

    <!-- Floating Star Info Card -->
    {#if selectedStar}
      <div 
        id="floating-star-card" 
        class="absolute z-40 pointer-events-auto transition-opacity duration-300"
        style="left: {selectedStar.screenPosition?.x || 100}px; top: {selectedStar.screenPosition?.y || 100}px;"
      >
        <TimelineCard 
          event={selectedStar}
          position={selectedStar.screenPosition?.cardClass?.replace('timeline-card-', '') || 'bottom'}
          isMobile={isMobile}
          isVisible={true}
        />
      </div>
    {/if}

    <!-- Reset View Button -->
    <div class="absolute bottom-4 right-4 z-30">
      <button 
        class="btn-regular p-3 rounded-full font-bold text-lg hover:scale-110 transition-transform"
        on:click={resetView}
        title="Reset View"
      >
        🎯
      </button>
    </div>
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
  
  /* Timeline card styles are now imported via TimelineCard.svelte component */
  
  /* Reduce animations for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .neon-text,
    .animate-pulse,
    .loading-progress {
      animation: none !important;
    }
    
    .hover\:scale-105:hover,
    .hover\:scale-110:hover {
      transform: none !important;
    }
  }
</style>