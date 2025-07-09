import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';

/**
 * Miranda Ship Level - Refactored version using BaseLevel pattern
 * Investigation level with environmental storytelling
 */
export class MirandaShip extends BaseLevel {
  private THREE: any;
  private shipModel: THREE.Group | null = null;
  private interactiveObjects: Map<string, THREE.Object3D> = new Map();
  
  // Story state
  private foundNotes: Set<string> = new Set();
  private safeOpened = false;
  
  // Callbacks
  private onNoteFoundCallback?: (noteId: string, content: string) => void;
  private onSafeOpenedCallback?: (recipe: any) => void;
  
  constructor(engine: Engine, interactionSystem: InteractionSystem, levelId: string) {
    super(
      engine,
      interactionSystem,
      levelId,
      'Miranda Ship Debris Field',
      'Investigate the mysterious debris field and uncover the secrets of the Perfect Mary recipe'
    );
    
    this.THREE = THREE;
  }
  
  /**
   * Create the ship environment
   */
  protected async createEnvironment(): Promise<void> {
    console.log('🚀 Creating Miranda Ship environment...');
    
    try {
      await this.loadShipModel();
      await this.createDebrisField();
      await this.createSpaceEnvironment();
      
      console.log('✅ Miranda Ship environment created');
      
    } catch (error) {
      console.error('❌ Failed to create Miranda Ship environment:', error);
      throw error;
    }
  }
  
  /**
   * Set up dramatic ship lighting
   */
  protected async createLighting(): Promise<void> {
    console.log('💡 Creating Miranda Ship lighting...');
    
    try {
      // Emergency lighting
      const emergencyLight = new this.THREE.DirectionalLight(0xff4444, 0.5);
      emergencyLight.position.set(10, 10, 10);
      emergencyLight.castShadow = true;
      this.levelGroup.add(emergencyLight);
      
      // Ambient space lighting
      const ambientLight = new this.THREE.AmbientLight(0x112244, 0.2);
      this.levelGroup.add(ambientLight);
      
      // Flickering ship lights
      this.createFlickeringLights();
      
      console.log('✅ Miranda Ship lighting created');
      
    } catch (error) {
      console.error('❌ Failed to create Miranda Ship lighting:', error);
      throw error;
    }
  }
  
  /**
   * Set up interactive story elements
   */
  protected async createInteractions(): Promise<void> {
    console.log('🎯 Creating Miranda Ship interactions...');
    
    try {
      await this.createInteractiveTerminals();
      await this.createCaptainsLogs();
      await this.createSafeInteraction();
      
      console.log('✅ Miranda Ship interactions created');
      
    } catch (error) {
      console.error('❌ Failed to create Miranda Ship interactions:', error);
      throw error;
    }
  }
  
  /**
   * Set up ship physics
   */
  protected async setupPhysics(): Promise<void> {
    if (!this.physicsWorld) return;
    
    console.log('⚡ Setting up Miranda Ship physics...');
    
    try {
      // Create ship floor collision
      this.physicsWorld.createRigidBody('ship-floor', {
        bodyType: 'static',
        colliderType: 'cuboid',
        position: new this.THREE.Vector3(0, 0, 0),
        rotation: new this.THREE.Quaternion(0, 0, 0, 1),
        scale: new this.THREE.Vector3(50, 1, 30),
        friction: 0.8,
        restitution: 0.1
      });
      
      console.log('✅ Miranda Ship physics set up');
      
    } catch (error) {
      console.error('❌ Failed to set up Miranda Ship physics:', error);
    }
  }
  
  /**
   * Called when level is ready
   */
  protected async onLevelReady(): Promise<void> {
    console.log('🎉 Miranda Ship level ready!');
    
    // Set camera position inside the ship
    this.camera.position.set(40, 8, 15);
    this.camera.lookAt(0, 0, 0);
    
    // Start ambient ship sounds (when audio is enabled)
    this.startAmbientSounds();
    
    // Emit ready event
    this.engine.getEventBus().emit('level.miranda.ready', {
      levelId: this.levelId,
      levelName: this.levelName
    });
  }
  
  /**
   * Update level-specific logic
   */
  protected updateLevel(deltaTime: number): void {
    // Update flickering lights
    this.updateFlickeringLights(deltaTime);
    
    // Check for story interactions
    this.checkStoryInteractions();
    
    // Update ship systems
    this.updateShipSystems(deltaTime);
  }
  
  /**
   * Custom cleanup for Miranda Ship
   */
  protected onDispose(): void {
    console.log('🧹 Disposing Miranda Ship systems...');
    
    // Clear story state
    this.foundNotes.clear();
    this.safeOpened = false;
    
    // Clear interactive objects
    this.interactiveObjects.clear();
    
    // Clear callbacks
    this.onNoteFoundCallback = undefined;
    this.onSafeOpenedCallback = undefined;
    
    console.log('✅ Miranda Ship systems disposed');
  }
  
  // Implementation methods (simplified for demo)
  
  private async loadShipModel(): Promise<void> {
    // Load ship model from assets
    // This would use the ModelLibrary system
    console.log('Loading ship model...');
  }
  
  private async createDebrisField(): Promise<void> {
    console.log('Creating debris field...');
    
    // Create floating debris around the ship
    for (let i = 0; i < 20; i++) {
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
  
  private async createSpaceEnvironment(): Promise<void> {
    console.log('Creating space environment...');
    
    // Create starfield background
    const starGeometry = new this.THREE.SphereGeometry(1000, 32, 32);
    const starMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0x000011,
      side: this.THREE.BackSide
    });
    const starSphere = new this.THREE.Mesh(starGeometry, starMaterial);
    
    this.levelGroup.add(starSphere);
  }
  
  private createFlickeringLights(): void {
    // Create flickering emergency lights
    for (let i = 0; i < 5; i++) {
      const light = new this.THREE.PointLight(0xff4444, 0.5, 20);
      light.position.set(
        (Math.random() - 0.5) * 40,
        5 + Math.random() * 5,
        (Math.random() - 0.5) * 20
      );
      
      light.userData = { 
        flickerSpeed: 0.5 + Math.random() * 2,
        baseIntensity: 0.5,
        time: 0
      };
      
      this.levelGroup.add(light);
    }
  }
  
  private updateFlickeringLights(deltaTime: number): void {
    this.levelGroup.children.forEach(child => {
      if (child instanceof this.THREE.PointLight && child.userData.flickerSpeed) {
        child.userData.time += deltaTime;
        const flicker = Math.sin(child.userData.time * child.userData.flickerSpeed) * 0.3 + 0.7;
        child.intensity = child.userData.baseIntensity * flicker;
      }
    });
  }
  
  private async createInteractiveTerminals(): Promise<void> {
    console.log('Creating interactive terminals...');
    // Create computer terminals that can be interacted with
  }
  
  private async createCaptainsLogs(): Promise<void> {
    console.log('Creating captain\'s logs...');
    // Create discoverable story elements
  }
  
  private async createSafeInteraction(): Promise<void> {
    console.log('Creating safe interaction...');
    // Create the safe that contains the Perfect Mary recipe
  }
  
  private checkStoryInteractions(): void {
    // Check if player is near story elements
    const playerPos = this.camera.position;
    
    // Simplified interaction checking
    this.interactiveObjects.forEach((object, id) => {
      const distance = playerPos.distanceTo(object.position);
      if (distance < 5) {
        // Player is near an interactive object
        this.handleStoryInteraction(id, object);
      }
    });
  }
  
  private handleStoryInteraction(id: string, object: THREE.Object3D): void {
    if (id.startsWith('note-') && !this.foundNotes.has(id)) {
      this.foundNotes.add(id);
      const noteContent = `Captain's Log ${id.replace('note-', '')}: Investigation continues...`;
      
      if (this.onNoteFoundCallback) {
        this.onNoteFoundCallback(id, noteContent);
      }
    } else if (id === 'safe' && !this.safeOpened) {
      this.safeOpened = true;
      const recipe = { name: 'Perfect Mary', ingredients: ['Secret ingredient'] };
      
      if (this.onSafeOpenedCallback) {
        this.onSafeOpenedCallback(recipe);
      }
    }
  }
  
  private updateShipSystems(deltaTime: number): void {
    // Update ship system animations
  }
  
  private startAmbientSounds(): void {
    // Start ambient ship sounds when audio is enabled
    if (this.engine.getAudioManager()) {
      console.log('Starting ambient ship sounds...');
    }
  }
  
  // Public API
  
  public onNoteFound(callback: (noteId: string, content: string) => void): void {
    this.onNoteFoundCallback = callback;
  }
  
  public onSafeOpened(callback: (recipe: any) => void): void {
    this.onSafeOpenedCallback = callback;
  }
  
  public checkInteraction(position: THREE.Vector3): any {
    // Check if player can interact with nearby objects
    const nearbyObjects = Array.from(this.interactiveObjects.entries())
      .filter(([id, obj]) => position.distanceTo(obj.position) < 5);
    
    if (nearbyObjects.length > 0) {
      return {
        type: 'interaction',
        objectId: nearbyObjects[0][0],
        distance: position.distanceTo(nearbyObjects[0][1].position)
      };
    }
    
    return null;
  }
  
  public getStoryProgress(): any {
    return {
      notesFound: this.foundNotes.size,
      safeOpened: this.safeOpened,
      totalNotes: 5 // Example total
    };
  }
}