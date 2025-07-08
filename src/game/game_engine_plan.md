# Game Engine Refactor Plan

## 🎯 Architecture Overview

### Core Engine Structure
```
src/
├── engine/
│   ├── core/
│   │   ├── Engine.ts           # Main game engine
│   │   ├── Scene.ts            # Scene management
│   │   ├── Time.ts             # Game time & delta
│   │   └── EventBus.ts         # Global event system
│   ├── rendering/
│   │   ├── Renderer.ts         # Three.js wrapper
│   │   ├── PostProcessor.ts    # Post-processing pipeline
│   │   ├── Camera.ts           # Camera management
│   │   └── Materials.ts        # Material library
│   ├── physics/
│   │   ├── PhysicsWorld.ts     # Rapier integration
│   │   ├── Colliders.ts        # Collision shapes
│   │   └── RigidBodies.ts      # Physics bodies
│   ├── input/
│   │   ├── InputManager.ts     # Keyboard/mouse handling
│   │   ├── Controls.ts         # FPS controls
│   │   └── InteractionSystem.ts # Object picking/selection
│   ├── audio/
│   │   ├── AudioManager.ts     # 3D audio system
│   │   └── SoundLibrary.ts     # Sound asset management
│   ├── resources/
│   │   ├── AssetLoader.ts      # Asset loading pipeline
│   │   ├── TextureManager.ts   # Texture caching
│   │   └── ModelLoader.ts      # 3D model loading
│   └── utils/
│       ├── Math.ts             # Math utilities
│       ├── Debug.ts            # Debug utilities
│       └── Performance.ts      # Performance monitoring
├── game/
│   ├── systems/
│   │   ├── LevelSystem.ts      # Level loading/management
│   │   ├── EntitySystem.ts     # Entity/component system
│   │   ├── UISystem.ts         # UI management
│   │   └── GameplaySystem.ts   # Game logic
│   ├── entities/
│   │   ├── Player.ts           # Player entity
│   │   ├── Environment.ts      # Environment objects
│   │   └── Interactive.ts      # Interactable objects
│   ├── levels/
│   │   ├── Level.ts            # Base level class
│   │   ├── StarObservatory.ts  # Your current level
│   │   └── level-configs/      # JSON level definitions
│   └── ui/
│       ├── GameUI.svelte       # Main game UI
│       ├── DebugPanel.svelte   # Debug interface
│       └── components/         # UI components
└── assets/
    ├── models/
    ├── textures/
    ├── audio/
    └── levels/
```

## 🛠 Recommended Libraries & Tools

### Core Dependencies
```typescript
// Physics Engine
import RAPIER from '@dimforge/rapier3d-compat'

// Post-processing
import { EffectComposer, RenderPass, BloomPass, SSAOPass } from 'postprocessing'

// Debug GUI
import { GUI } from 'lil-gui'

// Audio (if needed beyond Three.js)
import { Howl, Howler } from 'howler'

// Performance monitoring
import Stats from 'stats.js'
```

### Why These Tools?

1. **Rapier Physics** - Excellent Rust-based physics, great performance
2. **postprocessing library** - High-quality effects for Three.js
3. **lil-gui** - Perfect for debug interfaces, lightweight
4. **Stats.js** - Essential for performance monitoring

## 🚀 Implementation Phases

### Phase 1: Core Engine Foundation (Week 1-2)
- [ ] Set up Engine.ts with game loop
- [ ] Implement InputManager with WASD + mouse look
- [ ] Create basic Renderer with post-processing setup
- [ ] Add lil-gui debug panel
- [ ] Integrate Rapier physics

### Phase 2: Systems Architecture (Week 3)
- [ ] Build EntitySystem for game objects
- [ ] Create LevelSystem for modular levels
- [ ] Implement InteractionSystem for object selection
- [ ] Set up AssetLoader for resources

### Phase 3: Game Integration (Week 4)
- [ ] Refactor your current StarObservatory into new system
- [ ] Create Player entity with FPS movement
- [ ] Build level editor tools
- [ ] Add audio system

### Phase 4: Polish & Expansion (Ongoing)
- [ ] Advanced post-processing effects
- [ ] Level streaming system
- [ ] Save/load functionality
- [ ] Performance optimizations

## 🎮 Controls Design

### FPS-Style Movement
```typescript
// WASD movement + mouse look
const controls = {
  movement: {
    forward: 'KeyW',
    backward: 'KeyS', 
    left: 'KeyA',
    right: 'KeyD',
    up: 'Space',
    down: 'ShiftLeft'
  },
  interaction: {
    select: 'Mouse0',  // Left click
    inspect: 'KeyE',   // Examine object
    menu: 'Escape'
  }
}
```

## 🎨 Post-Processing Pipeline

### Suggested Effects
- **Bloom** - Glowing stars and UI elements
- **SSAO** - Ambient occlusion for depth
- **FXAA/SMAA** - Anti-aliasing
- **Color Grading** - Atmospheric mood
- **Depth of Field** - Focus effects

## 🔧 Debug Features

### lil-gui Panels
- Scene controls (lighting, fog, etc.)
- Physics visualization
- Performance metrics
- Level editor tools
- Entity inspector

## 📁 Level System Design

### JSON-Driven Levels
```json
{
  "id": "star-observatory",
  "name": "Star Observatory Alpha",
  "environment": {
    "skybox": "/assets/hdri/space.hdr",
    "fog": { "color": "#000020", "density": 0.01 }
  },
  "entities": [
    {
      "type": "star",
      "position": [100, 50, 200],
      "data": { "timelineEvent": "first-light" }
    }
  ],
  "physics": {
    "gravity": [0, -9.81, 0]
  }
}
```

## 🚦 Migration Strategy

### From Current Code
1. **Extract reusable systems** from existing classes
2. **Preserve working features** (star rendering, timeline events)
3. **Gradual refactor** - one system at a time
4. **Maintain compatibility** with current UI components

### Breaking Changes
- StarControls.ts → new FPS controls
- Scene setup → new Engine system
- Direct Three.js calls → through Renderer

## 🎯 Benefits of This Architecture

✅ **Modular** - Each system is independent
✅ **Scalable** - Easy to add new levels/features  
✅ **Maintainable** - Clear separation of concerns
✅ **Debuggable** - Built-in debug tools
✅ **Performant** - Optimized rendering pipeline
✅ **Flexible** - JSON-driven content creation

## 🔄 Next Steps

1. **Choose implementation approach** (big refactor vs gradual migration)
2. **Set up new project structure** 
3. **Install required dependencies**
4. **Begin with Phase 1** core systems
5. **Test integration** with existing star observatory level