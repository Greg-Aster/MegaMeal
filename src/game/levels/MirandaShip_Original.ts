// Miranda Ship Level - Exploring the debris field and solving the Bloody Mary mystery
// Based on The Miranda Incident storyline - Enhanced with SciFi 3D models

import { AssetLoader } from '../../engine/resources/AssetLoader';
import { ModelLibrary } from '../systems/ModelLibrary';
import { Materials } from '../../engine/rendering/Materials';
import { InteractionSystem, type InteractableObject } from '../../engine/input/InteractionSystem';

export class MirandaShip {
  private THREE: any;
  private scene: any;
  private physicsWorld: any;
  private camera: any;
  private gameContainer: any;
  
  // 3D Asset Management
  private assetLoader: AssetLoader;
  private modelLibrary: ModelLibrary;
  private materials: Materials;
  
  // Interaction System
  private interactionSystem: InteractionSystem;
  
  // Level components - organized for proper cleanup
  private levelGroup: any = null; // Main container for all level objects
  private shipGroup: any = null;
  private debrisField: any = null;
  private interiorGroup: any = null;
  private lightingGroup: any = null;
  
  // Story elements
  private interactableNotes: any[] = [];
  private safe: any = null;
  
  // Resource tracking for proper disposal
  private createdMaterials: any[] = [];
  private createdTextures: any[] = [];
  private createdGeometries: any[] = [];
  
  // Story state
  private notesFound: Set<string> = new Set();
  private safeUnlocked = false;
  private onNoteFoundCallback?: (noteId: string, content: string) => void;
  private onSafeOpenedCallback?: (recipe: any) => void;
  
  // UI state (contained within level)
  private currentLogUI: HTMLElement | null = null;
  
  // Level parameters
  private readonly shipLength = 120;
  private readonly shipWidth = 30;
  private readonly shipHeight = 15;
  
  constructor(THREE: any, scene: any, physicsWorld?: any, camera?: any, gameContainer?: any, assetLoader?: AssetLoader) {
    this.THREE = THREE;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.camera = camera;
    this.gameContainer = gameContainer;
    
    // Initialize 3D asset systems
    this.assetLoader = assetLoader || new AssetLoader();
    this.materials = new Materials(); // Materials constructor takes no arguments
    this.modelLibrary = new ModelLibrary(THREE, this.assetLoader, this.materials);
    
    // Initialize interaction system for click-to-select
    this.interactionSystem = new InteractionSystem(this.camera, this.gameContainer);
    
    // Create main level container
    this.levelGroup = new this.THREE.Group();
    this.levelGroup.name = 'MirandaShipLevel';
  }

  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Miranda Ship level with SciFi assets...');
    
    // Initialize asset systems
    await this.assetLoader.initialize();
    await this.modelLibrary.initialize();
    
    // Build the level
    await this.createSpaceEnvironment();
    this.setupSpaceshipLighting(); // Initialize lighting groups first
    await this.createShipExterior();
    await this.createShipInterior();
    await this.createDebrisField();
    this.placeStoryElements();
    
    // Add the complete level to scene
    this.scene.add(this.levelGroup);
    
    console.log('✅ Miranda Ship level initialized with SciFi models');
  }

  private async createSpaceEnvironment(): Promise<void> {
    console.log('Creating deep space environment...');
    
    // Create space skybox (dark with distant stars, no nebula like Observatory)
    const spaceGeometry = new this.THREE.SphereGeometry(1500, 32, 32);
    
    // Create a dark space texture with sparse distant stars
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Deep space background - very dark
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000011'); // Very dark blue-black
    gradient.addColorStop(0.5, '#000008'); // Almost black
    gradient.addColorStop(1, '#000011'); // Very dark blue-black
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add very sparse distant stars (not the interactive ones from Observatory)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 0.8 + 0.2; // Very small stars
      const opacity = Math.random() * 0.3 + 0.1; // Very dim
      
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    
    const spaceTexture = new this.THREE.CanvasTexture(canvas);
    spaceTexture.mapping = this.THREE.EquirectangularReflectionMapping;
    
    const spaceMaterial = new this.THREE.MeshBasicMaterial({
      map: spaceTexture,
      side: this.THREE.BackSide,
      transparent: true,
      opacity: 0.8
    });
    
    const spaceSkybox = new this.THREE.Mesh(spaceGeometry, spaceMaterial);
    spaceSkybox.name = 'SpaceSkybox';
    
    this.levelGroup.add(spaceSkybox);
    
    // Track for disposal
    this.createdGeometries.push(spaceGeometry);
    this.createdTextures.push(spaceTexture);
    this.createdMaterials.push(spaceMaterial);
    
    // Create supernova glow in the distance (Miranda system aftermath)
    this.createSupernovaRemnant();
    
    console.log('Space environment created');
  }

  private createSupernovaRemnant(): void {
    // Create a distant supernova glow
    const supernovaGeometry = new this.THREE.SphereGeometry(800, 16, 16);
    
    // Create supernova material with animated glow
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create radial gradient for supernova effect
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 200, 150, 0.4)'); // Orange center
    gradient.addColorStop(0.3, 'rgba(255, 100, 100, 0.3)'); // Red
    gradient.addColorStop(0.6, 'rgba(150, 50, 150, 0.2)'); // Purple
    gradient.addColorStop(0.8, 'rgba(100, 30, 150, 0.1)'); // Deep purple
    gradient.addColorStop(1, 'rgba(50, 0, 100, 0.05)'); // Very dark purple edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const supernovaTexture = new this.THREE.CanvasTexture(canvas);
    const supernovaMaterial = new this.THREE.MeshBasicMaterial({
      map: supernovaTexture,
      side: this.THREE.BackSide,
      transparent: true,
      opacity: 0.6,
      blending: this.THREE.AdditiveBlending
    });
    
    const supernovaMesh = new this.THREE.Mesh(supernovaGeometry, supernovaMaterial);
    supernovaMesh.position.set(-1000, 200, -800); // Distant and off to one side
    supernovaMesh.name = 'SupernovaRemnant';
    
    this.levelGroup.add(supernovaMesh);
    
    // Track for disposal
    this.createdGeometries.push(supernovaGeometry);
    this.createdTextures.push(supernovaTexture);
    this.createdMaterials.push(supernovaMaterial);
  }

  private async createShipExterior(): Promise<void> {
    console.log('Creating SciFi ship exterior with 3D models...');
    
    this.shipGroup = new this.THREE.Group();
    this.shipGroup.name = 'MirandaShipExterior';
    
    // Use SciFi models for ship construction if available
    await this.buildShipHull();
    await this.buildShipBridge();
    await this.buildEngineNacelles();
    await this.addBattleDamage();
    
    this.levelGroup.add(this.shipGroup);
    console.log('SciFi ship exterior created');
  }

  private async buildShipHull(): Promise<void> {
    // Try to use SciFi platform models to build the main hull
    const hullSections = [
      'scifi_platform_simple',
      'scifi_platform_metal',
      'scifi_platform_darkplates'
    ];
    
    const hullGroup = new this.THREE.Group();
    hullGroup.name = 'ShipHull';
    
    // Build hull from modular SciFi pieces
    for (let i = 0; i < 8; i++) {
      const sectionName = hullSections[Math.floor(Math.random() * hullSections.length)];
      const hullSection = this.modelLibrary.getModel('structures', sectionName, {
        position: new this.THREE.Vector3(
          (i - 4) * 12, // Spread along ship length
          0,
          0
        ),
        scale: new this.THREE.Vector3(1.5, 0.8, 2.0), // Stretch to make ship-like
        rotation: new this.THREE.Euler(0, Math.PI / 2, 0) // Orient properly
      });
      
      if (hullSection) {
        hullSection.name = `HullSection_${i}`;
        hullGroup.add(hullSection);
      }
    }
    
    // If no models available, create procedural hull
    if (hullGroup.children.length === 0) {
      const hullGeometry = new this.THREE.CylinderGeometry(
        this.shipWidth / 2, 
        this.shipWidth / 2, 
        this.shipLength, 
        12, 
        1
      );
      const hullMaterial = new this.THREE.MeshLambertMaterial({ 
        color: 0x444466,
        transparent: true,
        opacity: 0.9
      });
      const hull = new this.THREE.Mesh(hullGeometry, hullMaterial);
      hull.rotation.z = Math.PI / 2; // Orient horizontally
      hull.name = 'ProceduralHull';
      
      hullGroup.add(hull);
      
      // Track for disposal
      this.createdGeometries.push(hullGeometry);
      this.createdMaterials.push(hullMaterial);
    }
    
    this.shipGroup.add(hullGroup);
  }

  private async buildShipBridge(): Promise<void> {
    // Use SciFi wall models for bridge construction
    const bridgeModels = [
      'scifi_wallwindow_straight',
      'scifi_wallastra_straight_window',
      'scifi_platform_window_wide'
    ];
    
    const bridgeGroup = new this.THREE.Group();
    bridgeGroup.name = 'ShipBridge';
    
    // Try to build bridge from SciFi models
    for (let i = 0; i < 3; i++) {
      const modelName = bridgeModels[i % bridgeModels.length];
      const bridgeSection = this.modelLibrary.getModel('structures', modelName, {
        position: new this.THREE.Vector3(
          this.shipLength / 2 - 10 + i * 4,
          this.shipHeight / 2,
          0
        ),
        scale: 0.8,
        rotation: new this.THREE.Euler(0, 0, 0)
      });
      
      if (bridgeSection) {
        bridgeSection.name = `BridgeSection_${i}`;
        bridgeGroup.add(bridgeSection);
      }
    }
    
    // Fallback to procedural bridge if no models
    if (bridgeGroup.children.length === 0) {
      const bridgeGeometry = new this.THREE.BoxGeometry(20, 8, 12);
      const bridgeMaterial = new this.THREE.MeshLambertMaterial({ color: 0x555577 });
      const bridge = new this.THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.set(this.shipLength / 2 - 10, this.shipHeight / 2, 0);
      bridge.name = 'ProceduralBridge';
      
      bridgeGroup.add(bridge);
      
      // Track for disposal
      this.createdGeometries.push(bridgeGeometry);
      this.createdMaterials.push(bridgeMaterial);
    }
    
    this.shipGroup.add(bridgeGroup);
  }

  private async buildEngineNacelles(): Promise<void> {
    // Use SciFi column models for engine nacelles
    const engineModels = [
      'scifi_column_pipes',
      'scifi_column_metalsupport',
      'scifi_column_astra'
    ];
    
    const engineGroup = new this.THREE.Group();
    engineGroup.name = 'EngineNacelles';
    
    // Left engine
    const leftEngineModel = engineModels[Math.floor(Math.random() * engineModels.length)];
    const leftEngine = this.modelLibrary.getModel('structures', leftEngineModel, {
      position: new this.THREE.Vector3(-this.shipLength / 2 + 7, 0, -12),
      scale: new this.THREE.Vector3(0.8, 2.0, 0.8),
      rotation: new this.THREE.Euler(0, 0, Math.PI / 2)
    });
    
    if (leftEngine) {
      leftEngine.name = 'LeftEngine';
      engineGroup.add(leftEngine);
    }
    
    // Right engine
    const rightEngineModel = engineModels[Math.floor(Math.random() * engineModels.length)];
    const rightEngine = this.modelLibrary.getModel('structures', rightEngineModel, {
      position: new this.THREE.Vector3(-this.shipLength / 2 + 7, 0, 12),
      scale: new this.THREE.Vector3(0.8, 2.0, 0.8),
      rotation: new this.THREE.Euler(0, 0, Math.PI / 2)
    });
    
    if (rightEngine) {
      rightEngine.name = 'RightEngine';
      engineGroup.add(rightEngine);
    }
    
    // Fallback to procedural engines
    if (engineGroup.children.length === 0) {
      const engineGeometry = new this.THREE.CylinderGeometry(3, 3, 15, 8);
      const engineMaterial = new this.THREE.MeshLambertMaterial({ color: 0x662222 });
      
      const leftEngine = new this.THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine.position.set(-this.shipLength / 2 + 7, 0, -12);
      leftEngine.rotation.z = Math.PI / 2;
      leftEngine.name = 'ProceduralLeftEngine';
      
      const rightEngine = new this.THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine.position.set(-this.shipLength / 2 + 7, 0, 12);
      rightEngine.rotation.z = Math.PI / 2;
      rightEngine.name = 'ProceduralRightEngine';
      
      engineGroup.add(leftEngine, rightEngine);
      
      // Track for disposal
      this.createdGeometries.push(engineGeometry);
      this.createdMaterials.push(engineMaterial);
    }
    
    this.shipGroup.add(engineGroup);
  }

  private async addBattleDamage(): Promise<void> {
    // Use SciFi decorative models as damage/debris
    const damageModels = [
      'scifi_prop_barrel_large',
      'scifi_prop_crate3',
      'scifi_prop_computer'
    ];
    
    const damageGroup = new this.THREE.Group();
    damageGroup.name = 'BattleDamage';
    
    // Add damaged SciFi props around the ship
    for (let i = 0; i < 6; i++) {
      const modelName = damageModels[Math.floor(Math.random() * damageModels.length)];
      const damageObject = this.modelLibrary.getModel('decorative', modelName, {
        position: new this.THREE.Vector3(
          (Math.random() - 0.5) * this.shipLength * 0.8,
          (Math.random() - 0.5) * this.shipHeight,
          (Math.random() - 0.5) * this.shipWidth
        ),
        scale: 0.3 + Math.random() * 0.4,
        rotation: new this.THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
      });
      
      if (damageObject) {
        // Make it look damaged/darkened
        damageObject.traverse((child: any) => {
          if (child.isMesh && child.material) {
            let damagedMaterial: any;
            
            // Check if material has clone method, otherwise create new material
            if (typeof child.material.clone === 'function') {
              damagedMaterial = child.material.clone();
            } else {
              // Create a new basic material if clone is not available
              damagedMaterial = new this.THREE.MeshLambertMaterial({
                color: child.material.color || 0x888888
              });
            }
            
            // Apply damage styling
            if (damagedMaterial.color && damagedMaterial.color.multiplyScalar) {
              damagedMaterial.color.multiplyScalar(0.3); // Darken
            }
            damagedMaterial.transparent = true;
            damagedMaterial.opacity = 0.7;
            child.material = damagedMaterial;
            this.createdMaterials.push(damagedMaterial);
          }
        });
        
        damageObject.name = `DamageObject_${i}`;
        damageGroup.add(damageObject);
      }
    }
    
    this.shipGroup.add(damageGroup);
  }

  private async createShipInterior(): Promise<void> {
    console.log('Creating comprehensive SciFi ship interior with walls, floors, and collision...');
    
    this.interiorGroup = new this.THREE.Group();
    this.interiorGroup.name = 'ShipInterior';
    
    // Create solid floor system first
    await this.createShipFlooring();
    
    // Create room walls with collision
    await this.createShipWalls();
    
    // Create rooms using massive SciFi model library
    await this.createBridge();
    await this.createCaptainsQuarters();
    await this.createEngineering();
    await this.createCargoBay();
    await this.createCorridors();
    
    // Add visible light sources throughout
    await this.createInteriorLighting();
    
    this.levelGroup.add(this.interiorGroup);
    console.log('Comprehensive SciFi ship interior created');
  }

  private async createBridge(): Promise<void> {
    const bridgeGroup = new this.THREE.Group();
    bridgeGroup.name = 'BridgeRoom';
    
    // Use SciFi models for bridge equipment
    const bridgeEquipment = [
      'scifi_prop_computer',
      'scifi_prop_accesspoint',
      'scifi_platform_centerplate'
    ];
    
    for (let i = 0; i < 4; i++) {
      const modelName = bridgeEquipment[Math.floor(Math.random() * bridgeEquipment.length)];
      const equipment = this.modelLibrary.getModel('decorative', modelName, {
        position: new this.THREE.Vector3(
          45 + (Math.random() - 0.5) * 10,
          1,
          (Math.random() - 0.5) * 8
        ),
        scale: 0.8,
        rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      });
      
      if (equipment) {
        equipment.name = `BridgeEquipment_${i}`;
        bridgeGroup.add(equipment);
      }
    }
    
    this.interiorGroup.add(bridgeGroup);
  }

  private async createCaptainsQuarters(): Promise<void> {
    const quartersGroup = new this.THREE.Group();
    quartersGroup.name = 'CaptainsQuarters';
    
    // Use SciFi props for quarters furniture
    const quartersFurniture = [
      'scifi_prop_chest',
      'scifi_prop_computer',
      'scifi_prop_itemholder'
    ];
    
    for (let i = 0; i < 3; i++) {
      const modelName = quartersFurniture[Math.floor(Math.random() * quartersFurniture.length)];
      const furniture = this.modelLibrary.getModel('decorative', modelName, {
        position: new this.THREE.Vector3(
          35 + (Math.random() - 0.5) * 6,
          0,
          (Math.random() - 0.5) * 6
        ),
        scale: 0.6,
        rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      });
      
      if (furniture) {
        furniture.name = `QuartersFurniture_${i}`;
        quartersGroup.add(furniture);
      }
    }
    
    this.interiorGroup.add(quartersGroup);
  }

  private async createEngineering(): Promise<void> {
    const engineeringGroup = new this.THREE.Group();
    engineeringGroup.name = 'EngineeringRoom';
    
    // Use SciFi technical props
    const engineeringEquipment = [
      'scifi_prop_computer',
      'scifi_prop_vent_big',
      'scifi_prop_pipeholder',
      'scifi_column_pipes'
    ];
    
    for (let i = 0; i < 6; i++) {
      const modelName = engineeringEquipment[Math.floor(Math.random() * engineeringEquipment.length)];
      const category = modelName.includes('column') ? 'structures' : 'decorative';
      
      const equipment = this.modelLibrary.getModel(category, modelName, {
        position: new this.THREE.Vector3(
          -40 + (Math.random() - 0.5) * 12,
          Math.random() * 2,
          (Math.random() - 0.5) * 10
        ),
        scale: 0.7,
        rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      });
      
      if (equipment) {
        equipment.name = `EngineeringEquipment_${i}`;
        engineeringGroup.add(equipment);
      }
    }
    
    this.interiorGroup.add(engineeringGroup);
  }

  private async createCargoBay(): Promise<void> {
    const cargoGroup = new this.THREE.Group();
    cargoGroup.name = 'CargoBay';
    
    // Use SciFi crates and containers
    const cargoItems = [
      'scifi_prop_crate3',
      'scifi_prop_crate4',
      'scifi_prop_barrel_large',
      'scifi_prop_chest'
    ];
    
    for (let i = 0; i < 8; i++) {
      const modelName = cargoItems[Math.floor(Math.random() * cargoItems.length)];
      const cargoItem = this.modelLibrary.getModel('decorative', modelName, {
        position: new this.THREE.Vector3(
          -20 + (Math.random() - 0.5) * 16,
          -2,
          (Math.random() - 0.5) * 12
        ),
        scale: 0.8 + Math.random() * 0.4,
        rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      });
      
      if (cargoItem) {
        cargoItem.name = `CargoItem_${i}`;
        cargoGroup.add(cargoItem);
      }
    }
    
    this.interiorGroup.add(cargoGroup);
  }

  private async createCorridors(): Promise<void> {
    const corridorGroup = new this.THREE.Group();
    corridorGroup.name = 'Corridors';
    
    // Use SciFi wall pieces for corridor construction
    const wallModels = [
      'scifi_shortwall_simple1_straight',
      'scifi_shortwall_metal2_straight',
      'scifi_wallband_straight'
    ];
    
    // Main corridor walls
    for (let i = 0; i < 6; i++) {
      const modelName = wallModels[Math.floor(Math.random() * wallModels.length)];
      const wall = this.modelLibrary.getModel('structures', modelName, {
        position: new this.THREE.Vector3(
          (i - 3) * 15,
          2,
          8 // One side of corridor
        ),
        scale: 1.2,
        rotation: new this.THREE.Euler(0, 0, 0)
      });
      
      if (wall) {
        wall.name = `CorridorWall_${i}`;
        corridorGroup.add(wall);
      }
      
      // Opposite wall
      const oppositeWall = this.modelLibrary.getModel('structures', modelName, {
        position: new this.THREE.Vector3(
          (i - 3) * 15,
          2,
          -8 // Other side of corridor
        ),
        scale: 1.2,
        rotation: new this.THREE.Euler(0, Math.PI, 0)
      });
      
      if (oppositeWall) {
        oppositeWall.name = `CorridorWallOpposite_${i}`;
        corridorGroup.add(oppositeWall);
      }
    }
    
    this.interiorGroup.add(corridorGroup);
  }

  private async createDebrisField(): Promise<void> {
    console.log('Creating SciFi debris field...');
    
    this.debrisField = new this.THREE.Group();
    this.debrisField.name = 'DebrisField';
    
    // Create debris using SciFi models
    for (let i = 0; i < 50; i++) {
      await this.createSciFiDebrisObject(i);
    }
    
    // Add temporal distortions
    this.createTemporalDistortions();
    
    this.levelGroup.add(this.debrisField);
    console.log('SciFi debris field created');
  }

  private async createSciFiDebrisObject(index: number): Promise<void> {
    const debrisModels = [
      { category: 'structures', models: ['scifi_platform_simple', 'scifi_column_round', 'scifi_wallband_straight'] },
      { category: 'decorative', models: ['scifi_prop_crate3', 'scifi_prop_barrel_large', 'scifi_alien_cyclop'] }
    ];
    
    const useModel = Math.random() < 0.8; // 80% chance to use SciFi models
    let debris: any = null;
    
    if (useModel) {
      const typeIndex = Math.floor(Math.random() * debrisModels.length);
      const debrisType = debrisModels[typeIndex];
      const modelName = debrisType.models[Math.floor(Math.random() * debrisType.models.length)];
      
      debris = this.modelLibrary.getModel(debrisType.category, modelName, {
        position: new this.THREE.Vector3(0, 0, 0),
        scale: 0.3 + Math.random() * 0.7,
        rotation: new this.THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
      });
      
      if (debris) {
        // Make it look like damaged space debris
        debris.traverse((child: any) => {
          if (child.isMesh && child.material) {
            let debrisMaterial: any;
            
            // Check if material has clone method, otherwise create new material
            if (typeof child.material.clone === 'function') {
              debrisMaterial = child.material.clone();
            } else {
              // Create a new basic material if clone is not available
              debrisMaterial = new this.THREE.MeshLambertMaterial({
                color: child.material.color || 0x888888
              });
            }
            
            // Apply debris styling
            if (debrisMaterial.color && debrisMaterial.color.multiplyScalar) {
              debrisMaterial.color.multiplyScalar(0.2 + Math.random() * 0.3);
            }
            debrisMaterial.transparent = true;
            debrisMaterial.opacity = 0.6 + Math.random() * 0.3;
            child.material = debrisMaterial;
            this.createdMaterials.push(debrisMaterial);
          }
        });
      }
    }
    
    // Fallback to procedural debris
    if (!debris) {
      const geometry = new this.THREE.DodecahedronGeometry(Math.random() * 3 + 1, 0);
      const material = new this.THREE.MeshLambertMaterial({
        color: new this.THREE.Color().setHSL(0.6, 0.3, 0.2 + Math.random() * 0.3)
      });
      debris = new this.THREE.Mesh(geometry, material);
      
      this.createdGeometries.push(geometry);
      this.createdMaterials.push(material);
    }
    
    // Position debris OUTSIDE the ship (ship is ~120x50x50, so min distance 150)
    const distance = 150 + Math.random() * 400; // Much further from ship
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    let x = distance * Math.sin(phi) * Math.cos(theta);
    let y = distance * Math.sin(phi) * Math.sin(theta);
    let z = distance * Math.cos(phi);
    
    // Ensure debris doesn't spawn inside ship bounding box
    if (Math.abs(x) < 80 && Math.abs(z) < 40 && Math.abs(y) < 20) {
      // Push it further away if it's too close to ship
      const pushFactor = 2.0;
      x *= pushFactor;
      y *= pushFactor;
      z *= pushFactor;
    }
    
    debris.position.set(x, y, z);
    
    debris.name = `Debris_${index}`;
    this.debrisField.add(debris);
  }

  private createTemporalDistortions(): void {
    // Create purple temporal anomaly effects
    for (let i = 0; i < 15; i++) {
      const particleCount = 30;
      const positions = new Float32Array(particleCount * 3);
      
      for (let j = 0; j < particleCount; j++) {
        const j3 = j * 3;
        positions[j3] = (Math.random() - 0.5) * 15;
        positions[j3 + 1] = (Math.random() - 0.5) * 15;
        positions[j3 + 2] = (Math.random() - 0.5) * 15;
      }
      
      const geometry = new this.THREE.BufferGeometry();
      geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
      
      const material = new this.THREE.PointsMaterial({
        color: 0x8A2BE2, // Purple
        size: 2,
        transparent: true,
        opacity: 0.6,
        blending: this.THREE.AdditiveBlending
      });
      
      const distortion = new this.THREE.Points(geometry, material);
      
      // Position distortions around the ship
      const distance = 60 + Math.random() * 150;
      const angle = Math.random() * Math.PI * 2;
      distortion.position.set(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * 80,
        Math.sin(angle) * distance
      );
      
      distortion.name = `TemporalDistortion_${i}`;
      this.debrisField.add(distortion);
      
      // Track for disposal
      this.createdGeometries.push(geometry);
      this.createdMaterials.push(material);
    }
  }

  private placeStoryElements(): void {
    console.log('Placing story elements with SciFi models...');
    
    // Captain's logs using SciFi computer/datapad models
    this.createCaptainsLog('log_1', { x: 45, y: 2, z: 3 }, 'Day 1: The star... something\'s wrong with the star...');
    this.createCaptainsLog('log_2', { x: 35, y: 1, z: -2 }, 'Day 3: Temporal readings are off the charts. The crew is getting nervous.');
    this.createCaptainsLog('log_3', { x: 0, y: 1, z: 1 }, 'Day 7: We\'re trapped in some kind of loop. I keep seeing the same purple light...');
    this.createCaptainsLog('log_4', { x: -20, y: -2, z: 5 }, 'Day ?: Time has no meaning here. The Perfect Mary... it holds the key.');
    this.createCaptainsLog('log_5', { x: -40, y: 1, z: -3 }, 'Final entry: If you find this, check the safe. Code is the number of loops we experienced.');
    
    // The safe using a SciFi chest model
    this.createSciFiSafe({ x: 38, y: 0, z: -3 });
    
    console.log('Story elements placed with SciFi aesthetics');
  }

  private createCaptainsLog(id: string, position: {x: number, y: number, z: number}, content: string): void {
    // Try to use a SciFi computer model for the log
    let logObject: any = this.modelLibrary.getModel('decorative', 'scifi_prop_computer', {
      position: new this.THREE.Vector3(position.x, position.y, position.z),
      scale: 0.6,
      rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
    });
    
    if (!logObject) {
      // Fallback to procedural datapad
      const logGeometry = new this.THREE.BoxGeometry(1, 0.1, 1.5);
      const logMaterial = new this.THREE.MeshLambertMaterial({ 
        color: 0x00ff88,
        transparent: true,
        opacity: 0.8
      });
      logObject = new this.THREE.Mesh(logGeometry, logMaterial);
      logObject.position.set(position.x, position.y, position.z);
      
      this.createdGeometries.push(logGeometry);
      this.createdMaterials.push(logMaterial);
    }
    
    // At this point logObject is guaranteed to exist
    
    // Add MUCH more visible interaction indicator
    const glowGeometry = new this.THREE.SphereGeometry(3.0, 16, 16);
    const glowMaterial = new this.THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
      blending: this.THREE.AdditiveBlending
    });
    const glow = new this.THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(logObject.position);
    
    // Add floating text indicator
    const textGeometry = new this.THREE.PlaneGeometry(6, 1.5);
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 512;
    textCanvas.height = 128;
    const ctx = textCanvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`[E] Captain's Log ${id}`, 256, 50);
    ctx.fillStyle = '#88ffaa';
    ctx.font = '18px Arial';
    ctx.fillText('Press E to interact', 256, 80);
    
    const textTexture = new this.THREE.CanvasTexture(textCanvas);
    const textMaterial = new this.THREE.MeshBasicMaterial({ 
      map: textTexture, 
      transparent: true,
      alphaTest: 0.1
    });
    const textMesh = new this.THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(position.x, position.y + 4, position.z);
    
    logObject.name = `CaptainsLog_${id}`;
    glow.name = `LogGlow_${id}`;
    textMesh.name = `LogText_${id}`;
    
    this.interiorGroup.add(logObject, glow, textMesh);
    
    // Track for disposal
    this.createdGeometries.push(glowGeometry, textGeometry);
    this.createdMaterials.push(glowMaterial, textMaterial);
    this.createdTextures.push(textTexture);
    
    // Store for legacy proximity check
    this.interactableNotes.push({
      id,
      mesh: logObject,
      content,
      found: false,
      interactionRadius: 10
    });
    
    // Register with InteractionSystem for click-to-select
    const interactableObject: InteractableObject = {
      id: `captains_log_${id}`,
      mesh: logObject,
      type: 'note',
      data: { id, content },
      onInteract: (data) => {
        console.log(`📝 Captain's Log ${data.id} clicked: ${data.content}`);
        this.showCaptainsLogUI(data.id, data.content);
        
        // Mark as found
        const note = this.interactableNotes.find(n => n.id === data.id);
        if (note && !note.found) {
          note.found = true;
          this.notesFound.add(data.id);
          
          // Dim the note to show it's been read
          logObject.traverse((child: any) => {
            if (child.isMesh && child.material) {
              child.material.opacity = 0.3;
            }
          });
          
          if (this.onNoteFoundCallback) {
            this.onNoteFoundCallback(data.id, data.content);
          }
        }
      }
    };
    
    this.interactionSystem.addInteractable(interactableObject);
  }

  private createSciFiSafe(position: {x: number, y: number, z: number}): void {
    // Try to use a SciFi chest model
    let safeObject: any = this.modelLibrary.getModel('decorative', 'scifi_prop_chest', {
      position: new this.THREE.Vector3(position.x, position.y, position.z),
      scale: 1.2,
      rotation: new this.THREE.Euler(0, Math.PI / 4, 0)
    });
    
    if (!safeObject) {
      // Fallback to procedural safe
      const safeGeometry = new this.THREE.BoxGeometry(2, 2, 1.5);
      const safeMaterial = new this.THREE.MeshLambertMaterial({ color: 0x666666 });
      safeObject = new this.THREE.Mesh(safeGeometry, safeMaterial);
      safeObject.position.set(position.x, position.y, position.z);
      
      this.createdGeometries.push(safeGeometry);
      this.createdMaterials.push(safeMaterial);
    }
    
    // At this point safeObject is guaranteed to exist
    
    // Add lock indicator using SciFi styling
    const lockGeometry = new this.THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
    const lockMaterial = new this.THREE.MeshLambertMaterial({ color: 0xff3333 }); // Red = locked
    const lock = new this.THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.set(position.x + 1, position.y, position.z);
    lock.rotation.z = Math.PI / 2;
    
    safeObject.name = 'SciFiSafe';
    lock.name = 'SafeLock';
    
    this.safe = safeObject;
    this.interiorGroup.add(safeObject, lock);
    
    // Track for disposal
    this.createdGeometries.push(lockGeometry);
    this.createdMaterials.push(lockMaterial);
    
    // Store lock reference for interaction
    this.safe.userData = { lock, locked: true };
  }

  private setupSpaceshipLighting(): void {
    this.lightingGroup = new this.THREE.Group();
    this.lightingGroup.name = 'SpaceshipLighting';
    
    // MUCH brighter lighting so you can see everything clearly
    const ambientLight = new this.THREE.AmbientLight(0x8899bb, 1.2); // Bright blue-white
    this.lightingGroup.add(ambientLight);
    
    // Bright main directional light
    const mainLight = new this.THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    this.lightingGroup.add(mainLight);
    
    // Secondary fill light
    const fillLight = new this.THREE.DirectionalLight(0x6699ff, 1.0);
    fillLight.position.set(-50, 50, -50);
    this.lightingGroup.add(fillLight);
    
    // Ship interior lighting
    const interiorLight = new this.THREE.PointLight(0x88ccff, 1.0, 100);
    interiorLight.position.set(45, 10, 0); // Bridge area
    this.lightingGroup.add(interiorLight);
    
    this.levelGroup.add(this.lightingGroup);
  }

  // Public methods for story interaction
  public onNoteFound(callback: (noteId: string, content: string) => void): void {
    this.onNoteFoundCallback = callback;
  }
  
  public onSafeOpened(callback: (recipe: any) => void): void {
    this.onSafeOpenedCallback = callback;
  }
  
  public checkInteraction(position: {x: number, y: number, z: number}): any {
    // Check if player is near any interactable objects
    const playerPos = new this.THREE.Vector3(position.x, position.y, position.z);
    
    // Check notes with updated interaction radius
    for (const note of this.interactableNotes) {
      if (!note.found) {
        const distance = playerPos.distanceTo(note.mesh.position);
        const radius = (note as any).interactionRadius || 4; // Use new larger radius
        if (distance < radius) {
          note.found = true;
          this.notesFound.add(note.id);
          
          // Make note dim to show it's been read
          note.mesh.traverse((child: any) => {
            if (child.isMesh && child.material) {
              child.material.opacity = 0.3;
            }
          });
          
          if (this.onNoteFoundCallback) {
            this.onNoteFoundCallback(note.id, note.content);
          }
          
          return { type: 'note', id: note.id, content: note.content };
        }
      }
    }
    
    // Check safe
    if (this.safe && !this.safeUnlocked) {
      const distance = playerPos.distanceTo(this.safe.position);
      if (distance < 4) {
        if (this.notesFound.size >= 4) {
          this.safeUnlocked = true;
          
          // Change lock color to green
          this.safe.userData.lock.material.color.setHex(0x00ff00);
          this.safe.userData.locked = false;
          
          const recipe = {
            name: "The Perfect Mary",
            ingredients: [
              "2 oz Premium Vodka",
              "4 oz Miranda Tomato Juice", 
              "1/2 oz Temporal Lime Juice",
              "2 dashes Quantum Worcestershire",
              "1 dash Probability Hot Sauce",
              "Celery salt rim",
              "NO PICKLES (Critical: Pickles cause temporal instability)"
            ],
            instructions: "Mix in order during temporal anomaly. Serve immediately before causality collapse.",
            note: "Warning: This recipe was recovered from a causal isolation bubble. Effects unknown."
          };
          
          if (this.onSafeOpenedCallback) {
            this.onSafeOpenedCallback(recipe);
          }
          
          return { type: 'safe', recipe };
        } else {
          return { 
            type: 'safe_locked', 
            message: `Safe is locked. Need more captain's logs. Found: ${this.notesFound.size}/4`
          };
        }
      }
    }
    
    return null;
  }

  public update(): void {
    // Animate temporal distortions and debris
    if (this.debrisField) {
      const time = Date.now() * 0.001;
      
      this.debrisField.children.forEach((child: any, index: number) => {
        if (child.name && child.name.includes('TemporalDistortion')) {
          // Animate temporal distortions
          child.rotation.y += 0.015;
          child.position.y += Math.sin(time + index) * 0.08;
        } else if (child.name && child.name.includes('Debris')) {
          // Slowly rotate debris
          child.rotation.x += 0.002;
          child.rotation.y += 0.003;
          child.rotation.z += 0.001;
        }
      });
    }
  }

  private async createShipFlooring(): Promise<void> {
    console.log('Creating solid ship flooring to replace water...');
    
    // Create main ship deck using SciFi platform models
    const floorModels = [
      'scifi_platform_simple',
      'scifi_platform_metal',
      'scifi_platform_centerplate',
      'scifi_platform_darkplates'
    ];
    
    // Create a solid floor grid covering the entire ship
    for (let x = -60; x <= 60; x += 8) {
      for (let z = -25; z <= 25; z += 8) {
        const modelName = floorModels[Math.floor(Math.random() * floorModels.length)];
        const floorTile = this.modelLibrary.getModel('structures', modelName, {
          position: new this.THREE.Vector3(x, -1.5, z),
          scale: new this.THREE.Vector3(1.8, 0.3, 1.8),
          rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
        });
        
        if (floorTile) {
          floorTile.name = `FloorTile_${x}_${z}`;
          this.interiorGroup.add(floorTile);
        }
      }
    }
    
    // Add procedural floor backup if models fail
    const backupFloorGeometry = new this.THREE.PlaneGeometry(140, 60);
    const backupFloorMaterial = new this.THREE.MeshLambertMaterial({ 
      color: 0x334455,
      side: this.THREE.DoubleSide
    });
    const backupFloor = new this.THREE.Mesh(backupFloorGeometry, backupFloorMaterial);
    backupFloor.rotation.x = -Math.PI / 2;
    backupFloor.position.y = -2;
    backupFloor.name = 'BackupFloor';
    
    this.interiorGroup.add(backupFloor);
    this.createdGeometries.push(backupFloorGeometry);
    this.createdMaterials.push(backupFloorMaterial);
  }
  
  private async createShipWalls(): Promise<void> {
    console.log('Creating solid ship walls with collision...');
    
    const wallModels = [
      'scifi_shortwall_simple1_straight',
      'scifi_shortwall_metal2_straight', 
      'scifi_wallband_straight'
    ];
    
    // Create exterior hull walls that you can't walk through
    const wallHeight = 6;
    
    // Long side walls
    for (let x = -60; x <= 60; x += 10) {
      // North wall
      const northWall = this.createWallSection(wallModels, x, wallHeight/2, 25, 0);
      if (northWall) this.interiorGroup.add(northWall);
      
      // South wall  
      const southWall = this.createWallSection(wallModels, x, wallHeight/2, -25, Math.PI);
      if (southWall) this.interiorGroup.add(southWall);
    }
    
    // Short side walls
    for (let z = -20; z <= 20; z += 10) {
      // East wall
      const eastWall = this.createWallSection(wallModels, 65, wallHeight/2, z, Math.PI/2);
      if (eastWall) this.interiorGroup.add(eastWall);
      
      // West wall
      const westWall = this.createWallSection(wallModels, -65, wallHeight/2, z, -Math.PI/2);
      if (westWall) this.interiorGroup.add(westWall);
    }
  }
  
  private createWallSection(wallModels: string[], x: number, y: number, z: number, rotY: number): any {
    const modelName = wallModels[Math.floor(Math.random() * wallModels.length)];
    const wall = this.modelLibrary.getModel('structures', modelName, {
      position: new this.THREE.Vector3(x, y, z),
      scale: new this.THREE.Vector3(1, 1.5, 1),
      rotation: new this.THREE.Euler(0, rotY, 0)
    });
    
    if (wall) {
      wall.userData.isCollidable = true; // Mark for collision detection
      return wall;
    }
    
    // Fallback procedural wall
    const wallGeometry = new this.THREE.BoxGeometry(8, 6, 1);
    const wallMaterial = new this.THREE.MeshLambertMaterial({ color: 0x445566 });
    const fallbackWall = new this.THREE.Mesh(wallGeometry, wallMaterial);
    fallbackWall.position.set(x, y, z);
    fallbackWall.rotation.y = rotY;
    fallbackWall.userData.isCollidable = true;
    
    this.createdGeometries.push(wallGeometry);
    this.createdMaterials.push(wallMaterial);
    
    return fallbackWall;
  }
  
  private async createInteriorLighting(): Promise<void> {
    console.log('Creating visible interior light sources...');
    
    // Add many visible light fixtures throughout the ship
    const lightPositions = [
      {x: 45, y: 8, z: 0, color: 0x88ccff},   // Bridge
      {x: 35, y: 6, z: 0, color: 0x88ccff},   // Captain's quarters
      {x: -40, y: 7, z: 0, color: 0xff8844},  // Engineering (orange)
      {x: 0, y: 5, z: 0, color: 0x88ccff},    // Central corridor
      {x: 20, y: 6, z: 10, color: 0x88ccff},  // Cargo bay
      {x: 20, y: 6, z: -10, color: 0x88ccff}, // Cargo bay
      {x: -20, y: 5, z: 5, color: 0x88ccff},  // Side corridor
      {x: -20, y: 5, z: -5, color: 0x88ccff}, // Side corridor
    ];
    
    lightPositions.forEach((lightData, index) => {
      // Create actual point light
      const pointLight = new this.THREE.PointLight(lightData.color, 1.0, 30);
      pointLight.position.set(lightData.x, lightData.y, lightData.z);
      pointLight.name = `InteriorLight_${index}`;
      
      // Add visible glowing sphere
      const glowGeometry = new this.THREE.SphereGeometry(0.8, 12, 12);
      const glowMaterial = new this.THREE.MeshBasicMaterial({
        color: lightData.color,
        transparent: true,
        opacity: 0.6,
        blending: this.THREE.AdditiveBlending
      });
      const glow = new this.THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(pointLight.position);
      glow.name = `LightGlow_${index}`;
      
      this.lightingGroup.add(pointLight);
      this.interiorGroup.add(glow);
      
      this.createdGeometries.push(glowGeometry);
      this.createdMaterials.push(glowMaterial);
    });
  }

  // UI Methods (contained within level)
  private showCaptainsLogUI(logId: string, content: string): void {
    // Remove any existing UI
    this.hideCaptainsLogUI();
    
    // Create UI element
    const uiContainer = document.createElement('div');
    uiContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #00ff88;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      color: #00ff88;
      font-family: 'Courier New', monospace;
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
    `;
    
    uiContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: bold;">Captain's Log ${logId}</h3>
        <button id="closeLogBtn" style="
          background: transparent;
          border: 1px solid #00ff88;
          color: #00ff88;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        ">×</button>
      </div>
      <div style="color: #88ffaa; line-height: 1.5; font-size: 14px;">
        ${content}
      </div>
      <div style="margin-top: 16px; font-size: 12px; color: #00ff88; font-style: italic;">
        Click × or press ESC to close
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(uiContainer);
    this.currentLogUI = uiContainer;
    
    // Setup event listeners
    const closeBtn = uiContainer.querySelector('#closeLogBtn') as HTMLElement;
    closeBtn.addEventListener('click', () => this.hideCaptainsLogUI());
    
    // ESC key handler
    const escHandler = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        this.hideCaptainsLogUI();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
  
  private hideCaptainsLogUI(): void {
    if (this.currentLogUI) {
      document.body.removeChild(this.currentLogUI);
      this.currentLogUI = null;
    }
  }

  public dispose(): void {
    console.log('🧹 Disposing Miranda Ship level with complete cleanup...');
    
    // Remove the entire level from scene
    if (this.levelGroup) {
      this.scene.remove(this.levelGroup);
    }
    
    // Remove lighting
    if (this.lightingGroup) {
      this.scene.remove(this.lightingGroup);
    }
    
    // Dispose all tracked materials
    this.createdMaterials.forEach(material => {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    });
    
    // Dispose all tracked textures
    this.createdTextures.forEach(texture => {
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose();
      }
    });
    
    // Dispose all tracked geometries
    this.createdGeometries.forEach(geometry => {
      if (geometry && typeof geometry.dispose === 'function') {
        geometry.dispose();
      }
    });
    
    // Dispose interaction system
    if (this.interactionSystem) {
      this.interactionSystem.dispose();
    }
    
    // Clean up UI
    this.hideCaptainsLogUI();
    
    // Dispose model library and assets
    if (this.modelLibrary && typeof this.modelLibrary.dispose === 'function') {
      this.modelLibrary.dispose();
    }
    
    // Clear all references
    this.createdMaterials = [];
    this.createdTextures = [];
    this.createdGeometries = [];
    this.interactableNotes = [];
    this.safe = null;
    this.levelGroup = null;
    this.shipGroup = null;
    this.debrisField = null;
    this.interiorGroup = null;
    this.lightingGroup = null;
    
    console.log('✅ Miranda Ship level completely disposed with full resource cleanup');
  }
}