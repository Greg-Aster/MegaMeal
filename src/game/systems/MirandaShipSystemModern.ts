import * as THREE from 'three';
import { BaseLevelGenerator, type LevelGeneratorDependencies } from '../interfaces/ILevelGenerator';
import { ResourceManager } from '../../engine/utils/ResourceManager';

// Import spaceship-specific systems
import { AtmosphericAudioSystem } from '../components/AtmosphericAudioSystem';
import { ShipPropsSystem } from '../components/ShipPropsSystem';
import { MirandaStorySystem } from '../components/MirandaStorySystem';

export interface MirandaShipConfig {
  type: string;
  ship_layout?: any;
  story_elements?: any;
  atmospheric_audio?: any;
  ship_props?: any;
  environment?: any;
}

/**
 * Miranda Ship System - Handles spaceship interior creation for Miranda investigation level
 * Now uses standardized interface and is self-sufficient
 */
export class MirandaShipSystemModern extends BaseLevelGenerator {
  // Spaceship systems
  private atmosphericAudio!: AtmosphericAudioSystem;
  private shipProps!: ShipPropsSystem;
  private mirandaStory!: MirandaStorySystem;
  
  private spaceshipObjects: THREE.Object3D[] = [];
  private spaceshipLights: THREE.Light[] = [];
  private animationCleanups: (() => void)[] = [];
  
  constructor(dependencies: LevelGeneratorDependencies) {
    super(dependencies);
    console.log('🚀 MirandaShipSystemModern created with standardized interface');
  }
  
  async initialize(config: MirandaShipConfig): Promise<void> {
    console.log('🚀 Initializing Miranda Ship System...', config);
    
    try {
      // Setup spaceship environment
      await this.setupSpaceshipEnvironment();
      
      // Initialize spaceship subsystems
      await this.initializeShipSystems();
      
      // Build ship interior
      await this.buildShipInterior();
      
      // Setup story elements
      await this.setupStoryElements(config.story_elements);
      
      // Setup atmospheric audio
      await this.setupAtmosphericAudio(config.atmospheric_audio);
      
      console.log('✅ Miranda Ship System initialized successfully');
      
      // Emit level ready event
      this.dependencies.eventBus.emit('level.ready', {
        name: 'Miranda Investigation Bridge',
        description: 'Bridge of Captain Zhao\'s salvage vessel investigating the Miranda incident'
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Miranda Ship System:', error);
      throw error;
    }
  }
  
  public update(deltaTime: number): void {
    // Update subsystems
    this.atmosphericAudio?.update(deltaTime);
    this.shipProps?.update(deltaTime);
    this.mirandaStory?.update(deltaTime);
    
    // Update ship animations
    this.updateShipAnimations(deltaTime);
  }
  
  public dispose(): void {
    // Clean up subsystems
    this.atmosphericAudio?.dispose();
    this.shipProps?.dispose();
    this.mirandaStory?.dispose();
    
    // Clean up animations
    this.animationCleanups.forEach(cleanup => cleanup());
    this.animationCleanups = [];
    
    // Clean up three.js objects
    this.spaceshipObjects.forEach(obj => {
      this.dependencies.levelGroup.remove(obj);
    });
    this.spaceshipObjects = [];
    
    this.spaceshipLights.forEach(light => {
      this.dependencies.levelGroup.remove(light);
    });
    this.spaceshipLights = [];
    
    console.log('🧹 MirandaShipSystemModern disposed');
  }
  
  private async setupSpaceshipEnvironment(): Promise<void> {
    console.log('🌌 Setting up spaceship environment...');
    
    // Add cosmic horror fog
    const fog = new this.dependencies.THREE.Fog(0x0a0a1a, 1, 80);
    this.dependencies.scene.fog = fog;
    
    // Ambient lighting for moody atmosphere
    const ambientLight = new this.dependencies.THREE.AmbientLight(0x404080, 0.3);
    this.dependencies.levelGroup.add(ambientLight);
    this.spaceshipLights.push(ambientLight);
    
    // Directional light from ship's main systems
    const directionalLight = new this.dependencies.THREE.DirectionalLight(0x8888ff, 0.7);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    
    if (directionalLight.castShadow) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
    }
    
    this.dependencies.levelGroup.add(directionalLight);
    this.spaceshipLights.push(directionalLight);
    
    // Emergency lighting
    const emergencyLight = new this.dependencies.THREE.PointLight(0xff4444, 0.5, 20);
    emergencyLight.position.set(0, 3, 0);
    this.dependencies.levelGroup.add(emergencyLight);
    this.spaceshipLights.push(emergencyLight);
    
    console.log('✅ Spaceship environment setup complete');
  }
  
  private async initializeShipSystems(): Promise<void> {
    console.log('🔧 Initializing ship systems...');
    
    try {
      // Initialize atmospheric audio system
      this.atmosphericAudio = new AtmosphericAudioSystem(
        this.dependencies.THREE,
        this.dependencies.scene,
        this.dependencies.levelGroup,
        this.dependencies.interactionSystem,
        this.dependencies.eventBus,
        this.dependencies.camera,
        this.dependencies.gameContainer
      );
      
      // Initialize ship props system
      this.shipProps = new ShipPropsSystem(
        this.dependencies.THREE,
        this.dependencies.scene,
        this.dependencies.levelGroup,
        this.dependencies.interactionSystem,
        this.dependencies.eventBus,
        this.dependencies.camera,
        this.dependencies.gameContainer
      );
      
      // Initialize Miranda story system
      this.mirandaStory = new MirandaStorySystem(
        this.dependencies.THREE,
        this.dependencies.scene,
        this.dependencies.levelGroup,
        this.dependencies.interactionSystem,
        this.dependencies.eventBus,
        this.dependencies.camera,
        this.dependencies.gameContainer
      );
      
      console.log('✅ Ship systems initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize ship systems:', error);
      throw error;
    }
  }
  
  private async buildShipInterior(): Promise<void> {
    console.log('🏗️ Building ship interior...');
    
    // Create ship hull
    await this.createShipHull();
    
    // Create bridge layout
    await this.createBridgeLayout();
    
    // Create control panels
    await this.createControlPanels();
    
    // Create crew quarters
    await this.createCrewQuarters();
    
    console.log('✅ Ship interior built');
  }
  
  private async createShipHull(): Promise<void> {
    // Create main hull structure
    const hullGeometry = new this.dependencies.THREE.BoxGeometry(40, 8, 60);
    const hullMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    
    const hull = new this.dependencies.THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(0, 0, 0);
    hull.receiveShadow = true;
    
    this.dependencies.levelGroup.add(hull);
    this.spaceshipObjects.push(hull);
    
    // Create reinforcement beams
    for (let i = -15; i <= 15; i += 10) {
      const beamGeometry = new this.dependencies.THREE.BoxGeometry(2, 8, 60);
      const beamMaterial = new this.dependencies.THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.9,
        roughness: 0.2
      });
      
      const beam = new this.dependencies.THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(i, 0, 0);
      beam.castShadow = true;
      
      this.dependencies.levelGroup.add(beam);
      this.spaceshipObjects.push(beam);
    }
  }
  
  private async createBridgeLayout(): Promise<void> {
    // Create captain's chair
    const chairGeometry = new this.dependencies.THREE.BoxGeometry(2, 2, 2);
    const chairMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8
    });
    
    const chair = new this.dependencies.THREE.Mesh(chairGeometry, chairMaterial);
    chair.position.set(0, 0, 10);
    chair.castShadow = true;
    
    this.dependencies.levelGroup.add(chair);
    this.spaceshipObjects.push(chair);
    
    // Create navigation console
    const consoleGeometry = new this.dependencies.THREE.BoxGeometry(6, 1, 3);
    const consoleMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const console = new this.dependencies.THREE.Mesh(consoleGeometry, consoleMaterial);
    console.position.set(0, 0, 15);
    console.castShadow = true;
    
    this.dependencies.levelGroup.add(console);
    this.spaceshipObjects.push(console);
  }
  
  private async createControlPanels(): Promise<void> {
    // Create interactive control panels
    const panelPositions = [
      { x: -15, y: 2, z: 10 },
      { x: 15, y: 2, z: 10 },
      { x: -10, y: 2, z: 20 },
      { x: 10, y: 2, z: 20 }
    ];
    
    for (const pos of panelPositions) {
      const panelGeometry = new this.dependencies.THREE.BoxGeometry(3, 2, 0.3);
      const panelMaterial = new this.dependencies.THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x001122,
        emissiveIntensity: 0.3
      });
      
      const panel = new this.dependencies.THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(pos.x, pos.y, pos.z);
      panel.castShadow = true;
      
      this.dependencies.levelGroup.add(panel);
      this.spaceshipObjects.push(panel);
      
      // Register as interactable
      this.dependencies.interactionSystem.registerInteractable({
        id: `control-panel-${pos.x}-${pos.z}`,
        mesh: panel,
        type: 'button',
        data: { type: 'control_panel', position: pos },
        onInteract: () => {
          this.handleControlPanelInteraction(pos);
        }
      });
    }
  }
  
  private async createCrewQuarters(): Promise<void> {
    // Create crew bunks
    const bunkPositions = [
      { x: -18, y: -1, z: -10 },
      { x: -18, y: 1, z: -10 },
      { x: 18, y: -1, z: -10 },
      { x: 18, y: 1, z: -10 }
    ];
    
    for (const pos of bunkPositions) {
      const bunkGeometry = new this.dependencies.THREE.BoxGeometry(4, 0.5, 8);
      const bunkMaterial = new this.dependencies.THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.8
      });
      
      const bunk = new this.dependencies.THREE.Mesh(bunkGeometry, bunkMaterial);
      bunk.position.set(pos.x, pos.y, pos.z);
      bunk.castShadow = true;
      
      this.dependencies.levelGroup.add(bunk);
      this.spaceshipObjects.push(bunk);
    }
  }
  
  private async setupStoryElements(config: any): Promise<void> {
    if (this.mirandaStory) {
      await this.mirandaStory.initialize(config);
    }
  }
  
  private async setupAtmosphericAudio(config: any): Promise<void> {
    if (this.atmosphericAudio) {
      await this.atmosphericAudio.initialize(config);
    }
  }
  
  private handleControlPanelInteraction(position: any): void {
    console.log('🎛️ Control panel activated at:', position);
    
    // Emit interaction event
    this.dependencies.eventBus.emit('miranda.control_panel.activated', {
      position,
      timestamp: Date.now()
    });
  }
  
  private updateShipAnimations(deltaTime: number): void {
    // Add subtle ship movement/vibration
    const time = Date.now() * 0.001;
    const vibration = Math.sin(time * 2) * 0.01;
    
    this.spaceshipObjects.forEach(obj => {
      obj.position.y += vibration;
    });
    
    // Flicker emergency lights
    const emergencyLight = this.spaceshipLights.find(light => 
      light instanceof this.dependencies.THREE.PointLight && light.color.r > 0.5
    );
    
    if (emergencyLight) {
      emergencyLight.intensity = 0.3 + Math.sin(time * 8) * 0.2;
    }
  }
}