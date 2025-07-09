import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';

/**
 * Restaurant Backroom Level - Refactored version using BaseLevel pattern
 * Horror-themed level with atmospheric storytelling
 */
export class RestaurantBackroom extends BaseLevel {
  private THREE: any;
  private roomModel: THREE.Group | null = null;
  private npcs: Map<string, THREE.Object3D> = new Map();
  private horrorEffects: THREE.Group | null = null;
  
  // Horror state
  private dialogueActive = false;
  private currentDialogue: string | null = null;
  
  constructor(engine: Engine, interactionSystem: InteractionSystem, levelId: string) {
    super(
      engine,
      interactionSystem,
      levelId,
      'Restaurant Backroom',
      'Investigate the cosmic horror backroom of a SciFi restaurant'
    );
    
    this.THREE = THREE;
  }
  
  /**
   * Create the horror restaurant environment
   */
  protected async createEnvironment(): Promise<void> {
    console.log('🍴 Creating Restaurant Backroom environment...');
    
    try {
      await this.createRoomStructure();
      await this.createKitchenEquipment();
      await this.createHorrorElements();
      
      console.log('✅ Restaurant Backroom environment created');
      
    } catch (error) {
      console.error('❌ Failed to create Restaurant Backroom environment:', error);
      throw error;
    }
  }
  
  /**
   * Set up dramatic horror lighting
   */
  protected async createLighting(): Promise<void> {
    console.log('💡 Creating Restaurant Backroom lighting...');
    
    try {
      // Red emergency lighting
      const redLight = new this.THREE.DirectionalLight(0xff2222, 0.8);
      redLight.position.set(5, 10, 5);
      redLight.castShadow = true;
      this.levelGroup.add(redLight);
      
      // Dim ambient lighting
      const ambientLight = new this.THREE.AmbientLight(0x220000, 0.1);
      this.levelGroup.add(ambientLight);
      
      // Flickering overhead lights
      this.createFlickeringOverheadLights();
      
      // Shadows for horror effect
      this.createDramaticShadows();
      
      console.log('✅ Restaurant Backroom lighting created');
      
    } catch (error) {
      console.error('❌ Failed to create Restaurant Backroom lighting:', error);
      throw error;
    }
  }
  
  /**
   * Set up NPC interactions and horror elements
   */
  protected async createInteractions(): Promise<void> {
    console.log('🎯 Creating Restaurant Backroom interactions...');
    
    try {
      await this.createStrappedCharacter();
      await this.createInteractiveObjects();
      await this.createHorrorTriggers();
      
      console.log('✅ Restaurant Backroom interactions created');
      
    } catch (error) {
      console.error('❌ Failed to create Restaurant Backroom interactions:', error);
      throw error;
    }
  }
  
  /**
   * Set up restaurant physics
   */
  protected async setupPhysics(): Promise<void> {
    if (!this.physicsWorld) return;
    
    console.log('⚡ Setting up Restaurant Backroom physics...');
    
    try {
      // Create restaurant floor
      this.physicsWorld.createRigidBody('restaurant-floor', {
        bodyType: 'static',
        colliderType: 'cuboid',
        position: new this.THREE.Vector3(0, 0, 0),
        rotation: new this.THREE.Quaternion(0, 0, 0, 1),
        scale: new this.THREE.Vector3(25, 1, 25),
        friction: 0.9,
        restitution: 0.0
      });
      
      console.log('✅ Restaurant Backroom physics set up');
      
    } catch (error) {
      console.error('❌ Failed to set up Restaurant Backroom physics:', error);
    }
  }
  
  /**
   * Called when level is ready
   */
  protected async onLevelReady(): Promise<void> {
    console.log('🎉 Restaurant Backroom level ready!');
    
    // Set camera position inside the backroom
    this.camera.position.set(15, 5, 20);
    this.camera.lookAt(0, 0, 0);
    
    // Start horror ambience
    this.startHorrorAmbience();
    
    // Emit ready event
    this.engine.getEventBus().emit('level.restaurant.ready', {
      levelId: this.levelId,
      levelName: this.levelName
    });
  }
  
  /**
   * Update level-specific logic
   */
  protected updateLevel(deltaTime: number): void {
    // Update horror effects
    this.updateHorrorEffects(deltaTime);
    
    // Update NPC behaviors
    this.updateNPCs(deltaTime);
    
    // Update atmospheric effects
    this.updateAtmosphere(deltaTime);
  }
  
  /**
   * Custom cleanup for Restaurant Backroom
   */
  protected onDispose(): void {
    console.log('🧹 Disposing Restaurant Backroom systems...');
    
    // Clear NPCs
    this.npcs.clear();
    
    // Reset dialogue state
    this.dialogueActive = false;
    this.currentDialogue = null;
    
    console.log('✅ Restaurant Backroom systems disposed');
  }
  
  // Implementation methods
  
  private async createRoomStructure(): Promise<void> {
    console.log('Creating restaurant room structure...');
    
    // Create walls
    const wallGeometry = new this.THREE.BoxGeometry(1, 8, 25);
    const wallMaterial = new this.THREE.MeshBasicMaterial({ color: 0x444444 });
    
    // Left wall
    const leftWall = new this.THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-12, 4, 0);
    this.levelGroup.add(leftWall);
    
    // Right wall
    const rightWall = new this.THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(12, 4, 0);
    this.levelGroup.add(rightWall);
    
    // Back wall
    const backWallGeometry = new this.THREE.BoxGeometry(25, 8, 1);
    const backWall = new this.THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 4, -12);
    this.levelGroup.add(backWall);
    
    // Floor
    const floorGeometry = new this.THREE.PlaneGeometry(25, 25);
    const floorMaterial = new this.THREE.MeshBasicMaterial({ color: 0x222222 });
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.levelGroup.add(floor);
  }
  
  private async createKitchenEquipment(): Promise<void> {
    console.log('Creating kitchen equipment...');
    
    // Create prep table
    const tableGeometry = new this.THREE.BoxGeometry(4, 1, 2);
    const tableMaterial = new this.THREE.MeshBasicMaterial({ color: 0x666666 });
    const table = new this.THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 0.5, 0);
    this.levelGroup.add(table);
    
    // Create industrial equipment
    for (let i = 0; i < 3; i++) {
      const equipment = new this.THREE.BoxGeometry(2, 3, 1);
      const equipmentMaterial = new this.THREE.MeshBasicMaterial({ color: 0x555555 });
      const equipmentMesh = new this.THREE.Mesh(equipment, equipmentMaterial);
      
      equipmentMesh.position.set(-8 + i * 4, 1.5, -8);
      this.levelGroup.add(equipmentMesh);
    }
  }
  
  private async createHorrorElements(): Promise<void> {
    console.log('Creating horror elements...');
    
    this.horrorEffects = new this.THREE.Group();
    
    // Create eerie shadows
    this.createEerieShadows();
    
    // Create unsettling decorations
    this.createUnsettlingDecorations();
    
    this.levelGroup.add(this.horrorEffects);
  }
  
  private createFlickeringOverheadLights(): void {
    // Create flickering fluorescent lights
    for (let i = 0; i < 3; i++) {
      const light = new this.THREE.PointLight(0xffffff, 0.3, 15);
      light.position.set(-6 + i * 6, 7, 0);
      
      light.userData = {
        flickerSpeed: 1 + Math.random() * 3,
        baseIntensity: 0.3,
        time: 0,
        isFlickering: Math.random() > 0.5
      };
      
      this.levelGroup.add(light);
    }
  }
  
  private createDramaticShadows(): void {
    // Create dramatic shadow casting objects
    const shadowCasters = [];
    
    for (let i = 0; i < 5; i++) {
      const caster = new this.THREE.BoxGeometry(0.5, 6, 0.5);
      const casterMaterial = new this.THREE.MeshBasicMaterial({ color: 0x000000 });
      const casterMesh = new this.THREE.Mesh(caster, casterMaterial);
      
      casterMesh.position.set(
        (Math.random() - 0.5) * 20,
        3,
        (Math.random() - 0.5) * 20
      );
      
      this.levelGroup.add(casterMesh);
      shadowCasters.push(casterMesh);
    }
  }
  
  private async createStrappedCharacter(): Promise<void> {
    console.log('Creating strapped character NPC...');
    
    // Create a simple character representation
    const characterGeometry = new this.THREE.CapsuleGeometry(0.5, 2);
    const characterMaterial = new this.THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const character = new this.THREE.Mesh(characterGeometry, characterMaterial);
    
    character.position.set(5, 1, -5);
    character.userData = {
      type: 'strapped_character',
      dialogue: [
        "The Hamburgler... he was here...",
        "I know where he went...",
        "But first... you must help me..."
      ],
      currentDialogueIndex: 0,
      isInteractable: true
    };
    
    this.npcs.set('strapped_character', character);
    this.levelGroup.add(character);
  }
  
  private async createInteractiveObjects(): Promise<void> {
    console.log('Creating interactive objects...');
    
    // Create investigative clues
    const clueGeometry = new this.THREE.SphereGeometry(0.3);
    const clueMaterial = new this.THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    for (let i = 0; i < 3; i++) {
      const clue = new this.THREE.Mesh(clueGeometry, clueMaterial);
      clue.position.set(
        (Math.random() - 0.5) * 15,
        0.5,
        (Math.random() - 0.5) * 15
      );
      
      clue.userData = {
        type: 'clue',
        id: `clue_${i}`,
        message: `Clue ${i + 1}: Evidence of the Hamburgler's presence...`
      };
      
      this.levelGroup.add(clue);
    }
  }
  
  private async createHorrorTriggers(): Promise<void> {
    console.log('Creating horror triggers...');
    
    // Create invisible trigger zones for horror events
    const triggerGeometry = new this.THREE.BoxGeometry(3, 3, 3);
    const triggerMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0 // Invisible
    });
    
    for (let i = 0; i < 2; i++) {
      const trigger = new this.THREE.Mesh(triggerGeometry, triggerMaterial);
      trigger.position.set(
        (Math.random() - 0.5) * 10,
        1.5,
        (Math.random() - 0.5) * 10
      );
      
      trigger.userData = {
        type: 'horror_trigger',
        id: `trigger_${i}`,
        triggered: false
      };
      
      this.levelGroup.add(trigger);
    }
  }
  
  private createEerieShadows(): void {
    // Create moving shadow effects
    const shadowGeometry = new this.THREE.PlaneGeometry(2, 8);
    const shadowMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 4; i++) {
      const shadow = new this.THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.position.set(
        (Math.random() - 0.5) * 15,
        4,
        (Math.random() - 0.5) * 15
      );
      
      shadow.userData = {
        type: 'eerie_shadow',
        moveSpeed: 0.1 + Math.random() * 0.2,
        direction: Math.random() * Math.PI * 2
      };
      
      this.horrorEffects!.add(shadow);
    }
  }
  
  private createUnsettlingDecorations(): void {
    // Create unsettling decorative elements
    const decorations = ['strange_stains', 'broken_equipment', 'mysterious_symbols'];
    
    decorations.forEach((decoration, index) => {
      const decorGeometry = new this.THREE.BoxGeometry(1, 0.1, 1);
      const decorMaterial = new this.THREE.MeshBasicMaterial({ 
        color: 0x440000 + index * 0x001100
      });
      
      const decor = new this.THREE.Mesh(decorGeometry, decorMaterial);
      decor.position.set(
        (Math.random() - 0.5) * 18,
        0.05,
        (Math.random() - 0.5) * 18
      );
      
      this.horrorEffects!.add(decor);
    });
  }
  
  private updateHorrorEffects(deltaTime: number): void {
    if (!this.horrorEffects) return;
    
    // Update flickering lights
    this.levelGroup.children.forEach(child => {
      if (child instanceof this.THREE.PointLight && child.userData.isFlickering) {
        child.userData.time += deltaTime;
        if (child.userData.time > 1 / child.userData.flickerSpeed) {
          child.userData.time = 0;
          child.intensity = child.userData.baseIntensity * (0.5 + Math.random() * 0.8);
        }
      }
    });
    
    // Update moving shadows
    this.horrorEffects.children.forEach(child => {
      if (child.userData.type === 'eerie_shadow') {
        child.position.x += Math.cos(child.userData.direction) * child.userData.moveSpeed * deltaTime;
        child.position.z += Math.sin(child.userData.direction) * child.userData.moveSpeed * deltaTime;
        
        // Reverse direction at boundaries
        if (Math.abs(child.position.x) > 10 || Math.abs(child.position.z) > 10) {
          child.userData.direction += Math.PI;
        }
      }
    });
  }
  
  private updateNPCs(deltaTime: number): void {
    // Update NPC behaviors
    this.npcs.forEach((npc, id) => {
      if (npc.userData.type === 'strapped_character') {
        // Simple breathing animation
        npc.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      }
    });
  }
  
  private updateAtmosphere(deltaTime: number): void {
    // Update atmospheric effects like fog, particles, etc.
    // This would be expanded with more sophisticated effects
  }
  
  private startHorrorAmbience(): void {
    // Start horror ambient sounds when audio is enabled
    if (this.engine.getAudioManager()) {
      console.log('Starting horror ambience...');
    }
  }
  
  // Public API
  
  public startDialogue(npcId: string): void {
    const npc = this.npcs.get(npcId);
    if (npc && npc.userData.dialogue) {
      this.dialogueActive = true;
      this.currentDialogue = npc.userData.dialogue[npc.userData.currentDialogueIndex];
      npc.userData.currentDialogueIndex = (npc.userData.currentDialogueIndex + 1) % npc.userData.dialogue.length;
    }
  }
  
  public getCurrentDialogue(): string | null {
    return this.currentDialogue;
  }
  
  public endDialogue(): void {
    this.dialogueActive = false;
    this.currentDialogue = null;
  }
  
  public isDialogueActive(): boolean {
    return this.dialogueActive;
  }
  
  public getHorrorLevel(): number {
    // Return a horror intensity level based on player actions
    return Math.min(1.0, this.foundNotes.size / 5);
  }
  
  private foundNotes: Set<string> = new Set();
  
  public investigateClue(clueId: string): string | null {
    const clue = this.levelGroup.children.find(child => 
      child.userData?.type === 'clue' && child.userData?.id === clueId
    );
    
    if (clue) {
      this.foundNotes.add(clueId);
      return clue.userData.message;
    }
    
    return null;
  }
}