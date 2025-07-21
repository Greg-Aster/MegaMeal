# MEGAMEAL Game Design Document
## Threlte-Based 3D Web Game

**Version:** 2.0 (Post-Threlte Migration)  
**Date:** July 2025  
**Engine:** Threlte + Svelte 5 + Rapier Physics  

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Architecture](#technical-architecture)
3. [Player Control System](#player-control-system)
4. [Level System](#level-system)
5. [Physics and Movement](#physics-and-movement)
6. [State Management](#state-management)
7. [Rendering Pipeline](#rendering-pipeline)
8. [Performance Optimization](#performance-optimization)
9. [Mobile Support](#mobile-support)
10. [File Structure](#file-structure)

---

## Overview

MEGAMEAL is a first-person 3D exploration game built using modern web technologies. The game features multiple interconnected levels including an observatory, spaceship, restaurant, infinite library, and personal room environments. Players explore these spaces through immersive first-person controls with full WASD + mouse look functionality.

### Core Features
- **First-Person Movement**: WASD + mouse look controls with physics-based movement
- **Multiple Levels**: Observatory, Miranda Spaceship, Restaurant, Infinite Library, Jerry's Room
- **Timeline Integration**: Interactive star map and timeline system
- **Cross-Platform**: Desktop and mobile support with adaptive controls
- **Performance Optimized**: LOD system, automatic quality adjustment, mobile optimization

---

## Technical Architecture

### Core Technologies
- **Threlte**: Declarative 3D framework for Svelte
- **Svelte 5**: Reactive UI framework with modern stores
- **Rapier3D**: Physics engine for realistic movement and collisions
- **Three.js**: Underlying 3D engine (via Threlte)
- **Astro**: Static site generator with component islands

### Migration from Three.js
The game was completely migrated from imperative Three.js code to declarative Threlte components:

**Before (Three.js):**
```javascript
// Imperative camera setup
camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000)
camera.position.set(0, 5, 10)
scene.add(camera)
```

**After (Threlte):**
```svelte
<!-- Declarative camera setup -->
<T.PerspectiveCamera 
  bind:ref={camera}
  position={[0, 1.6, 0]}
  fov={75} 
  near={0.1} 
  far={2000} 
  makeDefault
/>
```

---

## Player Control System

### Input Handling
The player control system (`src/threlte/components/Player.svelte`) provides modern first-person controls:

#### Desktop Controls
- **Movement**: WASD or Arrow Keys
- **Look**: Click + Drag mouse movement
- **Jump**: Spacebar (with anti-fly protection)
- **Sprint**: Hold Shift while moving
- **Interaction**: Click on objects

#### Mobile Controls
- **Movement**: Virtual joystick (bottom area of screen)
- **Look**: Touch and drag (upper area of screen)
- **Jump**: Tap jump button
- **Interaction**: Tap on objects

### Anti-Exploit Features
```typescript
// Jump key press detection prevents flying
if (event.code === 'Space' && !keyStates['Space']) {
  jumpKeyPressed = true
}

// Ground detection with coyote time
const canJump = isGrounded || (currentTime - lastGroundTime < coyoteTime)
if (jumpKeyPressed && canJump) {
  velocity.y = jumpForce
  jumpKeyPressed = false // Prevents held key from repeating jump
}
```

### Movement Physics
```typescript
// Corrected velocity handling (prevents feedback loop)
velocity.set(0, linvel.y, 0) // Only preserve gravity, not horizontal velocity

// Transform local movement to world space
const localMovement = new THREE.Vector3(movement.x * moveSpeed, 0, movement.z * moveSpeed)
localMovement.applyQuaternion(quaternion)
velocity.x = localMovement.x
velocity.z = localMovement.z
```

---

## Level System

### Available Levels

#### 1. Observatory (`src/threlte/levels/Observatory.svelte`)
- **Purpose**: Main hub with interactive star map
- **Features**: Telescope interaction, star selection, timeline navigation
- **Key Objects**: Star field, telescope, navigation controls

#### 2. Miranda Spaceship (`src/threlte/levels/Miranda.svelte`)
- **Purpose**: Futuristic spaceship environment
- **Features**: Debris analysis, terminal access, ship systems
- **Key Objects**: Command terminals, analysis equipment, ship corridors

#### 3. Restaurant (`src/threlte/levels/Restaurant.svelte`)
- **Purpose**: Kitchen/restaurant back-room environment
- **Features**: Equipment interaction, secret discovery
- **Key Objects**: Kitchen equipment, storage areas, hidden passages

#### 4. Infinite Library (`src/threlte/levels/InfiniteLibrary.svelte`)
- **Purpose**: Endless library with knowledge systems
- **Features**: Bookshelf examination, knowledge access, portal system
- **Key Objects**: Bookshelves, reading terminals, interdimensional portals

#### 5. Jerry's Room (`src/threlte/levels/JerrysRoom.svelte`)
- **Purpose**: Personal workspace environment
- **Features**: Computer access, desk interaction, room exploration
- **Key Objects**: Multiple screens, desk setup, personal items

### Level Transition System
```typescript
// Store-based level transitions
const levelMap = {
  'miranda-ship-level': 'miranda',
  'restaurant-backroom-level': 'restaurant',
  'infinite-library-level': 'infinite_library',
}

function handleLevelTransition(event) {
  const levelId = levelMap[event.detail.levelType] || event.detail.levelType
  gameActions.transitionToLevel(levelId)
}
```

---

## Physics and Movement

### Rigid Body Setup
```svelte
<RigidBody
  bind:rigidBody
  type="dynamic"
  enabledRotations={[false, true, false]} <!-- Only Y-axis rotation -->
  gravityScale={1}
>
  <Collider 
    shape="capsule" 
    args={[0.3, 0.8]}
    friction={0.2}
    restitution={0}
  />
</RigidBody>
```

### Ground Detection
```typescript
// Strict ground detection prevents false positives
isGrounded = Math.abs(linvel.y) < 0.5 && linvel.y > -1.0

// Coyote time allows jump shortly after leaving ground
const coyoteTime = 100 // milliseconds
const canJump = isGrounded || (currentTime - lastGroundTime < coyoteTime)
```

### Camera-Body Relationship
The camera is now a child of the RigidBody, ensuring that:
- Eyes and body rotate together
- No camera desync issues
- Proper physics-based movement
- Realistic first-person perspective

---

## State Management

### Reactive Store System
Replaced the old event-bus system with modern Svelte stores:

```typescript
// Game state stores (src/threlte/stores/gameStateStore.ts)
export const currentLevelStore = writable('observatory')
export const selectedStarStore = writable<StarData | null>(null)
export const gameStatsStore = writable(defaultGameStats)
export const isMobileStore = writable(false)
export const isLoadingStore = writable(false)
export const errorStore = writable<string | null>(null)
export const dialogueStore = writable(defaultDialogue)

// Action creators for state updates
export const gameActions = {
  transitionToLevel: (levelId: string) => {
    currentLevelStore.set(levelId)
    gameSessionStore.update(session => ({
      ...session,
      levelsVisited: [...new Set([...session.levelsVisited, levelId])]
    }))
  },
  selectStar: (star: StarData) => selectedStarStore.set(star),
  setLoading: (loading: boolean) => isLoadingStore.set(loading),
  // ... more actions
}
```

### Reactive Updates
```svelte
<!-- Automatic reactivity in components -->
$: currentLevel = $currentLevelStore
$: selectedStar = $selectedStarStore
$: gameStats = $gameStatsStore
```

---

## Rendering Pipeline

### Post-Processing System
Migrated from Three.js EffectComposer to native Threlte lighting:

```svelte
<!-- Native Threlte lighting (src/threlte/systems/SimplePostProcessing.svelte) -->
<T.AmbientLight intensity={0.3} color="#ffffff" />
<T.DirectionalLight 
  position={[10, 10, 5]} 
  intensity={0.8}
  color="#ffffff"
  castShadow={true}
/>
<T.PointLight 
  position={[0, 5, 0]} 
  intensity={0.4}
  color="#ffa366"
  distance={20}
/>
```

### Visual Debug Elements
```svelte
<!-- Glowing wisp for player position debugging -->
<T.Mesh position={[0, 2, 0]}>
  <T.SphereGeometry args={[0.3, 16, 16]} />
  <T.MeshBasicMaterial color="#00ff88" />
</T.Mesh>

<T.PointLight 
  position={[0, 2, 0]} 
  color="#00ff88" 
  intensity={2} 
  distance={10}
/>
```

---

## Performance Optimization

### LOD (Level of Detail) System
```svelte
<LOD 
  enableLOD={true}
  maxDistance={100}
  updateFrequency={0.1}
  enableCulling={true}
  on:lodLevelChanged={(e) => dispatch('lodLevelChanged', e.detail)}
/>
```

### Automatic Quality Adjustment
```typescript
// Performance-based quality adjustment
on:performanceUpdate={(e) => {
  if (e.detail.averageFPS) {
    adjustQualityForPerformance(e.detail.averageFPS, 60)
  }
}}
```

### Mobile Optimizations
```typescript
// Mobile-specific settings
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
)

// Reduced quality for mobile
$: mobileExposure = isMobile ? toneMappingExposure * 0.9 : toneMappingExposure
```

---

## Mobile Support

### Touch Controls
```typescript
// Touch area detection
const touchY = touch.clientY
const isOnMobileControls = touchY > window.innerHeight - 200

// Mobile-specific sensitivity
const touchSensitivity = 0.0012
const deltaX = -rawDeltaX * touchSensitivity
const deltaY = -rawDeltaY * touchSensitivity
```

### Responsive UI
- Virtual joystick for movement
- Touch and drag for camera look
- Tap interactions for objects
- Automatic UI scaling
- Performance-optimized rendering

---

## File Structure

```
src/threlte/
├── components/
│   └── Player.svelte              # First-person controller
├── systems/
│   ├── SimplePostProcessing.svelte # Native lighting effects
│   ├── Physics.svelte             # Physics world setup
│   ├── EventBus.svelte           # Event coordination
│   ├── Performance.svelte        # Performance monitoring
│   └── StateManager.svelte       # Legacy state bridge
├── stores/
│   ├── gameStateStore.ts         # Reactive game state
│   └── postProcessingStore.ts    # Rendering configuration
├── levels/
│   ├── Observatory.svelte        # Star map hub
│   ├── Miranda.svelte            # Spaceship level
│   ├── Restaurant.svelte         # Kitchen environment
│   ├── InfiniteLibrary.svelte    # Library level
│   └── JerrysRoom.svelte         # Personal room
├── ui/
│   └── PerformancePanel.svelte   # Debug performance info
└── Game.svelte                   # Main game container
```

### Legacy Integration
```
src/game/                         # Legacy Three.js components (preserved)
├── ui/                          # Existing UI components
├── systems/                     # Old imperative systems
└── levels/                      # Old level definitions
```

---

## Key Implementation Details

### Critical Bug Fixes Applied

1. **Velocity Feedback Loop**: Fixed movement cancellation by changing `velocity.set(linvel.x, linvel.y, linvel.z)` to `velocity.set(0, linvel.y, 0)`

2. **Camera Desync**: Made camera a child of RigidBody to ensure body and eyes rotate together

3. **Jump Flying Exploit**: Added `jumpKeyPressed` flag to prevent infinite jumping with held Spacebar

4. **Post-Processing Freeze**: Removed Three.js EffectComposer dependencies and implemented native Threlte lighting

### Performance Characteristics
- **Load Time**: ~2-3 seconds (significantly improved from original)
- **Frame Rate**: 60 FPS target with automatic quality adjustment
- **Memory Usage**: Optimized with LOD and culling systems
- **Mobile Performance**: Automatically reduced quality for mobile devices

### Future Expansion Points
- Additional levels can be added to `src/threlte/levels/`
- New systems can be added to `src/threlte/systems/`
- Store-based state management allows easy feature additions
- Component-based architecture supports modular development

---

This document represents the current state of the MEGAMEAL game after successful migration to the Threlte framework, providing a modern, performant, and maintainable 3D web gaming experience.