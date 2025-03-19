<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
  
    // Main navigation properties
    export let scale = 1;
    export let offsetX = 0;
    export let offsetY = 0;
    export let isMobile = false;
    export let containerWidth = 0;
    export let containerHeight = 0;
    
    // Run after container dimensions change
    afterUpdate(() => {
      // If we're very zoomed in and the container dimensions change
      // (like during screen rotation), we might need to adjust offsets
      // to avoid user getting lost outside the visible area
      if (scale > 1.5) {
        // Constrain offsets to reasonable bounds based on container size
        const maxOffsetX = containerWidth * (scale - 1);
        const maxOffsetY = containerHeight * (scale - 1);
        
        if (Math.abs(offsetX) > maxOffsetX) {
          offsetXTweened.set(Math.sign(offsetX) * maxOffsetX * 0.8);
        }
        
        if (Math.abs(offsetY) > maxOffsetY) {
          offsetYTweened.set(Math.sign(offsetY) * maxOffsetY * 0.8);
        }
      }
    });
    
    // Internal state
    let isTouchActive = false;
    
    // For touch/drag handling
    const touchState = {
      isDragging: false,
      startDragX: 0,
      startDragY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
      touchStartX: 0,
      touchStartY: 0,
      lastTouchX: 0,
      lastTouchY: 0,
      touchDistance: 0,
      initialTouchDistance: 0,
      isTouching: false,
      isMultiTouch: false,
      touchStartTime: 0,
      touchMoved: false,
      lastTapTime: 0
    };
    
    // Create event dispatcher
    const dispatch = createEventDispatcher();
    
    // Create tweened stores for smooth animations
    const scaleTweened = tweened(scale, {
      duration: 300,
      easing: cubicOut
    });
    
    const offsetXTweened = tweened(offsetX, {
      duration: 300,
      easing: cubicOut
    });
    
    const offsetYTweened = tweened(offsetY, {
      duration: 300,
      easing: cubicOut
    });
    
    // Expose current transform values to parent
    $: scale = $scaleTweened;
    $: offsetX = $offsetXTweened;
    $: offsetY = $offsetYTweened;
    
    // Set animation duration
    function setAnimationDuration(duration) {
      scaleTweened.update(s => s, { duration });
      offsetXTweened.update(x => x, { duration });
      offsetYTweened.update(y => y, { duration });
    }
    
    /**
     * Public API methods for the parent component to call
     */
    
    // Zoom in by a fixed amount
    export function zoomIn() {
      scaleTweened.update(s => Math.min(5, s + 0.2));
    }
    
    // Zoom out by a fixed amount
    export function zoomOut() {
      scaleTweened.update(s => Math.max(0.5, s - 0.2));
    }
    
    // Reset view to original position and scale
    export function resetView() {
      scaleTweened.set(1);
      offsetXTweened.set(0);
      offsetYTweened.set(0);
    }
    
    // Pan the view by specified delta values
    export function pan(deltaX, deltaY) {
      offsetXTweened.update(x => x + deltaX);
      offsetYTweened.update(y => y + deltaY);
    }
    
    // Handle start of mouse drag
    export function handleMouseDown(clientX, clientY) {
      touchState.isDragging = true;
      touchState.startDragX = clientX;
      touchState.startDragY = clientY;
      touchState.startOffsetX = offsetX;
      touchState.startOffsetY = offsetY;
      
      return true;
    }
    
    // Handle mouse movement during drag
    export function handleMouseMove(clientX, clientY) {
      if (!touchState.isDragging) return false;
      
      const deltaX = clientX - touchState.startDragX;
      const deltaY = clientY - touchState.startDragY;
      
      offsetXTweened.set(touchState.startOffsetX + deltaX);
      offsetYTweened.set(touchState.startOffsetY + deltaY);
      
      return true;
    }
    
    // Handle end of mouse drag
    export function handleMouseUp() {
      touchState.isDragging = false;
      return true;
    }
    
    // Handle double-click to zoom
    export function handleDoubleClick(clickX, clickY) {
      // Calculate the center point of the container
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      // Calculate how far from center the click was
      const deltaX = clickX - centerX;
      const deltaY = clickY - centerY;
      
      // Zoom in
      scaleTweened.update(s => Math.min(5, s + 0.5));
      
      // Adjust the offset to center on the click position
      offsetXTweened.update(x => x - (deltaX / scale) * 0.2);
      offsetYTweened.update(y => y - (deltaY / scale) * 0.2);
      
      return true;
    }
    
    // Initialize touch interaction
    export function handleTouchStart(touches, isEventNode) {
      // Set to immediate animations during touch
      setAnimationDuration(0);
      isTouchActive = true;
      dispatch('touchActiveChange', { isTouchActive });
      
      // Reset touch state
      touchState.touchMoved = false;
      touchState.touchStartTime = Date.now();
      
      if (touches.length === 1) {
        // Single touch - pan
        touchState.isTouching = true;
        touchState.isMultiTouch = false;
        touchState.touchStartX = touches[0].clientX;
        touchState.touchStartY = touches[0].clientY;
        touchState.lastTouchX = touchState.touchStartX;
        touchState.lastTouchY = touchState.touchStartY;
        touchState.startOffsetX = offsetX;
        touchState.startOffsetY = offsetY;
      } else if (touches.length === 2) {
        // Two touches - pinch zoom
        touchState.isTouching = true;
        touchState.isMultiTouch = true;
        
        // Calculate initial distance
        const touch1 = touches[0];
        const touch2 = touches[1];
        touchState.initialTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        touchState.touchDistance = touchState.initialTouchDistance;
        
        // Store midpoint
        touchState.touchStartX = (touch1.clientX + touch2.clientX) / 2;
        touchState.touchStartY = (touch1.clientY + touch2.clientY) / 2;
        touchState.lastTouchX = touchState.touchStartX;
        touchState.lastTouchY = touchState.touchStartY;
        touchState.startOffsetX = offsetX;
        touchState.startOffsetY = offsetY;
      }
      
      return isTouchActive;
    }
    
    // Handle touch movement
    export function handleTouchMove(touches, isEventNode) {
      if (!touchState.isTouching) return false;
      
      // Check for movement threshold
      if (touches.length === 1) {
        const dx = touches[0].clientX - touchState.touchStartX;
        const dy = touches[0].clientY - touchState.touchStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
          touchState.touchMoved = true;
          
          if (isEventNode) {
            return false;
          }
        }
      }
      
      // Handle single touch pan
      if (touches.length === 1 && !touchState.isMultiTouch && !isEventNode) {
        const touchX = touches[0].clientX;
        const touchY = touches[0].clientY;
        
        const deltaX = touchX - touchState.lastTouchX;
        const deltaY = touchY - touchState.lastTouchY;
        
        offsetXTweened.set(offsetX + deltaX);
        offsetYTweened.set(offsetY + deltaY);
        
        touchState.lastTouchX = touchX;
        touchState.lastTouchY = touchY;
      } 
      // Handle pinch zoom
      else if (touches.length === 2) {
        touchState.touchMoved = true;
        
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        // Current pinch distance
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        // Zoom factor
        const zoomDelta = currentDistance / touchState.touchDistance;
        
        if (zoomDelta !== 1) {
          const newScale = Math.max(0.5, Math.min(5, scale * zoomDelta));
          scaleTweened.set(newScale);
          touchState.touchDistance = currentDistance;
        }
        
        // Handle panning during pinch
        const currentMidX = (touch1.clientX + touch2.clientX) / 2;
        const currentMidY = (touch1.clientY + touch2.clientY) / 2;
        
        const deltaX = currentMidX - touchState.lastTouchX;
        const deltaY = currentMidY - touchState.lastTouchY;
        
        offsetXTweened.set(offsetX + deltaX);
        offsetYTweened.set(offsetY + deltaY);
        
        touchState.lastTouchX = currentMidX;
        touchState.lastTouchY = currentMidY;
      }
      
      return true;
    }
    
    // Handle end of touch
    export function handleTouchEnd(touches) {
      // Calculate if this was a tap
      const wasTap = !touchState.touchMoved && (Date.now() - touchState.touchStartTime < 300);
      const lastTapTime = touchState.lastTapTime;
      
      // Update last tap time if it was a tap
      if (wasTap) {
        touchState.lastTapTime = Date.now();
      }
      
      // If all touches are removed
      if (touches.length === 0) {
        touchState.isTouching = false;
        touchState.isMultiTouch = false;
        
        // Restore normal animation duration with slight delay
        setTimeout(() => {
          setAnimationDuration(300);
          isTouchActive = false;
          dispatch('touchActiveChange', { isTouchActive });
        }, 50);
        
        return {
          wasTap,
          wasDoubleTap: wasTap && Date.now() - lastTapTime < 2000,
          touchTime: Date.now()
        };
      } 
      // If transitioning from multi-touch to single touch
      else if (touches.length === 1) {
        touchState.isMultiTouch = false;
        touchState.touchStartX = touches[0].clientX;
        touchState.touchStartY = touches[0].clientY;
        touchState.lastTouchX = touchState.touchStartX;
        touchState.lastTouchY = touchState.touchStartY;
        touchState.startOffsetX = offsetX;
        touchState.startOffsetY = offsetY;
        
        return {
          wasTap: false,
          wasDoubleTap: false,
          touchTime: 0
        };
      }
      
      return {
        wasTap: false,
        wasDoubleTap: false,
        touchTime: 0
      };
    }
    
    // Get transform string for background with parallax effect
    export function getBackgroundTransform() {
      return isMobile 
        ? `scale(${1.05 + 0.05 * scale}) translate(${-offsetX * 0.05}px, ${-offsetY * 0.05}px) rotate(90deg) scale(1.5)` 
        : `scale(${1.05 + 0.05 * scale}) translate(${-offsetX * 0.05}px, ${-offsetY * 0.05}px)`;
    }
  </script>