<!--
  Player Component - Modern First-Person Controller
  
  CRITICAL ARCHITECTURE NOTES:
  =============================================================================
  This component implements first-person controls using Threlte + Rapier physics.
  The implementation resolves the "spinning player" bug through careful separation
  of movement (velocity-based) and rotation (position-based) systems.
  
  KEY PRINCIPLES:
  1. Movement = setLinvel() - Physics-friendly velocity updates
  2. Rotation = setRotation() - Direct position control for mouse look
  3. Angular Velocity = Always locked to prevent physics interference
  
  PHYSICS ISSUE BACKGROUND:
  The capsule collider generates unwanted rotational forces when hitting trimesh
  geometry (walls, slopes, complex ground). These micro-rotations accumulate,
  causing circular movement. The solution aggressively locks angular velocity
  while allowing controlled rotation via setRotation().
  
  See: /src/threlte/docs/MOVEMENT_SYSTEM.md for detailed documentation
  =============================================================================
-->
<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { Collider, RigidBody, type RigidBodyApi, useRapier } from '@threlte/rapier'
  import { onMount, createEventDispatcher } from 'svelte'
  import * as THREE from 'three'

  const dispatch = createEventDispatcher()
  const rapier = useRapier()

  // Props
  export let position: [number, number, number] = [0, 10, 0]
  export let speed = 5
  export let jumpForce = 8
  export let mouseSensitivity = 0.002 // Matching original UniversalInputManager

  // Player state
  let rigidBody: RigidBodyApi
  let camera: THREE.PerspectiveCamera
  let fov = 60
  let near = 0.1
  let far = 2000

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  // Keyboard movement state (matching original UniversalInputManager)
  const keyStates: { [key: string]: boolean } = {}

  // Vectors for movement calculation
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()

  // Ground detection for proper jumping
  let isGrounded = false
  let lastGroundTime = 0
  let jumpKeyPressed = false // Track if jump key was just pressed (not held)
  const coyoteTime = 100 // ms - allows jump shortly after leaving ground

  // Mouse movement (click-and-drag style like original)
  let isMouseDown = false
  let lastMouseX = 0
  let lastMouseY = 0
  
  // Separate camera and body rotation
  let bodyRotationY = 0  // Only Y-axis rotation for physics body
  let cameraRotationX = 0  // Pitch (looking up/down) for camera only

  // Touch handling (from original UniversalInputManager)
  let touchStartTime = 0
  let touchStartPos = { x: 0, y: 0 }
  let isDragging = false
  const dragThreshold = 5 // pixels
  const tapTimeThreshold = 500 // milliseconds
  const touchSensitivity = 0.0012 // Mobile sensitivity
  let lookTouchIdentifier: number | null = null;

  // Handle keyboard input (matching original UniversalInputManager)
  function handleKeydown(event: KeyboardEvent) {
    // Prevent default for movement keys to avoid page scrolling
    if ([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'
    ].includes(event.code)) {
      event.preventDefault()
    }

    // Track if Space key was just pressed (not held down)
    if (event.code === 'Space' && !keyStates['Space']) {
      jumpKeyPressed = true
    }

    keyStates[event.code] = true
  }

  function handleKeyup(event: KeyboardEvent) {
    keyStates[event.code] = false
    
    // Reset jump flag when Space is released (extra safety)
    if (event.code === 'Space') {
      jumpKeyPressed = false
    }
  }

  // Handle mouse down/up events (original click-and-drag style)
  function handleMouseDown(event: MouseEvent) {
    isMouseDown = true
    lastMouseX = event.clientX
    lastMouseY = event.clientY
    dispatch('lock')
  }

  function handleMouseUp(event: MouseEvent) {
    const wasMouseDown = isMouseDown
    isMouseDown = false
    dispatch('unlock')
    
    // If this was a quick click without much movement, treat as interaction
    const deltaX = Math.abs(event.clientX - lastMouseX)
    const deltaY = Math.abs(event.clientY - lastMouseY)
    if (wasMouseDown && deltaX < 5 && deltaY < 5) {
      dispatch('interaction', { x: event.clientX, y: event.clientY, type: 'click' })
    }
  }

  // Touch event handlers (ported from UniversalInputManager)
  function handleTouchStart(event: TouchEvent) {
    // Loop through all new touches that just started
    for (const touch of Array.from(event.changedTouches)) {
      // Ignore any touch that starts in the mobile controls area
      const isOnMobileControls = touch.clientY > window.innerHeight - 200;
      if (isOnMobileControls) {
        continue; // Skip to the next touch
      }

      // If no finger is currently controlling the look, assign this new one
      if (lookTouchIdentifier === null) {
        lookTouchIdentifier = touch.identifier;
        lastMouseX = touch.clientX;
        lastMouseY = touch.clientY;
        touchStartPos.x = touch.clientX;
        touchStartPos.y = touch.clientY;
        touchStartTime = Date.now();
      }
    }
  }

  function handleTouchMove(event: TouchEvent) {
    // If no finger is assigned to look, do nothing
    if (lookTouchIdentifier === null || !rigidBody || !camera) return;

    // Find the finger that is moving and matches our look finger
    const lookTouch = Array.from(event.changedTouches).find(
      (t) => t.identifier === lookTouchIdentifier
    );

    // If our look finger isn't in the list of moved fingers, do nothing
    if (!lookTouch) return;

    const deltaX = lookTouch.clientX - lastMouseX;
    const deltaY = lookTouch.clientY - lastMouseY;

    // Apply rotation using mobile sensitivity
    bodyRotationY -= deltaX * touchSensitivity;
    cameraRotationX -= deltaY * touchSensitivity;
    cameraRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotationX));

    // Update RigidBody rotation (Y-axis only)
    const bodyQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bodyRotationY)
    rigidBody.setRotation({ x: bodyQuaternion.x, y: bodyQuaternion.y, z: bodyQuaternion.z, w: bodyQuaternion.w }, true)
    
    // Update camera rotation directly (pitch only)
    camera.rotation.x = cameraRotationX

    // Update last positions for the next movement calculation
    lastMouseX = lookTouch.clientX;
    lastMouseY = lookTouch.clientY;
  }

  function handleTouchEnd(event: TouchEvent) {
    // Check if the finger that was lifted is the one we were using to look
    const touchEnded = Array.from(event.changedTouches).find(
      (t) => t.identifier === lookTouchIdentifier
    );

    if (touchEnded) {
      // Check if this was a tap (short touch without movement)
      const distanceMoved = Math.sqrt(
        Math.pow(touchEnded.clientX - touchStartPos.x, 2) +
        Math.pow(touchEnded.clientY - touchStartPos.y, 2)
      );
      const duration = Date.now() - touchStartTime;
      
      // Handle tap (short touch without movement) - for object interaction
      if (duration < tapTimeThreshold && distanceMoved < dragThreshold) {
        dispatch('interaction', { x: touchEnded.clientX, y: touchEnded.clientY, type: 'tap' });
      }
      
      // Release the look control so another finger can take over
      lookTouchIdentifier = null;
    }
  }

  // Handle mouse movement for camera look (FIXED: Separate camera and body rotation)
  function handleMouseMove(event: MouseEvent) {
    if (!isMouseDown || !rigidBody || !camera) return

    const deltaX = event.clientX - lastMouseX
    const deltaY = event.clientY - lastMouseY

    // Apply horizontal rotation to physics body (Y-axis only)
    bodyRotationY -= deltaX * mouseSensitivity
    
    // Apply vertical rotation to camera only (X-axis only)
    cameraRotationX -= deltaY * mouseSensitivity
    
    // Limit vertical camera rotation
    cameraRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotationX))

    // Update RigidBody rotation (Y-axis only - no pitch)
    const bodyQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bodyRotationY)
    rigidBody.setRotation({ x: bodyQuaternion.x, y: bodyQuaternion.y, z: bodyQuaternion.z, w: bodyQuaternion.w }, true)
    
    // Update camera rotation directly (pitch only)
    camera.rotation.x = cameraRotationX
    
    // Update last mouse position
    lastMouseX = event.clientX
    lastMouseY = event.clientY
  }

  // No special click handler needed - using mousedown/mouseup instead

  // Import Threlte-native mobile controls store
  import { mobileInputStore } from '../stores/mobileInputStore'
  
  // Mobile movement state (now reactive from store)
  let mobileMovement = { x: 0, z: 0 }
  let mobileJumpPressed = false
  
  // Subscribe to reactive mobile input store
  $: if ($mobileInputStore) {
    mobileMovement = $mobileInputStore.movement
    
    // Handle actions
    if ($mobileInputStore.actionPressed === 'jump') {
      mobileJumpPressed = true
    }
  }

  // Movement calculation (matching original UniversalInputManager logic)
  function updateMovementFromKeys(): { x: number, z: number } {
    let x = 0, z = 0

    // Desktop: WASD movement (matching original)
    if (!isMobile) {
      if (keyStates['KeyW'] || keyStates['ArrowUp']) z -= 1
      if (keyStates['KeyS'] || keyStates['ArrowDown']) z += 1
      if (keyStates['KeyA'] || keyStates['ArrowLeft']) x -= 1
      if (keyStates['KeyD'] || keyStates['ArrowRight']) x += 1
    } else {
      // Mobile: Use joystick input (input throttling handled in MobileControls)
      x = mobileMovement.x
      z = mobileMovement.z
    }

    // Normalize diagonal movement (matching original) - only for WASD binary input
    if (!isMobile && x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z)
      x /= length
      z /= length
    }
    // Mobile joystick input is already normalized, don't normalize again

    return { x, z }
  }

  // =============================================================================
  // PHYSICS UPDATE LOOP - CRITICAL MOVEMENT IMPLEMENTATION
  // =============================================================================
  // This function runs every frame and implements the core movement system.
  // The separation of movement (velocity) and rotation (position) here is what
  // prevents the "spinning player" bug. DO NOT modify without understanding
  // the physics collision issues documented in MOVEMENT_SYSTEM.md
  // =============================================================================
  useTask(() => {
    if (!rigidBody) {
      console.log('⚠️ Missing RigidBody')
      return
    }
    
    // =============================================================================
    // AUTHORITATIVE ROTATION CONTROL - "Chain of Command" Pattern
    // =============================================================================
    // Set rotation every frame from our state variables, making input the single
    // source of truth and overriding any physics-induced rotation noise.
    const bodyQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bodyRotationY)
    rigidBody.setRotation(bodyQuaternion, true)
    
    // Update camera pitch directly from state
    if (camera) camera.rotation.x = cameraRotationX

    // =============================================================================
    // MOVEMENT CALCULATION (Velocity-Based)
    // =============================================================================
    // Get current velocity from the physics body
    const linvel = rigidBody.linvel()
    
    // Only preserve Y velocity (gravity), reset X/Z to prevent feedback loops
    velocity.set(0, linvel.y, 0)

    // Get movement input
    const movement = updateMovementFromKeys()

    // Apply movement if there's input
    if (movement.z !== 0 || movement.x !== 0) {
      // Debug mobile vs desktop movement values (throttled logging)
      if (isMobile && Math.random() < 0.01) { // Only log 1% of the time to reduce console spam
        console.log(`📱 Mobile movement: x=${movement.x.toFixed(3)}, z=${movement.z.toFixed(3)}`)
      }
      
      const moveSpeed = keyStates['ShiftLeft'] || keyStates['ShiftRight'] ? speed * 2 : speed
      
      // Get RigidBody's current rotation to transform local movement to world space
      const rotation = rigidBody.rotation()
      const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      
      // Create local movement vector
      const localMovement = new THREE.Vector3(movement.x * moveSpeed, 0, movement.z * moveSpeed)
      
      // Transform to world space using RigidBody rotation
      localMovement.applyQuaternion(quaternion)
      
      // Movement calculation complete
      
      // Apply world-space velocity (now won't be overridden by old velocity)
      velocity.x = localMovement.x
      velocity.z = localMovement.z
      
      // Movement applied successfully
    }
    // If no input, velocity.x and velocity.z remain 0 (stopping movement)

    // Ground detection - more forgiving for slopes and hills
    const currentTime = Date.now()
    const wasGrounded = isGrounded
    // Allow jumping on slopes - less strict about vertical velocity
    isGrounded = Math.abs(linvel.y) < 2.0 && linvel.y > -3.0
    
    if (isGrounded && !wasGrounded) {
      lastGroundTime = currentTime // Update when we touch ground
    }
    
    // Handle jumping - desktop (spacebar) or mobile (jump button)
    const canJump = isGrounded || (currentTime - lastGroundTime < coyoteTime)
    const wantsToJump = jumpKeyPressed || mobileJumpPressed
    
    // Debug jumping issues
    if (wantsToJump && !canJump) {
      console.log(`❌ Jump blocked - isGrounded: ${isGrounded}, linvel.y: ${linvel.y.toFixed(3)}, timeSinceGround: ${currentTime - lastGroundTime}ms`)
    }
    
    if (wantsToJump && canJump) {
      console.log(`✅ Jump! - isGrounded: ${isGrounded}, linvel.y: ${linvel.y.toFixed(3)}`)
      velocity.y = jumpForce
      isGrounded = false // Immediately set as not grounded when jumping
      jumpKeyPressed = false // Reset jump flags
      mobileJumpPressed = false
    } else if (!canJump) {
      jumpKeyPressed = false // Reset jump keys if we can't jump (prevents queued jumps)
      mobileJumpPressed = false
    }

    // Apply the new velocity to the physics body
    rigidBody.setLinvel(velocity, true)
  })

  // Spawn function for ECS SpawnSystem to use
  export function spawnAt(x: number, y: number, z: number) {
    if (!rigidBody) {
      console.warn('⚠️ Cannot spawn player - rigid body not ready')
      return
    }
    
    console.log(`🚀 Spawning player at: [${x}, ${y}, ${z}]`)
    rigidBody.setTranslation({ x, y, z }, true)
    rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true) // Stop any movement
    
    // Update position prop for consistency
    position = [x, y, z]
  }

  // Player initialization
  onMount(() => {
    console.log('🎮 Player component ready - awaiting ECS SpawnSystem')
  })
</script>

<!-- Listen for keyboard, mouse, and touch events (original style) -->
<svelte:window 
  on:keydown={handleKeydown} 
  on:keyup={handleKeyup}
  on:mousemove={handleMouseMove}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
/>

<!-- 
  The player is a RigidBody with a capsule shape, which is standard for characters.
  The camera is a child of this body, so it moves with it.
-->
<RigidBody
  bind:rigidBody
  type="dynamic"
  enabledRotations={[false, true, false]}
  gravityScale={1}
  linearDamping={isMobile ? 0.1 : 0.0}
  angularDamping={isMobile ? 0.2 : 0.0}
  userData={{ isPlayer: true, type: 'player' }}
>
  <!-- The player's physical shape - capsule collider for smooth movement -->
  <Collider 
    shape="capsule" 
    args={[0.3, 0.8]}
    friction={0.2}
    restitution={0}
  />


  <!-- FIXED: Camera handles pitch only - body handles yaw -->
  <T.PerspectiveCamera 
    bind:ref={camera}
    position={[0, 1.6, 0]}
    rotation={[cameraRotationX, 0, 0]}
    {fov} 
    {near} 
    {far} 
    makeDefault
  />
</RigidBody>

<style>
  /* No styles needed - this is a headless component */
</style>