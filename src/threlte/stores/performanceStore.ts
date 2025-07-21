import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

export interface MemoryInfo {
  geometries: number
  textures: number
  programs: number
}

export interface RenderInfo {
  calls: number
  triangles: number
  points: number
  lines: number
}

/**
 * Performance-related Svelte stores.
 * These can be imported and used by any component.
 */

// Raw performance metrics, updated by Performance.svelte
export const fpsStore: Writable<number> = writable(60)
export const frameTimeStore: Writable<number> = writable(16.67)
export const memoryStore: Writable<MemoryInfo> = writable({
  geometries: 0,
  textures: 0,
  programs: 0,
})
export const renderInfoStore: Writable<RenderInfo> = writable({
  calls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
})

// Optimization-related metrics, can be updated by an optimization system
export const qualityLevelStore: Writable<string> = writable('medium')
export const performanceGradeStore: Writable<string> = writable('A')
export const performanceScoreStore: Writable<number> = writable(100)
export const optimizationRecommendationsStore: Writable<string[]> = writable([])