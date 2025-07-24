<!--
  Modern Threlte-Native Mobile Controls
  
  Uses reactive stores for seamless integration with Player component.
  Eliminates legacy DOM conflicts and provides unified input handling.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { mobileInputStore } from '../stores/mobileInputStore'

  // Joystick state
  let joystickContainer: HTMLElement
  let joystickKnob: HTMLElement
  let isDragging = false
  let joystickCenter = { x: 0, y: 0 }
  const joystickRadius = 50

  // Touch tracking
  let activeTouchId: number | null = null
  
  // Delta-based movement (like smooth look-around system)
  let lastTouchX = 0
  let lastTouchY = 0
  let accumulatedMovement = { x: 0, z: 0 }
  const movementSensitivity = 0.008 // Similar to touchSensitivity in Player
  const movementDecay = 0.85 // How quickly movement decays when touch stops
  
  // Update throttling
  let lastUpdateTime = 0
  const updateThrottle = 16 // ~60fps
  
  function handleJoystickStart(event: TouchEvent) {
    event.preventDefault()
    event.stopPropagation()
    
    if (activeTouchId !== null) return // Already tracking a touch
    
    const touch = event.changedTouches[0]
    activeTouchId = touch.identifier
    isDragging = true

    // Initialize delta tracking (like look-around system)
    lastTouchX = touch.clientX
    lastTouchY = touch.clientY
    
    const rect = joystickContainer.getBoundingClientRect()
    joystickCenter.x = rect.left + rect.width / 2
    joystickCenter.y = rect.top + rect.height / 2
    
    // Update store
    mobileInputStore.update(state => ({
      ...state,
      isJoystickActive: true
    }))
  }

  function handleJoystickMove(event: TouchEvent) {
    if (!isDragging || activeTouchId === null) return
    
    event.preventDefault()
    event.stopPropagation()

    // Throttle updates like look-around system
    const now = performance.now()
    if (now - lastUpdateTime < updateThrottle) return
    lastUpdateTime = now

    // Find the specific touch we're tracking
    const touch = Array.from(event.changedTouches).find(
      t => t.identifier === activeTouchId
    )
    
    if (touch) {
      // Delta-based movement (like smooth look-around)
      const deltaX = touch.clientX - lastTouchX
      const deltaY = touch.clientY - lastTouchY
      
      // Apply delta to accumulated movement (like look-around applies to rotation)
      accumulatedMovement.x += deltaX * movementSensitivity
      accumulatedMovement.z += deltaY * movementSensitivity
      
      // Clamp accumulated movement to reasonable bounds
      accumulatedMovement.x = Math.max(-1, Math.min(1, accumulatedMovement.x))
      accumulatedMovement.z = Math.max(-1, Math.min(1, accumulatedMovement.z))
      
      // Update visual joystick knob position
      updateJoystickVisuals()
      
      // Update store with accumulated movement
      mobileInputStore.update(state => ({
        ...state,
        movement: { ...accumulatedMovement }
      }))
      
      // Update last position for next delta calculation
      lastTouchX = touch.clientX
      lastTouchY = touch.clientY
    }
  }

  function handleJoystickEnd(event: TouchEvent) {
    if (activeTouchId === null) return
    
    // Check if our tracked touch ended
    const touchEnded = Array.from(event.changedTouches).find(
      t => t.identifier === activeTouchId
    )
    
    if (touchEnded) {
      event.preventDefault()
      event.stopPropagation()
      
      isDragging = false
      activeTouchId = null

      // Movement will decay naturally through continuous update loop
      // Reset joystick visually
      if (joystickKnob) {
        joystickKnob.style.transform = 'translate(-50%, -50%)'
      }

      // Update store - joystick no longer active
      mobileInputStore.update(state => ({
        ...state,
        isJoystickActive: false
      }))
    }
  }

  // Update visual joystick knob position based on accumulated movement
  function updateJoystickVisuals() {
    if (!joystickKnob) return
    
    // Convert normalized movement (-1 to 1) to knob position
    const knobX = accumulatedMovement.x * joystickRadius
    const knobY = accumulatedMovement.z * joystickRadius
    
    // Update knob position
    joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`
  }
  
  // Continuous update loop for movement decay (like look-around maintains state)
  function continuousUpdate() {
    if (!isDragging) {
      // Apply decay when not actively dragging (natural movement fade)
      accumulatedMovement.x *= movementDecay
      accumulatedMovement.z *= movementDecay
      
      // Stop very small movements to prevent endless micro-movements
      if (Math.abs(accumulatedMovement.x) < 0.01) accumulatedMovement.x = 0
      if (Math.abs(accumulatedMovement.z) < 0.01) accumulatedMovement.z = 0
      
      // Update store with decayed movement
      mobileInputStore.update(state => ({
        ...state,
        movement: { ...accumulatedMovement }
      }))
      
      // Update visual knob position
      updateJoystickVisuals()
    }
    
    // Continue the update loop
    requestAnimationFrame(continuousUpdate)
  }

  function handleActionPress(action: string, event: TouchEvent) {
    event.preventDefault()
    event.stopPropagation()
    
    mobileInputStore.update(state => ({
      ...state,
      actionPressed: action
    }))

    // Clear action after brief delay
    setTimeout(() => {
      mobileInputStore.update(state => ({
        ...state,
        actionPressed: null
      }))
    }, 100)
  }

  // Global touch handlers to prevent conflicts
  function handleGlobalTouchStart(event: TouchEvent) {
    // Only prevent touches that are actually on game control elements
    const touch = event.touches[0]
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
    
    // Check if the touch is on a game control element
    const isOnGameControl = target?.closest('.mobile-control') || 
                           target?.closest('.joystick') || 
                           target?.closest('[data-game-control]')
    
    if (!isOnGameControl) return
    
    // Only prevent default for actual game controls
    event.preventDefault()
  }

  onMount(() => {
    // Add global touch prevention for mobile control area
    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: false })
    
    // Start continuous update loop (like look-around maintains state)
    continuousUpdate()
    
    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart)
    }
  })
</script>

<!-- Modern Mobile Controls - Regular DOM positioned outside Canvas -->
<div class="threlte-mobile-controls">
  <!-- Virtual Joystick -->
  <div 
    class="virtual-joystick"
    bind:this={joystickContainer}
    on:touchstart={handleJoystickStart}
    on:touchmove={handleJoystickMove}
    on:touchend={handleJoystickEnd}
    role="button"
    tabindex="0"
    aria-label="Movement joystick"
  >
    <div class="joystick-base"></div>
    <div class="joystick-knob" bind:this={joystickKnob}></div>
  </div>
  
  <!-- Action Buttons -->
  <div class="action-buttons">
    <button 
      class="action-btn jump-btn"
      on:touchstart={(e) => handleActionPress('jump', e)}
      aria-label="Jump"
    >
      JUMP
    </button>
    <button 
      class="action-btn interact-btn"
      on:touchstart={(e) => handleActionPress('interact', e)}
      aria-label="Interact"
    >
      E
    </button>
  </div>
</div>

<style>
  .threlte-mobile-controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    pointer-events: none;
    z-index: 1000;
    font-family: 'Courier New', monospace;
  }
  
  .virtual-joystick {
    position: absolute;
    bottom: 30px;
    left: 30px;
    width: 100px;
    height: 100px;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
  }
  
  .joystick-base {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(0, 255, 136, 0.4);
    transform: translate(-50%, -50%);
    backdrop-filter: blur(10px);
    box-shadow: 
      0 0 20px rgba(0, 255, 136, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .joystick-knob {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background: rgba(0, 255, 136, 0.7);
    border: 2px solid rgba(255, 255, 255, 0.8);
    transform: translate(-50%, -50%);
    transition: none;
    backdrop-filter: blur(5px);
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
  }
  
  .action-buttons {
    position: absolute;
    bottom: 30px;
    right: 30px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    pointer-events: auto;
  }
  
  .action-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    touch-action: manipulation;
    user-select: none;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .action-btn:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
  
  .interact-btn {
    border-color: rgba(0, 255, 136, 0.4);
    background: rgba(0, 255, 136, 0.1);
  }
  
  .interact-btn:active {
    background: rgba(0, 255, 136, 0.3);
  }
  
  .jump-btn {
    border-color: rgba(255, 255, 0, 0.4);
    background: rgba(255, 255, 0, 0.1);
    font-size: 11px;
  }
  
  .jump-btn:active {
    background: rgba(255, 255, 0, 0.3);
  }

  /* Responsive adjustments */
  @media (max-height: 600px) {
    .threlte-mobile-controls {
      height: 150px;
    }
    
    .virtual-joystick,
    .action-buttons {
      bottom: 20px;
    }
  }
</style>