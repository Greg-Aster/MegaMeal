# MEGAMEAL Game Engine Plan 4.0
## Complete Architecture & Level Creation Guide

*Updated with comprehensive level creation best practices and interaction systems - January 2025*

---

## 🎯 Executive Summary

The MEGAMEAL game engine has evolved into a sophisticated, production-ready 3D web game framework featuring advanced asset management, multi-format 3D model support, and hybrid procedural/model-based content generation. The engine successfully powers a rich space exploration experience with multiple themed levels, proper interaction systems, and comprehensive resource management.

### Current State: **Production Ready + Advanced Level Creation Pipeline**
- ✅ **Full multi-platform support** (desktop + mobile with responsive controls)
- ✅ **Advanced 3D model library system** (GLB, OBJ, FBX support with 189+ SciFi models)
- ✅ **Hybrid content generation** (procedural + model-based)
- ✅ **Professional PBR material workflow** with texture management
- ✅ **Multi-zone terrain system** with material blending
- ✅ **Blender integration pipeline** for asset creation
- ✅ **Cross-level asset reusability** with organized library structure
- ✅ **Physics-driven gameplay** with collision detection
- ✅ **Advanced rendering pipeline** with post-processing
- ✅ **Story-driven level progression** with seamless transitions
- ✅ **🆕 Proper interaction systems** with click-to-select functionality
- ✅ **🆕 Self-contained level UI management** 
- ✅ **🆕 Comprehensive resource cleanup** preventing global contamination
- ✅ **🆕 Multiple themed levels** (Space Observatory, Ship Investigation, Horror Backroom)

---

## 🏗️ System Architecture Overview

### Core Engine Hierarchy
```
MEGAMEAL Game Engine v4.0
├── Core Engine (Singleton Pattern)
│   ├── EventBus (Global Communication)
│   ├── Scene Management with Asset Integration
│   ├── Time & Performance Monitoring  
│   └── Lifecycle Management
├── Subsystems (Modular Architecture)
│   ├── Rendering Pipeline (Three.js + Post-processing)
│   ├── Physics World (Rapier Integration)
│   ├── Input Management (Multi-platform)
│   ├── Audio System (3D Spatial Audio)
│   ├── Advanced Asset Management (Multi-format)
│   ├── 🆕 InteractionSystem (Click-to-select)
│   └── Debug Tools (Performance & Development)
├── Asset Pipeline (Enhanced v4.0)
│   ├── ModelLibrary (GLB/OBJ/FBX support)
│   ├── 🆕 SciFi Model Integration (189+ models)
│   ├── ForestElementFactory (Procedural + Model)
│   ├── PBR Texture Management
│   └── Blender Integration Workflow
└── Game Layer
    ├── Level System (Observatory ↔ Miranda Ship ↔ Restaurant Backroom)
    ├── 🆕 Proper Level Isolation (No global contamination)
    ├── Entity Management (Player, Environment, Interactive)
    ├── UI Framework (Svelte Components + Level UI)
    └── Game Logic (Timeline Events, Story Progression)
```

---

## 🆕 Level Creation Best Practices (NEW v4.0)

### **Essential Level Architecture**

Every level must follow this proven pattern for proper resource management and functionality:

```typescript
// Level Template Structure
import { AssetLoader } from '../../engine/resources/AssetLoader';
import { ModelLibrary } from '../systems/ModelLibrary';
import { Materials } from '../../engine/rendering/Materials';
import { InteractionSystem, type InteractableObject } from '../../engine/input/InteractionSystem';

export class YourLevel {
  private THREE: any;
  private scene: any;
  private physicsWorld: any;
  private camera: any;
  private gameContainer: any;
  
  // 3D Asset Management
  private assetLoader: AssetLoader;
  private modelLibrary: ModelLibrary;
  private materials: Materials;
  
  // 🆕 CRITICAL: InteractionSystem for click-to-select
  private interactionSystem: InteractionSystem;
  
  // 🆕 CRITICAL: Level isolation container
  private levelGroup: any = null; // Main container for ALL level objects
  
  // 🆕 CRITICAL: Resource tracking for proper disposal
  private createdMaterials: any[] = [];
  private createdTextures: any[] = [];
  private createdGeometries: any[] = [];
  
  // 🆕 CRITICAL: UI management within level
  private currentUI: HTMLElement | null = null;
  
  constructor(THREE: any, scene: any, physicsWorld?: any, camera?: any, gameContainer?: any, assetLoader?: AssetLoader) {
    this.THREE = THREE;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.camera = camera;
    this.gameContainer = gameContainer;
    
    // Initialize systems
    this.assetLoader = assetLoader || new AssetLoader();
    this.materials = new Materials();
    this.modelLibrary = new ModelLibrary(THREE, this.assetLoader, this.materials);
    
    // 🆕 CRITICAL: Initialize interaction system
    this.interactionSystem = new InteractionSystem(this.camera, this.gameContainer);
    
    // 🆕 CRITICAL: Create level isolation container
    this.levelGroup = new this.THREE.Group();
    this.levelGroup.name = 'YourLevelGroup';
  }
  
  public async initialize(): Promise<void> {
    // Initialize asset systems
    await this.assetLoader.initialize();
    await this.modelLibrary.initialize();
    
    // 🆕 CRITICAL: Initialize lighting BEFORE creating objects
    this.setupLighting();
    
    // Build level components
    await this.createEnvironment();
    await this.createStructures();
    await this.createInteractables();
    
    // 🆕 CRITICAL: Add complete level to scene as single unit
    this.scene.add(this.levelGroup);
  }
  
  // 🆕 CRITICAL: Proper disposal pattern
  public dispose(): void {
    console.log('🧹 Disposing level...');
    
    // Remove entire level from scene
    if (this.levelGroup) {
      this.scene.remove(this.levelGroup);
    }
    
    // Dispose interaction system
    if (this.interactionSystem) {
      this.interactionSystem.dispose();
    }
    
    // Clean up any UI
    this.hideUI();
    
    // Dispose tracked resources
    this.createdMaterials.forEach(material => {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    });
    
    this.createdTextures.forEach(texture => {
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose();
      }
    });
    
    this.createdGeometries.forEach(geometry => {
      if (geometry && typeof geometry.dispose === 'function') {
        geometry.dispose();
      }
    });
    
    // Clear references
    this.createdMaterials = [];
    this.createdTextures = [];
    this.createdGeometries = [];
    this.levelGroup = null;
    
    console.log('✅ Level disposed completely');
  }
}
```

### **🆕 Critical Level Creation Rules**

#### **1. Level Isolation (MANDATORY)**
- **ALL objects must be children of `levelGroup`**
- **NEVER add objects directly to `this.scene`**
- **Use `this.levelGroup.add(object)` for everything**

```typescript
// ✅ CORRECT
this.levelGroup.add(myObject);

// ❌ WRONG - Causes global contamination
this.scene.add(myObject);
```

#### **2. Resource Tracking (MANDATORY)**
- **Track ALL created materials, textures, and geometries**
- **Push to tracking arrays immediately after creation**

```typescript
// ✅ CORRECT
const material = new this.THREE.MeshLambertMaterial({ color: 0xff0000 });
this.createdMaterials.push(material); // Track immediately

const texture = new this.THREE.CanvasTexture(canvas);
this.createdTextures.push(texture); // Track immediately
```

#### **3. UI Management (MANDATORY)**
- **Level UIs must be managed within the level, not in Game.svelte**
- **Clean up UI in disposal**

```typescript
// ✅ CORRECT - UI within level
private showUI(content: string): void {
  const uiElement = document.createElement('div');
  // ... create UI
  document.body.appendChild(uiElement);
  this.currentUI = uiElement;
}

private hideUI(): void {
  if (this.currentUI) {
    document.body.removeChild(this.currentUI);
    this.currentUI = null;
  }
}
```

#### **4. Lighting Setup (MANDATORY)**
- **Initialize lighting system before creating objects**
- **Make lighting bright enough to see content**

```typescript
private setupLighting(): void {
  const lightingGroup = new this.THREE.Group();
  
  // 🆕 CRITICAL: Bright ambient lighting
  const ambientLight = new this.THREE.AmbientLight(0x888899, 0.8);
  lightingGroup.add(ambientLight);
  
  // 🆕 CRITICAL: Main directional light
  const mainLight = new this.THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(50, 100, 50);
  lightingGroup.add(mainLight);
  
  // 🆕 CRITICAL: Add to level group, not scene
  this.levelGroup.add(lightingGroup);
}
```

---

## 🆕 Interaction System Architecture (NEW v4.0)

### **Click-to-Select System (RECOMMENDED)**

The engine uses a proper InteractionSystem for object selection, similar to star interactions:

```typescript
// 🆕 Creating an interactable object
const interactableObject: InteractableObject = {
  id: 'unique_object_id',
  mesh: yourMeshObject,
  type: 'note' | 'button' | 'terminal' | 'safe',
  data: { /* your custom data */ },
  onInteract: (data) => {
    console.log('Object clicked:', data);
    this.showCustomUI(data);
  }
};

// 🆕 Register with interaction system
this.interactionSystem.addInteractable(interactableObject);
```

### **Keyboard Controls (DISCOURAGED)**

Based on experience, keyboard interactions (E key) are problematic:
- **Issues**: Complex event handling, conflicts with other systems
- **User Experience**: Users expect click-to-select in web games
- **Mobile**: Keyboard controls don't work on mobile devices

### **🆕 Interaction Best Practices**

#### **Visual Indicators**
- **Large, bright glowing objects** (3.0+ radius spheres)
- **Floating text labels** with clear instructions
- **Color coding** for different interaction types

```typescript
// 🆕 Create highly visible interaction indicator
const glowGeometry = new this.THREE.SphereGeometry(3.0, 16, 16);
const glowMaterial = new this.THREE.MeshBasicMaterial({
  color: 0x00ff88,
  transparent: true,
  opacity: 0.6,
  blending: this.THREE.AdditiveBlending
});
const glow = new this.THREE.Mesh(glowGeometry, glowMaterial);
```

#### **Text Labels**
- **Always include instruction text** ("Click to interact")
- **Use high contrast colors** (green on black, red on black)
- **Make text readable size** (32px+ font)

---

## 🆕 SciFi Asset Integration (NEW v4.0)

### **Available SciFi Model Library (189+ models)**

The engine includes a comprehensive SciFi asset library:

```
📦 SciFi Models (/public/assets/game/shared/models/)
├── structures/                    # Walls, platforms, columns
│   ├── scifi_platform_simple      # Basic platform
│   ├── scifi_platform_metal       # Metal platform
│   ├── scifi_shortwall_*          # Various wall types
│   ├── scifi_column_*             # Structural columns
│   └── scifi_wallband_*           # Wall panels
├── decorative/                    # Props and details
│   ├── scifi_prop_computer        # Computer terminals
│   ├── scifi_prop_crate*          # Storage crates
│   ├── scifi_prop_barrel_*        # Industrial barrels
│   ├── scifi_prop_chest           # Storage chests
│   ├── scifi_prop_accesspoint     # Access terminals
│   ├── scifi_prop_vent_*          # Ventilation systems
│   └── scifi_prop_pipeholder      # Pipe systems
```

### **🆕 SciFi Model Usage Patterns**

#### **Ship/Station Construction**
```typescript
// 🆕 Building with SciFi platform models
const floorModels = [
  'scifi_platform_simple',
  'scifi_platform_metal',
  'scifi_platform_centerplate',
  'scifi_platform_darkplates'
];

for (let x = -30; x <= 30; x += 10) {
  for (let z = -25; z <= 25; z += 10) {
    const modelName = floorModels[Math.floor(Math.random() * floorModels.length)];
    const floorTile = this.modelLibrary.getModel('structures', modelName, {
      position: new this.THREE.Vector3(x, -2, z),
      scale: new this.THREE.Vector3(2, 0.3, 2),
      rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
    });
    
    if (floorTile) {
      this.levelGroup.add(floorTile);
    }
  }
}
```

#### **Wall Construction**
```typescript
// 🆕 Creating solid walls with collision
const wallModels = [
  'scifi_shortwall_simple1_straight',
  'scifi_shortwall_metal2_straight',
  'scifi_wallband_straight'
];

const wall = this.modelLibrary.getModel('structures', wallName, {
  position: new this.THREE.Vector3(x, y, z),
  scale: new this.THREE.Vector3(1, 1.5, 1),
  rotation: new this.THREE.Euler(0, rotationY, 0)
});

if (wall) {
  wall.userData.isCollidable = true; // Mark for collision
  this.levelGroup.add(wall);
}
```

#### **Equipment Placement**
```typescript
// 🆕 Placing interactive SciFi equipment
const equipmentItems = [
  { model: 'scifi_prop_computer', pos: [10, 1, 5], interactive: true },
  { model: 'scifi_prop_chest', pos: [-5, 0, 8], interactive: true },
  { model: 'scifi_prop_crate3', pos: [15, 0, -10], interactive: false },
];

equipmentItems.forEach(item => {
  const equipment = this.modelLibrary.getModel('decorative', item.model, {
    position: new this.THREE.Vector3(item.pos[0], item.pos[1], item.pos[2]),
    scale: 1.0,
    rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
  });
  
  if (equipment && item.interactive) {
    // Register as interactable
    this.interactionSystem.addInteractable({
      id: `equipment_${item.model}`,
      mesh: equipment,
      type: 'terminal',
      data: { type: item.model },
      onInteract: (data) => this.handleEquipmentInteraction(data)
    });
  }
  
  if (equipment) {
    this.levelGroup.add(equipment);
  }
});
```

### **🆕 Material Enhancement**

SciFi models can be enhanced with custom materials:

```typescript
// 🆕 Making models look dirty/damaged
equipment.traverse((child: any) => {
  if (child.isMesh && child.material) {
    let customMaterial: any;
    
    if (typeof child.material.clone === 'function') {
      customMaterial = child.material.clone();
    } else {
      customMaterial = new this.THREE.MeshLambertMaterial({
        color: child.material.color || 0x888888
      });
    }
    
    // Apply customizations
    customMaterial.color.multiplyScalar(0.5); // Darken
    customMaterial.transparent = true;
    customMaterial.opacity = 0.8;
    
    child.material = customMaterial;
    this.createdMaterials.push(customMaterial); // Track for disposal
  }
});
```

---

## 🆕 Level Theme Guidelines (NEW v4.0)

### **Space Station/Ship Levels**
- **Use**: SciFi platform models for floors/ceilings
- **Lighting**: Bright ambient (0.8+) + directional lights
- **Colors**: Blue-white lighting with accent colors
- **Atmosphere**: Clean, functional, some battle damage

### **Horror/Backroom Levels**
- **Use**: Same SciFi models but with darker materials
- **Lighting**: Ambient (0.8+) + dramatic point lights + colored accents
- **Colors**: Red emergency lights, blue equipment lights
- **Atmosphere**: Flickering lights, grimy textures, shadows

### **Forest/Natural Levels**
- **Use**: Nature asset pack + procedural generation
- **Lighting**: Warm ambient + sun directional light
- **Colors**: Natural lighting with green/brown tones
- **Atmosphere**: Organic, peaceful, mysterious

---

## 🆕 Game.svelte Integration (NEW v4.0)

### **Level Registration Pattern**

To add a new level to the game:

#### **1. Import the Level Class**
```typescript
import { YourNewLevel } from './levels/YourNewLevel';
```

#### **2. Add Level Variable**
```typescript
let yourNewLevel: YourNewLevel;
```

#### **3. Update Level Type**
```typescript
let currentLevel: 'observatory' | 'miranda' | 'restaurant' | 'yournew' = 'observatory';
```

#### **4. Add Transition Logic**
```typescript
else if (levelType === 'your-new-level' && currentLevel === 'observatory') {
  console.log('🎯 Transitioning to Your New Level...');
  
  try {
    // Dispose current level
    if (starObservatory) {
      starObservatory.dispose();
    }
    if (starVisuals) {
      starVisuals.dispose();
    }
    
    // Initialize new level
    const scene = engine.getScene();
    const physicsWorld = engine.getPhysicsWorld();
    const camera = engine.getCamera();
    
    yourNewLevel = new YourNewLevel(THREE, scene, physicsWorld, camera, gameContainer);
    await yourNewLevel.initialize();
    
    // Set camera position
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    
    // Update game state
    currentLevel = 'yournew';
    gameStats.currentLocation = 'Your New Location';
    
  } catch (error) {
    console.error('❌ Failed to transition to Your New Level:', error);
  }
}
```

#### **5. Add Return Logic**
```typescript
if (currentLevel === 'miranda' || currentLevel === 'restaurant' || currentLevel === 'yournew') {
  // ... existing code
  
  if (yourNewLevel) {
    yourNewLevel.dispose();
  }
}
```

#### **6. Add Update Loop**
```typescript
} else if (currentLevel === 'yournew') {
  yourNewLevel?.update();
}
```

#### **7. Add Star to StarObservatory**
```typescript
// Add in both locations in Game.svelte
const yourNewEvent = {
  title: "Your New Level Title",
  description: "Description of what the level contains...",
  slug: "your-new-level",
  uniqueId: "your-new-level-id",
  timelineYear: 28050,
  timelineEra: "transcendent-age",
  timelineLocation: "Your New Location",
  isKeyEvent: true,
  isLevel: true,
  tags: ["Level", "Adventure", "Exploration"],
  category: "GAME_LEVEL"
};

events.push(yourNewEvent);
```

---

## 🆕 Performance & Optimization (NEW v4.0)

### **Lighting Optimization**
- **Use ambient lighting** (0.8+ intensity) for base illumination
- **Limit point lights** to 6-8 per level maximum
- **Use directional lights** for main illumination
- **Disable shadows** on decorative lights

### **Model Performance**
- **Reuse model instances** when possible
- **Batch similar objects** together
- **Use level-of-detail** for distant objects
- **Dispose unused models** immediately

### **Resource Management**
- **Track all created resources** in arrays
- **Dispose everything** in level disposal
- **Use weak references** when possible
- **Clear arrays** after disposal

---

## 🆕 Troubleshooting Guide (NEW v4.0)

### **Common Issues & Solutions**

#### **Level Elements Persist Between Levels**
- **Cause**: Objects added to `this.scene` instead of `this.levelGroup`
- **Solution**: Always use `this.levelGroup.add(object)`

#### **Memory Leaks**
- **Cause**: Not disposing materials, textures, or geometries
- **Solution**: Track all created resources and dispose in level disposal

#### **Interactions Don't Work**
- **Cause**: Not registering with InteractionSystem
- **Solution**: Use `this.interactionSystem.addInteractable()`

#### **Level Too Dark**
- **Cause**: Insufficient ambient lighting
- **Solution**: Use ambient light with 0.8+ intensity

#### **E Key Doesn't Work**
- **Cause**: Keyboard event conflicts
- **Solution**: Use click-to-select InteractionSystem instead

#### **Models Don't Load**
- **Cause**: Model path or name incorrect
- **Solution**: Check console for loading errors, verify model exists

---

## 🆕 Controls Documentation (NEW v4.0)

### **Desktop Controls (Verified Working)**
- **WASD**: Movement (forward/back/left/right)
- **Mouse**: Look around (first-person camera)
- **Space**: Jump
- **Left Click**: Interact with objects
- **ESC**: Close UI dialogs

### **Mobile Controls (Verified Working)**
- **Touch Drag**: Look around
- **Virtual Joystick**: Movement
- **Jump Button**: Jump
- **Tap**: Interact with objects

### **Interaction Methods**
- **✅ Click-to-Select**: Primary interaction method
- **❌ Keyboard (E key)**: Not recommended due to conflicts
- **✅ Touch/Tap**: Mobile interaction

---

## 🚀 Recommended Development Workflow

### **Creating a New Level**

1. **📁 Create Level File**
   ```typescript
   /src/game/levels/YourNewLevel.ts
   ```

2. **🏗️ Use Level Template**
   - Copy the level template architecture
   - Implement required methods
   - Follow all mandatory patterns

3. **🎨 Design Environment**
   - Plan lighting system first
   - Choose appropriate SciFi models
   - Create interaction points

4. **🔗 Add to Game.svelte**
   - Import level class
   - Add transition logic
   - Create star in StarObservatory

5. **🧪 Test Thoroughly**
   - Test level switching
   - Verify interactions work
   - Check resource disposal

6. **📖 Document**
   - Add level description
   - Document special features
   - Update this guide

---

## 🎯 Game Design Philosophy (Updated v4.0)

The MEGAMEAL game engine now embodies:

- **🆕 Proper Architecture**: Clean separation of concerns with self-contained levels
- **🆕 User Experience First**: Click-to-select interactions that work on all platforms
- **🆕 Visual Clarity**: Bright, readable environments with clear interaction indicators
- **🆕 Resource Responsibility**: Comprehensive cleanup preventing memory leaks
- **🆕 SciFi Aesthetic**: Professional 3D models creating immersive environments
- **🆕 Horror Atmosphere**: Dramatic lighting and environmental storytelling
- **Cross-platform**: Equal quality experience across all supported devices
- **Performance Conscious**: Optimized asset pipeline maintaining smooth gameplay
- **Developer Friendly**: Clear patterns and comprehensive documentation

---

## 🎮 Current Game Content (v4.0)

### **Star Observatory** (Hub Level)
- **Purpose**: Level selection and narrative introduction
- **Features**: Interactive star field, floating forest island, timeline navigation
- **Interactions**: Click stars to travel to other levels

### **Miranda Ship** (Investigation Level)
- **Purpose**: Story-driven exploration and puzzle solving
- **Features**: SciFi ship interior, captain's logs, mystery solving
- **Interactions**: Click captain's logs to read entries, solve safe puzzle

### **Restaurant Backroom** (Horror Level)
- **Purpose**: Atmospheric horror experience
- **Features**: Grimy SciFi restaurant, dramatic lighting, strapped person
- **Interactions**: Click person for dialogue about Hamburgler location

### **🆕 Future Level Ideas**
- **Space Station Medical Bay**: Horror/medical theme
- **Alien Marketplace**: Trading and exploration
- **Abandoned Mining Facility**: Industrial exploration
- **Temporal Laboratory**: Time manipulation puzzles

---

## 📊 Asset Statistics (v4.0)

### **3D Model Library**
- **SciFi Models**: 189+ professional models
- **Nature Models**: 62+ forest and landscape models
- **Total Assets**: 250+ 3D models across all categories

### **Texture Library**
- **PBR Texture Sets**: 50+ complete material sets
- **Environment Maps**: 12+ HDR skyboxes
- **Procedural Textures**: Unlimited generated variations

### **Performance Metrics**
- **Load Time**: 3-8 seconds depending on level complexity
- **Memory Usage**: 200-400MB with comprehensive cleanup
- **Frame Rate**: 60 FPS desktop, 30+ FPS mobile
- **Model Rendering**: 100+ SciFi models with smooth performance

---

## 🏆 Architecture Achievements (v4.0)

### **🆕 Level System Mastery**
- **Proper Isolation**: Zero cross-level contamination
- **Resource Management**: Comprehensive disposal patterns
- **UI Separation**: Level-contained UI management
- **Interaction Systems**: Professional click-to-select implementation

### **🆕 Asset Pipeline Excellence**
- **SciFi Integration**: 189+ models seamlessly integrated
- **Performance Optimization**: Instanced rendering and reuse
- **Visual Quality**: Professional 3D environments
- **Theme Flexibility**: Same assets for multiple atmospheres

### **🆕 User Experience Focus**
- **Cross-Platform**: Consistent experience on all devices
- **Intuitive Controls**: Click-to-select that users expect
- **Visual Clarity**: Bright, readable environments
- **Atmospheric Design**: Immersive themed experiences

---

*Document Version: 4.0*  
*Last Updated: January 2025*  
*Engine Status: Production Ready + Comprehensive Level Creation System*  
*Asset Integration: 189+ SciFi Models + 62+ Nature Models*  
*Level System: Fully Mature with Best Practices*  
*Next Review: Based on new level creation and asset expansion*