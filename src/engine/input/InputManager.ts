// Input management system for WASD + mouse look FPS controls

import { EventBus } from '../core/EventBus';

export interface InputState {
  keys: { [key: string]: boolean };
  mouse: {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    buttons: { [button: number]: boolean };
  };
  touch: {
    touches: Touch[];
    deltaX: number;
    deltaY: number;
  };
}

export interface InputConfig {
  mouseSensitivity: number;
  touchSensitivity: number;
  keyMap: { [action: string]: string };
  enablePointerLock: boolean;
  invertY: boolean;
}

export class InputManager {
  private container: HTMLElement;
  private eventBus: EventBus;
  private config: InputConfig;
  private state: InputState;
  private isInitialized = false;
  private isPointerLocked = false;
  private isMobile = false;
  private movementVector = { x: 0, y: 0, z: 0 };
  private virtualMovement = { x: 0, y: 0, z: 0 };
  
  // Default key mappings
  private readonly defaultKeyMap = {
    forward: 'KeyW',
    backward: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    up: 'Space',
    down: 'ShiftLeft',
    interact: 'KeyE',
    menu: 'Escape',
    sprint: 'ShiftLeft',
    jump: 'Space'
  };
  
  constructor(container: HTMLElement, eventBus?: EventBus, config?: Partial<InputConfig>) {
    this.container = container;
    this.eventBus = eventBus || new EventBus();
    
    this.config = {
      mouseSensitivity: 0.002,
      touchSensitivity: 0.004,
      keyMap: { ...this.defaultKeyMap, ...config?.keyMap },
      enablePointerLock: false, // Disable pointer lock for hybrid controls
      invertY: false,
      ...config
    };
    
    this.state = {
      keys: {},
      mouse: {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        buttons: {}
      },
      touch: {
        touches: [],
        deltaX: 0,
        deltaY: 0
      }
    };
    
    this.detectMobile();
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('InputManager already initialized');
      return;
    }
    
    console.log('🎮 Initializing Input Manager...');
    
    this.setupEventListeners();
    this.isInitialized = true;
    
    console.log('✅ Input Manager initialized');
  }
  
  private detectMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('wheel', this.handleWheel.bind(this));
    this.container.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Touch events (mobile)
    if (this.isMobile) {
      this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    // Pointer lock events
    if (this.config.enablePointerLock) {
      document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
      document.addEventListener('pointerlockerror', this.handlePointerLockError.bind(this));
    }
    
    // Focus events
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    
    if (!this.state.keys[event.code]) {
      this.state.keys[event.code] = true;
      this.eventBus.emit('input.keydown', event.code, event);
      
      // Emit action events
      const action = this.getActionForKey(event.code);
      if (action) {
        this.eventBus.emit(`input.action.${action}`, true, event);
      }
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    event.preventDefault();
    
    if (this.state.keys[event.code]) {
      this.state.keys[event.code] = false;
      this.eventBus.emit('input.keyup', event.code, event);
      
      // Emit action events
      const action = this.getActionForKey(event.code);
      if (action) {
        this.eventBus.emit(`input.action.${action}`, false, event);
      }
    }
  }
  
  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    
    this.state.mouse.buttons[event.button] = true;
    this.eventBus.emit('input.mousedown', event.button, event);
    
    // Request pointer lock on first click
    if (this.config.enablePointerLock && !this.isPointerLocked) {
      this.requestPointerLock();
    }
  }
  
  private handleMouseUp(event: MouseEvent): void {
    event.preventDefault();
    
    this.state.mouse.buttons[event.button] = false;
    this.eventBus.emit('input.mouseup', event.button, event);
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      // Use movement deltas when pointer is locked
      this.state.mouse.deltaX = event.movementX * this.config.mouseSensitivity;
      this.state.mouse.deltaY = event.movementY * this.config.mouseSensitivity;
    } else {
      // Use position when pointer is not locked
      const rect = this.container.getBoundingClientRect();
      this.state.mouse.x = event.clientX - rect.left;
      this.state.mouse.y = event.clientY - rect.top;
      this.state.mouse.deltaX = 0;
      this.state.mouse.deltaY = 0;
    }
    
    if (this.config.invertY) {
      this.state.mouse.deltaY = -this.state.mouse.deltaY;
    }
    
    this.eventBus.emit('input.mousemove', this.state.mouse, event);
  }
  
  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    this.eventBus.emit('input.wheel', event.deltaY, event);
  }
  
  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }
  
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.state.touch.touches = Array.from(event.touches);
    this.eventBus.emit('input.touchstart', this.state.touch.touches, event);
  }
  
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const prevTouch = this.state.touch.touches[0];
      
      if (prevTouch) {
        this.state.touch.deltaX = (touch.clientX - prevTouch.clientX) * this.config.touchSensitivity;
        this.state.touch.deltaY = (touch.clientY - prevTouch.clientY) * this.config.touchSensitivity;
        
        if (this.config.invertY) {
          this.state.touch.deltaY = -this.state.touch.deltaY;
        }
      }
    }
    
    this.state.touch.touches = Array.from(event.touches);
    this.eventBus.emit('input.touchmove', this.state.touch, event);
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.state.touch.touches = Array.from(event.touches);
    this.state.touch.deltaX = 0;
    this.state.touch.deltaY = 0;
    this.eventBus.emit('input.touchend', this.state.touch.touches, event);
  }
  
  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.container;
    this.eventBus.emit('input.pointerlockchange', this.isPointerLocked);
  }
  
  private handlePointerLockError(): void {
    console.error('Pointer lock error');
    this.eventBus.emit('input.pointerlockerror');
  }
  
  private handleWindowBlur(): void {
    // Clear all input state when window loses focus
    this.state.keys = {};
    this.state.mouse.buttons = {};
    this.eventBus.emit('input.windowblur');
  }
  
  private handleWindowFocus(): void {
    this.eventBus.emit('input.windowfocus');
  }
  
  private getActionForKey(keyCode: string): string | null {
    for (const [action, code] of Object.entries(this.config.keyMap)) {
      if (code === keyCode) {
        return action;
      }
    }
    return null;
  }
  
  // Public API
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Update movement vector based on pressed keys
    this.updateMovementVector();
    
    // Reset mouse deltas after each frame
    this.state.mouse.deltaX = 0;
    this.state.mouse.deltaY = 0;
    this.state.touch.deltaX = 0;
    this.state.touch.deltaY = 0;
  }
  
  private updateMovementVector(): void {
    // Start with virtual movement (mobile) or keyboard movement
    if (this.isMobile && (this.virtualMovement.x !== 0 || this.virtualMovement.z !== 0)) {
      // Use virtual movement from mobile joystick
      this.movementVector.x = this.virtualMovement.x;
      this.movementVector.y = this.virtualMovement.y;
      this.movementVector.z = this.virtualMovement.z;
    } else {
      // Use keyboard movement
      this.movementVector.x = 0;
      this.movementVector.y = 0;
      this.movementVector.z = 0;
      
      // Forward/backward
      if (this.isActionPressed('forward')) {
        this.movementVector.z -= 1;
      }
      if (this.isActionPressed('backward')) {
        this.movementVector.z += 1;
      }
      
      // Left/right
      if (this.isActionPressed('left')) {
        this.movementVector.x -= 1;
      }
      if (this.isActionPressed('right')) {
        this.movementVector.x += 1;
      }
      
      // Up/down
      if (this.isActionPressed('up')) {
        this.movementVector.y += 1;
      }
      if (this.isActionPressed('down')) {
        this.movementVector.y -= 1;
      }
      
      // Normalize movement vector
      const length = Math.sqrt(
        this.movementVector.x * this.movementVector.x +
        this.movementVector.y * this.movementVector.y +
        this.movementVector.z * this.movementVector.z
      );
      
      if (length > 0) {
        this.movementVector.x /= length;
        this.movementVector.y /= length;
        this.movementVector.z /= length;
      }
    }
  }
  
  public isKeyPressed(keyCode: string): boolean {
    return !!this.state.keys[keyCode];
  }
  
  public isActionPressed(action: string): boolean {
    const keyCode = this.config.keyMap[action];
    return keyCode ? this.isKeyPressed(keyCode) : false;
  }
  
  public isMouseButtonPressed(button: number): boolean {
    return !!this.state.mouse.buttons[button];
  }
  
  public getMouseDelta(): { x: number; y: number } {
    return { x: this.state.mouse.deltaX, y: this.state.mouse.deltaY };
  }
  
  public getTouchDelta(): { x: number; y: number } {
    return { x: this.state.touch.deltaX, y: this.state.touch.deltaY };
  }
  
  public getMousePosition(): { x: number; y: number } {
    return { x: this.state.mouse.x, y: this.state.mouse.y };
  }
  
  public getTouchCount(): number {
    return this.state.touch.touches.length;
  }
  
  public isMobileDevice(): boolean {
    return this.isMobile;
  }
  
  public isPointerLockActive(): boolean {
    return this.isPointerLocked;
  }
  
  public requestPointerLock(): void {
    if (this.config.enablePointerLock) {
      this.container.requestPointerLock();
    }
  }
  
  public exitPointerLock(): void {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }
  
  public setMouseSensitivity(sensitivity: number): void {
    this.config.mouseSensitivity = sensitivity;
  }
  
  public setTouchSensitivity(sensitivity: number): void {
    this.config.touchSensitivity = sensitivity;
  }
  
  public setInvertY(invert: boolean): void {
    this.config.invertY = invert;
  }
  
  public getMovementVector(): { x: number; y: number; z: number } {
    return { ...this.movementVector };
  }
  
  public getConfig(): InputConfig {
    return { ...this.config };
  }
  
  public getState(): InputState {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  public setVirtualMovement(x: number, y: number, z: number): void {
    this.virtualMovement.x = x;
    this.virtualMovement.y = y;
    this.virtualMovement.z = z;
  }
  
  public clearVirtualMovement(): void {
    this.virtualMovement.x = 0;
    this.virtualMovement.y = 0;
    this.virtualMovement.z = 0;
  }
  
  public dispose(): void {
    console.log('🧹 Disposing Input Manager...');
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    this.container.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.removeEventListener('wheel', this.handleWheel.bind(this));
    this.container.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    if (this.isMobile) {
      this.container.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.container.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      this.container.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.removeEventListener('pointerlockerror', this.handlePointerLockError.bind(this));
    
    window.removeEventListener('blur', this.handleWindowBlur.bind(this));
    window.removeEventListener('focus', this.handleWindowFocus.bind(this));
    
    // Exit pointer lock
    if (this.isPointerLocked) {
      this.exitPointerLock();
    }
    
    // Clear state
    this.state = {
      keys: {},
      mouse: { x: 0, y: 0, deltaX: 0, deltaY: 0, buttons: {} },
      touch: { touches: [], deltaX: 0, deltaY: 0 }
    };
    
    this.isInitialized = false;
    
    console.log('✅ Input Manager disposed');
  }
}