// Math utilities for game engine

import * as THREE from 'three'

export class Math {
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  public static randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  public static sphericalToCartesian(
    radius: number,
    theta: number,
    phi: number,
  ): THREE.Vector3 {
    return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)
  }

  public static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  public static radToDeg(radians: number): number {
    return radians * (180 / Math.PI)
  }
}
