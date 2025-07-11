// Ship Terminal System Component
// Handles interactive terminals and computer consoles for spaceship environments

import * as THREE from 'three';
import { InteractionSystem } from '../../engine/systems/InteractionSystem';
import { InteractableObject, InteractionType, InteractionData, InteractionMetadata } from '../../engine/interfaces/InteractableObject';

export interface TerminalConfig {
  terminals: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    model: string;
    status: 'normal' | 'damaged' | 'flickering' | 'temporal_loop';
    data: {
      title: string;
      content: string;
      timestamp: string;
    };
  }>;
}

export class ShipTerminalSystem {
  private terminals: THREE.Object3D[] = [];
  
  constructor(
    private THREE: any,
    private scene: any,
    private levelGroup: any,
    private interactionSystem: InteractionSystem,
    private assetLoader: any
  ) {}
  
  async initialize(config: TerminalConfig): Promise<void> {
    console.log('💻 Creating ship terminal system...', config);
    
    if (config.terminals) {
      for (const terminal of config.terminals) {
        await this.createTerminal(terminal);
      }
    }
  }
  
  private async createTerminal(terminal: any): Promise<void> {
    let terminalMesh;
    
    if (terminal.model === 'Prop_Computer') {
      // Create computer console
      const consoleGroup = new this.THREE.Group();
      
      // Base
      const baseGeometry = new this.THREE.BoxGeometry(1.2, 0.8, 0.6);
      const baseMaterial = new this.THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
      });
      const base = new this.THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.4;
      consoleGroup.add(base);
      
      // Screen
      const screenGeometry = new this.THREE.PlaneGeometry(0.8, 0.5);
      const screenMaterial = new this.THREE.MeshStandardMaterial({ 
        color: terminal.status === 'damaged' ? 0x440000 : 
              terminal.status === 'flickering' ? 0x004400 : 0x000044,
        emissive: terminal.status === 'damaged' ? 0x220000 : 
                 terminal.status === 'flickering' ? 0x002200 : 0x000022
      });
      const screen = new this.THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(0, 0.9, 0.31);
      consoleGroup.add(screen);
      
      terminalMesh = consoleGroup;
    } else {
      // Default terminal design
      const terminalGeometry = new this.THREE.BoxGeometry(1, 1.5, 0.3);
      const terminalMaterial = new this.THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.4
      });
      terminalMesh = new this.THREE.Mesh(terminalGeometry, terminalMaterial);
    }
    
    terminalMesh.position.set(...terminal.position);
    terminalMesh.castShadow = true;
    terminalMesh.receiveShadow = true;
    this.levelGroup.add(terminalMesh);
    this.terminals.push(terminalMesh);
    
    // Add status lighting
    if (terminal.status === 'flickering') {
      const light = new this.THREE.PointLight(0x00ff00, 0.5, 3);
      light.position.copy(terminalMesh.position);
      light.position.y += 1;
      this.levelGroup.add(light);
      
      // Simple flicker animation
      setInterval(() => {
        light.intensity = Math.random() * 0.5 + 0.2;
      }, 200);
    }
    
    // Register interaction with proper interface
    const interactableObj: InteractableObject = {
      id: terminal.id,
      mesh: terminalMesh,
      interactionRadius: 3,
      isInteractable: true,
      interactionType: InteractionType.CLICK,
      onInteract: (_interactionData: InteractionData) => {
        console.log(`Terminal ${terminal.name} accessed:`, terminal.data.title);
        console.log(terminal.data.content);
      },
      getInteractionPrompt: () => `Access ${terminal.name}`,
      getInteractionData: (): InteractionMetadata => ({
        id: terminal.id,
        name: terminal.name,
        description: terminal.data.title,
        interactionType: InteractionType.CLICK,
        interactionRadius: 3,
        isInteractable: true,
        tags: ['terminal', 'computer'],
        userData: terminal.data
      })
    };
    
    this.interactionSystem.registerInteractable(interactableObj);
  }
  
  update(_deltaTime: number): void {
    // Update terminal animations if needed
  }
  
  dispose(): void {
    this.terminals.forEach(terminal => {
      this.levelGroup.remove(terminal);
    });
    this.terminals = [];
  }
}