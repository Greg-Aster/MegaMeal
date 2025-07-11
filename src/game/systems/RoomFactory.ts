// Room Factory System
// Automatically generates rooms using the Modular SciFi MegaKit assets with physics

import * as THREE from 'three';
import { AssetLoader } from '../../engine/resources/AssetLoader';
import { Materials } from '../../engine/rendering/Materials';
import { BaseLevel } from '../levels/BaseLevel';

export interface RoomConfig {
  type: 'restaurant' | 'laboratory' | 'corridor' | 'control_room';
  size: { width: number; height: number; length: number };
  style: 'clean' | 'industrial' | 'damaged' | 'horror';
  lighting: 'bright' | 'dim' | 'emergency' | 'dramatic';
  props: string[];
  doors: Array<{ position: 'front' | 'back' | 'left' | 'right'; type: 'simple' | 'metal' | 'blocked' }>;
  floor?: string;
  ceiling?: string;
}

export interface PropPlacement {
  asset: string;
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: number;
  physics: boolean;
}

export class RoomFactory {
  private THREE: any;
  private assetLoader: AssetLoader;
  private materials: Materials;
  private assetBasePath = '/assets/game/Modular SciFi MegaKit[Standard]/glTF';
  
  constructor(THREE: any, assetLoader: AssetLoader, materials: Materials) {
    this.THREE = THREE;
    this.assetLoader = assetLoader;
    this.materials = materials;
  }

  /**
   * Generate a complete room using SciFi MegaKit assets with automatic physics
   */
  public async generateRoom(config: RoomConfig, level: BaseLevel): Promise<THREE.Group> {
    console.log(`🏗️ Generating ${config.type} room (${config.size.width}x${config.size.length}x${config.size.height})`);
    
    const roomGroup = new this.THREE.Group();
    roomGroup.name = `room_${config.type}`;
    
    try {
      // Start with fallback room to ensure something always works
      const fallbackRoom = this.createFallbackRoom(config, level);
      
      // Try to enhance with SciFi assets, but don't fail if they can't load
      try {
        // Add atmospheric lighting
        const lights = this.createAtmosphericLighting(config);
        lights.forEach(light => fallbackRoom.add(light));
        
        // Try to add some basic props without complex models
        const basicProps = this.createBasicProps(config, level);
        basicProps.forEach(prop => fallbackRoom.add(prop));
        
      } catch (assetError) {
        console.warn(`⚠️ Failed to load SciFi assets, using basic fallback:`, assetError);
      }
      
      console.log(`✅ Generated ${config.type} room with ${fallbackRoom.children.length} elements`);
      return fallbackRoom;
      
    } catch (error) {
      console.error(`❌ Failed to generate room completely:`, error);
      // Return absolute minimal fallback
      return this.createMinimalRoom(config, level);
    }
  }

  /**
   * Create floor using appropriate SciFi assets
   */
  private async createFloor(config: RoomConfig): Promise<THREE.Group | null> {
    const floorGroup = new this.THREE.Group();
    floorGroup.name = 'floor';
    
    try {
      // Choose floor style based on room type
      let floorAsset = '';
      switch (config.type) {
        case 'restaurant':
          floorAsset = 'Platforms/Platform_Metal.gltf';
          break;
        case 'laboratory':
          floorAsset = 'Platforms/Platform_Simple.gltf';
          break;
        case 'control_room':
          floorAsset = 'Platforms/Platform_Squares.gltf';
          break;
        default:
          floorAsset = 'Platforms/Platform_Simple.gltf';
      }
      
      // Calculate how many floor tiles we need
      const tileSize = 4; // Assuming each tile is 4x4 units
      const tilesX = Math.ceil(config.size.width / tileSize);
      const tilesZ = Math.ceil(config.size.length / tileSize);
      
      // Try to load the floor asset
      const floorModel = await this.assetLoader.loadModel(
        'floor_tile',
        `${this.assetBasePath}/${floorAsset}`,
        'gltf'
      );
      
      if (floorModel) {
        // Place floor tiles
        for (let x = 0; x < tilesX; x++) {
          for (let z = 0; z < tilesZ; z++) {
            const tile = floorModel.scene.clone();
            tile.position.set(
              (x - tilesX / 2) * tileSize + tileSize / 2,
              0,
              (z - tilesZ / 2) * tileSize + tileSize / 2
            );
            tile.traverse((child) => {
              if (child instanceof this.THREE.Mesh) {
                child.castShadow = false;
                child.receiveShadow = true;
              }
            });
            floorGroup.add(tile);
          }
        }
        
        return floorGroup;
      }
      
    } catch (error) {
      console.warn('Failed to load floor assets, using procedural floor:', error);
    }
    
    // Fallback to procedural floor
    return this.createProceduralFloor(config);
  }

  /**
   * Create walls using SciFi wall assets with automatic physics
   */
  private async createWalls(config: RoomConfig, level: BaseLevel): Promise<THREE.Group[]> {
    const walls: THREE.Group[] = [];
    
    try {
      // Choose wall style based on config
      let wallAsset = '';
      switch (config.style) {
        case 'industrial':
          wallAsset = 'Walls/WallBand_Straight.gltf';
          break;
        case 'clean':
          wallAsset = 'Walls/WallAstra_Straight.gltf';
          break;
        case 'damaged':
          wallAsset = 'Walls/WallAstra_Straight_Broken.gltf';
          break;
        case 'horror':
          wallAsset = 'Walls/ShortWall_DarkMetal2_Straight.gltf';
          break;
        default:
          wallAsset = 'Walls/WallAstra_Straight.gltf';
      }
      
      const wallModel = await this.assetLoader.loadModel(
        'wall_segment',
        `${this.assetBasePath}/${wallAsset}`,
        'gltf'
      );
      
      if (wallModel) {
        // Create 4 walls with proper door placement
        const wallPositions = [
          { pos: [0, config.size.height/2, -config.size.length/2], rot: [0, 0, 0], side: 'back' },
          { pos: [0, config.size.height/2, config.size.length/2], rot: [0, Math.PI, 0], side: 'front' },
          { pos: [-config.size.width/2, config.size.height/2, 0], rot: [0, Math.PI/2, 0], side: 'left' },
          { pos: [config.size.width/2, config.size.height/2, 0], rot: [0, -Math.PI/2, 0], side: 'right' }
        ];
        
        for (const wallData of wallPositions) {
          const wall = await this.createWallSegment(
            wallModel, 
            wallData.pos as [number, number, number], 
            wallData.rot as [number, number, number],
            wallData.side as 'front' | 'back' | 'left' | 'right',
            config,
            level
          );
          if (wall) walls.push(wall);
        }
      }
      
    } catch (error) {
      console.warn('Failed to load wall assets, using procedural walls:', error);
      return this.createProceduralWalls(config, level);
    }
    
    return walls;
  }

  /**
   * Create a wall segment with doors and physics
   */
  private async createWallSegment(
    wallModel: any,
    position: [number, number, number],
    rotation: [number, number, number],
    side: 'front' | 'back' | 'left' | 'right',
    config: RoomConfig,
    level: BaseLevel
  ): Promise<THREE.Group | null> {
    const wallGroup = new this.THREE.Group();
    wallGroup.name = `wall_${side}`;
    
    // Check if this wall should have a door
    const doorConfig = config.doors.find(door => door.position === side);
    
    if (doorConfig && doorConfig.type !== 'blocked') {
      // Create wall segments with door opening
      const leftWall = wallModel.scene.clone();
      const rightWall = wallModel.scene.clone();
      
      // Position wall segments to leave door opening
      const doorWidth = 3;
      const wallLength = side === 'front' || side === 'back' ? config.size.width : config.size.length;
      const segmentLength = (wallLength - doorWidth) / 2;
      
      leftWall.position.set(position[0] - segmentLength/2, position[1], position[2]);
      rightWall.position.set(position[0] + segmentLength/2, position[1], position[2]);
      
      leftWall.rotation.set(rotation[0], rotation[1], rotation[2]);
      rightWall.rotation.set(rotation[0], rotation[1], rotation[2]);
      
      // Enable shadows
      [leftWall, rightWall].forEach(wall => {
        wall.traverse((child) => {
          if (child instanceof this.THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      });
      
      wallGroup.add(leftWall, rightWall);
      
      // Add physics for wall segments
      level.createPhysicsObject(`wall_${side}_left`, leftWall, 'static', 'cuboid', { friction: 0.8 });
      level.createPhysicsObject(`wall_${side}_right`, rightWall, 'static', 'cuboid', { friction: 0.8 });
      
    } else {
      // Create solid wall
      const wall = wallModel.scene.clone();
      wall.position.set(position[0], position[1], position[2]);
      wall.rotation.set(rotation[0], rotation[1], rotation[2]);
      
      wall.traverse((child) => {
        if (child instanceof this.THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      wallGroup.add(wall);
      
      // Add physics for solid wall
      level.createPhysicsObject(`wall_${side}`, wall, 'static', 'cuboid', { friction: 0.8 });
    }
    
    return wallGroup;
  }

  /**
   * Create ceiling using appropriate assets
   */
  private async createCeiling(config: RoomConfig): Promise<THREE.Group | null> {
    // Similar to floor but positioned at ceiling height
    const ceilingGroup = new this.THREE.Group();
    ceilingGroup.name = 'ceiling';
    
    try {
      const ceilingAsset = 'Platforms/Platform_Simple.gltf';
      const ceilingModel = await this.assetLoader.loadModel(
        'ceiling_tile',
        `${this.assetBasePath}/${ceilingAsset}`,
        'gltf'
      );
      
      if (ceilingModel) {
        const ceiling = ceilingModel.scene.clone();
        ceiling.position.set(0, config.size.height, 0);
        ceiling.scale.set(
          config.size.width / 4,
          1,
          config.size.length / 4
        );
        
        ceiling.traverse((child) => {
          if (child instanceof this.THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });
        
        ceilingGroup.add(ceiling);
        return ceilingGroup;
      }
      
    } catch (error) {
      console.warn('Failed to load ceiling assets:', error);
    }
    
    return null;
  }

  /**
   * Create props and furniture using SciFi assets
   */
  private async createProps(config: RoomConfig, level: BaseLevel): Promise<THREE.Object3D[]> {
    const props: THREE.Object3D[] = [];
    
    try {
      // Define prop placements based on room type
      const propConfigs = this.getPropConfigurations(config);
      
      for (const propConfig of propConfigs) {
        try {
          const propModel = await this.assetLoader.loadModel(
            `prop_${propConfig.asset}`,
            `${this.assetBasePath}/Props/${propConfig.asset}`,
            'gltf'
          );
          
          if (propModel) {
            const prop = propModel.scene.clone();
            prop.position.copy(propConfig.position);
            if (propConfig.rotation) prop.rotation.copy(propConfig.rotation);
            if (propConfig.scale) prop.scale.setScalar(propConfig.scale);
            
            prop.traverse((child) => {
              if (child instanceof this.THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            props.push(prop);
            
            // Add physics if required
            if (propConfig.physics) {
              level.createPhysicsObject(`prop_${props.length}`, prop, 'static', 'cuboid', {
                friction: 0.8,
                restitution: 0.3
              });
            }
          }
          
        } catch (error) {
          console.warn(`Failed to load prop ${propConfig.asset}:`, error);
        }
      }
      
    } catch (error) {
      console.warn('Failed to create props:', error);
    }
    
    return props;
  }

  /**
   * Get prop configurations based on room type
   */
  private getPropConfigurations(config: RoomConfig): PropPlacement[] {
    const props: PropPlacement[] = [];
    
    switch (config.type) {
      case 'restaurant':
        props.push(
          { asset: 'Prop_Crate3.gltf', position: new this.THREE.Vector3(-6, 0.75, -6), physics: true },
          { asset: 'Prop_Crate4.gltf', position: new this.THREE.Vector3(6, 0.75, -6), physics: true },
          { asset: 'Prop_Barrel_Large.gltf', position: new this.THREE.Vector3(-6, 0, 6), physics: true },
          { asset: 'Prop_Computer.gltf', position: new this.THREE.Vector3(0, 0, -8), physics: true }
        );
        break;
        
      case 'laboratory':
        props.push(
          { asset: 'Prop_Computer.gltf', position: new this.THREE.Vector3(-4, 0, -4), physics: true },
          { asset: 'Prop_Chest.gltf', position: new this.THREE.Vector3(4, 0, -4), physics: true },
          { asset: 'Prop_AccessPoint.gltf', position: new this.THREE.Vector3(0, 1, 0), physics: false }
        );
        break;
        
      case 'control_room':
        props.push(
          { asset: 'Prop_Computer.gltf', position: new this.THREE.Vector3(0, 0, -6), physics: true },
          { asset: 'Prop_Light_Floor.gltf', position: new this.THREE.Vector3(-4, 0, 4), physics: false },
          { asset: 'Prop_Light_Floor.gltf', position: new this.THREE.Vector3(4, 0, 4), physics: false }
        );
        break;
    }
    
    return props;
  }

  /**
   * Create atmospheric lighting based on config
   */
  private createAtmosphericLighting(config: RoomConfig): THREE.Light[] {
    const lights: THREE.Light[] = [];
    
    switch (config.lighting) {
      case 'dramatic':
        // Single overhead spotlight
        const spotlight = new this.THREE.SpotLight(0xffffff, 8.0, 30, Math.PI * 0.4, 0.3, 1);
        spotlight.position.set(0, config.size.height - 2, 0);
        spotlight.target.position.set(0, 0, 0);
        spotlight.castShadow = true;
        lights.push(spotlight);
        
        // Emergency corner lights
        const redLight1 = new this.THREE.PointLight(0xff3333, 1.5, 15);
        redLight1.position.set(-config.size.width/3, config.size.height/2, -config.size.length/3);
        lights.push(redLight1);
        
        const redLight2 = new this.THREE.PointLight(0xff3333, 1.5, 15);
        redLight2.position.set(config.size.width/3, config.size.height/2, -config.size.length/3);
        lights.push(redLight2);
        break;
        
      case 'bright':
        // Multiple overhead lights
        const positions = [
          [-config.size.width/3, config.size.height - 1, -config.size.length/3],
          [config.size.width/3, config.size.height - 1, -config.size.length/3],
          [-config.size.width/3, config.size.height - 1, config.size.length/3],
          [config.size.width/3, config.size.height - 1, config.size.length/3]
        ];
        
        positions.forEach(pos => {
          const light = new this.THREE.PointLight(0xffffff, 3.0, 20);
          light.position.set(pos[0], pos[1], pos[2]);
          light.castShadow = true;
          lights.push(light);
        });
        break;
        
      case 'emergency':
        // Flickering emergency lighting
        const emergencyLight = new this.THREE.PointLight(0xff4444, 2.0, 25);
        emergencyLight.position.set(0, config.size.height - 1, 0);
        emergencyLight.castShadow = true;
        lights.push(emergencyLight);
        break;
    }
    
    // Always add some ambient light
    const ambientLight = new this.THREE.AmbientLight(0x404040, 0.3);
    lights.push(ambientLight);
    
    return lights;
  }

  /**
   * Fallback to procedural room if assets fail to load
   */
  private createFallbackRoom(config: RoomConfig, level: BaseLevel): THREE.Group {
    console.log('🔧 Creating fallback procedural room');
    
    const roomGroup = new this.THREE.Group();
    
    // Create simple box room
    const floorGeometry = new this.THREE.PlaneGeometry(config.size.width, config.size.length);
    const floorMaterial = this.materials.createPBRMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);
    
    // Add floor physics at eye level
    level.createFloorCollision('main', { 
      width: config.size.width, 
      height: config.size.length 
    }, new this.THREE.Vector3(0, -0.1, 0));
    
    return roomGroup;
  }

  /**
   * Create procedural floor as fallback
   */
  private createProceduralFloor(config: RoomConfig): THREE.Group {
    const floorGroup = new this.THREE.Group();
    
    const floorGeometry = new this.THREE.PlaneGeometry(config.size.width, config.size.length);
    const floorMaterial = this.materials.createPBRMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floorGroup.add(floor);
    
    return floorGroup;
  }

  /**
   * Create procedural walls as fallback
   */
  private createProceduralWalls(config: RoomConfig, level: BaseLevel): THREE.Group[] {
    const walls: THREE.Group[] = [];
    
    const wallMaterial = this.materials.createPBRMaterial({
      color: 0x1a1a1a,
      metalness: 0.7,
      roughness: 0.4
    });
    
    const wallThickness = 0.5;
    
    // Create 4 walls
    const wallConfigs = [
      { pos: [0, config.size.height/2, -config.size.length/2], size: [config.size.width, config.size.height, wallThickness], side: 'back' },
      { pos: [0, config.size.height/2, config.size.length/2], size: [config.size.width, config.size.height, wallThickness], side: 'front' },
      { pos: [-config.size.width/2, config.size.height/2, 0], size: [wallThickness, config.size.height, config.size.length], side: 'left' },
      { pos: [config.size.width/2, config.size.height/2, 0], size: [wallThickness, config.size.height, config.size.length], side: 'right' }
    ];
    
    wallConfigs.forEach(wallConfig => {
      const wallGroup = new this.THREE.Group();
      const wallGeometry = new this.THREE.BoxGeometry(wallConfig.size[0], wallConfig.size[1], wallConfig.size[2]);
      const wall = new this.THREE.Mesh(wallGeometry, wallMaterial);
      
      wall.position.set(wallConfig.pos[0], wallConfig.pos[1], wallConfig.pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      
      wallGroup.add(wall);
      walls.push(wallGroup);
      
      // Add physics
      level.createPhysicsObject(`wall_${wallConfig.side}`, wall, 'static', 'cuboid', { friction: 0.8 });
    });
    
    return walls;
  }
  
  /**
   * Create basic props without loading external assets
   */
  private createBasicProps(config: RoomConfig, level: BaseLevel): THREE.Object3D[] {
    const props: THREE.Object3D[] = [];
    
    // Create simple geometric props based on room type
    switch (config.type) {
      case 'corridor':
        // Add wall-mounted lights
        const positions = [
          [-config.size.width/3, config.size.height/2, -config.size.length/4],
          [config.size.width/3, config.size.height/2, -config.size.length/4],
          [-config.size.width/3, config.size.height/2, config.size.length/4],
          [config.size.width/3, config.size.height/2, config.size.length/4]
        ];
        
        positions.forEach((pos, index) => {
          const lightGeometry = new this.THREE.BoxGeometry(0.3, 0.3, 0.3);
          const lightMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0x444444
          });
          const light = new this.THREE.Mesh(lightGeometry, lightMaterial);
          light.position.set(pos[0], pos[1], pos[2]);
          light.castShadow = true;
          light.receiveShadow = true;
          props.push(light);
        });
        break;
        
      case 'restaurant':
        // Add simple crates/boxes
        for (let i = 0; i < 4; i++) {
          const crateGeometry = new this.THREE.BoxGeometry(1, 1, 1);
          const crateMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
          });
          const crate = new this.THREE.Mesh(crateGeometry, crateMaterial);
          crate.position.set(
            (Math.random() - 0.5) * config.size.width * 0.6,
            0.5,
            (Math.random() - 0.5) * config.size.length * 0.6
          );
          crate.castShadow = true;
          crate.receiveShadow = true;
          props.push(crate);
        }
        break;
    }
    
    return props;
  }
  
  /**
   * Create minimal room as absolute fallback
   */
  private createMinimalRoom(config: RoomConfig, level: BaseLevel): THREE.Group {
    console.log('🔧 Creating minimal fallback room');
    
    const roomGroup = new this.THREE.Group();
    
    // Just a simple floor
    const floorGeometry = new this.THREE.PlaneGeometry(config.size.width, config.size.length);
    const floorMaterial = new this.THREE.MeshBasicMaterial({ color: 0x333333 });
    
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);
    
    // Add minimal physics - use public methods if available
    try {
      (level as any).createFloorCollision('main', { 
        width: config.size.width, 
        height: config.size.length 
      }, new this.THREE.Vector3(0, -0.1, 0));
    } catch (error) {
      console.warn('Could not create floor collision:', error);
    }
    
    // Add basic ambient light
    const ambientLight = new this.THREE.AmbientLight(0x404040, 0.6);
    roomGroup.add(ambientLight);
    
    return roomGroup;
  }
}