// src/components/timeline/starmap/StarMapUtils.ts
import { eraColorMap, colorSpectrum, starTypes } from './StarMapConfig';

export function hashCode(str: string): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getStarColor(id: string, currentEra?: string, shouldUseEraColors?: boolean): string {
  if (shouldUseEraColors && currentEra && eraColorMap[currentEra as keyof typeof eraColorMap]) {
    return eraColorMap[currentEra as keyof typeof eraColorMap];
  }
  const hash = hashCode(id);
  return colorSpectrum[hash % colorSpectrum.length];
}

export function getStarType(id: string, keyEvent: boolean): string {
  const hash = hashCode(id);
  if (keyEvent) {
    return ['classic', 'sparkle', 'refraction', 'halo'][hash % 4];
  }
  return starTypes[hash % starTypes.length];
}

export function getSizeFactor(keyEvent: boolean): number {
  return keyEvent ? 1.2 : 0.85 + (Math.random() * 0.3);
}

export function getAnimationDuration(id: string): number {
  const hash = hashCode(id);
  return 4 + (hash % 5);
}

export function getScreenPosition(object3D: any, camera: any, container: HTMLElement) {
  const THREE = (window as any).THREE;
  const vector = new THREE.Vector3();
  
  vector.setFromMatrixPosition(object3D.matrixWorld);
  vector.project(camera);
  
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  
  return {
    x: (vector.x * widthHalf) + widthHalf,
    y: -(vector.y * heightHalf) + heightHalf,
    isInFront: vector.z < 1
  };
}

export function calculateCardPosition(
  eventX: number, 
  eventY: number, 
  containerRect: DOMRect
): { x: number; y: number; positionClass: string } {
  const cardWidth = 200;
  const cardHeight = 100;
  const edgeMargin = 10;
  const offsetX = -35;
  const offsetY = -35;

  let cardX = eventX + offsetX;
  let cardY = eventY + offsetY;

  // Edge clamping
  if (cardX + cardWidth > containerRect.width - edgeMargin) {
    cardX = containerRect.width - cardWidth - edgeMargin;
  }
  if (cardX < edgeMargin) {
    cardX = edgeMargin;
  }
  if (cardY + cardHeight > containerRect.height - edgeMargin) {
    cardY = containerRect.height - cardHeight - edgeMargin;
  }
  if (cardY < edgeMargin) {
    cardY = edgeMargin;
  }

  // Determine position class
  let positionClass = 'timeline-card-bottom';
  const cardCenterX = cardX + cardWidth / 2;
  const cardCenterY = cardY + cardHeight / 2;
  const deltaX = eventX - cardCenterX;
  const deltaY = eventY - cardCenterY;

  if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
    positionClass = (deltaX > 0) ? 'timeline-card-left' : 'timeline-card-right';
  } else {
    positionClass = (deltaY > 0) ? 'timeline-card-top' : 'timeline-card-bottom';
  }

  return { x: cardX, y: cardY, positionClass };
}