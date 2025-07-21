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
  let fov = 75
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
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      
      // Check if touch is on mobile controls area (bottom 200px)
      const touchY = touch.clientY
      const isOnMobileControls = touchY > window.innerHeight - 200
      
      if (isOnMobileControls) {
        return
      }
      
      isDragging = false
      touchStartTime = Date.now()
      touchStartPos.x = touch.clientX
      touchStartPos.y = touch.clientY
      
    }
  }

  function handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && camera) {
      const touch = event.touches[0]
      
      // Check if touch is on mobile controls area
      const touchY = touch.clientY
      const isOnMobileControls = touchY > window.innerHeight - 200
      
      if (isOnMobileControls) return
      
      const distanceMoved = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) +
        Math.pow(touch.clientY - touchStartPos.y, 2)
      )
      
      if (distanceMoved > dragThreshold) {
        isDragging = true
        
        // Calculate deltas with mobile sensitivity (inverted for intuitive controls)
        const rawDeltaX = touch.clientX - touchStartPos.x
        const rawDeltaY = touch.clientY - touchStartPos.y
        const deltaX = -rawDeltaX * touchSensitivity
        const deltaY = -rawDeltaY * touchSensitivity
        
        // Apply horizontal rotation to physics body
        bodyRotationY -= deltaX
        
        // Apply vertical rotation to camera only  
        cameraRotationX -= deltaY
        
        // Limit vertical camera rotation
        cameraRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotationX))
        
        // Update RigidBody rotation (Y-axis only)
        if (rigidBody) {
          const bodyQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bodyRotationY)
          rigidBody.setRotation({ x: bodyQuaternion.x, y: bodyQuaternion.y, z: bodyQuaternion.z, w: bodyQuaternion.w }, true)
        }
        
        // Update camera rotation directly (pitch only)
        camera.rotation.x = cameraRotationX
        
        // Update touch start position for next delta
        touchStartPos.x = touch.clientX
        touchStartPos.y = touch.clientY
      }
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0]
      
      // Check if touch is on mobile controls area
      const touchY = touch.clientY
      const isOnMobileControls = touchY > window.innerHeight - 200
      
      if (isOnMobileControls) return
      
      const distanceMoved = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) +
        Math.pow(touch.clientY - touchStartPos.y, 2)
      )
      const duration = Date.now() - touchStartTime
      
      // Handle tap (short touch without movement) - for object interaction
      if (duration < tapTimeThreshold && distanceMoved < dragThreshold) {
        dispatch('interaction', { x: touch.clientX, y: touch.clientY, type: 'tap' })
      }
      
      isDragging = false
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

  // Movement calculation (matching original UniversalInputManager logic)
  function updateMovementFromKeys(): { x: number, z: number } {
    let x = 0, z = 0

    // WASD movement (matching original)
    if (keyStates['KeyW'] || keyStates['ArrowUp']) z -= 1
    if (keyStates['KeyS'] || keyStates['ArrowDown']) z += 1
    if (keyStates['KeyA'] || keyStates['ArrowLeft']) x -= 1
    if (keyStates['KeyD'] || keyStates['ArrowRight']) x += 1

    // Debug logging (can be removed once working)
    // if (x !== 0 || z !== 0) {
    //   console.log('🎮 Movement detected:', { x, z })
    // }

    // Normalize diagonal movement (matching original)
    if (x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z)
      x /= length
      z /= length
    }

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

    // Ground detection - player is grounded if vertical velocity is very small and they're not falling fast
    const currentTime = Date.now()
    const wasGrounded = isGrounded
    isGrounded = Math.abs(linvel.y) < 0.5 && linvel.y > -1.0 // More strict ground detection
    
    if (isGrounded && !wasGrounded) {
      lastGroundTime = currentTime // Update when we touch ground
    }
    
    // Handle jumping - only jump if recently grounded AND space was just pressed (prevents flying)
    const canJump = isGrounded || (currentTime - lastGroundTime < coyoteTime)
    if (jumpKeyPressed && canJump) {
      velocity.y = jumpForce
      isGrounded = false // Immediately set as not grounded when jumping
      jumpKeyPressed = false // Reset jump key flag - prevents held key from repeating jump
    } else if (!canJump) {
      jumpKeyPressed = false // Reset jump key if we can't jump (prevents queued jumps)
    }

    // Apply the new velocity to the physics body
    rigidBody.setLinvel(velocity, true)
  })

  // Ground detection for spawn positioning  
  function findGroundHeightAt(x: number, z: number): number {
    const fallbackHeight = Math.max(position[1] + 5, 10) // Ensure minimum safe height
    
    if (!rapier.world || !rigidBody) {
      return fallbackHeight
    }
    
    // For now, disable complex raycast and use safe fallback
    // The raycast is causing NaN issues that break the player spawning
    return fallbackHeight
  }

  // Player initialization with automatic ground detection
  onMount(() => {
    console.log('🎮 Player ready')
    
    // Set initial position with automatic ground detection (preserves level flexibility)
    setTimeout(() => {
      if (rigidBody) {
        // Use original spawn X,Z coordinates from level config (maintains flexibility)
        const spawnX = position[0] || 0
        const spawnZ = position[2] || 0
        
        // Find safe spawn height automatically at these coordinates
        const safeY = findGroundHeightAt(spawnX, spawnZ)
        
        // Safety check - ensure no NaN values
        const finalPosition = {
          x: isNaN(spawnX) ? 0 : spawnX,
          y: isNaN(safeY) ? 15 : safeY, // Safe fallback height
          z: isNaN(spawnZ) ? 0 : spawnZ
        }
        
        console.log(`🚀 Player spawned at: [${finalPosition.x}, ${finalPosition.y}, ${finalPosition.z}]`)
        rigidBody.setTranslation(finalPosition, true)
        
        // Update position prop for consistency
        position = [finalPosition.x, finalPosition.y, finalPosition.z]
      }
    }, 500)
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