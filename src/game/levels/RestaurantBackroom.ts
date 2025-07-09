// Restaurant Backroom Level - Cosmic Horror themed SciFi back room investigation
// Someone is strapped to a food prep table in a dirty SciFi restaurant back room

import { AssetLoader } from '../../engine/resources/AssetLoader';
import { ModelLibrary } from '../systems/ModelLibrary';
import { Materials } from '../../engine/rendering/Materials';
import { InteractionSystem, type InteractableObject } from '../../engine/input/InteractionSystem';

export class RestaurantBackroom {
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
  private levelGroup: any = null;
  private backroomGroup: any = null;
  private equipmentGroup: any = null;
  private lightingGroup: any = null;
  
  // Horror elements
  private strappedPerson: any = null;
  private foodPrepTable: any = null;
  
  // Resource tracking for proper disposal
  private createdMaterials: any[] = [];
  private createdTextures: any[] = [];
  private createdGeometries: any[] = [];
  
  // Level parameters
  private readonly roomWidth = 60;
  private readonly roomLength = 80;
  private readonly roomHeight = 20;

  constructor(THREE: any, scene: any, physicsWorld?: any, camera?: any, gameContainer?: any, assetLoader?: AssetLoader) {
    this.THREE = THREE;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.camera = camera;
    this.gameContainer = gameContainer;
    
    // Initialize 3D asset systems
    this.assetLoader = assetLoader || new AssetLoader();
    this.materials = new Materials();
    this.modelLibrary = new ModelLibrary(THREE, this.assetLoader, this.materials);
    
    // Initialize interaction system for click-to-select
    this.interactionSystem = new InteractionSystem(this.camera, this.gameContainer);
    
    // Create main level container
    this.levelGroup = new this.THREE.Group();
    this.levelGroup.name = 'RestaurantBackroomLevel';
  }

  public async initialize(): Promise<void> {
    console.log('🍴 Initializing Restaurant Backroom level with cosmic horror...');
    
    // Initialize asset systems
    await this.assetLoader.initialize();
    await this.modelLibrary.initialize();
    
    // Build the level
    await this.createHorrorEnvironment();
    this.setupBackroomLighting(); // Initialize lighting groups first
    await this.createBackroomStructure();
    await this.createRestaurantEquipment();
    await this.createFoodPrepScene();
    await this.createScatteredUtensils();
    
    // Add the complete level to scene
    this.scene.add(this.levelGroup);
    
    console.log('✅ Restaurant Backroom level initialized with cosmic horror elements');
  }

  public update(): void {
    // Update any animated elements (flickering lights, etc.)
    if (this.lightingGroup) {
      const time = Date.now() * 0.001;
      
      // Make the red emergency lights flicker
      this.lightingGroup.children.forEach((light: any, index: number) => {
        if (light.color && light.color.r > 0.8) { // Red lights
          const flicker = 0.3 + Math.sin(time * 5 + index) * 0.2;
          light.intensity = flicker;
        }
      });
    }
  }

  private async createHorrorEnvironment(): Promise<void> {
    console.log('Creating cosmic horror atmosphere...');
    
    // Create dark, oppressive space environment
    const spaceGeometry = new this.THREE.SphereGeometry(500, 16, 16);
    
    // Create a very dark, unsettling texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Deep, horror space background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0005'); // Deep red-black
    gradient.addColorStop(0.5, '#000000'); // Pure black
    gradient.addColorStop(1, '#050008'); // Dark purple-black
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some ominous "stars" (distant horrors)
    ctx.fillStyle = '#220011';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 1.5 + 0.5;
      const opacity = Math.random() * 0.3 + 0.1;
      
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
      opacity: 0.9
    });
    
    const spaceSkybox = new this.THREE.Mesh(spaceGeometry, spaceMaterial);
    spaceSkybox.name = 'HorrorSkybox';
    
    this.levelGroup.add(spaceSkybox);
    
    // Track for disposal
    this.createdGeometries.push(spaceGeometry);
    this.createdTextures.push(spaceTexture);
    this.createdMaterials.push(spaceMaterial);
    
    console.log('Horror space environment created');
  }

  private setupBackroomLighting(): void {
    this.lightingGroup = new this.THREE.Group();
    this.lightingGroup.name = 'BackroomLighting';
    
    // Much brighter ambient lighting so you can see everything
    const ambientLight = new this.THREE.AmbientLight(0x665544, 0.8);
    this.lightingGroup.add(ambientLight);
    
    // Bright main directional light
    const mainDirectionalLight = new this.THREE.DirectionalLight(0xffffff, 1.2);
    mainDirectionalLight.position.set(20, 50, 30);
    mainDirectionalLight.castShadow = true;
    this.lightingGroup.add(mainDirectionalLight);
    
    // Secondary fill light
    const fillLight = new this.THREE.DirectionalLight(0xddddaa, 0.8);
    fillLight.position.set(-30, 40, -20);
    this.lightingGroup.add(fillLight);
    
    // Dramatic overhead light (the main story element) - much brighter
    const mainLight = new this.THREE.PointLight(0xffffaa, 3.0, 80);
    mainLight.position.set(0, 15, 0); // Directly over the prep table
    mainLight.castShadow = true;
    this.lightingGroup.add(mainLight);
    
    // Brighter emergency lights in corners
    const redLight1 = new this.THREE.PointLight(0xff4444, 1.0, 50);
    redLight1.position.set(-25, 8, -35);
    this.lightingGroup.add(redLight1);
    
    const redLight2 = new this.THREE.PointLight(0xff4444, 0.8, 45);
    redLight2.position.set(25, 6, 35);
    this.lightingGroup.add(redLight2);
    
    // Brighter blue light from SciFi equipment
    const blueLight = new this.THREE.PointLight(0x4466ff, 1.2, 60);
    blueLight.position.set(-20, 5, 10);
    this.lightingGroup.add(blueLight);
    
    // Additional ceiling lights for better visibility
    const ceilingLight1 = new this.THREE.PointLight(0xffffff, 1.5, 70);
    ceilingLight1.position.set(15, 12, 20);
    this.lightingGroup.add(ceilingLight1);
    
    const ceilingLight2 = new this.THREE.PointLight(0xffffff, 1.5, 70);
    ceilingLight2.position.set(-15, 12, -20);
    this.lightingGroup.add(ceilingLight2);
    
    this.levelGroup.add(this.lightingGroup);
  }

  private async createBackroomStructure(): Promise<void> {
    console.log('Creating backroom structure with SciFi walls and floors...');
    
    this.backroomGroup = new this.THREE.Group();
    this.backroomGroup.name = 'BackroomStructure';
    
    // Create dirty, industrial floor
    await this.createIndustrialFloor();
    
    // Create grimy walls
    await this.createGrimyWalls();
    
    // Create ceiling with exposed pipes/vents
    await this.createIndustrialCeiling();
    
    this.levelGroup.add(this.backroomGroup);
    console.log('Backroom structure created');
  }

  private async createIndustrialFloor(): Promise<void> {
    // Use SciFi platform pieces for dirty industrial floor
    const floorModels = [
      'scifi_platform_simple',
      'scifi_platform_metal',
      'scifi_platform_darkplates'
    ];
    
    // Create floor grid
    for (let x = -30; x <= 30; x += 10) {
      for (let z = -40; z <= 40; z += 10) {
        const modelName = floorModels[Math.floor(Math.random() * floorModels.length)];
        const floorTile = this.modelLibrary.getModel('structures', modelName, {
          position: new this.THREE.Vector3(x, -2, z),
          scale: new this.THREE.Vector3(2, 0.3, 2),
          rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
        });
        
        if (floorTile) {
          // Make it look dirty and stained
          floorTile.traverse((child: any) => {
            if (child.isMesh && child.material) {
              let dirtyMaterial: any;
              if (typeof child.material.clone === 'function') {
                dirtyMaterial = child.material.clone();
              } else {
                dirtyMaterial = new this.THREE.MeshLambertMaterial({
                  color: child.material.color || 0x444444
                });
              }
              
              // Make it dirty brown/grey
              if (dirtyMaterial.color && dirtyMaterial.color.multiplyScalar) {
                dirtyMaterial.color.multiplyScalar(0.3 + Math.random() * 0.2);
                dirtyMaterial.color.r *= 0.8;
                dirtyMaterial.color.g *= 0.6;
                dirtyMaterial.color.b *= 0.4;
              }
              child.material = dirtyMaterial;
              this.createdMaterials.push(dirtyMaterial);
            }
          });
          
          floorTile.name = `FloorTile_${x}_${z}`;
          this.backroomGroup.add(floorTile);
        }
      }
    }
  }

  private async createGrimyWalls(): Promise<void> {
    const wallModels = [
      'scifi_shortwall_simple1_straight',
      'scifi_shortwall_metal2_straight',
      'scifi_wallband_straight'
    ];
    
    const wallHeight = 8;
    
    // Create walls around the room
    const wallPositions = [
      // Long walls
      ...Array.from({length: 8}, (_, i) => ({x: (i-4)*10, y: wallHeight/2, z: 40, rotY: 0})),
      ...Array.from({length: 8}, (_, i) => ({x: (i-4)*10, y: wallHeight/2, z: -40, rotY: Math.PI})),
      // Short walls  
      ...Array.from({length: 6}, (_, i) => ({x: 35, y: wallHeight/2, z: (i-3)*12, rotY: Math.PI/2})),
      ...Array.from({length: 6}, (_, i) => ({x: -35, y: wallHeight/2, z: (i-3)*12, rotY: -Math.PI/2}))
    ];
    
    wallPositions.forEach((pos, index) => {
      const modelName = wallModels[Math.floor(Math.random() * wallModels.length)];
      const wall = this.modelLibrary.getModel('structures', modelName, {
        position: new this.THREE.Vector3(pos.x, pos.y, pos.z),
        scale: new this.THREE.Vector3(1, 1.5, 1),
        rotation: new this.THREE.Euler(0, pos.rotY, 0)
      });
      
      if (wall) {
        // Make walls look grimy and stained
        wall.traverse((child: any) => {
          if (child.isMesh && child.material) {
            let grimyMaterial: any;
            if (typeof child.material.clone === 'function') {
              grimyMaterial = child.material.clone();
            } else {
              grimyMaterial = new this.THREE.MeshLambertMaterial({
                color: child.material.color || 0x555555
              });
            }
            
            // Make it grimy and dark
            if (grimyMaterial.color && grimyMaterial.color.multiplyScalar) {
              grimyMaterial.color.multiplyScalar(0.4 + Math.random() * 0.3);
            }
            child.material = grimyMaterial;
            this.createdMaterials.push(grimyMaterial);
          }
        });
        
        wall.name = `GrimyWall_${index}`;
        wall.userData.isCollidable = true;
        this.backroomGroup.add(wall);
      }
    });
  }

  private async createIndustrialCeiling(): Promise<void> {
    // Add some ceiling pipes and vents using SciFi models
    const ceilingModels = [
      'scifi_prop_pipeholder',
      'scifi_column_pipes',
      'scifi_prop_vent_big',
      'scifi_prop_vent_wide'
    ];
    
    for (let i = 0; i < 8; i++) {
      const modelName = ceilingModels[Math.floor(Math.random() * ceilingModels.length)];
      const category = modelName.includes('column') ? 'structures' : 'decorative';
      
      const ceilingElement = this.modelLibrary.getModel(category, modelName, {
        position: new this.THREE.Vector3(
          (Math.random() - 0.5) * 50,
          16 + Math.random() * 2,
          (Math.random() - 0.5) * 60
        ),
        scale: 0.8 + Math.random() * 0.4,
        rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      });
      
      if (ceilingElement) {
        ceilingElement.name = `CeilingElement_${i}`;
        this.backroomGroup.add(ceilingElement);
      }
    }
  }

  private async createRestaurantEquipment(): Promise<void> {
    console.log('Creating SciFi restaurant equipment...');
    
    this.equipmentGroup = new this.THREE.Group();
    this.equipmentGroup.name = 'RestaurantEquipment';
    
    // SciFi restaurant equipment using available models
    const equipmentItems = [
      // Large storage/prep items
      { model: 'scifi_prop_crate3', category: 'decorative', pos: [-25, 0, -20], scale: 1.2, name: 'Food Storage Crate' },
      { model: 'scifi_prop_crate4', category: 'decorative', pos: [-20, 0, -25], scale: 1.0, name: 'Ingredient Container' },
      { model: 'scifi_prop_barrel_large', category: 'decorative', pos: [25, 0, -15], scale: 1.5, name: 'Industrial Cooker' },
      { model: 'scifi_prop_chest', category: 'decorative', pos: [20, 0, 25], scale: 1.0, name: 'Equipment Storage' },
      
      // Computer/control stations
      { model: 'scifi_prop_computer', category: 'decorative', pos: [-30, 1, 10], scale: 0.8, name: 'Kitchen Control System' },
      { model: 'scifi_prop_accesspoint', category: 'decorative', pos: [30, 2, -10], scale: 1.0, name: 'Order Terminal' },
      
      // Smaller equipment scattered around
      { model: 'scifi_prop_itemholder', category: 'decorative', pos: [-15, 0, 15], scale: 0.6, name: 'Utensil Rack' },
      { model: 'scifi_prop_itemholder', category: 'decorative', pos: [15, 0, -20], scale: 0.7, name: 'Tool Holder' },
    ];
    
    for (const item of equipmentItems) {
      const equipment = this.modelLibrary.getModel(item.category, item.model, {
        position: new this.THREE.Vector3(item.pos[0], item.pos[1], item.pos[2]),
        scale: item.scale,
        rotation: new this.THREE.Euler(0, Math.random() * Math.PI * 2, 0)
      });
      
      if (equipment) {
        equipment.name = item.name;
        this.equipmentGroup.add(equipment);
      }
    }
    
    this.levelGroup.add(this.equipmentGroup);
    console.log('SciFi restaurant equipment created');
  }

  private async createFoodPrepScene(): Promise<void> {
    console.log('Creating the main horror scene - food prep table...');
    
    // Create the central food prep table using SciFi platform
    this.foodPrepTable = this.modelLibrary.getModel('structures', 'scifi_platform_centerplate', {
      position: new this.THREE.Vector3(0, 1, 0),
      scale: new this.THREE.Vector3(2, 0.5, 1.5),
      rotation: new this.THREE.Euler(0, 0, 0)
    });
    
    if (!this.foodPrepTable) {
      // Fallback procedural table
      const tableGeometry = new this.THREE.BoxGeometry(8, 2, 6);
      const tableMaterial = new this.THREE.MeshLambertMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.9
      });
      this.foodPrepTable = new this.THREE.Mesh(tableGeometry, tableMaterial);
      this.foodPrepTable.position.set(0, 1, 0);
      
      this.createdGeometries.push(tableGeometry);
      this.createdMaterials.push(tableMaterial);
    }
    
    this.foodPrepTable.name = 'FoodPrepTable';
    this.levelGroup.add(this.foodPrepTable);
    
    // Create the strapped person (using a simple representation)
    const personGeometry = new this.THREE.CapsuleGeometry(0.8, 4, 8, 16);
    const personMaterial = new this.THREE.MeshLambertMaterial({ 
      color: 0xffddaa, // Skin-like color
      transparent: true,
      opacity: 0.9
    });
    this.strappedPerson = new this.THREE.Mesh(personGeometry, personMaterial);
    this.strappedPerson.position.set(0, 3, 0); // On top of table
    this.strappedPerson.rotation.z = Math.PI / 2; // Lying down
    this.strappedPerson.name = 'StrappedPerson';
    
    this.levelGroup.add(this.strappedPerson);
    
    // Track for disposal
    this.createdGeometries.push(personGeometry);
    this.createdMaterials.push(personMaterial);
    
    // Register the person as an interactable
    const interactableObject: InteractableObject = {
      id: 'strapped_person',
      mesh: this.strappedPerson,
      type: 'button', // Using button type for person interaction
      data: { 
        message: "I'll never tell you where the Hamburgler is!",
        isStrappedPerson: true
      },
      onInteract: (data) => {
        console.log('💀 Player clicked on the strapped person');
        this.showPersonDialogue(data.message);
      }
    };
    
    this.interactionSystem.addInteractable(interactableObject);
    
    console.log('Horror food prep scene created with interactable person');
  }

  private async createScatteredUtensils(): Promise<void> {
    console.log('Scattering knives and forks around the scene...');
    
    // Create various utensils scattered around the prep table
    const utensilPositions = [
      { pos: [2, 3.5, 1], rot: [0, 0, Math.PI/4], type: 'knife' },
      { pos: [-1.5, 3.5, -0.5], rot: [0, Math.PI/3, 0], type: 'fork' },
      { pos: [1, 3.5, -2], rot: [0, -Math.PI/6, Math.PI/3], type: 'knife' },
      { pos: [-2, 3.5, 1.5], rot: [0, Math.PI/2, 0], type: 'fork' },
      { pos: [0.5, 3.5, 2], rot: [0, -Math.PI/4, Math.PI/6], type: 'knife' },
      // Some on the floor around the table
      { pos: [4, -1.5, 2], rot: [Math.PI/2, 0, Math.PI/3], type: 'fork' },
      { pos: [-3, -1.5, -1], rot: [Math.PI/3, Math.PI/4, 0], type: 'knife' },
      { pos: [2, -1.5, -4], rot: [0, Math.PI/6, Math.PI/2], type: 'fork' },
    ];
    
    utensilPositions.forEach((utensil, index) => {
      let geometry: any;
      let material: any;
      
      if (utensil.type === 'knife') {
        // Create a simple knife shape
        geometry = new this.THREE.BoxGeometry(0.2, 2, 0.1);
        material = new this.THREE.MeshLambertMaterial({ color: 0xcccccc });
      } else {
        // Create a simple fork shape
        geometry = new this.THREE.CylinderGeometry(0.05, 0.05, 1.8, 8);
        material = new this.THREE.MeshLambertMaterial({ color: 0xdddddd });
      }
      
      const mesh = new this.THREE.Mesh(geometry, material);
      mesh.position.set(utensil.pos[0], utensil.pos[1], utensil.pos[2]);
      mesh.rotation.set(utensil.rot[0], utensil.rot[1], utensil.rot[2]);
      mesh.name = `${utensil.type}_${index}`;
      
      this.levelGroup.add(mesh);
      
      // Track for disposal
      this.createdGeometries.push(geometry);
      this.createdMaterials.push(material);
    });
    
    console.log('Utensils scattered around the horror scene');
  }

  // UI Methods (contained within level)
  private showPersonDialogue(message: string): void {
    // Create UI element for the person's dialogue
    const uiContainer = document.createElement('div');
    uiContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      background: rgba(50, 0, 0, 0.95);
      border: 2px solid #ff3333;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      color: #ff6666;
      font-family: 'Courier New', monospace;
      box-shadow: 0 0 30px rgba(255, 51, 51, 0.5);
      text-align: center;
    `;
    
    uiContainer.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: bold; color: #ff3333;">STRAPPED PERSON</h3>
        <div style="font-size: 16px; font-style: italic; color: #ffaaaa;">
          *struggles against restraints*
        </div>
      </div>
      <div style="color: #ff6666; line-height: 1.5; font-size: 16px; font-weight: bold;">
        "${message}"
      </div>
      <div style="margin-top: 20px;">
        <button id="closeDialogueBtn" style="
          background: transparent;
          border: 2px solid #ff3333;
          color: #ff6666;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        ">Close</button>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(uiContainer);
    
    // Setup event listeners
    const closeBtn = uiContainer.querySelector('#closeDialogueBtn') as HTMLElement;
    const closeHandler = () => {
      document.body.removeChild(uiContainer);
    };
    
    closeBtn.addEventListener('click', closeHandler);
    
    // Auto-close after 5 seconds
    setTimeout(closeHandler, 5000);
    
    // ESC key handler
    const escHandler = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        try {
          document.body.removeChild(uiContainer);
        } catch (e) {
          // Container already removed
        }
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  public dispose(): void {
    console.log('🧹 Disposing Restaurant Backroom level...');
    
    // Remove the entire level from scene
    if (this.levelGroup) {
      this.scene.remove(this.levelGroup);
    }
    
    // Dispose interaction system
    if (this.interactionSystem) {
      this.interactionSystem.dispose();
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
    
    // Dispose model library and assets
    if (this.modelLibrary && typeof this.modelLibrary.dispose === 'function') {
      this.modelLibrary.dispose();
    }
    
    // Clear all references
    this.createdMaterials = [];
    this.createdTextures = [];
    this.createdGeometries = [];
    this.levelGroup = null;
    this.backroomGroup = null;
    this.equipmentGroup = null;
    this.lightingGroup = null;
    this.strappedPerson = null;
    this.foodPrepTable = null;
    
    console.log('✅ Restaurant Backroom level completely disposed');
  }
}