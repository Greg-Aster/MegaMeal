// Enhanced Level loading and management system - Data-Driven Architecture
import type { MovementConfig } from '../../engine/components/MovementTypes';

export interface TerrainConfig {
  type: 'procedural_island' | 'scifi_room' | 'heightmap' | 'flat';
  generator: string; // Component class name
  parameters: Record<string, any>; // Generator-specific config
}

export interface EnvironmentConfig {
  skybox?: string;
  lighting: {
    type: 'atmospheric' | 'dramatic' | 'bright' | 'emergency' | 'hdri_only';
    config: Record<string, any>;
  };
  effects?: Array<{
    type: 'fireflies' | 'particles' | 'fog' | 'weather';
    config: Record<string, any>;
  }>;
  fog?: { color: string; density: number }; // Legacy support
}

export interface MovementSystemConfig {
  terrainFollowing: boolean;
  boundaryType: 'circular' | 'rectangular' | 'none';
  boundaryConfig?: Record<string, any>;
  spawnPoint: [number, number, number];
  movementConfig: Partial<MovementConfig>;
}

export interface SystemConfig {
  type: string; // Component class name
  config: Record<string, any>; // System-specific configuration
}

export interface AssetConfig {
  models?: Array<{ id: string; path: string; position: [number, number, number] }>;
  textures?: Array<{ id: string; path: string }>;
  audio?: Array<{ id: string; path: string }>;
}

export interface PhysicsConfig {
  autoGenerate: boolean;
  gravity: [number, number, number];
  customColliders?: Array<any>; // TODO: Define PhysicsColliderConfig
}

export interface LevelConfig {
  // Core Identity
  id: string;
  name: string;
  description?: string;
  
  // Environment Configuration
  terrain: TerrainConfig;
  environment: EnvironmentConfig;
  
  // Movement Configuration
  movement: MovementSystemConfig;
  
  // Interactive Systems
  systems: SystemConfig[];
  
  // Asset References
  assets?: AssetConfig;
  
  // Physics Configuration
  physics: PhysicsConfig;
  
  // Legacy support
  entities?: any[];
}

export interface ComponentRegistry {
  [key: string]: any; // Component constructor functions
}

export class LevelSystem {
  private currentLevel: LevelConfig | null = null;
  private componentRegistry: ComponentRegistry = {};
  private initializationPromise: Promise<void>;
  
  constructor() {
    this.initializationPromise = this.initializeDefaultComponents();
  }
  
  /**
   * Register available components for dynamic loading
   */
  private async initializeDefaultComponents(): Promise<void> {
    // Register existing components dynamically
    try {
      const { ObservatoryEnvironment } = await import('../levels/ObservatoryEnvironment');
      this.registerComponent('ObservatoryEnvironment', ObservatoryEnvironment);
    } catch (error) {
      console.warn('Failed to register ObservatoryEnvironment:', error);
    }
    
    try {
      const { RoomFactory } = await import('../systems/RoomFactory');
      this.registerComponent('RoomFactory', RoomFactory);
    } catch (error) {
      console.warn('Failed to register RoomFactory:', error);
    }
    
    try {
      const { StarNavigationSystem } = await import('../systems/StarNavigationSystem');
      this.registerComponent('StarNavigationSystem', StarNavigationSystem);
    } catch (error) {
      console.warn('Failed to register StarNavigationSystem:', error);
    }
    
    try {
      const { AtmosphericEffects } = await import('../systems/AtmosphericEffects');
      this.registerComponent('AtmosphericEffects', AtmosphericEffects);
    } catch (error) {
      console.warn('Failed to register AtmosphericEffects:', error);
    }
    
    try {
      const { MirandaShipSystem } = await import('../systems/MirandaShipSystem');
      this.registerComponent('MirandaShipSystem', MirandaShipSystem);
    } catch (error) {
      console.warn('Failed to register MirandaShipSystem:', error);
    }

    // Register built-in terrain generators
    this.registerComponent('DataDrivenTerrain', { name: 'DataDrivenTerrain', builtin: true });

    // Register new components for data-driven levels
    this.registerComponent('SpaceEnvironmentSystem', this.createSpaceEnvironmentSystem());
    this.registerComponent('InteractiveTerminalSystem', this.createInteractiveTerminalSystem());
    this.registerComponent('StorySystem', this.createStorySystem());
    this.registerComponent('NPCSystem', this.createNPCSystem());
    this.registerComponent('FurnitureSystem', this.createFurnitureSystem());
    this.registerComponent('DialogueSystem', this.createDialogueSystem());
    this.registerComponent('PortalSystem', this.createPortalSystem());
    
    // Register Miranda-specific components (from separate files)
    try {
      const { ShipTerminalSystem } = await import('../components/ShipTerminalSystem');
      this.registerComponent('ShipTerminalSystem', ShipTerminalSystem);
    } catch (error) {
      console.warn('Failed to register ShipTerminalSystem:', error);
    }
    
    try {
      const { MirandaStorySystem } = await import('../components/MirandaStorySystem');
      this.registerComponent('MirandaStorySystem', MirandaStorySystem);
    } catch (error) {
      console.warn('Failed to register MirandaStorySystem:', error);
    }
    
    try {
      const { AtmosphericAudioSystem } = await import('../components/AtmosphericAudioSystem');
      this.registerComponent('AtmosphericAudioSystem', AtmosphericAudioSystem);
    } catch (error) {
      console.warn('Failed to register AtmosphericAudioSystem:', error);
    }
    
    try {
      const { ShipPropsSystem } = await import('../components/ShipPropsSystem');
      this.registerComponent('ShipPropsSystem', ShipPropsSystem);
    } catch (error) {
      console.warn('Failed to register ShipPropsSystem:', error);
    }
  }
  
  /**
   * Wait for component registration to complete
   */
  public async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
  }
  
  /**
   * Register a component for use in level configurations
   */
  public registerComponent(name: string, componentClass: any): void {
    this.componentRegistry[name] = componentClass;
    console.log(`📦 Registered component: ${name}`);
  }
  
  /**
   * Get a component constructor by name
   */
  public getComponent(name: string): any {
    const component = this.componentRegistry[name];
    if (!component) {
      console.warn(`⚠️ Component '${name}' not found in registry`);
      return null;
    }
    return component;
  }
  
  /**
   * Load level from configuration
   */
  public async loadLevel(config: LevelConfig): Promise<void> {
    console.log(`🎮 Loading data-driven level: ${config.name}`);
    
    // Wait for component registration to complete
    await this.initializationPromise;
    
    // Validate configuration
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid level configuration: ${config.id}`);
    }
    
    this.currentLevel = config;
    console.log(`✅ Level configuration loaded: ${config.name}`);
  }
  
  /**
   * Validate level configuration
   */
  private validateConfig(config: LevelConfig): boolean {
    // Basic validation
    if (!config.id || !config.name) {
      console.error('❌ Level config missing id or name');
      return false;
    }
    
    if (!config.terrain || !config.terrain.type) {
      console.error('❌ Level config missing terrain configuration');
      return false;
    }
    
    if (!config.movement || !config.movement.spawnPoint) {
      console.error('❌ Level config missing movement configuration');
      return false;
    }
    
    // Check if required components are registered
    const requiredComponent = config.terrain.generator;
    if (!this.getComponent(requiredComponent)) {
      console.error(`❌ Required component '${requiredComponent}' not registered`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get current level configuration
   */
  public getCurrentLevel(): LevelConfig | null {
    return this.currentLevel;
  }
  
  /**
   * Get list of registered components
   */
  public getRegisteredComponents(): string[] {
    return Object.keys(this.componentRegistry);
  }
  
  /**
   * Dispose of the level system
   */
  public dispose(): void {
    this.currentLevel = null;
    console.log('🧹 LevelSystem disposed');
  }

  // Component factory methods for data-driven levels
  
  private createSpaceEnvironmentSystem = () => {
    return class SpaceEnvironmentSystem {
      constructor(private THREE: any, private scene: any, private levelGroup: any, private assetLoader: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('🚀 Creating space environment...', config);
        
        // Create starfield background
        const starGeometry = new this.THREE.SphereGeometry(config.starfieldRadius || 1000, 32, 32);
        const starMaterial = new this.THREE.MeshBasicMaterial({ 
          color: config.spaceColor || 0x000011,
          side: this.THREE.BackSide
        });
        const starSphere = new this.THREE.Mesh(starGeometry, starMaterial);
        this.levelGroup.add(starSphere);
        
        // Create debris field
        for (let i = 0; i < (config.debrisCount || 20); i++) {
          const debris = new this.THREE.BoxGeometry(1, 1, 1);
          const material = new this.THREE.MeshBasicMaterial({ color: 0x444444 });
          const mesh = new this.THREE.Mesh(debris, material);
          
          mesh.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 100
          );
          
          this.levelGroup.add(mesh);
        }
      }
      
      update(deltaTime: number): void {}
      dispose(): void {}
    };
  };

  private createInteractiveTerminalSystem = () => {
    return class InteractiveTerminalSystem {
      constructor(private THREE: any, private scene: any, private levelGroup: any, private interactionSystem: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('💻 Creating interactive terminals...', config);
        
        if (config.terminals) {
          for (const terminal of config.terminals) {
            // Create simple terminal representation
            const terminalGeometry = new this.THREE.BoxGeometry(1, 1.5, 0.3);
            const terminalMaterial = new this.THREE.MeshStandardMaterial({ color: 0x333333 });
            const terminalMesh = new this.THREE.Mesh(terminalGeometry, terminalMaterial);
            
            terminalMesh.position.set(...terminal.position);
            this.levelGroup.add(terminalMesh);
            
            // Register interaction
            this.interactionSystem.registerInteractable({
              id: terminal.id,
              mesh: terminalMesh,
              type: 'button',
              data: { message: terminal.data },
              onInteract: () => {
                console.log('Terminal accessed:', terminal.data);
              }
            });
          }
        }
      }
      
      update(deltaTime: number): void {}
      dispose(): void {}
    };
  };

  private createStorySystem = () => {
    return class StorySystem {
      constructor(private THREE: any, private scene: any, private levelGroup: any, private interactionSystem: any, private eventBus: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('📖 Creating story system...', config);
        
        // Create captain's logs
        if (config.captainsLogs) {
          for (const log of config.captainsLogs) {
            const logGeometry = new this.THREE.BoxGeometry(0.3, 0.1, 0.2);
            const logMaterial = new this.THREE.MeshStandardMaterial({ color: 0x0066cc });
            const logMesh = new this.THREE.Mesh(logGeometry, logMaterial);
            
            logMesh.position.set(...log.position);
            this.levelGroup.add(logMesh);
            
            this.interactionSystem.registerInteractable({
              id: log.id,
              mesh: logMesh,
              type: 'button',
              data: { content: log.content },
              onInteract: () => {
                console.log('Found note:', log.content);
                this.eventBus.emit('story.note_found', { noteId: log.id, content: log.content });
              }
            });
          }
        }
        
        // Create safe interaction
        if (config.safeInteraction) {
          const safe = config.safeInteraction;
          const safeGeometry = new this.THREE.BoxGeometry(1, 1, 0.5);
          const safeMaterial = new this.THREE.MeshStandardMaterial({ color: 0x555555 });
          const safeMesh = new this.THREE.Mesh(safeGeometry, safeMaterial);
          
          safeMesh.position.set(...safe.position);
          this.levelGroup.add(safeMesh);
          
          this.interactionSystem.registerInteractable({
            id: safe.id,
            mesh: safeMesh,
            type: 'button',
            data: { recipe: safe.recipe },
            onInteract: () => {
              console.log('Safe opened! Found recipe:', safe.recipe);
              this.eventBus.emit('story.safe_opened', { recipe: safe.recipe });
            }
          });
        }
      }
      
      update(deltaTime: number): void {}
      dispose(): void {}
    };
  };

  private createNPCSystem = () => {
    return class NPCSystem {
      constructor(private THREE: any, private scene: any, private levelGroup: any, private interactionSystem: any, private eventBus: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('👥 Creating NPC system...', config);
        
        if (config.npcs) {
          for (const npc of config.npcs) {
            const npcGroup = this.createCorndogMascot(npc);
            npcGroup.position.set(...npc.position);
            this.levelGroup.add(npcGroup);
            
            this.interactionSystem.registerInteractable({
              id: npc.id,
              mesh: npcGroup,
              type: 'button',
              data: { dialogue: npc.dialogue },
              onInteract: () => {
                console.log('NPC interaction:', npc.dialogue.greeting);
                this.eventBus.emit('dialogue.show', {
                  text: npc.dialogue.greeting,
                  speaker: npc.name,
                  duration: 3000
                });
              }
            });
          }
        }
      }
      
      private createCorndogMascot(npc: any): any {
        const mascotGroup = new this.THREE.Group();
        
        // Body (corndog shape)
        const bodyGeometry = new this.THREE.CapsuleGeometry(0.4, 1.5);
        const bodyMaterial = new this.THREE.MeshStandardMaterial({
          color: 0xdaa520,
          roughness: 0.8,
          metalness: 0.0
        });
        
        const body = new this.THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        body.receiveShadow = true;
        mascotGroup.add(body);
        
        // Head
        const headGeometry = new this.THREE.SphereGeometry(0.3);
        const headMaterial = new this.THREE.MeshStandardMaterial({
          color: 0xb8860b,
          roughness: 0.7,
          metalness: 0.0
        });
        
        const head = new this.THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        head.receiveShadow = true;
        mascotGroup.add(head);
        
        return mascotGroup;
      }
      
      update(deltaTime: number): void {}
      dispose(): void {}
    };
  };

  private createFurnitureSystem = () => {
    return class FurnitureSystem {
      constructor(private THREE: any, private scene: any, private levelGroup: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('🪑 Creating furniture system...', config);
        
        if (config.furniture) {
          for (const item of config.furniture) {
            if (item.type === 'table') {
              // Create butcher block
              const blockGeometry = new this.THREE.BoxGeometry(...item.size);
              const blockMaterial = new this.THREE.MeshStandardMaterial({
                color: item.color,
                roughness: 0.9,
                metalness: 0.0
              });
              
              const block = new this.THREE.Mesh(blockGeometry, blockMaterial);
              block.position.set(...item.position);
              block.castShadow = true;
              block.receiveShadow = true;
              this.levelGroup.add(block);
              
              // Add legs if specified
              if (item.legs?.enabled) {
                const legGeometry = new this.THREE.BoxGeometry(...item.legs.size);
                const legMaterial = new this.THREE.MeshStandardMaterial({
                  color: 0x654321,
                  roughness: 0.8,
                  metalness: 0.0
                });
                
                for (const legPos of item.legs.positions) {
                  const leg = new this.THREE.Mesh(legGeometry, legMaterial);
                  leg.position.set(...legPos);
                  leg.castShadow = true;
                  leg.receiveShadow = true;
                  this.levelGroup.add(leg);
                }
              }
            }
          }
        }
      }
      
      update(deltaTime: number): void {}
      dispose(): void {}
    };
  };

  private createDialogueSystem = () => {
    return class DialogueSystem {
      constructor(private eventBus: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('💬 Creating dialogue system...', config);
        // Dialogue system is mainly UI-driven, handled by EventBus
      }
      
      update(deltaTime: number): void {}
      dispose(): void {}
    };
  };

  private createPortalSystem = () => {
    return class PortalSystem {
      constructor(private THREE: any, private scene: any, private levelGroup: any, private interactionSystem: any, private eventBus: any) {}
      
      async initialize(config: any): Promise<void> {
        console.log('🌀 Creating portal system...', config);
        
        if (config.portals) {
          for (const portal of config.portals) {
            // Create portal visual
            const portalGeometry = new this.THREE.SphereGeometry(portal.size || 2, 32, 16);
            const portalMaterial = new this.THREE.MeshBasicMaterial({
              color: portal.color || 0x00ffff,
              transparent: true,
              opacity: 0.5,
              wireframe: true,
            });
            const portalMesh = new this.THREE.Mesh(portalGeometry, portalMaterial);
            portalMesh.position.set(...portal.position);
            this.levelGroup.add(portalMesh);

            // Add glow effect
            const portalLight = new this.THREE.PointLight(portal.color || 0x00ffff, 1, 15);
            portalMesh.add(portalLight);

            // Register interaction with proper interface
            const { InteractionType } = await import('../../engine/interfaces/InteractableObject');
            
            const interactableObj = {
              id: portal.id,
              mesh: portalMesh,
              interactionRadius: 3,
              isInteractable: true,
              interactionType: InteractionType.CLICK,
              onInteract: (_interactionData: any) => {
                console.log('Portal activated:', portal.message);
                this.eventBus.emit('level.transition.request', {
                  levelId: portal.targetLevel,
                });
              },
              getInteractionPrompt: () => portal.message,
              getInteractionData: () => ({
                id: portal.id,
                name: portal.message,
                description: `Portal to ${portal.targetLevel}`,
                interactionType: InteractionType.CLICK,
                interactionRadius: 3,
                isInteractable: true,
                tags: ['portal', 'transportation'],
                userData: { message: portal.message, targetLevel: portal.targetLevel }
              })
            };
            
            this.interactionSystem.registerInteractable(interactableObj);
          }
        }
      }
      
      update(_deltaTime: number): void {}
      dispose(): void {}
    };
  };

}