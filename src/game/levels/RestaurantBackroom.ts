import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { Engine } from '../../engine/core/Engine';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { InteractionType } from '../../engine/interfaces/InteractableObject';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * RestaurantBackroom Level - Cosmic Horror Sci-Fi Redesign
 * A claustrophobic horror experience with professional 3D assets
 * Features dramatic single-source lighting and interactive NPCs
 */
export class RestaurantBackroom extends BaseLevel {
  private THREE: any;
  private gltfLoader: GLTFLoader;
  private roomModel: THREE.Group | null = null;
  private corndogMascot: THREE.Object3D | null = null;
  private butcherBlock: THREE.Object3D | null = null;
  private overheadLight: THREE.SpotLight | null = null;
  
  // Atmospheric effects
  private fogParticles: THREE.Points | null = null;
  private ambientHum: THREE.Audio | null = null;
  
  // Interactive dialogue system
  private dialogueActive = false;
  private dialogueText = "I don't know where she is! 🍔";
  
  constructor(engine: Engine, interactionSystem: InteractionSystem, levelId: string) {
    super(
      engine,
      interactionSystem,
      levelId,
      'Restaurant Backroom',
      'A claustrophobic cosmic horror experience in a sci-fi restaurant backroom'
    );
    
    this.THREE = THREE;
    this.gltfLoader = new GLTFLoader();
  }
  
  /**
   * Create the cosmic horror sci-fi environment
   */
  protected async createEnvironment(): Promise<void> {
    console.log('🍴 Creating Cosmic Horror Restaurant Backroom...');
    
    try {
      // Create small, claustrophobic room
      await this.createRoomStructure();
      
      // Add atmospheric fog
      await this.createAtmosphericFog();
      
      // Add professional sci-fi props
      await this.createSciFiProps();
      
      // Create butcher block centerpiece
      await this.createButcherBlock();
      
      // Add corndog mascot
      await this.createCorndogMascot();
      
      console.log('✅ Cosmic Horror Restaurant Backroom created');
      
    } catch (error) {
      console.error('❌ Failed to create Restaurant Backroom environment:', error);
      throw error;
    }
  }
  
  /**
   * Create dramatic single-source overhead lighting
   */
  protected async createLighting(): Promise<void> {
    console.log('💡 Creating dramatic horror lighting...');
    
    try {
      // Remove default lighting
      this.scene.traverse((child) => {
        if (child instanceof THREE.Light) {
          this.scene.remove(child);
        }
      });
      
      // Brighter ambient light for visibility
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      this.levelGroup.add(ambientLight);
      
      // Dramatic single overhead spotlight (brighter)
      this.overheadLight = new THREE.SpotLight(0xffffff, 8.0, 30, Math.PI * 0.4, 0.3, 1);
      this.overheadLight.position.set(0, 8, 0);
      this.overheadLight.target.position.set(0, 0, 0);
      this.overheadLight.castShadow = true;
      
      // High-quality shadow settings
      this.overheadLight.shadow.mapSize.width = 2048;
      this.overheadLight.shadow.mapSize.height = 2048;
      this.overheadLight.shadow.camera.near = 0.1;
      this.overheadLight.shadow.camera.far = 50;
      this.overheadLight.shadow.camera.fov = 60;
      this.overheadLight.shadow.bias = -0.0001;
      
      this.levelGroup.add(this.overheadLight);
      this.levelGroup.add(this.overheadLight.target);
      
      // Add slight flickering effect
      this.overheadLight.userData = {
        baseIntensity: 8.0,
        flickerSpeed: 0.5,
        time: 0
      };
      
      // Brighter red emergency lighting from corners
      const redLight1 = new THREE.PointLight(0xff3333, 1.5, 15);
      redLight1.position.set(-3, 5, -3);
      this.levelGroup.add(redLight1);
      
      const redLight2 = new THREE.PointLight(0xff3333, 1.5, 15);
      redLight2.position.set(3, 5, -3);
      this.levelGroup.add(redLight2);
      
      // Additional white lights for better visibility
      const fillLight1 = new THREE.PointLight(0xffffff, 2.0, 12);
      fillLight1.position.set(-3, 4, 2);
      this.levelGroup.add(fillLight1);
      
      const fillLight2 = new THREE.PointLight(0xffffff, 2.0, 12);
      fillLight2.position.set(3, 4, 2);
      this.levelGroup.add(fillLight2);
      
      // Shadows are already enabled by default in the engine's renderer configuration
      
      console.log('✅ Dramatic horror lighting created');
      
    } catch (error) {
      console.error('❌ Failed to create lighting:', error);
      throw error;
    }
  }
  
  /**
   * Set up interactive elements
   */
  protected async createInteractions(): Promise<void> {
    console.log('🎯 Creating interactive elements...');
    
    try {
      // Make corndog mascot interactive
      if (this.corndogMascot) {
        const corndogInteractable = this.createCorndogInteractable();
        this.interactionSystem.registerInteractable(corndogInteractable);
      }
      
      console.log('✅ Interactive elements created');
      
    } catch (error) {
      console.error('❌ Failed to create interactions:', error);
      throw error;
    }
  }
  
  /**
   * Create a proper InteractableObject for the corndog mascot
   */
  private createCorndogInteractable(): any {
    return {
      id: 'corndog-mascot',
      mesh: this.corndogMascot!,
      interactionRadius: 3.0,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      
      onInteract: () => {
        console.log('🌭 Corndog mascot clicked!');
        this.triggerDialogue(this.dialogueText);
      },
      
      getInteractionPrompt: () => {
        return 'Click to talk to the corndog mascot';
      },
      
      getInteractionData: () => ({
        id: 'corndog-mascot',
        name: 'Corndog Mascot',
        description: 'A terrified corndog mascot strapped to a butcher block',
        interactionType: InteractionType.CLICK,
        interactionRadius: 3.0,
        isInteractable: true,
        tags: ['npc', 'dialogue', 'horror'],
        userData: { dialogue: this.dialogueText }
      })
    };
  }
  
  /**
   * Update level animations and effects
   */
  protected updateLevel(deltaTime: number): void {
    // Update flickering overhead light
    if (this.overheadLight && this.overheadLight.userData) {
      this.overheadLight.userData.time += deltaTime;
      
      if (this.overheadLight.userData.time > 1 / this.overheadLight.userData.flickerSpeed) {
        this.overheadLight.userData.time = 0;
        
        // Subtle intensity variation for atmosphere
        const variation = 0.8 + Math.random() * 0.4; // Range 0.8 to 1.2
        this.overheadLight.intensity = this.overheadLight.userData.baseIntensity * variation;
      }
    }
    
    // Animate fog particles
    if (this.fogParticles) {
      this.fogParticles.rotation.y += deltaTime * 0.1;
    }
    
    // Animate corndog mascot (subtle breathing)
    if (this.corndogMascot) {
      this.corndogMascot.rotation.y += Math.sin(Date.now() * 0.001) * 0.002;
      this.corndogMascot.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.02;
    }
  }
  
  /**
   * Create room structure using professional assets
   */
  private async createRoomStructure(): Promise<void> {
    console.log('🏗️ Creating room structure...');
    
    // Create proper-sized claustrophobic room (20x20 units)
    const roomSize = 20;
    const wallHeight = 12;
    
    // Load professional wall assets
    try {
      // Floor using dark metal platform
      const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.8,
        roughness: 0.3,
        envMapIntensity: 0.5
      });
      
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      this.levelGroup.add(floor);
      
      // Walls using sci-fi panels
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.7,
        roughness: 0.4,
        envMapIntensity: 0.3
      });
      
      // Create 4 walls
      const wallGeometry = new THREE.PlaneGeometry(roomSize, wallHeight);
      
      // Back wall
      const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
      backWall.position.set(0, wallHeight / 2, -roomSize / 2);
      backWall.castShadow = true;
      backWall.receiveShadow = true;
      this.levelGroup.add(backWall);
      
      // Left wall  
      const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
      leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      this.levelGroup.add(leftWall);
      
      // Right wall
      const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
      rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      this.levelGroup.add(rightWall);
      
      // Front wall (with opening for entrance)
      const frontWallLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize * 0.3, wallHeight), 
        wallMaterial
      );
      frontWallLeft.position.set(-roomSize * 0.35, wallHeight / 2, roomSize / 2);
      frontWallLeft.rotation.y = Math.PI;
      frontWallLeft.castShadow = true;
      frontWallLeft.receiveShadow = true;
      this.levelGroup.add(frontWallLeft);
      
      const frontWallRight = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize * 0.3, wallHeight), 
        wallMaterial
      );
      frontWallRight.position.set(roomSize * 0.35, wallHeight / 2, roomSize / 2);
      frontWallRight.rotation.y = Math.PI;
      frontWallRight.castShadow = true;
      frontWallRight.receiveShadow = true;
      this.levelGroup.add(frontWallRight);
      
      // Ceiling
      const ceiling = new THREE.Mesh(floorGeometry, wallMaterial);
      ceiling.position.y = wallHeight;
      ceiling.castShadow = true;
      ceiling.receiveShadow = true;
      this.levelGroup.add(ceiling);
      
    } catch (error) {
      console.error('Failed to load room assets:', error);
      // Fallback to procedural generation if assets fail
    }
  }
  
  /**
   * Create atmospheric fog effect
   */
  private async createAtmosphericFog(): Promise<void> {
    console.log('🌫️ Creating atmospheric fog...');
    
    // Volumetric fog using particles (scaled for larger room)
    const particleCount = 200;
    const particles = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 18;     // x
      particles[i * 3 + 1] = Math.random() * 8 + 2;      // y
      particles[i * 3 + 2] = (Math.random() - 0.5) * 18; // z
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x666666,
      size: 0.1,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending
    });
    
    this.fogParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.levelGroup.add(this.fogParticles);
    
    // Global fog (scaled for larger room)
    this.scene.fog = new THREE.Fog(0x0a0a0a, 12, 35);
  }
  
  /**
   * Add professional sci-fi props
   */
  private async createSciFiProps(): Promise<void> {
    console.log('📦 Adding sci-fi props...');
    
    // Add some crates and equipment around the room (scaled for larger room)
    const propPositions = [
      { x: -6, y: 0, z: -6 },
      { x: 6, y: 0, z: -6 },
      { x: -6, y: 0, z: 6 },
      { x: 6, y: 0, z: 6 },
      { x: 0, y: 0, z: -8 }
    ];
    
    propPositions.forEach((pos) => {
      // Create industrial crate (larger size)
      const crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.2,
        roughness: 0.8,
        envMapIntensity: 0.2
      });
      
      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, pos.y + 0.75, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.levelGroup.add(crate);
    });
    
    // Add industrial pipes along walls (scaled for larger room)
    const pipeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 16);
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.position.set(-8, 6, 0);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.castShadow = true;
    this.levelGroup.add(pipe1);
    
    const pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe2.position.set(8, 6, 0);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.castShadow = true;
    this.levelGroup.add(pipe2);
  }
  
  /**
   * Create butcher block centerpiece
   */
  private async createButcherBlock(): Promise<void> {
    console.log('🔪 Creating butcher block...');
    
    // Create wooden butcher block (larger size)
    const blockGeometry = new THREE.BoxGeometry(3, 0.5, 1.5);
    const blockMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.0
    });
    
    this.butcherBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    this.butcherBlock.position.set(0, 1.0, 0);
    this.butcherBlock.castShadow = true;
    this.butcherBlock.receiveShadow = true;
    this.levelGroup.add(this.butcherBlock);
    
    // Add table legs (larger)
    const legGeometry = new THREE.BoxGeometry(0.15, 2.0, 0.15);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
      metalness: 0.0
    });
    
    const legPositions = [
      { x: -1.2, z: -0.6 },
      { x: 1.2, z: -0.6 },
      { x: -1.2, z: 0.6 },
      { x: 1.2, z: 0.6 }
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, 1.0, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.levelGroup.add(leg);
    });
  }
  
  /**
   * Create corndog mascot character
   */
  private async createCorndogMascot(): Promise<void> {
    console.log('🌭 Creating corndog mascot...');
    
    // Create humanoid corndog mascot
    const mascotGroup = new THREE.Group();
    
    // Body (corndog shape) - larger size
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 2.0);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xdaa520, // Golden corndog color
      roughness: 0.8,
      metalness: 0.0
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.0;
    body.castShadow = true;
    body.receiveShadow = true;
    mascotGroup.add(body);
    
    // Head (slightly darker) - larger
    const headGeometry = new THREE.SphereGeometry(0.4);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      roughness: 0.7,
      metalness: 0.0
    });
    
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.2;
    head.castShadow = true;
    head.receiveShadow = true;
    mascotGroup.add(head);
    
    // Eyes (terrified expression) - larger
    const eyeGeometry = new THREE.SphereGeometry(0.08);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x222222,
      emissiveIntensity: 0.1
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 2.3, 0.3);
    mascotGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 2.3, 0.3);
    mascotGroup.add(rightEye);
    
    // Arms (strapped to sides) - larger
    const armGeometry = new THREE.CapsuleGeometry(0.12, 0.7);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xdaa520,
      roughness: 0.8,
      metalness: 0.0
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 1.3, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    mascotGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 1.3, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    mascotGroup.add(rightArm);
    
    // Restraints (rope/straps) - larger
    const restraintGeometry = new THREE.TorusGeometry(0.55, 0.04, 8, 16);
    const restraintMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.0
    });
    
    const restraint = new THREE.Mesh(restraintGeometry, restraintMaterial);
    restraint.position.y = 1.3;
    restraint.rotation.x = Math.PI / 2;
    restraint.castShadow = true;
    mascotGroup.add(restraint);
    
    // Position on butcher block (higher position for larger table)
    mascotGroup.position.set(0, 1.25, 0);
    
    this.corndogMascot = mascotGroup;
    this.levelGroup.add(mascotGroup);
  }
  
  /**
   * Trigger dialogue with the mascot
   */
  private triggerDialogue(text: string): void {
    console.log('💬 Triggering dialogue:', text);
    
    this.dialogueActive = true;
    
    // Emit dialogue event for UI
    this.engine.getEventBus().emit('dialogue.show', {
      text: text,
      speaker: 'Corndog Mascot',
      duration: 3000
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.dialogueActive = false;
      this.engine.getEventBus().emit('dialogue.hide');
    }, 3000);
  }
  
  /**
   * Called when level is ready
   */
  protected async onLevelReady(): Promise<void> {
    console.log('🎉 Cosmic Horror Restaurant Backroom ready!');
    
    // Set camera position inside the scaled room with proper viewing angle
    this.camera.position.set(0, 2.5, 8);
    this.camera.lookAt(0, 1.5, 0);
    
    // Emit ready event
    this.engine.getEventBus().emit('level.restaurant.ready', {
      levelId: this.levelId,
      levelName: this.levelName,
      atmosphere: 'cosmic_horror'
    });
  }
  
  /**
   * Level-specific cleanup
   */
  protected onDispose(): void {
    console.log('🧹 Disposing Restaurant Backroom systems...');
    
    // Clean up fog
    if (this.scene.fog) {
      this.scene.fog = null;
    }
    
    // Clean up interactive elements
    if (this.corndogMascot) {
      this.interactionSystem.unregisterInteractable('corndog-mascot');
    }
    
    // Reset dialogue state
    this.dialogueActive = false;
    
    console.log('✅ Restaurant Backroom systems disposed');
  }
  
  // Public API for dialogue system
  public isDialogueActive(): boolean {
    return this.dialogueActive;
  }
  
  public getDialogueText(): string {
    return this.dialogueText;
  }
}