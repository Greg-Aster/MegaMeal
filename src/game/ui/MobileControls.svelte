<!-- Mobile Virtual Controls -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let visible = false;
  
  onMount(() => {
    console.log('📱 MobileControls mounted, visible:', visible);
  });
  
  $: {
    console.log('📱 MobileControls visibility changed:', visible);
  }
  
  const dispatch = createEventDispatcher();
  
  let joystickContainer: HTMLElement;
  let joystickKnob: HTMLElement;
  let isDragging = false;
  let joystickCenter = { x: 0, y: 0 };
  let joystickRadius = 50;
  
  // Movement state
  let movementVector = { x: 0, z: 0 };
  
  function handleJoystickStart(event: TouchEvent) {
    event.preventDefault();
    isDragging = true;
    
    const rect = joystickContainer.getBoundingClientRect();
    joystickCenter.x = rect.left + rect.width / 2;
    joystickCenter.y = rect.top + rect.height / 2;
    
    updateJoystick(event.touches[0]);
  }
  
  function handleJoystickMove(event: TouchEvent) {
    if (!isDragging) return;
    event.preventDefault();
    updateJoystick(event.touches[0]);
  }
  
  function handleJoystickEnd(event: TouchEvent) {
    event.preventDefault();
    isDragging = false;
    
    // Reset joystick
    if (joystickKnob) {
      joystickKnob.style.transform = 'translate(-50%, -50%)';
    }
    
    // Stop movement
    movementVector = { x: 0, z: 0 };
    dispatch('movement', movementVector);
  }
  
  function updateJoystick(touch: Touch) {
    if (!joystickKnob) return;
    
    const deltaX = touch.clientX - joystickCenter.x;
    const deltaY = touch.clientY - joystickCenter.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Clamp to joystick radius
    const clampedDistance = Math.min(distance, joystickRadius);
    const angle = Math.atan2(deltaY, deltaX);
    
    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;
    
    // Update knob position
    joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Calculate movement vector (-1 to 1) - reduced dead zone for better responsiveness
    movementVector.x = clampedDistance > 2 ? knobX / joystickRadius : 0;
    movementVector.z = clampedDistance > 2 ? knobY / joystickRadius : 0;
    
    console.log('📱 MobileControls: Joystick movement:', movementVector);
    dispatch('movement', movementVector);
  }
  
  // Action buttons
  function handleActionPress(action: string) {
    console.log('📱 MobileControls: Action pressed:', action);
    dispatch('action', action);
  }
</script>

{#if visible}
  <div class="mobile-controls">
    <!-- Virtual Joystick -->
    <div 
      class="virtual-joystick"
      bind:this={joystickContainer}
      on:touchstart={handleJoystickStart}
      on:touchmove={handleJoystickMove}
      on:touchend={handleJoystickEnd}
    >
      <div class="joystick-base"></div>
      <div class="joystick-knob" bind:this={joystickKnob}></div>
    </div>
    
    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        class="action-btn jump-btn"
        on:touchstart={() => handleActionPress('jump')}
        on:touchend={() => handleActionPress('jump')}
      >
        ↑
      </button>
      <button 
        class="action-btn interact-btn"
        on:touchstart={() => handleActionPress('interact')}
        on:touchend={() => handleActionPress('interact')}
      >
        E
      </button>
    </div>
  </div>
{/if}

<style>
  .mobile-controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    pointer-events: none;
    z-index: 100;
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
    background: rgba(255, 255, 255, 0.2);
    border: 3px solid rgba(0, 255, 136, 0.6);
    transform: translate(-50%, -50%);
    backdrop-filter: blur(10px);
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
  }
  
  .joystick-knob {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 255, 136, 0.8);
    border: 2px solid rgba(255, 255, 255, 0.9);
    transform: translate(-50%, -50%);
    transition: none;
    backdrop-filter: blur(5px);
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
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
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-weight: bold;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    touch-action: manipulation;
    user-select: none;
  }
  
  .action-btn:active {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0.95);
  }
  
  .interact-btn {
    border-color: rgba(0, 255, 136, 0.6);
    background: rgba(0, 255, 136, 0.2);
  }
  
  .interact-btn:active {
    background: rgba(0, 255, 136, 0.4);
  }
  
  .jump-btn {
    border-color: rgba(255, 255, 0, 0.6);
    background: rgba(255, 255, 0, 0.2);
    font-size: 24px;
  }
  
  .jump-btn:active {
    background: rgba(255, 255, 0, 0.4);
  }
</style>