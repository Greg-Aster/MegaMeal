# Three.js to Threlte Migration Plan

## Current Architecture Analysis

Your game engine is a sophisticated Three.js-based system with these key components:

### Core Engine (`src/engine/`)
- **Engine.ts**: Main orchestration class with singleton pattern
- **Renderer.ts**: Advanced renderer with post-processing pipeline (Bloom, SSAO, FXAA, ToneMapping)
- **PhysicsWorld.ts**: Rapier3D physics integration
- **AudioManager.ts**: Audio system management
- **OptimizationManager.ts**: Performance optimization with mobile detection
- **Scene.ts, Camera.ts**: Core Three.js scene management

### Game Layer (`src/game/`)
- **GameManager.ts**: High-level game orchestration
- **LevelManager.ts**: Level loading and transitions
- **GameStateManager.ts**: Centralized state management
- **InteractionSystem.ts**: Object interaction handling
- **Multiple Level Systems**: Observatory, Restaurant, Library levels

### Performance Features
- Mobile-aware rendering with reduced resolution scaling
- Intelligent optimization levels (ultra_low to ultra)
- Dynamic effect toggling based on device capabilities
- Post-processing pipeline with conditional effects

## Migration Strategy

### Phase 1: Setup Threlte Foundation

#### 1.1 Dependencies
```bash
pnpm add @threlte/core @threlte/extras @threlte/rapier
pnpm add @threlte/theatre # Optional for animations
```

#### 1.2 Core Svelte Component Structure
```
src/
  threlte/
    Game.svelte           # Main Threlte scene
    Camera.svelte         # Camera component
    Renderer.svelte       # Renderer wrapper
    levels/
      Observatory.svelte  # Level components
      Restaurant.svelte
      Library.svelte
    systems/
      Physics.svelte      # Physics world
      Audio.svelte        # Audio management
      Optimization.svelte # Performance optimization
```

### Phase 2: Engine Component Migration

#### 2.1 Scene Management
- Convert `Engine.ts` singleton to Threlte context providers
- Replace `THREE.Scene` with `<T.Scene>`
- Migrate camera management to `<T.PerspectiveCamera>`

#### 2.2 Renderer Migration
- **Challenge**: Threlte doesn't expose post-processing directly
- **Solution**: Use `<T.WebGLRenderer>` with custom post-processing
- Migrate bloom/SSAO effects using `@threlte/extras` or custom passes

#### 2.3 Physics Integration
- Replace manual Rapier setup with `@threlte/rapier`
- Convert `PhysicsWorld.ts` to `<RigidBody>` and `<Collider>` components
- Maintain existing optimization patterns

### Phase 3: Level System Refactor

#### 3.1 Component-Based Levels
Convert level classes to Svelte components:

```svelte
<!-- Observatory.svelte -->
<script>
  import { T } from '@threlte/core'
  import { GLTF } from '@threlte/extras'
  import { RigidBody, Collider } from '@threlte/rapier'
</script>

<T.Group name="observatory">
  <GLTF url="/models/observatory.gltf" />
  <RigidBody type="fixed">
    <Collider shape="trimesh" />
  </RigidBody>
</T.Group>
```

#### 3.2 State Management
- Keep existing `GameStateManager.ts` pattern
- Use Svelte stores for reactive state
- Maintain event bus architecture for cross-component communication

### Phase 4: Performance Optimization

#### 4.1 Mobile Optimization
- Implement LOD (Level of Detail) using Threlte's automatic optimization
- Use `@threlte/extras` for instancing and performance features
- Maintain mobile-aware rendering patterns

#### 4.2 Post-Processing
```svelte
<!-- PostProcessing.svelte -->
<script>
  import { EffectComposer } from 'postprocessing'
  import { useFrame } from '@threlte/core'
  
  // Custom post-processing integration
</script>
```

### Phase 5: Asset Loading

#### 5.1 GLTF Integration
- Replace custom `AssetLoader.ts` with `<GLTF>` component
- Use Threlte's built-in preloading
- Maintain performance optimization patterns

### Migration Benefits

1. **Declarative Syntax**: Easier to read and maintain
2. **Automatic Optimization**: Threlte handles many performance optimizations
3. **Better TypeScript**: Strong typing throughout
4. **Reactive State**: Svelte's reactivity for game state
5. **Smaller Bundle**: Tree-shaking and optimized builds

### Migration Challenges

1. **Post-Processing**: Requires custom integration
2. **Physics Migration**: Need to refactor existing physics code
3. **Level Loading**: Convert dynamic loading to component-based
4. **State Management**: Integrate Svelte stores with existing patterns

### Implementation Plan

1. **Week 1**: Setup Threlte, create basic scene structure
2. **Week 2**: Migrate one level (Observatory) as proof of concept
3. **Week 3**: Implement physics and interaction system
4. **Week 4**: Add post-processing and optimization
5. **Week 5**: Migrate remaining levels and polish

### Compatibility Notes

- Keep existing JSON level configurations
- Maintain mobile optimization patterns
- Preserve optimization manager functionality
- Keep event bus for component communication

This migration will modernize your codebase while preserving the sophisticated optimization and performance features you've built.