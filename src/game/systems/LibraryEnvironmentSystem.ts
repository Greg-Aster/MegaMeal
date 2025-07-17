import * as THREE from 'three';
import { BaseLevelGenerator, type LevelGeneratorDependencies } from '../interfaces/ILevelGenerator';

/**
 * LibraryEnvironmentSystem - Creates indoor library environment inspired by E_StudyRoom_01.blend
 * Now uses standardized interface
 */
export class LibraryEnvironmentSystem extends BaseLevelGenerator {
  constructor(dependencies: LevelGeneratorDependencies) {
    super(dependencies);
    console.log('📚 LibraryEnvironmentSystem created - building study room inspired library');
  }
  
  async initialize(config: any): Promise<void> {
    console.log('📚 Creating study room inspired library...');
    
    // Create the main library room based on study room layout
    this.createLibraryRoom();
    this.createStudyFurniture();
    this.createBookCollections();
    this.createLibraryLighting();
    
    console.log('✅ Library environment created');
  }
  
  private createLibraryRoom(): void {
    const roomWidth = 15;
    const roomLength = 20;
    const roomHeight = 4;
    
    // Wooden floor (study room style)
    const floorGeometry = new this.dependencies.THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x654321, // Dark wood brown
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new this.dependencies.THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.dependencies.levelGroup.add(floor);
    
    // Create walls
    this.createRoomWalls(roomWidth, roomLength, roomHeight);
    
    // Ceiling
    const ceiling = new this.dependencies.THREE.Mesh(floorGeometry, floorMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    this.dependencies.levelGroup.add(ceiling);
  }
  
  private createRoomWalls(width: number, length: number, height: number): void {
    const wallMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x8B7D6B, // Warm stone color
      roughness: 0.7,
      metalness: 0.2
    });
    
    // Back wall
    const backWallGeometry = new this.dependencies.THREE.BoxGeometry(width, height, 0.2);
    const backWall = new this.dependencies.THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, height/2, -length/2);
    backWall.castShadow = true;
    this.dependencies.levelGroup.add(backWall);
    
    // Left wall
    const sideWallGeometry = new this.dependencies.THREE.BoxGeometry(0.2, height, length);
    const leftWall = new this.dependencies.THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width/2, height/2, 0);
    leftWall.castShadow = true;
    this.dependencies.levelGroup.add(leftWall);
    
    // Right wall
    const rightWall = new this.dependencies.THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width/2, height/2, 0);
    rightWall.castShadow = true;
    this.dependencies.levelGroup.add(rightWall);
    
    // Front wall with entrance opening
    const frontWallLeft = new this.dependencies.THREE.BoxGeometry(4, height, 0.2);
    const frontWallLeftMesh = new this.dependencies.THREE.Mesh(frontWallLeft, wallMaterial);
    frontWallLeftMesh.position.set(-4, height/2, length/2);
    this.dependencies.levelGroup.add(frontWallLeftMesh);
    
    const frontWallRight = new this.dependencies.THREE.Mesh(frontWallLeft, wallMaterial);
    frontWallRight.position.set(4, height/2, length/2);
    this.dependencies.levelGroup.add(frontWallRight);
  }
  
  private createStudyFurniture(): void {
    // Central study table (like in study room)
    const tableGeometry = new this.dependencies.THREE.BoxGeometry(4, 0.1, 2);
    const tableMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const centralTable = new this.dependencies.THREE.Mesh(tableGeometry, tableMaterial);
    centralTable.position.set(0, 0.75, 0);
    centralTable.castShadow = true;
    this.dependencies.levelGroup.add(centralTable);
    
    // Study chairs
    this.createStudyChair(-1.5, 0, 1, 0);
    this.createStudyChair(1.5, 0, -1, Math.PI);
    
    // Reading desk along wall (study room style)
    const deskGeometry = new this.dependencies.THREE.BoxGeometry(6, 0.1, 1.5);
    const desk = new this.dependencies.THREE.Mesh(deskGeometry, tableMaterial);
    desk.position.set(3, 0.75, -8);
    desk.castShadow = true;
    this.dependencies.levelGroup.add(desk);
  }
  
  private createStudyChair(x: number, y: number, z: number, rotation: number): void {
    const chairMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x5D4E37,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Chair seat
    const seatGeometry = new this.dependencies.THREE.BoxGeometry(0.5, 0.05, 0.5);
    const seat = new this.dependencies.THREE.Mesh(seatGeometry, chairMaterial);
    seat.position.set(x, 0.4, z);
    seat.rotation.y = rotation;
    seat.castShadow = true;
    this.dependencies.levelGroup.add(seat);
    
    // Chair back
    const backGeometry = new this.dependencies.THREE.BoxGeometry(0.5, 0.6, 0.05);
    const back = new this.dependencies.THREE.Mesh(backGeometry, chairMaterial);
    back.position.set(x, 0.7, z - 0.2);
    back.rotation.y = rotation;
    back.castShadow = true;
    this.dependencies.levelGroup.add(back);
  }
  
  private createBookCollections(): void {
    // Wall-mounted bookshelves (study room style)
    this.createBookshelf(-6, 0, -8, 'vertical');
    this.createBookshelf(6, 0, -8, 'vertical');
    this.createBookshelf(-6, 0, 5, 'vertical');
    this.createBookshelf(6, 0, 5, 'vertical');
    
    // Corner reading area with book stacks
    this.createBookStack(-5, 0.1, 7);
    this.createBookStack(5, 0.1, 7);
    
    // Interactive glowing book on central table
    this.createMagicalBook(0, 1, 0);
  }
  
  private createBookshelf(x: number, y: number, z: number, type: string): void {
    const shelfMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Main shelf structure
    const shelfGeometry = new this.dependencies.THREE.BoxGeometry(1.5, 3, 0.3);
    const shelf = new this.dependencies.THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.set(x, y + 1.5, z);
    shelf.castShadow = true;
    this.dependencies.levelGroup.add(shelf);
    
    // Add books on shelf
    for (let i = 0; i < 6; i++) {
      const bookColor = new this.dependencies.THREE.Color().setHSL(Math.random(), 0.7, 0.5);
      const bookMaterial = new this.dependencies.THREE.MeshStandardMaterial({ color: bookColor });
      const bookGeometry = new this.dependencies.THREE.BoxGeometry(0.1, 0.3, 0.15);
      
      const book = new this.dependencies.THREE.Mesh(bookGeometry, bookMaterial);
      book.position.set(
        x - 0.6 + (i * 0.2),
        y + 0.5 + Math.random() * 2,
        z + 0.2
      );
      book.castShadow = true;
      this.dependencies.levelGroup.add(book);
    }
  }
  
  private createBookStack(x: number, y: number, z: number): void {
    // Stack of books on floor
    for (let i = 0; i < 4; i++) {
      const bookColor = new this.dependencies.THREE.Color().setHSL(Math.random(), 0.6, 0.4);
      const bookMaterial = new this.dependencies.THREE.MeshStandardMaterial({ color: bookColor });
      const bookGeometry = new this.dependencies.THREE.BoxGeometry(0.3, 0.05, 0.2);
      
      const book = new this.dependencies.THREE.Mesh(bookGeometry, bookMaterial);
      book.position.set(x, y + (i * 0.05), z);
      book.rotation.y = Math.random() * 0.5;
      this.dependencies.levelGroup.add(book);
    }
  }
  
  private createMagicalBook(): void {
    // Glowing interactive book
    const bookGeometry = new this.dependencies.THREE.BoxGeometry(0.3, 0.4, 0.05);
    const bookMaterial = new this.dependencies.THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      emissive: 0x4a90e2,
      emissiveIntensity: 0.3
    });
    
    const book = new this.dependencies.THREE.Mesh(bookGeometry, bookMaterial);
    book.position.set(0, 1, 0);
    book.name = 'InteractiveBook';
    book.userData = {
      type: 'interactive_book',
      title: 'The Codex of Infinite Timelines',
      content: 'A mystical tome containing the secrets of timeline navigation.'
    };
    
    this.dependencies.levelGroup.add(book);
  }
  
  private createLibraryLighting(): void {
    // Warm ambient lighting
    const ambientLight = new this.dependencies.THREE.AmbientLight(0xFFF8DC, 0.5);
    this.dependencies.levelGroup.add(ambientLight);
    
    // Study lamp on desk
    const lampLight = new this.dependencies.THREE.PointLight(0xFFE4B5, 1, 10);
    lampLight.position.set(3, 2, -8);
    lampLight.castShadow = true;
    this.dependencies.levelGroup.add(lampLight);
    
    // Main room lighting
    const mainLight = new this.dependencies.THREE.DirectionalLight(0xFFE4B5, 0.7);
    mainLight.position.set(0, 3, 2);
    mainLight.castShadow = true;
    this.dependencies.levelGroup.add(mainLight);
  }
  
  update(deltaTime: number): void {
    // Simple book glow animation
    const time = Date.now() * 0.001;
    
    this.dependencies.levelGroup.children.forEach(child => {
      if (child.name === 'InteractiveBook') {
        const material = (child as this.dependencies.THREE.Mesh).material as this.dependencies.THREE.MeshStandardMaterial;
        if (material.emissive) {
          const pulse = Math.sin(time * 2) * 0.1 + 0.3;
          material.emissiveIntensity = pulse;
        }
      }
    });
  }
  
  dispose(): void {
    console.log('🧹 Disposing LibraryEnvironmentSystem');
  }
}