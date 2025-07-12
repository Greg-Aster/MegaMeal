// Miranda Spaceship Level
// Investigation of the Miranda Incident aboard Captain Zhao's salvage vessel "Second Breakfast"

import * as THREE from 'three';
import { BaseLevel } from './BaseLevel';
import { ResourceManager } from '../../engine/utils/ResourceManager';
import { EventBus } from '../../engine/core/EventBus';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { AssetLoader } from '../../engine/core/AssetLoader';

// Import spaceship-specific systems
import { AtmosphericAudioSystem } from '../components/AtmosphericAudioSystem';
import { ShipPropsSystem } from '../components/ShipPropsSystem';
import { MirandaStorySystem } from '../components/MirandaStorySystem';

export class MirandaSpaceshipLevel extends BaseLevel {
  // Spaceship systems
  private atmosphericAudio!: AtmosphericAudioSystem;
  private shipProps!: ShipPropsSystem;
  private mirandaStory!: MirandaStorySystem;
  
  // Level configuration
  private readonly levelConfig = {
    name: 'Miranda Investigation',
    description: 'Bridge of salvage vessel "Second Breakfast" - investigating the Miranda incident',
    
    // Environment settings
    environment: {
      fog: {
        color: 0x0a0a1a,
        near: 1,
        far: 100,
        density: 0.02
      },
      ambient_light: {
        color: 0x404080,
        intensity: 0.3
      },
      directional_light: {
        color: 0x8888ff,
        intensity: 0.7,
        position: [10, 20, 5],
        cast_shadow: true
      }
    },
    
    // Ship interior layout
    ship_layout: {
      walls: [
        // Bridge perimeter walls
        { type: 'WallAstra_Straight', position: [0, 0, -10], rotation: [0, 0, 0] },
        { type: 'WallAstra_Straight', position: [4, 0, -10], rotation: [0, 0, 0] },
        { type: 'WallAstra_Straight', position: [-4, 0, -10], rotation: [0, 0, 0] },
        { type: 'WallAstra_Corner_Square_Outer', position: [8, 0, -10], rotation: [0, 0, 0] },
        { type: 'WallAstra_Corner_Square_Outer', position: [-8, 0, -10], rotation: [0, Math.PI/2, 0] },
        
        // Side walls with windows for viewing space
        { type: 'WallWindow_Straight', position: [8, 0, -6], rotation: [0, -Math.PI/2, 0] },
        { type: 'WallWindow_Straight', position: [8, 0, -2], rotation: [0, -Math.PI/2, 0] },
        { type: 'WallWindow_Straight', position: [8, 0, 2], rotation: [0, -Math.PI/2, 0] },
        { type: 'WallWindow_Straight', position: [-8, 0, -6], rotation: [0, Math.PI/2, 0] },
        { type: 'WallWindow_Straight', position: [-8, 0, -2], rotation: [0, Math.PI/2, 0] },
        { type: 'WallWindow_Straight', position: [-8, 0, 2], rotation: [0, Math.PI/2, 0] },
        
        // Front bridge window
        { type: 'WallWindow_Straight', position: [0, 0, 6], rotation: [0, Math.PI, 0] },
        { type: 'WallWindow_Straight', position: [4, 0, 6], rotation: [0, Math.PI, 0] },
        { type: 'WallWindow_Straight', position: [-4, 0, 6], rotation: [0, Math.PI, 0] },
        
        // Corner connections
        { type: 'WallAstra_Corner_Square_Outer', position: [8, 0, 6], rotation: [0, Math.PI, 0] },
        { type: 'WallAstra_Corner_Square_Outer', position: [-8, 0, 6], rotation: [0, -Math.PI/2, 0] }
      ],
      
      floors: [
        // Main bridge floor
        { type: 'Platform_Metal', position: [0, -1, 0] },
        { type: 'Platform_Metal', position: [4, -1, 0] },
        { type: 'Platform_Metal', position: [-4, -1, 0] },
        { type: 'Platform_Metal', position: [0, -1, 4] },
        { type: 'Platform_Metal', position: [4, -1, 4] },
        { type: 'Platform_Metal', position: [-4, -1, 4] },
        { type: 'Platform_Metal', position: [0, -1, -4] },
        { type: 'Platform_Metal', position: [4, -1, -4] },
        { type: 'Platform_Metal', position: [-4, -1, -4] },
        
        // Extended floor areas
        { type: 'Platform_Metal2', position: [8, -1, 0] },
        { type: 'Platform_Metal2', position: [-8, -1, 0] },
        { type: 'Platform_Metal2', position: [0, -1, -8] }
      ],
      
      ceiling: [
        // Overhead structure with cables
        { type: 'TopCables_Straight', position: [0, 4, 0] },
        { type: 'TopCables_Straight', position: [4, 4, 0] },
        { type: 'TopCables_Straight', position: [-4, 4, 0] },
        { type: 'TopCables_Straight', position: [0, 4, 4] },
        { type: 'TopCables_Straight', position: [0, 4, -4] }
      ]
    },
    
    // Bridge equipment and props
    ship_props: {
      props: [
        // Captain's command station
        {
          model: 'Prop_Computer',
          positions: [[0, 0, 2]],
          lighting: true
        },
        
        // Investigation workstations
        {
          model: 'Prop_Computer',
          positions: [[3, 0, -1], [-3, 0, -1]],
          lighting: true
        },
        
        // Storage containers with investigation materials
        {
          model: 'Prop_Crate3',
          positions: [[6, 0, -6], [-6, 0, -6], [0, 0, -8]],
          rotation: 'random'
        },
        
        // Data storage units
        {
          model: 'Prop_Barrel_Large',
          positions: [[5, 0, 4], [-5, 0, 4]],
          lighting: false
        },
        
        // Ship systems
        {
          model: 'Prop_Vent_Big',
          positions: [[0, 3.5, 0]],
          attach_to: 'ceiling'
        },
        
        // Emergency lighting
        {
          model: 'Prop_Light_Corner',
          positions: [[7, 2, 5], [-7, 2, 5], [7, 2, -8], [-7, 2, -8]],
          attach_to: 'wall',
          lighting: true
        },
        
        // Cable management
        {
          model: 'Prop_Cable_3',
          positions: [[2, 0, 0], [-2, 0, 0]],
          attach_to: 'ceiling'
        }
      ]
    },
    
    // Story elements for Miranda investigation
    story_elements: {
      captain_logs: [
        {
          id: 'log_initial_scan',
          name: 'Initial Debris Scan Report',
          position: [3, 0.5, -1],
          model: 'Prop_Chest',
          content: `Captain's Log, Stardate 45.7.21: This is Captain Helena Zhao of the salvage vessel Second Breakfast. A number of weeks ago, the primary sun in the Miranda system went supernova without warning, destroying the entire system. The inner planets - vaporized. The debris field is expanding at an alarming rate. Our initial scans show a high concentration of Fe and Ni isotopes, consistent with a Type II supernova. However, the sheer scale of the explosion and the speed at which the star collapsed defies all known astrophysical models.`
        },
        
        {
          id: 'log_quantum_anomaly',
          name: 'Quantum Resonance Discovery',
          position: [-3, 0.5, -1],
          model: 'Prop_Chest',
          content: `Captain's Log, Stardate 45.8.15: We've detected a quantum resonance signature pattern. What we recovered is unsettling - not just because of the content, but because of the contradictions. The radiation was concentrating in a manner that was breaking the second law of thermodynamics. Instead of decaying into entropy, it was reconstituting itself into order—as if it was reversing its decay. After the drones returned, some crew began experiencing headaches. I've started waking with my uniform collar damp with cold sweat.`
        },
        
        {
          id: 'log_temporal_dreams',
          name: 'Temporal Dream Analysis',
          position: [0, 0.5, 2],
          model: 'Prop_Chest',
          content: `Personal Log: The crew remains focused, but I've started experiencing lapses. Dreams that feel more like transmissions. Three elderly men playing cards, their faces blurred by cigar smoke. A figure in a fedora ordering "a Bloody Mary, no pickles, make it a double" - the phrase echoes in my head. When I whispered it in the mess hall, my coffee cup vibrated slightly. I've forbidden myself from speaking it aloud again.`
        },
        
        {
          id: 'log_mechanical_observer',
          name: 'Automated System Recovery',
          position: [6, 0.5, -6],
          model: 'Prop_Chest',
          content: `Captain's Log, Stardate 45.8.25: Breakthrough! We recovered data from an automated service unit on Miranda-7. The transmission continued 1,342 times longer than should be possible - after the shockwave passed over the planet. The data appears to be conversations between a bartender and variations of a Bloody Mary recipe. When hearing this report, I broke out in a cold sweat. The data shows a critical alert: "Temporal wave detected. Causality breach imminent. [Static for 8.7 seconds]"`
        }
      ],
      
      interactive_objects: [
        {
          id: 'perfect_mary_sample',
          name: 'Perfect Bloody Mary Sample',
          position: [0, 1, 0],
          model: 'Prop_ItemHolder',
          glow: true,
          glow_color: '#8844ff',
          interaction: 'examine',
          content: `A sealed containment unit holds what appears to be a liquid sample. The container is filled with a deep red substance that seems to pulse with its own light. A faint purple aura surrounds it, and looking directly at it causes a strange temporal resonance sensation. The label reads: "Perfect Mary - Final Iteration 1,342. WARNING: Do not speak activation phrase. 'No pickles' - Temporal weapon confirmed."`,
          visual_effect: 'temporal_distortion'
        },
        
        {
          id: 'debris_analyzer',
          name: 'Debris Field Analyzer',
          position: [5, 0, 4],
          model: 'Prop_ItemHolder',
          glow: true,
          glow_color: '#00ffff',
          interaction: 'access',
          content: `Holographic display shows the expanding Miranda debris field. Radiation patterns exhibit impossible thermodynamic violations - energy organizing instead of dissipating. Multiple temporal echoes detected from the same coordinates. Analysis suggests artificial acceleration of stellar fusion processes. Required energy: equivalent to multiple star systems. Current technology cannot account for this level of stellar manipulation.`
        },
        
        {
          id: 'temporal_scanner',
          name: 'Temporal Anomaly Scanner',
          position: [-5, 0, 4],
          model: 'Prop_Light_Small',
          glow: true,
          glow_color: '#ff4488',
          interaction: 'scan',
          content: `Temporal scanner readings are off the charts. Multiple causal isolation bubbles detected in debris field. Estimated 1,342 recursive temporal loops centered on hospitality establishments. The "Purple Force" entity appears across multiple readings with apparent intentionality. Scanner warns: "Probability resonance detected. Causal transplantation possible. Recommend immediate extraction protocols."`
        }
      ]
    },
    
    // Atmospheric audio for spaceship ambiance
    atmospheric_audio: {
      ambient_tracks: [
        {
          id: 'ship_hum',
          file: '/audio/ambient/ship_hum.ogg',
          volume: 0.3,
          loop: true,
          position: 'global'
        },
        {
          id: 'computer_systems',
          file: '/audio/ambient/computer_beeps.ogg',
          volume: 0.2,
          loop: true,
          position: [0, 0, 2],
          radius: 8
        },
        {
          id: 'ventilation',
          file: '/audio/ambient/ship_ventilation.ogg',
          volume: 0.15,
          loop: true,
          position: [0, 3, 0],
          radius: 12
        }
      ],
      
      sound_effects: [
        {
          trigger: 'story.log_found',
          sound: '/audio/effects/data_access.ogg',
          volume: 0.5
        },
        {
          trigger: 'story.object_examined',
          sound: '/audio/effects/scanner_beep.ogg',
          volume: 0.4
        },
        {
          trigger: 'temporal_anomaly_detected',
          sound: '/audio/effects/temporal_distortion.ogg',
          volume: 0.6
        }
      ]
    },
    
    // Player spawn point on the bridge
    player_spawn: {
      position: [0, 0, -2],
      rotation: [0, 0, 0]
    }
  };

  constructor(
    THREE: any,
    scene: THREE.Scene,
    assetLoader: AssetLoader,
    eventBus: EventBus,
    interactionSystem: InteractionSystem
  ) {
    super(THREE, scene, assetLoader, eventBus, interactionSystem);
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Miranda Spaceship Level...');
    
    try {
      // Create level group for organization
      this.levelGroup = new this.THREE.Group();
      this.levelGroup.name = 'MirandaSpaceshipLevel';
      this.scene.add(this.levelGroup);
      
      // Setup environment
      await this.setupEnvironment();
      
      // Initialize spaceship systems
      await this.initializeShipSystems();
      
      // Build ship interior
      await this.buildShipInterior();
      
      // Setup story elements
      await this.setupStoryElements();
      
      // Setup atmospheric audio
      await this.setupAtmosphericAudio();
      
      console.log('✅ Miranda Spaceship Level initialized successfully');
      
      // Emit level ready event
      this.eventBus.emit('level.ready', {
        name: this.levelConfig.name,
        description: this.levelConfig.description
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Miranda Spaceship Level:', error);
      throw error;
    }
  }
  
  private async setupEnvironment(): Promise<void> {
    console.log('🌌 Setting up spaceship environment...');
    
    const config = this.levelConfig.environment;
    
    // Add cosmic horror fog
    const fog = new this.THREE.Fog(
      config.fog.color,
      config.fog.near,
      config.fog.far
    );
    this.scene.fog = fog;
    
    // Ambient lighting for moody atmosphere
    const ambientLight = new this.THREE.AmbientLight(
      config.ambient_light.color,
      config.ambient_light.intensity
    );
    this.levelGroup.add(ambientLight);
    
    // Directional light from ship's main systems
    const directionalLight = new this.THREE.DirectionalLight(
      config.directional_light.color,
      config.directional_light.intensity
    );
    directionalLight.position.set(...config.directional_light.position);
    directionalLight.castShadow = config.directional_light.cast_shadow;
    
    if (directionalLight.castShadow) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
    }
    
    this.levelGroup.add(directionalLight);
    
    // Add stars visible through windows
    await this.createStarField();
  }
  
  private async createStarField(): Promise<void> {
    const starGeometry = new this.THREE.BufferGeometry();
    const starMaterial = new this.THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });
    
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;     // x
      positions[i + 1] = (Math.random() - 0.5) * 200; // y
      positions[i + 2] = (Math.random() - 0.5) * 200; // z
    }
    
    starGeometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    const stars = new this.THREE.Points(starGeometry, starMaterial);
    this.levelGroup.add(stars);
  }
  
  private async initializeShipSystems(): Promise<void> {
    console.log('⚙️ Initializing ship systems...');
    
    // Initialize atmospheric audio system
    this.atmosphericAudio = new AtmosphericAudioSystem(
      this.THREE,
      this.scene,
      this.levelGroup,
      this.eventBus
    );
    
    // Initialize ship props system
    this.shipProps = new ShipPropsSystem(
      this.THREE,
      this.scene,
      this.levelGroup,
      this.assetLoader
    );
    
    // Initialize Miranda story system
    this.mirandaStory = new MirandaStorySystem(
      this.THREE,
      this.scene,
      this.levelGroup,
      this.interactionSystem,
      this.eventBus
    );
  }
  
  private async buildShipInterior(): Promise<void> {
    console.log('🏗️ Building ship interior...');
    
    // For now, create placeholder geometry until GLTF loading is implemented
    // This creates a basic spaceship bridge layout
    
    // Floor
    const floorGeometry = new this.THREE.PlaneGeometry(20, 20);
    const floorMaterial = new this.THREE.MeshStandardMaterial({ 
      color: 0x333366,
      roughness: 0.8,
      metalness: 0.2 
    });
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.levelGroup.add(floor);
    
    // Walls with windows
    await this.createBridgeWalls();
    
    // Initialize ship props
    await this.shipProps.initialize(this.levelConfig.ship_props);
  }
  
  private async createBridgeWalls(): Promise<void> {
    // Create basic walls as placeholders
    const wallHeight = 4;
    const wallGeometry = new this.THREE.BoxGeometry(0.2, wallHeight, 4);
    const wallMaterial = new this.THREE.MeshStandardMaterial({ 
      color: 0x444477,
      roughness: 0.6,
      metalness: 0.4 
    });
    
    // Left wall
    const leftWall = new this.THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-10, wallHeight/2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.levelGroup.add(leftWall);
    
    // Right wall
    const rightWall = new this.THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(10, wallHeight/2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.levelGroup.add(rightWall);
    
    // Back wall
    const backWallGeometry = new this.THREE.BoxGeometry(20, wallHeight, 0.2);
    const backWall = new this.THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight/2, -10);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.levelGroup.add(backWall);
    
    // Front viewscreen (transparent for viewing space)
    const viewscreenMaterial = new this.THREE.MeshStandardMaterial({ 
      color: 0x001133,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.9 
    });
    const viewscreen = new this.THREE.Mesh(backWallGeometry, viewscreenMaterial);
    viewscreen.position.set(0, wallHeight/2, 10);
    this.levelGroup.add(viewscreen);
  }
  
  private async setupStoryElements(): Promise<void> {
    console.log('📖 Setting up Miranda story elements...');
    
    // Initialize story system with Miranda investigation content
    await this.mirandaStory.initialize(this.levelConfig.story_elements);
  }
  
  private async setupAtmosphericAudio(): Promise<void> {
    console.log('🎵 Setting up atmospheric audio...');
    
    // Initialize atmospheric audio system
    await this.atmosphericAudio.initialize(this.levelConfig.atmospheric_audio);
  }

  update(deltaTime: number): void {
    // Update ship systems
    if (this.atmosphericAudio && !this.atmosphericAudio.isDisposed) {
      this.atmosphericAudio.update(deltaTime);
    }
    
    if (this.shipProps && !this.shipProps.isDisposed) {
      this.shipProps.update(deltaTime);
    }
    
    if (this.mirandaStory && !this.mirandaStory.isDisposed) {
      this.mirandaStory.update(deltaTime);
    }
    
    // Update any temporal distortion effects
    this.updateTemporalEffects(deltaTime);
  }
  
  private updateTemporalEffects(deltaTime: number): void {
    // Add subtle temporal distortion effects for cosmic horror atmosphere
    const time = Date.now() * 0.001;
    
    // Slightly distort the fog color to create an unsettling atmosphere
    if (this.scene.fog && this.scene.fog instanceof this.THREE.Fog) {
      const pulse = Math.sin(time * 0.5) * 0.1 + 0.9;
      const baseColor = new this.THREE.Color(0x0a0a1a);
      baseColor.multiplyScalar(pulse);
      this.scene.fog.color = baseColor;
    }
  }

  getSpawnPoint(): { position: [number, number, number]; rotation: [number, number, number] } {
    return this.levelConfig.player_spawn;
  }

  dispose(): void {
    console.log('🧹 Disposing Miranda Spaceship Level...');
    
    // Dispose ship systems
    if (this.atmosphericAudio && !this.atmosphericAudio.isDisposed) {
      this.atmosphericAudio.dispose();
    }
    
    if (this.shipProps && !this.shipProps.isDisposed) {
      this.shipProps.dispose();
    }
    
    if (this.mirandaStory && !this.mirandaStory.isDisposed) {
      this.mirandaStory.dispose();
    }
    
    // Clear fog
    this.scene.fog = null;
    
    // Dispose level group using ResourceManager
    if (this.levelGroup) {
      ResourceManager.disposeObject3D(this.levelGroup);
      this.scene.remove(this.levelGroup);
    }
    
    console.log('✅ Miranda Spaceship Level disposed');
  }
}