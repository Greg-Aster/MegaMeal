<!-- 
  Enhanced Debug Panel - Showcases all new systems
  Real-time monitoring and controls for the game architecture
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GUI } from 'lil-gui';
  import type { GameManager } from '../GameManager';
  
  export let gameManager: GameManager;
  
  let debugContainer: HTMLElement;
  let gui: GUI;
  let updateInterval: NodeJS.Timeout;
  
  // Real-time data
  let performanceMetrics = {
    fps: 0,
    frameTime: 0,
    memory: 0,
    drawCalls: 0,
    triangles: 0
  };
  
  let gameStateMetrics = {
    actionCount: 0,
    averageActionTime: 0,
    stateSize: 0,
    subscriberCount: 0,
    validationSuccessRate: 0
  };
  
  let optimizationMetrics = {
    qualityTier: 'high',
    deviceType: 'desktop',
    targetFPS: 60,
    currentFPS: 0,
    frameDrops: 0
  };
  
  let validationMetrics = {
    totalValidations: 0,
    successRate: 0,
    criticalErrors: 0,
    autoFixSuccesses: 0,
    commonErrors: [] as string[]
  };
  
  let timeMetrics = {
    totalPlayTime: 0,
    sessionTime: 0,
    timeExplored: 0,
    lastUpdateInterval: 0
  };
  
  // Control states
  let controls = {
    // Graphics controls
    vectorMode: true,
    bloom: 0.5,
    outlines: true,
    
    // Performance controls
    targetFPS: 60,
    autoOptimize: true,
    
    // Debug controls
    showValidationErrors: false,
    enableAutoFix: true,
    logActions: false,
    
    // Time controls
    timeMultiplier: 1.0,
    pauseTime: false
  };
  
  onMount(() => {
    if (!gameManager) return;
    
    setupDebugGUI();
    startRealTimeUpdates();
    
    return () => {
      cleanup();
    };
  });
  
  onDestroy(() => {
    cleanup();
  });
  
  function setupDebugGUI() {
    gui = new GUI({ container: debugContainer });
    gui.title('🔧 MEGAMEAL Debug Panel');
    
    // === ENGINE PERFORMANCE ===
    const engineFolder = gui.addFolder('⚡ Engine Performance');
    engineFolder.add(performanceMetrics, 'fps').listen().disable();
    engineFolder.add(performanceMetrics, 'frameTime').listen().disable();
    engineFolder.add(performanceMetrics, 'memory').listen().disable();
    engineFolder.add(performanceMetrics, 'drawCalls').listen().disable();
    engineFolder.add(performanceMetrics, 'triangles').listen().disable();
    
    // === GAME STATE MANAGER ===
    const stateFolder = gui.addFolder('🎮 Game State Manager');
    stateFolder.add(gameStateMetrics, 'actionCount').listen().disable();
    stateFolder.add(gameStateMetrics, 'averageActionTime').listen().disable();
    stateFolder.add(gameStateMetrics, 'stateSize').listen().disable();
    stateFolder.add(gameStateMetrics, 'subscriberCount').listen().disable();
    stateFolder.add(gameStateMetrics, 'validationSuccessRate').listen().disable();
    
    // State controls
    stateFolder.add(controls, 'logActions').name('Log Actions').onChange(toggleActionLogging);
    stateFolder.add({ validateState: () => validateCurrentState() }, 'validateState').name('Validate State');
    stateFolder.add({ resetState: () => resetGameState() }, 'resetState').name('Reset State');
    
    // === STATE VALIDATOR ===
    const validatorFolder = gui.addFolder('✅ State Validator');
    validatorFolder.add(validationMetrics, 'totalValidations').listen().disable();
    validatorFolder.add(validationMetrics, 'successRate').listen().disable();
    validatorFolder.add(validationMetrics, 'criticalErrors').listen().disable();
    validatorFolder.add(validationMetrics, 'autoFixSuccesses').listen().disable();
    
    // Validator controls
    validatorFolder.add(controls, 'showValidationErrors').name('Show Validation Errors');
    validatorFolder.add(controls, 'enableAutoFix').name('Enable Auto-Fix');
    validatorFolder.add({ runValidation: () => runFullValidation() }, 'runValidation').name('Run Validation');
    validatorFolder.add({ autoFixState: () => autoFixCurrentState() }, 'autoFixState').name('Auto-Fix State');
    
    // === OPTIMIZATION MANAGER ===
    const optimizationFolder = gui.addFolder('🚀 Optimization Manager');
    optimizationFolder.add(optimizationMetrics, 'qualityTier').listen().disable();
    optimizationFolder.add(optimizationMetrics, 'deviceType').listen().disable();
    optimizationFolder.add(optimizationMetrics, 'targetFPS').listen().disable();
    optimizationFolder.add(optimizationMetrics, 'currentFPS').listen().disable();
    optimizationFolder.add(optimizationMetrics, 'frameDrops').listen().disable();
    
    // Optimization controls
    optimizationFolder.add(controls, 'targetFPS', 30, 120, 1).name('Target FPS').onChange(setTargetFPS);
    optimizationFolder.add(controls, 'autoOptimize').name('Auto-Optimize').onChange(toggleAutoOptimize);
    
    // === TIME TRACKER ===
    const timeFolder = gui.addFolder('⏱️ Time Tracker');
    timeFolder.add(timeMetrics, 'totalPlayTime').listen().disable();
    timeFolder.add(timeMetrics, 'sessionTime').listen().disable();
    timeFolder.add(timeMetrics, 'timeExplored').listen().disable();
    timeFolder.add(timeMetrics, 'lastUpdateInterval').listen().disable();
    
    // Time controls
    timeFolder.add(controls, 'timeMultiplier', 0.1, 5.0, 0.1).name('Time Multiplier').onChange(setTimeMultiplier);
    timeFolder.add(controls, 'pauseTime').name('Pause Time').onChange(toggleTimeTracking);
    
    // === GRAPHICS CONTROLS ===
    const graphicsFolder = gui.addFolder('🎨 Graphics');
    graphicsFolder.add(controls, 'vectorMode').name('Vector Mode').onChange(toggleVectorMode);
    graphicsFolder.add(controls, 'bloom', 0, 2, 0.1).name('Bloom').onChange(setBloom);
    graphicsFolder.add(controls, 'outlines').name('Outlines').onChange(toggleOutlines);
    
    // === LEVEL CONTROLS ===
    const levelFolder = gui.addFolder('🌟 Level Controls');
    levelFolder.add({ observatory: () => transitionToLevel('observatory') }, 'observatory').name('Observatory');
    levelFolder.add({ miranda: () => transitionToLevel('miranda') }, 'miranda').name('Miranda');
    levelFolder.add({ restaurant: () => transitionToLevel('restaurant') }, 'restaurant').name('Restaurant');
    levelFolder.add({ resetCamera: () => resetCameraView() }, 'resetCamera').name('Reset Camera');
    
    // === SAVE/LOAD CONTROLS ===
    const saveFolder = gui.addFolder('💾 Save/Load');
    saveFolder.add({ saveGame: () => saveGame() }, 'saveGame').name('Save Game');
    saveFolder.add({ loadGame: () => loadGame() }, 'loadGame').name('Load Game');
    saveFolder.add({ clearSave: () => clearSaveData() }, 'clearSave').name('Clear Save');
    
    // Start with some folders closed to reduce clutter
    stateFolder.close();
    validatorFolder.close();
    timeFolder.close();
    saveFolder.close();
  }
  
  function startRealTimeUpdates() {
    updateInterval = setInterval(() => {
      updatePerformanceMetrics();
      updateGameStateMetrics();
      updateOptimizationMetrics();
      updateValidationMetrics();
      updateTimeMetrics();
    }, 1000); // Update every second
  }
  
  function updatePerformanceMetrics() {
    if (!gameManager) return;
    
    const engine = gameManager.getEngine();
    if (!engine) return;
    
    const time = engine.getTime();
    performanceMetrics.fps = Math.round(1000 / (time.deltaTime || 16));
    performanceMetrics.frameTime = Number((time.deltaTime || 0).toFixed(2));
    
    // Memory usage (if available)
    if (performance && (performance as any).memory) {
      performanceMetrics.memory = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    
    // Renderer info (Three.js WebGLRenderer)
    const renderer = engine.getRenderer();
    if (renderer && (renderer as any).info) {
      performanceMetrics.drawCalls = (renderer as any).info.render.calls;
      performanceMetrics.triangles = (renderer as any).info.render.triangles;
    }
  }
  
  function updateGameStateMetrics() {
    if (!gameManager) return;
    
    const stateManager = gameManager.getGameStateManager();
    if (!stateManager) return;
    
    const metrics = stateManager.getPerformanceMetrics();
    gameStateMetrics.actionCount = metrics.actionCount;
    gameStateMetrics.averageActionTime = Number(metrics.averageActionTime.toFixed(2));
    gameStateMetrics.stateSize = Math.round(metrics.stateSize / 1024); // KB
    gameStateMetrics.subscriberCount = metrics.subscriberCount;
    
    // Validation success rate
    const validationStats = stateManager.getValidationStats();
    gameStateMetrics.validationSuccessRate = Number(validationStats.successRate.toFixed(1));
  }
  
  function updateOptimizationMetrics() {
    if (!gameManager) return;
    
    const engine = gameManager.getEngine();
    if (!engine) return;
    
    const optimizationManager = engine.getOptimizationManager();
    if (!optimizationManager) return;
    
    const capabilities = optimizationManager.getDeviceCapabilities();
    const level = optimizationManager.getOptimizationLevel();
    
    optimizationMetrics.qualityTier = level.graphics?.quality || 'medium';
    optimizationMetrics.deviceType = capabilities?.deviceType || 'desktop';
    optimizationMetrics.targetFPS = level.performance?.targetFPS || 60;
    optimizationMetrics.currentFPS = Math.round(1000 / (engine.getTime().deltaTime || 16));
    
    // Frame drops (simplified)
    if (optimizationMetrics.currentFPS < optimizationMetrics.targetFPS - 10) {
      optimizationMetrics.frameDrops++;
    }
  }
  
  function updateValidationMetrics() {
    if (!gameManager) return;
    
    const stateManager = gameManager.getGameStateManager();
    if (!stateManager) return;
    
    const stats = stateManager.getValidationStats();
    validationMetrics.totalValidations = stats.totalValidations;
    validationMetrics.successRate = Number(stats.successRate.toFixed(1));
    validationMetrics.criticalErrors = stats.criticalErrors;
    validationMetrics.autoFixSuccesses = stats.autoFixSuccesses;
    
    // Convert common errors map to array
    validationMetrics.commonErrors = Array.from(stats.commonErrors.entries())
      .map(([code, count]) => `${code}: ${count}`)
      .slice(0, 5); // Top 5 errors
  }
  
  function updateTimeMetrics() {
    if (!gameManager) return;
    
    const timeTracker = gameManager.getTimeTracker();
    if (!timeTracker) return;
    
    const currentTime = timeTracker.getCurrentTime();
    timeMetrics.totalPlayTime = Number((currentTime.totalPlayTime / 1000).toFixed(1));
    timeMetrics.sessionTime = Number((currentTime.totalPlayTime / 1000).toFixed(1)); // Same as total for now
    timeMetrics.timeExplored = Number((currentTime.timeExplored / 1000).toFixed(1));
    timeMetrics.lastUpdateInterval = 1000; // Default update interval
  }
  
  // Control functions
  function toggleActionLogging(enabled: boolean) {
    console.log(`Action logging ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  function validateCurrentState() {
    const stateManager = gameManager.getGameStateManager();
    const result = stateManager.validateCurrentState();
    console.log('🔍 State Validation Result:', result);
    
    if (controls.showValidationErrors && !result.isValid) {
      alert(`Validation failed with ${result.errors.length} errors:\n${result.errors.map(e => e.message).join('\n')}`);
    }
  }
  
  function resetGameState() {
    if (confirm('Are you sure you want to reset the game state?')) {
      gameManager.getGameStateManager().resetGame(true);
      console.log('🔄 Game state reset');
    }
  }
  
  function runFullValidation() {
    const stateManager = gameManager.getGameStateManager();
    const result = stateManager.validateCurrentState();
    console.log('🔍 Full Validation Result:', result);
    
    const history = stateManager.getValidationHistory();
    console.log('📜 Validation History:', history.slice(-10)); // Last 10 validations
  }
  
  function autoFixCurrentState() {
    const stateManager = gameManager.getGameStateManager();
    const fixed = stateManager.autoFixCurrentState();
    console.log(`🔧 Auto-fix ${fixed ? 'applied' : 'not needed'}`);
  }
  
  function setTargetFPS(fps: number) {
    // This would need to be implemented in OptimizationManager
    console.log(`🎯 Target FPS set to ${fps}`);
  }
  
  function toggleAutoOptimize(enabled: boolean) {
    console.log(`Auto-optimization ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  function setTimeMultiplier(multiplier: number) {
    // This would need to be implemented in TimeTracker
    console.log(`⏱️ Time multiplier set to ${multiplier}`);
  }
  
  function toggleTimeTracking(paused: boolean) {
    console.log(`Time tracking ${paused ? 'paused' : 'resumed'}`);
  }
  
  function toggleVectorMode(enabled: boolean) {
    gameManager.setVectorGraphicsMode(enabled);
    console.log(`🎨 Vector mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  function setBloom(intensity: number) {
    // This would need to be implemented in the engine
    console.log(`✨ Bloom set to ${intensity}`);
  }
  
  function toggleOutlines(enabled: boolean) {
    const engine = gameManager.getEngine();
    const outlineRenderer = engine.getOutlineRenderer();
    outlineRenderer.updateConfig({ enabled });
    console.log(`🖼️ Outlines ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  function transitionToLevel(levelId: string) {
    gameManager.transitionToLevel(levelId);
    console.log(`🌟 Transitioning to level: ${levelId}`);
  }
  
  function resetCameraView() {
    gameManager.resetView();
    console.log('📷 Camera view reset');
  }
  
  function saveGame() {
    gameManager.getGameStateManager().saveGame('manual');
    console.log('💾 Game saved');
  }
  
  function loadGame() {
    gameManager.getGameStateManager().loadGame();
    console.log('📁 Game loaded');
  }
  
  function clearSaveData() {
    if (confirm('Are you sure you want to clear all save data?')) {
      localStorage.removeItem('megameal_save');
      localStorage.removeItem('megameal_save_meta');
      console.log('🗑️ Save data cleared');
    }
  }
  
  function cleanup() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    if (gui) {
      gui.destroy();
    }
  }
</script>

<div bind:this={debugContainer} class="debug-panel"></div>

<style>
  .debug-panel {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
    font-family: 'Courier New', monospace;
    font-size: 11px;
  }
  
  /* Custom styling for lil-gui */
  :global(.lil-gui) {
    --background-color: rgba(0, 0, 0, 0.9);
    --text-color: #ffffff;
    --title-background-color: rgba(255, 255, 255, 0.1);
    --title-text-color: #ffffff;
    --widget-color: rgba(255, 255, 255, 0.1);
    --hover-color: rgba(255, 255, 255, 0.2);
    --focus-color: rgba(255, 255, 255, 0.3);
    --number-color: #00ff88;
    --string-color: #88ff00;
    --font-family: 'Courier New', monospace;
    --font-size: 11px;
    --input-font-size: 10px;
    --folder-indent: 7px;
    --scrollbar-width: 5px;
    --slider-input-width: 27%;
    --color-input-width: 27%;
    --slider-input-min-width: 45px;
    --color-input-min-width: 45px;
    --folder-indent: 7px;
    --widget-padding: 0 6px;
    --widget-border-radius: 2px;
    --checkbox-size: 16px;
    --scrollbar-width: 5px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  :global(.lil-gui .title) {
    font-weight: bold;
    text-align: center;
    padding: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 4px 4px 0 0;
  }
  
  :global(.lil-gui .folder > .title) {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-bottom: 2px;
  }
  
  :global(.lil-gui .folder > .title::before) {
    content: '';
    margin-right: 4px;
  }
</style>