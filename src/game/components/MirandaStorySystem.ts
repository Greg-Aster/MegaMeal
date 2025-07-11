// Miranda Story System Component
// Handles story elements, captain's logs, and interactive objects for the Miranda incident level

import * as THREE from 'three';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { EventBus } from '../../engine/core/EventBus';
import { InteractableObject, InteractionType, InteractionData, InteractionMetadata } from '../../engine/interfaces/InteractableObject';

export interface StoryConfig {
  captain_logs?: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    model: string;
    content: string;
    unlock_condition?: string;
  }>;
  interactive_objects?: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    model: string;
    glow?: boolean;
    glow_color?: string;
    interaction: string;
    content: string;
    visual_effect?: string;
  }>;
}

export class MirandaStorySystem {
  private storyObjects: THREE.Object3D[] = [];
  
  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private interactionSystem: InteractionSystem,
    private eventBus: EventBus
  ) {}
  
  async initialize(config: StoryConfig): Promise<void> {
    console.log('📖 Creating Miranda story system...', config);
    
    // Create captain's logs
    if (config.captain_logs) {
      for (const log of config.captain_logs) {
        await this.createCaptainLog(log);
      }
    }
    
    // Create interactive objects
    if (config.interactive_objects) {
      for (const obj of config.interactive_objects) {
        await this.createInteractiveObject(obj);
      }
    }
  }
  
  private async createCaptainLog(log: any): Promise<void> {
    let logMesh;
    
    if (log.model === 'Prop_Chest') {
      // Create chest-like container
      const chestGeometry = new this.THREE.BoxGeometry(0.5, 0.3, 0.3);
      const chestMaterial = new this.THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        metalness: 0.1,
        roughness: 0.8
      });
      logMesh = new this.THREE.Mesh(chestGeometry, chestMaterial);
    } else {
      // Default container
      const containerGeometry = new this.THREE.BoxGeometry(0.3, 0.1, 0.2);
      const containerMaterial = new this.THREE.MeshStandardMaterial({ color: 0x0066cc });
      logMesh = new this.THREE.Mesh(containerGeometry, containerMaterial);
    }
    
    logMesh.position.set(...log.position);
    logMesh.castShadow = true;
    logMesh.receiveShadow = true;
    this.levelGroup.add(logMesh);
    this.storyObjects.push(logMesh);
    
    const interactableObj: InteractableObject = {
      id: log.id,
      mesh: logMesh,
      interactionRadius: 2,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      onInteract: (_interactionData: InteractionData) => {
        console.log(`Found log: ${log.name}`);
        console.log(log.content);
        this.eventBus.emit('story.log_found', { logId: log.id, content: log.content });
      },
      getInteractionPrompt: () => `Read ${log.name}`,
      getInteractionData: (): InteractionMetadata => ({
        id: log.id,
        name: log.name,
        description: `Captain's log entry`,
        interactionType: InteractionType.CLICK,
        interactionRadius: 2,
        isInteractable: true,
        tags: ['story', 'log'],
        userData: { content: log.content, name: log.name }
      })
    };
    
    this.interactionSystem.registerInteractable(interactableObj);
  }
  
  private async createInteractiveObject(obj: any): Promise<void> {
    let objectMesh;
    
    if (obj.model === 'Prop_ItemHolder') {
      // Create pedestal-like holder
      const pedestalGeometry = new this.THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
      const pedestalMaterial = new this.THREE.MeshStandardMaterial({ 
        color: 0x666666,
        metalness: 0.7,
        roughness: 0.3
      });
      objectMesh = new this.THREE.Mesh(pedestalGeometry, pedestalMaterial);
      
      // Add glow effect if specified
      if (obj.glow) {
        const glowColor = obj.glow_color || '#ffffff';
        const light = new this.THREE.PointLight(glowColor, 1, 5);
        light.position.copy(objectMesh.position);
        light.position.y += 0.5;
        this.levelGroup.add(light);
      }
    } else if (obj.model === 'Prop_Light_Small') {
      // Create anomaly visualization
      const anomalyGeometry = new this.THREE.SphereGeometry(0.5, 16, 16);
      const anomalyMaterial = new this.THREE.MeshBasicMaterial({ 
        color: 0x8844ff,
        transparent: true,
        opacity: 0.6
      });
      objectMesh = new this.THREE.Mesh(anomalyGeometry, anomalyMaterial);
      
      // Add pulsing animation
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) * 0.001;
        const pulse = Math.sin(elapsed * 2) * 0.2 + 0.8;
        anomalyMaterial.opacity = 0.6 * pulse;
        objectMesh.scale.setScalar(1 + pulse * 0.1);
        requestAnimationFrame(animate);
      };
      animate();
    } else {
      // Default object
      const objGeometry = new this.THREE.BoxGeometry(0.3, 0.3, 0.3);
      const objMaterial = new this.THREE.MeshStandardMaterial({ color: 0x4444ff });
      objectMesh = new this.THREE.Mesh(objGeometry, objMaterial);
    }
    
    objectMesh.position.set(...obj.position);
    objectMesh.castShadow = true;
    objectMesh.receiveShadow = true;
    this.levelGroup.add(objectMesh);
    this.storyObjects.push(objectMesh);
    
    const interactableObj: InteractableObject = {
      id: obj.id,
      mesh: objectMesh,
      interactionRadius: obj.interaction === 'approach' ? 1 : 2,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      onInteract: (_interactionData: InteractionData) => {
        console.log(`Examined: ${obj.name}`);
        console.log(obj.content);
        this.eventBus.emit('story.object_examined', { 
          objectId: obj.id, 
          content: obj.content 
        });
      },
      getInteractionPrompt: () => `${obj.interaction} ${obj.name}`,
      getInteractionData: (): InteractionMetadata => ({
        id: obj.id,
        name: obj.name,
        description: `Interactive story object`,
        interactionType: InteractionType.CLICK,
        interactionRadius: obj.interaction === 'approach' ? 1 : 2,
        isInteractable: true,
        tags: ['story', 'interactive'],
        userData: { content: obj.content, name: obj.name }
      })
    };
    
    this.interactionSystem.registerInteractable(interactableObj);
  }
  
  update(_deltaTime: number): void {
    // Update story object animations if needed
  }
  
  dispose(): void {
    this.storyObjects.forEach(obj => {
      this.levelGroup.remove(obj);
    });
    this.storyObjects = [];
  }
}