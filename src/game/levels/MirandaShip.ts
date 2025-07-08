// Miranda Ship Level - Exploring the debris field and solving the Bloody Mary mystery
// Based on The Miranda Incident storyline

export class MirandaShip {
  private THREE: any;
  private scene: any;
  private physicsWorld: any;
  private camera: any;
  private gameContainer: any;
  
  // Ship components
  private shipGroup: any = null;
  private debrisField: any = null;
  private interactableNotes: any[] = [];
  private safe: any = null;
  
  // Story state
  private notesFound: Set<string> = new Set();
  private safeUnlocked = false;
  private onNoteFoundCallback?: (noteId: string, content: string) => void;
  private onSafeOpenedCallback?: (recipe: any) => void;
  
  // Level parameters
  private readonly shipLength = 120;
  private readonly shipWidth = 30;
  private readonly shipHeight = 15;
  
  constructor(THREE: any, scene: any, physicsWorld?: any, camera?: any, gameContainer?: any) {
    this.THREE = THREE;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.camera = camera;
    this.gameContainer = gameContainer;
  }

  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Miranda Ship level...');
    
    await this.createDebrisField();
    this.createShipExterior();
    this.createShipInterior();
    this.placeStoryElements();
    this.setupLighting();
    
    console.log('✅ Miranda Ship level initialized');
  }

  private async createDebrisField(): Promise<void> {
    console.log('Creating debris field from Miranda system...');
    
    this.debrisField = new this.THREE.Group();
    
    // Create the supernova background
    this.createSupernovaBackground();
    
    // Add floating debris
    for (let i = 0; i < 200; i++) {
      this.createDebrisObject(i);
    }
    
    // Add purple temporal distortions
    this.createTemporalDistortions();
    
    this.scene.add(this.debrisField);
    
    console.log('Debris field created');
  }
  
  private createSupernovaBackground(): void {
    // Create a large sphere for the supernova glow
    const supernovaGeometry = new this.THREE.SphereGeometry(2000, 32, 32);
    
    // Create supernova material with animated glow
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create radial gradient from white-hot center to red edges
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // White hot center
    gradient.addColorStop(0.3, 'rgba(255, 200, 150, 0.6)'); // Orange
    gradient.addColorStop(0.6, 'rgba(255, 100, 100, 0.4)'); // Red
    gradient.addColorStop(0.8, 'rgba(150, 50, 150, 0.2)'); // Purple
    gradient.addColorStop(1, 'rgba(50, 0, 100, 0.1)'); // Deep purple edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const supernovaTexture = new this.THREE.CanvasTexture(canvas);
    const supernovaMaterial = new this.THREE.MeshBasicMaterial({
      map: supernovaTexture,
      side: this.THREE.BackSide,
      transparent: true,
      opacity: 0.3
    });
    
    const supernovaMesh = new this.THREE.Mesh(supernovaGeometry, supernovaMaterial);
    this.debrisField.add(supernovaMesh);
  }
  
  private createDebrisObject(index: number): void {
    // Random debris types
    const debrisTypes = ['asteroid', 'ship_fragment', 'building_chunk', 'metal_scrap'];
    const type = debrisTypes[Math.floor(Math.random() * debrisTypes.length)];
    
    let geometry;
    let material;
    
    switch (type) {
      case 'asteroid':
        geometry = new this.THREE.DodecahedronGeometry(
          Math.random() * 5 + 2, 
          Math.floor(Math.random() * 2)
        );
        material = new this.THREE.MeshBasicMaterial({ 
          color: new this.THREE.Color().setHSL(0.1, 0.3, 0.2 + Math.random() * 0.3)
        });
        break;
        
      case 'ship_fragment':
        geometry = new this.THREE.BoxGeometry(
          Math.random() * 8 + 2,
          Math.random() * 3 + 1,
          Math.random() * 6 + 2
        );
        material = new this.THREE.MeshBasicMaterial({ 
          color: new this.THREE.Color().setHSL(0.6, 0.2, 0.3 + Math.random() * 0.4)
        });
        break;
        
      case 'building_chunk':
        geometry = new this.THREE.CylinderGeometry(
          Math.random() * 4 + 1,
          Math.random() * 4 + 1,
          Math.random() * 10 + 3,
          6
        );
        material = new this.THREE.MeshBasicMaterial({ 
          color: new this.THREE.Color().setHSL(0.05, 0.4, 0.25 + Math.random() * 0.3)
        });
        break;
        
      default: // metal_scrap
        geometry = new this.THREE.OctahedronGeometry(Math.random() * 3 + 1, 0);
        material = new this.THREE.MeshBasicMaterial({ 
          color: new this.THREE.Color().setHSL(0.15, 0.1, 0.4 + Math.random() * 0.3)
        });
        break;
    }
    
    const debris = new this.THREE.Mesh(geometry, material);
    
    // Position debris in a large sphere around the ship
    const distance = 150 + Math.random() * 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    debris.position.set(
      distance * Math.sin(phi) * Math.cos(theta),
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi)
    );
    
    // Random rotation
    debris.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    this.debrisField.add(debris);
  }
  
  private createTemporalDistortions(): void {
    // Create purple temporal anomaly effects
    for (let i = 0; i < 20; i++) {
      const particleCount = 50;
      const positions = new Float32Array(particleCount * 3);
      
      for (let j = 0; j < particleCount; j++) {
        const j3 = j * 3;
        // Cluster particles in a small area
        positions[j3] = (Math.random() - 0.5) * 20;
        positions[j3 + 1] = (Math.random() - 0.5) * 20;
        positions[j3 + 2] = (Math.random() - 0.5) * 20;
      }
      
      const geometry = new this.THREE.BufferGeometry();
      geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
      
      const material = new this.THREE.PointsMaterial({
        color: 0x8A2BE2, // Purple
        size: 3,
        transparent: true,
        opacity: 0.7,
        blending: this.THREE.AdditiveBlending
      });
      
      const distortion = new this.THREE.Points(geometry, material);
      
      // Position distortions randomly around the ship
      const distance = 80 + Math.random() * 200;
      const angle = Math.random() * Math.PI * 2;
      distortion.position.set(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * 100,
        Math.sin(angle) * distance
      );
      
      this.debrisField.add(distortion);
    }
  }

  private createShipExterior(): void {
    console.log('Creating ship exterior...');
    
    this.shipGroup = new this.THREE.Group();
    
    // Main hull
    const hullGeometry = new this.THREE.CylinderGeometry(
      this.shipWidth / 2, 
      this.shipWidth / 2, 
      this.shipLength, 
      12, 
      1
    );
    const hullMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0x444466,
      transparent: true,
      opacity: 0.9
    });
    const hull = new this.THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.z = Math.PI / 2; // Orient horizontally
    
    // Bridge section
    const bridgeGeometry = new this.THREE.BoxGeometry(20, 8, 12);
    const bridgeMaterial = new this.THREE.MeshBasicMaterial({ color: 0x555577 });
    const bridge = new this.THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(this.shipLength / 2 - 10, this.shipHeight / 2, 0);
    
    // Engine nacelles
    const engineGeometry = new this.THREE.CylinderGeometry(3, 3, 15, 8);
    const engineMaterial = new this.THREE.MeshBasicMaterial({ color: 0x662222 });
    
    const leftEngine = new this.THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-this.shipLength / 2 + 7, 0, -12);
    leftEngine.rotation.z = Math.PI / 2;
    
    const rightEngine = new this.THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(-this.shipLength / 2 + 7, 0, 12);
    rightEngine.rotation.z = Math.PI / 2;
    
    this.shipGroup.add(hull, bridge, leftEngine, rightEngine);
    
    // Add battle damage
    this.addBattleDamage();
    
    this.scene.add(this.shipGroup);
    
    console.log('Ship exterior created');
  }
  
  private addBattleDamage(): void {
    // Add scorch marks and hull breaches as separate geometries
    for (let i = 0; i < 8; i++) {
      const damageGeometry = new this.THREE.SphereGeometry(2 + Math.random() * 3, 8, 8);
      const damageMaterial = new this.THREE.MeshBasicMaterial({ 
        color: 0x220011,
        transparent: true,
        opacity: 0.8
      });
      const damage = new this.THREE.Mesh(damageGeometry, damageMaterial);
      
      // Position damage randomly on hull
      damage.position.set(
        (Math.random() - 0.5) * this.shipLength * 0.8,
        (Math.random() - 0.5) * this.shipHeight,
        (Math.random() - 0.5) * this.shipWidth
      );
      
      this.shipGroup.add(damage);
    }
  }

  private createShipInterior(): void {
    console.log('Creating ship interior layout...');
    
    // We'll create the interior as invisible collision boxes that define rooms
    // The player will walk through these areas
    
    // Bridge
    this.createRoom('bridge', { x: 45, y: 0, z: 0 }, { x: 15, y: 8, z: 12 });
    
    // Captain's quarters
    this.createRoom('quarters', { x: 35, y: 0, z: 0 }, { x: 10, y: 8, z: 8 });
    
    // Main corridor
    this.createRoom('corridor', { x: 0, y: 0, z: 0 }, { x: 80, y: 8, z: 4 });
    
    // Engineering
    this.createRoom('engineering', { x: -40, y: 0, z: 0 }, { x: 15, y: 8, z: 12 });
    
    // Cargo bay
    this.createRoom('cargo', { x: -20, y: -4, z: 0 }, { x: 20, y: 6, z: 15 });
    
    console.log('Ship interior created');
  }
  
  private createRoom(name: string, position: {x: number, y: number, z: number}, size: {x: number, y: number, z: number}): void {
    // Create room floor
    const floorGeometry = new this.THREE.PlaneGeometry(size.x, size.z);
    const floorMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0x333344,
      side: this.THREE.DoubleSide
    });
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(position.x, position.y - size.y / 2, position.z);
    
    this.shipGroup.add(floor);
    
    // Create walls (simple boxes for now)
    const wallMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0x445566,
      transparent: true,
      opacity: 0.3
    });
    
    // Front and back walls
    const frontWallGeometry = new this.THREE.PlaneGeometry(size.z, size.y);
    const frontWall = new this.THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(position.x + size.x / 2, position.y, position.z);
    
    const backWall = new this.THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.set(position.x - size.x / 2, position.y, position.z);
    backWall.rotation.y = Math.PI;
    
    // Side walls
    const sideWallGeometry = new this.THREE.PlaneGeometry(size.x, size.y);
    const leftWall = new this.THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(position.x, position.y, position.z + size.z / 2);
    leftWall.rotation.y = -Math.PI / 2;
    
    const rightWall = new this.THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(position.x, position.y, position.z - size.z / 2);
    rightWall.rotation.y = Math.PI / 2;
    
    this.shipGroup.add(frontWall, backWall, leftWall, rightWall);
  }

  private placeStoryElements(): void {
    console.log('Placing story elements...');
    
    // Captain's logs scattered throughout the ship
    this.createCaptainsLog('log_1', { x: 45, y: 2, z: 3 }, 'Day 1: The star... something\'s wrong with the star...');
    this.createCaptainsLog('log_2', { x: 35, y: 1, z: -2 }, 'Day 3: Temporal readings are off the charts. The crew is getting nervous.');
    this.createCaptainsLog('log_3', { x: 0, y: 1, z: 1 }, 'Day 7: We\'re trapped in some kind of loop. I keep seeing the same purple light...');
    this.createCaptainsLog('log_4', { x: -20, y: -2, z: 5 }, 'Day ?: Time has no meaning here. The Perfect Mary... it holds the key.');
    this.createCaptainsLog('log_5', { x: -40, y: 1, z: -3 }, 'Final entry: If you find this, check the safe. Code is the number of loops we experienced.');
    
    // The safe in captain's quarters
    this.createSafe({ x: 38, y: 0, z: -3 });
    
    console.log('Story elements placed');
  }
  
  private createCaptainsLog(id: string, position: {x: number, y: number, z: number}, content: string): void {
    // Create a glowing tablet/datapad
    const logGeometry = new this.THREE.BoxGeometry(1, 0.1, 1.5);
    const logMaterial = new this.THREE.MeshBasicMaterial({ 
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8
    });
    const log = new this.THREE.Mesh(logGeometry, logMaterial);
    log.position.set(position.x, position.y, position.z);
    
    // Add a subtle glow effect
    const glowGeometry = new this.THREE.SphereGeometry(1.5, 8, 8);
    const glowMaterial = new this.THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.2,
      blending: this.THREE.AdditiveBlending
    });
    const glow = new this.THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(log.position);
    
    this.shipGroup.add(log, glow);
    
    // Store for interaction
    this.interactableNotes.push({
      id,
      mesh: log,
      content,
      found: false
    });
  }
  
  private createSafe(position: {x: number, y: number, z: number}): void {
    // Create a safe
    const safeGeometry = new this.THREE.BoxGeometry(2, 2, 1.5);
    const safeMaterial = new this.THREE.MeshBasicMaterial({ color: 0x666666 });
    this.safe = new this.THREE.Mesh(safeGeometry, safeMaterial);
    this.safe.position.set(position.x, position.y, position.z);
    
    // Add a lock indicator
    const lockGeometry = new this.THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
    const lockMaterial = new this.THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red = locked
    const lock = new this.THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.set(position.x + 1, position.y, position.z);
    lock.rotation.z = Math.PI / 2;
    
    this.shipGroup.add(this.safe, lock);
    
    // Store lock reference for interaction
    this.safe.userData = { lock, locked: true };
  }

  private setupLighting(): void {
    // Dim emergency lighting
    const ambientLight = new this.THREE.AmbientLight(0x220033, 0.3);
    this.scene.add(ambientLight);
    
    // Red emergency lights
    const redLight = new this.THREE.DirectionalLight(0xff3333, 0.5);
    redLight.position.set(0, 20, 0);
    this.scene.add(redLight);
    
    // Purple temporal glow
    const purpleLight = new this.THREE.PointLight(0x8A2BE2, 0.7, 100);
    purpleLight.position.set(20, 10, 0);
    this.scene.add(purpleLight);
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
    
    // Check notes
    for (const note of this.interactableNotes) {
      if (!note.found) {
        const distance = playerPos.distanceTo(note.mesh.position);
        if (distance < 3) {
          note.found = true;
          this.notesFound.add(note.id);
          
          // Make note dim to show it's been read
          note.mesh.material.opacity = 0.3;
          
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
      if (distance < 3) {
        // Check if player has found enough notes to unlock (need at least 4 notes)
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
    // Animate temporal distortions
    if (this.debrisField) {
      const time = Date.now() * 0.001;
      
      this.debrisField.children.forEach((child: any, index: number) => {
        if (child.material && child.material.color && child.material.color.r > 0.5) {
          // This is likely a purple temporal distortion
          child.rotation.y += 0.01;
          child.position.y += Math.sin(time + index) * 0.1;
        }
      });
    }
  }

  public dispose(): void {
    console.log('🧹 Disposing Miranda Ship level...');
    
    if (this.shipGroup) {
      this.scene.remove(this.shipGroup);
    }
    
    if (this.debrisField) {
      this.scene.remove(this.debrisField);
    }
    
    console.log('✅ Miranda Ship level disposed');
  }
}