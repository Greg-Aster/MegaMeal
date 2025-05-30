// src/components/timeline/starmap/StarMapTextures.client.ts
import { getSizeFactor } from './StarMapUtils';

export function createAdvancedStarTexture(
  THREE: any,
  color: string,
  starType: string,
  isKeyEvent: boolean = false,
  isSelected: boolean = false,
  isHovered: boolean = false,
  animationTime: number = 0,
  size: number = 512
) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const center = size / 2;
  const baseRadius = isKeyEvent ? size * 0.04 : size * 0.03;
  const sizeFactor = getSizeFactor(isKeyEvent);
  const finalRadius = baseRadius * sizeFactor;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Animation calculations
  const glowPhase = (Math.sin(animationTime * 0.0008) + 1) / 2;
  const shimmerPhase = (Math.sin(animationTime * 0.001) + 1) / 2;
  const orbitalPhase = animationTime * 0.0004;
  const raysRotation = animationTime * 0.0003;
  
  // Backing plate
  const backingRadius = finalRadius * 4;
  const backingGradient = ctx.createRadialGradient(center, center, 0, center, center, backingRadius);
  const backingOpacity = isSelected ? 0.95 : (isHovered ? 0.9 : 0.7);
  backingGradient.addColorStop(0, `rgba(0,0,0,${backingOpacity})`);
  backingGradient.addColorStop(0.7, `rgba(0,0,0,${backingOpacity * 0.6})`);
  backingGradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = backingGradient;
  ctx.beginPath();
  ctx.arc(center, center, backingRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Multi-layer glow
  const glowLayers = [
    { radius: finalRadius * 20, opacity: 0.02 + glowPhase * 0.01, blur: 30 },
    { radius: finalRadius * 15, opacity: 0.04 + glowPhase * 0.02, blur: 25 },
    { radius: finalRadius * 12, opacity: 0.06 + glowPhase * 0.03, blur: 20 },
    { radius: finalRadius * 8, opacity: 0.1 + glowPhase * 0.05, blur: 15 },
    { radius: finalRadius * 5, opacity: 0.15 + glowPhase * 0.08, blur: 10 },
    { radius: finalRadius * 3, opacity: 0.25 + glowPhase * 0.1, blur: 5 },
  ];
  
  const hueShift = Math.sin(animationTime * 0.0004) * 20;
  const brightness = 1 + Math.sin(animationTime * 0.0006) * 0.15;
  
  glowLayers.forEach((layer, index) => {
    ctx.save();
    ctx.filter = `blur(${layer.blur}px) hue-rotate(${hueShift * (index + 1) / glowLayers.length}deg) brightness(${brightness})`;
    
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, layer.radius);
    const alpha = Math.floor(layer.opacity * 255).toString(16).padStart(2, '0');
    gradient.addColorStop(0, color + alpha);
    gradient.addColorStop(0.2, color + Math.floor(layer.opacity * 180).toString(16).padStart(2, '0'));
    gradient.addColorStop(0.5, color + Math.floor(layer.opacity * 100).toString(16).padStart(2, '0'));
    gradient.addColorStop(0.8, color + Math.floor(layer.opacity * 40).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, layer.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  
  // Light rays
  if (isKeyEvent || isSelected || isHovered) {
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(raysRotation);
    ctx.translate(-center, -center);
    
    const raysRadius = finalRadius * 10;
    const raysOpacity = isSelected ? 0.3 : (isHovered ? 0.18 : (isKeyEvent ? 0.2 : 0.15));
    
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = raysRadius * (0.8 + Math.sin(animationTime * 0.003 + i) * 0.2);
      
      ctx.strokeStyle = color + Math.floor(raysOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + Math.cos(angle) * rayLength,
        center + Math.sin(angle) * rayLength
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  
  // Orbital rings
  if (isSelected || isHovered) {
    const orbitalRingsDef = isSelected ? [
      { radius: finalRadius * 8, opacity: 0.8, speed: 1, width: 2 },
      { radius: finalRadius * 6.5, opacity: 0.6, speed: -0.7, width: 1.5 },
    ] : [
      { radius: finalRadius * 6, opacity: 0.4, speed: 0.8, width: 1 },
    ];
    
    orbitalRingsDef.forEach((ring, index) => {
      ctx.save();
      const ringPhase = orbitalPhase * ring.speed + index * Math.PI;
      const ringOpacity = ring.opacity * (0.7 + Math.sin(ringPhase * 2) * 0.3);
      const ringRadius = ring.radius * (0.9 + Math.sin(ringPhase * 1.5) * 0.1);
      
      ctx.strokeStyle = color + Math.floor(ringOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = ring.width;
      ctx.setLineDash([3, 2]);
      ctx.lineDashOffset = ringPhase * 10;
      ctx.beginPath();
      ctx.arc(center, center, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }
  
  // Main star shape
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  
  const shimmerBrightness = 1 + shimmerPhase * 0.3;
  ctx.filter = `brightness(${shimmerBrightness}) drop-shadow(0 0 ${finalRadius * 0.5}px ${color})`;
  
  switch (starType) {
    case 'point':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'classic':
      drawStar(ctx, center, center, 5, finalRadius * 2, finalRadius * 1, color);
      break;
      
    case 'sparkle':
      drawStar(ctx, center, center, 4, finalRadius * 1.8, finalRadius * 0.8, color);
      const crossOpacity = 0.4 + shimmerPhase * 0.6;
      ctx.strokeStyle = color + Math.floor(crossOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center - finalRadius * 3, center);
      ctx.lineTo(center + finalRadius * 3, center);
      ctx.moveTo(center, center - finalRadius * 3);
      ctx.lineTo(center, center + finalRadius * 3);
      ctx.stroke();
      break;
      
    case 'refraction':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      const refractionOpacity = 0.2 + Math.sin(animationTime * 0.0025) * 0.4;
      ctx.strokeStyle = color + Math.floor(refractionOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center - finalRadius * 4, center);
      ctx.lineTo(center + finalRadius * 4, center);
      ctx.moveTo(center, center - finalRadius * 4);
      ctx.lineTo(center, center + finalRadius * 4);
      ctx.stroke();
      
      const diagOpacity = refractionOpacity * 0.6;
      ctx.strokeStyle = color + Math.floor(diagOpacity * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.moveTo(center - finalRadius * 2.8, center - finalRadius * 2.8);
      ctx.lineTo(center + finalRadius * 2.8, center + finalRadius * 2.8);
      ctx.moveTo(center - finalRadius * 2.8, center + finalRadius * 2.8);
      ctx.lineTo(center + finalRadius * 2.8, center - finalRadius * 2.8);
      ctx.stroke();
      break;
      
    case 'halo':
      const breathingPhase = Math.sin(animationTime * 0.0015);
      const haloRings = [
        { radius: finalRadius * (1.2 + breathingPhase * 0.2), opacity: 1 },
        { radius: finalRadius * (2 + breathingPhase * 0.3), opacity: 0.6 },
        { radius: finalRadius * (2.8 + breathingPhase * 0.4), opacity: 0.3 },
        { radius: finalRadius * (3.6 + breathingPhase * 0.5), opacity: 0.15 }
      ];
      
      haloRings.forEach(ring => {
        const ringOpacity = ring.opacity * (0.4 + breathingPhase * 0.2);
        ctx.fillStyle = color + Math.floor(ringOpacity * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(center, center, ring.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
      
    default: // subtle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(center, center, finalRadius * 1.1, 0, Math.PI * 2);
      ctx.fill();
      
      const subtleOpacity = 0.6 + shimmerPhase * 0.4;
      ctx.strokeStyle = color + Math.floor(subtleOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(center - finalRadius * 2.5, center);
      ctx.lineTo(center + finalRadius * 2.5, center);
      ctx.moveTo(center, center - finalRadius * 2.5);
      ctx.lineTo(center, center + finalRadius * 2.5);
      ctx.stroke();
      break;
  }
  
  // Center glow for key events
  if (isKeyEvent) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const pulsePhase = Math.sin(animationTime * 0.002);
    const glowRadius = finalRadius * (2.5 + pulsePhase * 0.7);
    const glowOpacity = 0.4 + pulsePhase * 0.2;
    
    const centerGlow = ctx.createRadialGradient(center, center, 0, center, center, glowRadius);
    centerGlow.addColorStop(0, color);
    centerGlow.addColorStop(0.3, color + Math.floor(glowOpacity * 255).toString(16).padStart(2, '0'));
    centerGlow.addColorStop(1, color + '00');
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(center, center, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  ctx.restore();
  
  return new THREE.CanvasTexture(canvas);
}

export function createOrbitalRingTexture(
  THREE: any,
  color: string,
  ringType: string = 'base',
  size: number = 256
) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const center = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.35;
  
  ctx.clearRect(0, 0, size, size);
  
  const gradient = ctx.createRadialGradient(center, center, innerRadius, center, center, outerRadius);
  
  if (ringType === 'selected') {
    gradient.addColorStop(0, color + '00');
    gradient.addColorStop(0.3, color + '80');
    gradient.addColorStop(0.7, color + 'CC');
    gradient.addColorStop(1, color + '00');
  } else if (ringType === 'init') {
    gradient.addColorStop(0, color + '00');
    gradient.addColorStop(0.2, color + 'AA');
    gradient.addColorStop(0.8, color + 'DD');
    gradient.addColorStop(1, color + '00');
  } else {
    gradient.addColorStop(0, color + '00');
    gradient.addColorStop(0.4, color + '20');
    gradient.addColorStop(0.6, color + '40');
    gradient.addColorStop(1, color + '00');
  }
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
  ctx.arc(center, center, innerRadius, 0, Math.PI * 2, true);
  ctx.fill();
  
  return new THREE.CanvasTexture(canvas);
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}