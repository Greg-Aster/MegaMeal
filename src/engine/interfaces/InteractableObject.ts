import * as THREE from 'three';

/**
 * Interface for objects that can be interacted with
 */
export interface InteractableObject {
  /** Unique identifier for the interactable object */
  id: string;
  
  /** The Three.js object that can be clicked/interacted with */
  mesh: THREE.Object3D;
  
  /** Maximum distance from which the object can be interacted with */
  interactionRadius: number;
  
  /** Whether the object is currently interactable */
  isInteractable: boolean;
  
  /** Type of interaction (click, proximity, etc.) */
  interactionType: InteractionType;
  
  /** Called when the object is interacted with */
  onInteract(interactionData: InteractionData): void;
  
  /** Get text to display when player can interact with this object */
  getInteractionPrompt(): string;
  
  /** Called when player enters interaction range (for proximity interactions) */
  onEnterRange?(playerPosition: THREE.Vector3): void;
  
  /** Called when player leaves interaction range (for proximity interactions) */
  onLeaveRange?(playerPosition: THREE.Vector3): void;
  
  /** Get additional data about this interactable for UI/debugging */
  getInteractionData(): InteractionMetadata;
}

/**
 * Types of interactions supported
 */
export enum InteractionType {
  CLICK = 'click',
  PROXIMITY = 'proximity',
  LONG_PRESS = 'long_press',
  HOVER = 'hover'
}

/**
 * Data passed to interaction handlers
 */
export interface InteractionData {
  /** Position where the interaction occurred */
  worldPosition: THREE.Vector3;
  
  /** The camera position when interaction occurred */
  cameraPosition: THREE.Vector3;
  
  /** The direction from camera to interaction point */
  direction: THREE.Vector3;
  
  /** Type of interaction that occurred */
  interactionType: InteractionType;
  
  /** Platform-specific data (mouse button, touch info, etc.) */
  platformData?: any;
  
  /** Timestamp when interaction occurred */
  timestamp: number;
}

/**
 * Metadata about an interactable object
 */
export interface InteractionMetadata {
  id: string;
  name: string;
  description: string;
  interactionType: InteractionType;
  interactionRadius: number;
  isInteractable: boolean;
  tags: string[];
  userData?: any;
}

/**
 * Result of an interaction check
 */
export interface InteractionResult {
  /** The interactable object that was found */
  interactable: InteractableObject;
  
  /** Distance from interaction point to object */
  distance: number;
  
  /** The exact point where interaction occurred */
  worldPosition: THREE.Vector3;
  
  /** Whether the interaction was successful */
  success: boolean;
  
  /** Optional message about the interaction */
  message?: string;
}