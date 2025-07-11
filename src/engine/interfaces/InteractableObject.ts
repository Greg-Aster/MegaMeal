import type * as THREE from 'three';

/**
 * Defines the types of interaction available in the game.
 */
export enum InteractionType {
  CLICK = 'CLICK',
  HOVER = 'HOVER',
  PROXIMITY = 'PROXIMITY',
}

/**
 * Data passed when an interaction occurs.
 */
export interface InteractionData {
  worldPosition: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  direction: THREE.Vector3;
  interactionType: InteractionType;
  platformData: Record<string, any>;
  timestamp: number;
}

/**
 * The result of an interaction check, like a raycast.
 */
export interface InteractionResult {
  interactable: InteractableObject;
  distance: number;
  worldPosition: THREE.Vector3;
  success: boolean;
}

/**
 * Standardized metadata for any interactable object.
 * Used for UI, state management, and debugging.
 */
export interface InteractionMetadata {
  id: string;
  name: string;
  description: string;
  interactionType: InteractionType;
  interactionRadius: number;
  isInteractable: boolean;
  tags: string[];
  userData: Record<string, any>;
}

/**
 * The core interface for any object in the game that can be interacted with.
 * This ensures a consistent API for all interactive elements.
 */
export interface InteractableObject {
  // A unique identifier for the object.
  id: string;
  // The Three.js mesh or group representing the object in the scene.
  mesh: THREE.Object3D;
  // The radius within which proximity interactions are triggered.
  interactionRadius: number;
  // A flag to enable or disable interactions for this object.
  isInteractable: boolean;
  // The primary type of interaction this object supports.
  interactionType: InteractionType;

  // The main callback function executed when an interaction occurs.
  onInteract: (interactionData: InteractionData) => void;
  // A function that returns a string to be displayed as a prompt (e.g., "Press E to open").
  getInteractionPrompt: () => string;
  // A function that returns a standardized set of metadata about the object.
  getInteractionData: () => InteractionMetadata;

  // Optional callbacks for proximity-based interactions.
  onEnterRange?: (playerPosition: THREE.Vector3) => void;
  onLeaveRange?: (playerPosition: THREE.Vector3) => void;
}