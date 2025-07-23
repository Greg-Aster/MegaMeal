<!-- 
  Threlte Input System Component
  Replaces UniversalInputManager.ts with reactive input handling
-->
<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import { writable } from 'svelte/store'
import { UniversalInputManager } from '../../engine/input/UniversalInputManager'

const dispatch = createEventDispatcher()

// Reactive stores for input state
export const keysStore = writable({})
export const mouseStore = writable({ x: 0, y: 0, buttons: 0 })
export const touchStore = writable([])
export const gamepadStore = writable([])

let inputManager: UniversalInputManager
let isInitialized = false
let container: HTMLElement

// Export input state for external access
export let keys = {}
export let mouse = { x: 0, y: 0, buttons: 0 }
export let touches = []
export let gamepads = []

// Props
export let targetContainer: HTMLElement | null = null

onMount(() => {
  console.log('🎮 Initializing Threlte Input System...')
  
  // Use provided container or document.body as fallback
  container = targetContainer || document.body
  
  // Create input manager
  inputManager = new UniversalInputManager(container, {
    emit: (event: string, data: any) => {
      dispatch(event, data)
      handleInputEvent(event, data)
    },
    on: () => {}, // Not used in this context
    off: () => {} // Not used in this context
  })
  
  // Initialize input manager
  inputManager.initialize()
  
  // Set up input state tracking
  setupInputTracking()
  
  isInitialized = true
  console.log('✅ Threlte Input System initialized')
})

/**
 * Set up input state tracking
 */
function setupInputTracking() {
  // Track keyboard state
  container.addEventListener('keydown', (event) => {
    keys = { ...keys, [event.code]: true }
    keysStore.set(keys)
    dispatch('keyDown', { key: event.code, event })
  })
  
  container.addEventListener('keyup', (event) => {
    keys = { ...keys, [event.code]: false }
    keysStore.set(keys)
    dispatch('keyUp', { key: event.code, event })
  })
  
  // Track mouse state
  container.addEventListener('mousemove', (event) => {
    mouse = {
      x: event.clientX,
      y: event.clientY,
      buttons: event.buttons
    }
    mouseStore.set(mouse)
    dispatch('mouseMove', { mouse, event })
  })
  
  container.addEventListener('mousedown', (event) => {
    mouse = { ...mouse, buttons: event.buttons }
    mouseStore.set(mouse)
    dispatch('mouseDown', { button: event.button, mouse, event })
  })
  
  container.addEventListener('mouseup', (event) => {
    mouse = { ...mouse, buttons: event.buttons }
    mouseStore.set(mouse)
    dispatch('mouseUp', { button: event.button, mouse, event })
  })
  
  // Track touch state
  container.addEventListener('touchstart', (event) => {
    touches = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }))
    touchStore.set(touches)
    dispatch('touchStart', { touches, event })
  })
  
  container.addEventListener('touchmove', (event) => {
    touches = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }))
    touchStore.set(touches)
    dispatch('touchMove', { touches, event })
  })
  
  container.addEventListener('touchend', (event) => {
    touches = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }))
    touchStore.set(touches)
    dispatch('touchEnd', { touches, event })
  })
  
  // Gamepad polling (if supported)
  if (navigator.getGamepads) {
    const pollGamepads = () => {
      const pads = navigator.getGamepads()
      gamepads = Array.from(pads).filter(pad => pad !== null).map(pad => ({
        id: pad?.id || '',
        buttons: pad?.buttons.map(button => button.pressed) || [],
        axes: Array.from(pad?.axes || [])
      }))
      gamepadStore.set(gamepads)
      
      if (isInitialized) {
        requestAnimationFrame(pollGamepads)
      }
    }
    pollGamepads()
  }
}

/**
 * Handle input events from UniversalInputManager
 */
function handleInputEvent(event: string, data: any) {
  switch (event) {
    case 'input.keyboard':
      dispatch('keyboard', data)
      break
    case 'input.mouse':
      dispatch('mouse', data)
      break
    case 'input.touch':
      dispatch('touch', data)
      break
    case 'input.gamepad':
      dispatch('gamepad', data)
      break
    case 'movement.request':
      dispatch('movementRequest', data)
      break
    case 'interaction.request':
      dispatch('interactionRequest', data)
      break
    default:
      // Forward unknown events
      dispatch(event, data)
  }
}

/**
 * Check if key is pressed
 */
export function isKeyPressed(keyCode: string): boolean {
  return keys[keyCode] || false
}

/**
 * Check if mouse button is pressed
 */
export function isMousePressed(button: number): boolean {
  return (mouse.buttons & (1 << button)) !== 0
}

/**
 * Get touch by ID
 */
export function getTouch(id: number) {
  return touches.find(touch => touch.id === id)
}

/**
 * Get gamepad by index
 */
export function getGamepad(index: number) {
  return gamepads[index]
}

onDestroy(() => {
  if (inputManager) {
    inputManager.dispose()
    console.log('🧹 Threlte Input System disposed')
  }
  isInitialized = false
})

// Export input manager for external access
export { inputManager }
</script>

<!-- No visual output - this is a system component -->

{#if isInitialized}
  <slot />
{/if}