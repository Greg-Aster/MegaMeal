/**
 * Mobile Input Store - Threlte-Native Reactive State
 * 
 * Centralized store for mobile input state that integrates seamlessly
 * with Threlte's reactive system.
 */

import { writable } from 'svelte/store'

export interface MobileInputState {
  movement: { x: number, z: number }
  isJoystickActive: boolean
  actionPressed: string | null
}

export const mobileInputStore = writable<MobileInputState>({
  movement: { x: 0, z: 0 },
  isJoystickActive: false,
  actionPressed: null
})