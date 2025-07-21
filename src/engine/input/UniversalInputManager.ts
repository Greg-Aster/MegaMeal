import type { EventBus } from '../core/EventBus'

/**
 * A universal input manager that handles all input including mobile controls.
 * This becomes the single source of truth for all user input.
 */
export class UniversalInputManager {
  private eventBus: EventBus
  private gameContainer: HTMLElement
  private isInitialized = false
  private isDisposed = false

  // State for tap vs. drag detection
  private touchStartTime = 0
  private touchStartPos = { x: 0, y: 0 }
  private isDragging = false
  private dragThreshold = 5 // pixels - reduced for more responsive touch
  private tapTimeThreshold = 500 // milliseconds - increased for more forgiving touch

  // Mobile detection
  private isMobile = false

  // Movement and action state
  private movementVector = { x: 0, y: 0, z: 0 }
  private actionStates: { [action: string]: boolean } = {}

  // Keyboard state
  private keyStates: { [key: string]: boolean } = {}

  // Sensitivity settings
  private mouseSensitivity = 0.002
  private touchSensitivity = 0.0012 // Increased for more responsive mobile camera

  constructor(gameContainer: HTMLElement, eventBus: EventBus) {
    this.gameContainer = gameContainer
    this.eventBus = eventBus
    this.detectMobile()
  }

  private detectMobile(): void {
    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      )
  }

  public initialize(): void {
    if (this.isInitialized) {
      console.warn('UniversalInputManager already initialized')
      return
    }

    // console.log('🕹️ Initializing Universal Input Manager...');

    // Binding methods to ensure 'this' context is correct
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)

    // Desktop events
    this.gameContainer.addEventListener('mousedown', this.handleMouseDown)
    this.gameContainer.addEventListener('mouseup', this.handleMouseUp)
    this.gameContainer.addEventListener('mousemove', this.handleMouseMove)

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    // Mobile events
    this.gameContainer.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    })
    this.gameContainer.addEventListener('touchend', this.handleTouchEnd, {
      passive: false,
    })
    this.gameContainer.addEventListener('touchmove', this.handleTouchMove, {
      passive: true,
    })

    this.isInitialized = true
    // console.log('✅ Universal Input Manager initialized');
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDragging = false
    this.touchStartTime = Date.now()
    this.touchStartPos.x = event.clientX
    this.touchStartPos.y = event.clientY

    // Emit drag start for camera controls
    this.eventBus.emit('input:drag:start', {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
    })
  }

  private handleMouseUp(event: MouseEvent): void {
    const duration = Date.now() - this.touchStartTime
    const distanceMoved = Math.sqrt(
      Math.pow(event.clientX - this.touchStartPos.x, 2) +
        Math.pow(event.clientY - this.touchStartPos.y, 2),
    )

    // Emit drag end
    this.eventBus.emit('input:drag:end', {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
    })

    // Only emit tap if it wasn't a drag
    if (
      !this.isDragging &&
      duration < this.tapTimeThreshold &&
      distanceMoved < this.dragThreshold
    ) {
      this.emitTap(event.clientX, event.clientY)
    }

    this.isDragging = false
  }

  private handleMouseMove(event: MouseEvent): void {
    const distanceMoved = Math.sqrt(
      Math.pow(event.clientX - this.touchStartPos.x, 2) +
        Math.pow(event.clientY - this.touchStartPos.y, 2),
    )

    // Detect if we're dragging
    if (event.buttons === 1 && distanceMoved > this.dragThreshold) {
      this.isDragging = true
      // Apply mouse sensitivity to movement deltas
      const deltaX = event.movementX * this.mouseSensitivity
      const deltaY = event.movementY * this.mouseSensitivity

      this.eventBus.emit('input:drag:move', {
        x: event.clientX,
        y: event.clientY,
        deltaX: deltaX,
        deltaY: deltaY,
        button: 0,
      })
    } else if (!this.isDragging) {
      // Only emit hover if not dragging
      this.eventBus.emit('input:hover', { x: event.clientX, y: event.clientY })
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Check if touch is on mobile controls area (bottom 200px)
      const touch = event.touches[0]
      const containerRect = this.gameContainer.getBoundingClientRect()
      const touchY = touch.clientY - containerRect.top
      const isOnMobileControls = touchY > containerRect.height - 200

      if (isOnMobileControls) {
        console.log(
          '🎮 Touch on mobile controls area, ignoring for camera drag',
        )
        return // Don't handle touch events on mobile controls
      }

      this.isDragging = false
      this.touchStartTime = Date.now()
      this.touchStartPos.x = event.touches[0].clientX
      this.touchStartPos.y = event.touches[0].clientY

      // Emit drag start for camera controls
      this.eventBus.emit('input:drag:start', {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        button: 0,
      })
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Check if touch is on mobile controls area (bottom 200px)
      const touch = event.touches[0]
      const containerRect = this.gameContainer.getBoundingClientRect()
      const touchY = touch.clientY - containerRect.top
      const isOnMobileControls = touchY > containerRect.height - 200

      if (isOnMobileControls) {
        return // Don't handle touch events on mobile controls
      }

      const distanceMoved = Math.sqrt(
        Math.pow(touch.clientX - this.touchStartPos.x, 2) +
          Math.pow(touch.clientY - this.touchStartPos.y, 2),
      )

      if (distanceMoved > this.dragThreshold) {
        this.isDragging = true

        // Calculate deltas with proper mobile sensitivity
        // Invert deltas for intuitive mobile controls (swipe right = look right)
        const rawDeltaX = touch.clientX - this.touchStartPos.x
        const rawDeltaY = touch.clientY - this.touchStartPos.y
        const deltaX = -rawDeltaX * this.touchSensitivity // Inverted for mobile
        const deltaY = -rawDeltaY * this.touchSensitivity // Inverted for mobile

        this.eventBus.emit('input:drag:move', {
          x: touch.clientX,
          y: touch.clientY,
          deltaX: deltaX,
          deltaY: deltaY,
          button: 0,
        })

        // Update touch start position for next delta calculation
        this.touchStartPos.x = touch.clientX
        this.touchStartPos.y = touch.clientY
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
      // Check if touch is on mobile controls area (bottom 200px)
      const touch = event.changedTouches[0]
      const containerRect = this.gameContainer.getBoundingClientRect()
      const touchY = touch.clientY - containerRect.top
      const isOnMobileControls = touchY > containerRect.height - 200

      if (isOnMobileControls) {
        return // Don't handle touch events on mobile controls
      }

      const distanceMoved = Math.sqrt(
        Math.pow(touch.clientX - this.touchStartPos.x, 2) +
          Math.pow(touch.clientY - this.touchStartPos.y, 2),
      )
      const duration = Date.now() - this.touchStartTime

      // Emit drag end
      this.eventBus.emit('input:drag:end', {
        x: touch.clientX,
        y: touch.clientY,
        button: 0,
      })

      // Only emit tap if it's a quick, short touch
      if (
        duration < this.tapTimeThreshold &&
        distanceMoved < this.dragThreshold
      ) {
        event.preventDefault() // Prevent double-tap zoom and other browser behaviors
        this.emitTap(touch.clientX, touch.clientY)
      }
    }
  }

  private emitTap(x: number, y: number): void {
    this.eventBus.emit('input:tap', { x, y })
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Prevent default for movement keys to avoid page scrolling
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'Space',
      ].includes(event.code)
    ) {
      event.preventDefault()
    }

    this.keyStates[event.code] = true

    // Handle specific actions immediately
    if (event.code === 'Space') {
      this.eventBus.emit('desktop.action', 'jump')
    }

    // Update movement vector based on current key states
    this.updateMovementFromKeys()
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keyStates[event.code] = false

    // Update movement vector based on current key states
    this.updateMovementFromKeys()
  }

  private updateMovementFromKeys(): void {
    let x = 0,
      z = 0

    // WASD movement
    if (this.keyStates['KeyW'] || this.keyStates['ArrowUp']) z -= 1
    if (this.keyStates['KeyS'] || this.keyStates['ArrowDown']) z += 1
    if (this.keyStates['KeyA'] || this.keyStates['ArrowLeft']) x -= 1
    if (this.keyStates['KeyD'] || this.keyStates['ArrowRight']) x += 1

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z)
      x /= length
      z /= length
    }

    // Emit movement event
    this.eventBus.emit('desktop.movement', { x, z })
  }

  // Mobile control methods
  public setVirtualMovement(x: number, y: number, z: number): void {
    this.movementVector.x = x
    this.movementVector.y = y
    this.movementVector.z = z

    // Don't emit events here - this method is called FROM event handlers
  }

  public setVirtualAction(action: string, pressed: boolean): void {
    this.actionStates[action] = pressed

    // Don't emit events here - this method is called FROM event handlers
  }

  public getMovementVector(): { x: number; y: number; z: number } {
    return { ...this.movementVector }
  }

  public isActionPressed(action: string): boolean {
    return !!this.actionStates[action]
  }

  public isMobileDevice(): boolean {
    return this.isMobile
  }

  public dispose(): void {
    if (this.isDisposed) return

    this.gameContainer.removeEventListener('mousedown', this.handleMouseDown)
    this.gameContainer.removeEventListener('mouseup', this.handleMouseUp)
    this.gameContainer.removeEventListener('mousemove', this.handleMouseMove)
    this.gameContainer.removeEventListener('touchstart', this.handleTouchStart)
    this.gameContainer.removeEventListener('touchend', this.handleTouchEnd)
    this.gameContainer.removeEventListener('touchmove', this.handleTouchMove)

    // Remove keyboard events
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)

    this.isDisposed = true
    // console.log('🧹 Universal Input Manager disposed');
  }
}
