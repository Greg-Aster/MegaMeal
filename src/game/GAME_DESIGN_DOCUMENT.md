# MEGAMEAL Game Design Document
**Version 1.0**  
**Date: July 2025**

## 📋 **Executive Summary**

MEGAMEAL is a narrative-driven 3D web exploration game built on cutting-edge web technologies with a clean, maintainable architecture. Players navigate through interconnected levels, uncovering mysteries across time and space through an innovative star-based navigation system. The game features a refactored BaseLevel architecture with proper separation of concerns and comprehensive resource management.

---

## 🎯 **Game Overview**

### **Core Vision**
A cinematic exploration experience that combines the accessibility of web games with the quality and depth of traditional adventure games.

### **Target Audience**
- **Primary**: Web gamers aged 16-35 interested in narrative experiences
- **Secondary**: Casual players seeking atmospheric, story-driven content
- **Tertiary**: Tech enthusiasts interested in advanced web game development

### **Platform**
- **Primary**: Modern web browsers (Chrome, Firefox, Safari, Edge)
- **Secondary**: Mobile browsers with WebGL support
- **Accessibility**: Cross-platform with adaptive controls

---

## 🎮 **Core Gameplay**

### **Primary Mechanics**

#### **Exploration**
- **Free-roam Movement**: WASD + mouse controls on desktop
- **Touch Controls**: Virtual joystick and gesture controls on mobile
- **Physics-Based**: Realistic movement with gravity and collision detection
- **Atmospheric Pacing**: Slow, contemplative exploration encouraging discovery

#### **Star Navigation System**
- **Interactive Timeline Stars**: 41 timeline events represented as clickable 3D sprites positioned at radius 990
- **Advanced Star Textures**: Dynamic star textures with multiple types (classic, sparkle, refraction, halo)
- **Constellation Network**: Hardcoded constellation patterns with era-based connections
- **Smart Era Grouping**: Stars organized by historical periods using predefined constellation configurations
- **TimelineCard Integration**: Original TimelineCard component with dark theme overlay for optimal visibility
- **Level Portal System**: Level-type stars (magenta color) serve as interactive portals between game areas
- **Direct Raycasting Interaction**: Mouse click and hover detection using Three.js raycaster
- **Adaptive Visual Feedback**: Hover effects, selection states, and pulsing animations
- **Optimized Performance**: Throttled updates and efficient texture management

#### **Investigation**
- **Environmental Storytelling**: Clues embedded in level design
- **Interactive Objects**: Click-to-examine system for story elements
- **Narrative Progression**: Story unfolds through exploration and discovery
- **Mystery Solving**: Players piece together overarching narrative

### **Secondary Mechanics**

#### **Atmospheric Immersion**
- **Dynamic Lighting**: Adaptive lighting based on story context
- **Particle Effects**: Fireflies, waterfalls, and cosmic dust
- **3D Audio**: Spatial audio system (currently disabled for performance)
- **Weather Systems**: Planned future feature

#### **Performance Adaptation**
- **Adaptive Quality**: Automatic quality adjustment based on device capabilities
- **Resource Management**: Efficient loading and disposal of assets
- **Cross-Platform Optimization**: Separate code paths for mobile vs desktop

---
  
  ## 🏗️ **Technical Architecture**

 ### **Engine Structure**
 ### **Current Implementation Status**

 #### **✅ Refactored Architecture (Completed)**
- **Single, clean GameManager** with centralized coordination
- **BaseLevel architecture** with proper inheritance patterns
- **Component-based UI** with reactive state management
- **Proper error handling** and resource cleanup
- **Unified interaction systems** across all levels
 
 
 ### **Current File Structure (Post-Refactoring)**

 #### **Core Engine Systems**
 ```
/src/engine/
├── core/           # Core engine systems (Engine, GameObject)
├── rendering/      # Graphics and visual effects
├── input/          # Control and interaction systems (HybridControls)
├── physics/        # Collision detection and movement
├── audio/          # 3D spatial audio system (disabled for performance)
├── resources/      # Asset loading and management
├── systems/        # Engine subsystems (InteractionSystem)
└── utils/          # Shared utilities and tools (ErrorHandler)
```

#### **Game Layer Architecture**
```
/src/game/
├── Game.svelte                    # Main game component (267 lines, refactored)
├── GameManager.ts                 # Centralized game coordination
├── managers/
│   └── LevelManager.ts            # Level lifecycle management
├── state/
│   ├── GameState.ts               # Game state definitions
│   └── GameStateManager.ts        # Centralized state management
├── levels/
│   ├── BaseLevel.ts               # Abstract base class for all levels
│   ├── StarObservatory.ts         # Hub level with star navigation
│   ├── MirandaShip.ts             # Investigation level with story
│   └── RestaurantBackroom.ts      # Horror level with NPCs
├── systems/
│   ├── StarNavigationSystem.ts    # Complete star interaction & rendering system
│   ├── ObservatoryEnvironment.ts  # Observatory-specific environment
│   └── AtmosphericEffects.ts      # Environmental effects (fireflies, dust)
├── ui/
│   ├── GameUI.svelte              # Main game interface
│   ├── MobileControls.svelte      # Mobile interface
│   ├── DebugPanel.svelte          # Debug tools
│   └── components/
│       ├── LoadingScreen.svelte   # Loading state
│       ├── ErrorScreen.svelte     # Error handling
│       └── TimelineCard.svelte    # Primary star information display
└── debug/
    └── StateDebugger.ts           # Debug tools
```

### **Architecture Benefits**

#### **✅ Achieved Improvements**
- **Maintainable**: Clear separation of concerns with BaseLevel pattern
- **Extensible**: Easy to add new levels by inheriting from BaseLevel
- **Testable**: Modular components with clear interfaces
- **Performant**: Proper resource management and disposal patterns
- **Scalable**: Clean architecture ready for team development
 
### **Key Technologies**
- **Rendering**: Three.js for 3D graphics and WebGL
- **Physics**: Rapier physics engine for realistic movement
- **UI Framework**: Svelte for reactive user interfaces
- **Build System**: Astro for static site generation
- **Asset Pipeline**: Custom tools for 3D model management
  
---

## 🌟 **Level Design**

### **Level 1: Star Observatory (Hub)**
**Purpose**: Central navigation hub and tutorial area

**Environment**:
- Floating island with waterfalls and magical fireflies
- Interactive star field showing timeline events
- Contemplative atmosphere encouraging exploration

**Key Features**:
- Tutorial introduction to movement controls
- Star navigation system demonstration
- Portal access to other levels
- Safe area for players to experiment with controls

**Gameplay Flow**:
1. Player spawns on floating island
2. Discovers movement controls through organic exploration
3. Learns star selection mechanics
4. Chooses first story level to enter

### **Level 2: Miranda Ship (Investigation)**
**Purpose**: Mystery-solving level with environmental storytelling

**Environment**:
- Damaged spaceship interior with multiple rooms
- Debris field surrounding the ship
- Atmospheric lighting emphasizing mystery and discovery

**Key Features**:
- Interactive story elements (captain's logs, terminals)
- Environmental puzzles requiring exploration
- Multiple story threads converging on central mystery
- Professional SciFi assets creating immersive atmosphere

**Gameplay Flow**:
1. Player enters ship through damaged hull
2. Explores different ship sections
3. Discovers captain's logs revealing story
4. Solves environmental puzzles
5. Uncovers the Perfect Mary recipe mystery

### **Level 3: Restaurant Backroom (Horror)**
**Purpose**: Atmospheric horror level with NPC interaction

**Environment**:
- Grimy SciFi restaurant backroom
- Dramatic red emergency lighting
- Claustrophobic atmosphere with interactive NPCs

**Key Features**:
- Horror atmosphere with environmental storytelling
- Interactive NPCs with dialogue system
- Story connection to larger Hamburgler narrative
- Atmospheric design emphasizing tension and discovery

**Gameplay Flow**:
1. Player enters dark restaurant backroom
2. Encounters strapped character with story information
3. Investigates environment for clues
4. Pieces together connection to larger mystery
5. Discovers information about Hamburgler location

---

## 🎨 **Visual Design**

### **Art Direction**
- **Style**: Realistic 3D environments with atmospheric lighting
- **Color Palette**: Deep space blues, warm firefly glows, dramatic reds
- **Mood**: Contemplative, mysterious, with moments of wonder and tension
- **Quality**: Professional-grade 3D assets with PBR materials

### **Asset Library**
- **SciFi Models**: 189+ professional models (walls, props, equipment)
- **Nature Assets**: 62+ trees, rocks, and environmental elements
- **Character Models**: Various human characters and alien designs
- **Textures**: Complete PBR material sets with normal/roughness maps

### **Lighting Design**
- **Star Observatory**: Soft moonlight with magical firefly glows
- **Miranda Ship**: Harsh emergency lighting with dramatic shadows
- **Restaurant Backroom**: Red warning lights creating horror atmosphere
- **General**: Adaptive lighting system supporting story mood

---

## 🎵 **Audio Design**

### **Current Implementation**
- **Status**: 3D spatial audio system implemented but disabled for performance
- **Architecture**: Complete AudioManager with 3D positioning
- **Future**: Re-enable when performance optimization is complete

### **Planned Audio Features**
- **Ambient Soundscapes**: Unique audio for each level
- **Interactive Audio**: Sound feedback for player actions
- **Spatial Audio**: 3D positioned audio sources
- **Dynamic Music**: Adaptive music based on story context

---

## 🎮 **User Experience**

### **Control Systems**

#### **Desktop Controls**
- **Movement**: WASD keys for character movement
- **Camera**: Mouse for free-look camera control
- **Interaction**: Left mouse click for object selection
- **UI**: Intuitive interface with clear visual feedback

#### **Mobile Controls**
- **Movement**: Virtual joystick with smooth analog input
- **Camera**: Touch and drag for camera control
- **Interaction**: Tap-to-select with touch feedback
- **UI**: Adaptive interface scaling for different screen sizes

### **Accessibility Features**
- **Cross-Platform**: Consistent experience across devices
- **Visual Clarity**: High contrast interface elements
- **Input Flexibility**: Multiple input methods supported
- **Performance Scaling**: Automatic quality adjustment

---

## 🔄 **Game Flow**

### **Player Journey**
1. **Entry**: Player arrives at Star Observatory
2. **Tutorial**: Organic discovery of movement and interaction
3. **Navigation**: Learn star selection and level transition
4. **Exploration**: Visit different levels in any order
5. **Investigation**: Gather story clues across multiple levels
6. **Resolution**: Piece together overarching narrative

### **Story Progression**
- **Non-Linear**: Players can explore levels in any order
- **Interconnected**: Story elements across levels form larger narrative
- **Discovery-Based**: Story unfolds through environmental exploration
- **Mystery-Driven**: Central mystery motivates continued exploration

---

## 📊 **Performance Specifications**

### **Target Performance**
- **Frame Rate**: 60 FPS on desktop, 30 FPS on mobile
- **Load Times**: <5 seconds for level transitions
- **Memory Usage**: <2GB total memory footprint
- **Asset Size**: Optimized for web delivery

### **Technical Requirements**
- **WebGL**: WebGL 2.0 support required
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Network**: Broadband connection for initial asset download
- **Storage**: 500MB browser cache for optimal performance

---

## 🚀 **Development Roadmap**

### **Phase 1: Code Refactoring (✅ Completed)**
- [x] Implement shared base classes for levels (BaseLevel architecture)
- [x] Create unified interaction system (InteractionSystem)
- [x] Optimize asset loading and management (AssetLoader)
- [x] Improve code organization and maintainability (Component-based UI)

### **Phase 2: Content Expansion**
- [ ] Add more investigation levels
- [ ] Implement complete story arc
- [ ] Add character dialogue system
- [ ] Create save/load functionality

### **Phase 3: Polish and Optimization**
- [ ] Re-enable 3D audio system
- [ ] Implement dynamic weather effects
- [ ] Add advanced post-processing effects
- [ ] Optimize for mobile performance

### **Phase 4: Advanced Features**
- [ ] Multiplayer exploration mode
- [ ] Level editor for user-generated content
- [ ] VR support for compatible devices
- [ ] Advanced AI for interactive NPCs

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- **Performance**: Consistent 60 FPS on target hardware
- **Stability**: <1% crash rate across all platforms
- **Loading**: <3 second average level transition time
- **Memory**: <2GB peak memory usage

### **User Experience Metrics**
- **Engagement**: >10 minutes average session time
- **Completion**: >70% of players visit all levels
- **Retention**: >50% of players return within 24 hours
- **Satisfaction**: >4.5/5 average user rating

---

## 🔧 **Technical Appendix**

### **Star Navigation Implementation Details**

#### **Advanced Star Texture System**
```typescript
// Dynamic texture generation with multiple star types
const texture = createAdvancedStarTexture(
  THREE,
  hexColor,
  starType, // 'classic', 'sparkle', 'refraction', 'halo'
  isKeyEvent,
  isSelected,
  isHovered,
  animationTime,
  256, // texture size
  animationSeed
);
```

#### **Constellation Pattern System**
```typescript
// Hardcoded constellation configurations by era
const constellationConfig = {
  'ancient-epoch': {
    pattern: 'bigDipper',
    centerAzimuth: 0,
    centerElevation: 60
  },
  'awakening-era': {
    pattern: 'constellation',
    centerAzimuth: 90,
    centerElevation: 45
  }
};
```

#### **Performance Optimization**
```typescript
// Throttled animation updates
if (currentTime % 100 < 16) { // ~6 fps for animations
  updateStarTextures();
}

// Efficient texture disposal
if (sprite.material && sprite.material.map) {
  sprite.material.map.dispose();
}
```

### **File Structure**
```
/src/
├── engine/         # Core game engine
├── game/           # Game-specific logic
├── layouts/        # UI layout components
└── pages/          # Entry points and routing

/public/
├── assets/         # Game assets and resources
├── audio/          # Sound effects and music
└── textures/       # Materials and visual assets
```

### **Build Configuration**
- **Development**: Hot-reloading with instant updates
- **Production**: Optimized builds with asset compression
- **Testing**: Automated testing for core functionality
- **Deployment**: Static site generation for web deployment

---

## 📝 **Conclusion**

MEGAMEAL represents a sophisticated implementation of modern web game development, combining the accessibility of web technologies with the quality expectations of traditional gaming. The current codebase provides a solid foundation for continued development and expansion.

**Key Strengths**:
- Professional 3D assets and visual quality
- Robust engine architecture with proper separation of concerns
- Cross-platform compatibility with adaptive controls
- Comprehensive resource management preventing memory leaks

**Development Priorities**:
1. Code refactoring for maintainability and extensibility
2. Performance optimization for broader device support
3. Content expansion with additional levels and story elements
4. Advanced features like 3D audio and dynamic weather

The game is well-positioned for continued development and has the potential to become a showcase example of what's possible with modern web game development technologies.

---

*This document is a living specification and will be updated as development progresses.*