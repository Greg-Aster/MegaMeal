/**
 * ===================================================================
 * BANNER ANIMATION UTILITY - CENTRALIZED ANIMATION LOGIC
 * ===================================================================
 * 
 * This file contains all banner animation logic, extracted from the layout
 * component for better organization and maintainability. It provides a
 * clean API for initializing and controlling banner animations.
 * 
 * FEATURES:
 * - Professional crossfade transitions
 * - PostCard-style link previews using existing site styling (UPDATED)
 * - Mobile and desktop interaction handling
 * - Pause/resume functionality
 * - Mixed video and image content support
 * - Configuration-driven behavior
 * 
 * USAGE:
 * - Import: import { BannerAnimationController } from '@/utils/bannerAnimation'
 * - Initialize: const controller = new BannerAnimationController(config)
 * - Start: controller.initialize()
 * 
 * ARCHITECTURE:
 * - All configuration comes from banner.config.ts
 * - Animation logic is decoupled from layout components
 * - Provides clean API for external control
 * - Maintains performance optimizations
 * - Uses PostCard styling for consistent appearance (NEW)
 * 
 * RECENT UPDATES:
 * - Replaced custom banner preview styles with PostCard-based styling
 * - Reuses existing card-base, meta-icon, and button classes
 * - Maintains design consistency with the rest of the site
 * - Keeps code DRY by avoiding duplicate CSS
 * ===================================================================
 */

import type { BannerAnimationConfig } from '@/config/banners/types'

/**
 * Configuration interface for banner animation controller
 * Contains all necessary dependencies for banner animation system
 */
export interface BannerAnimationControllerConfig {
  containerId: string;
  animationConfig: BannerAnimationConfig;
  getBannerLink: (index: number) => string | null;
  getLinkPreviewData: (url: string) => any;
  getIconSVG: (iconName: string) => string;
  isVideoBannerItem?: (item: any) => boolean;
  isImageBannerItem?: (item: any) => boolean;
}

/**
 * Banner Animation Controller Class
 * Handles all banner animation logic and interactions
 * 
 * This class manages the complete lifecycle of banner animations including:
 * - Slide transitions with smooth crossfading
 * - User interaction handling (hover, touch, click)
 * - Pause/resume functionality with reason tracking
 * - Mobile and desktop UX optimizations
 * - PostCard-style link previews for consistency
 */
export class BannerAnimationController {
  private config: BannerAnimationControllerConfig;
  private bannerContainer: HTMLElement | null = null;
  private bannerSlides: NodeListOf<Element> | null = null;
  private currentIndex: number = 0;
  private animationTimeout: number = 0;
  private isAnimating: boolean = false;
  private isPaused: boolean = false;
  private selectedBannerIndex: number = -1;
  private pauseReason: string = '';

  constructor(config: BannerAnimationControllerConfig) {
    this.config = config;
  }

  /**
   * Initialize the banner animation system
   * Call this when DOM is ready
   * 
   * @returns boolean indicating successful initialization
   */
  public initialize(): boolean {
    this.bannerContainer = document.getElementById(this.config.containerId);
    if (!this.bannerContainer) {
      console.log('Banner animation: No banner container found');
      return false;
    }
    
    this.bannerSlides = this.bannerContainer.querySelectorAll('.banner-slide');
    console.log(`Banner animation: Found ${this.bannerSlides.length} banner slides`);
    
    if (this.bannerSlides.length <= 1) {
      console.log('Banner animation: Not enough slides for animation (need at least 2)');
      return false;
    }

    console.log('Banner animation: Starting enhanced UX', this.config.animationConfig);

    // Initialize all components in proper order
    this.initializeSlideOpacity();
    this.createPostCardStylePreviews();
    this.setupInteractionControls();
    this.updateInteractionStates();
    this.setupVisibilityHandling();
    this.startAnimation();

    // Expose API to window for external control
    this.exposeGlobalAPI();

    return true;
  }

  /**
   * Initialize all slides with proper opacity
   * Sets first slide visible, others transparent for crossfade effect
   */
  private initializeSlideOpacity(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      slideElement.style.opacity = index === 0 ? '1' : '0';
      console.log(`Banner init: Slide ${index} opacity set to ${slideElement.style.opacity}`);
    });
  }

  /**
   * Create PostCard-style link preview overlays using existing site styling
   * 
   * UPDATED METHOD: Now uses PostCard.astro design patterns for consistency
   * - Reuses card-base class for background and styling
   * - Uses meta-icon for consistent iconography
   * - Follows PostCard layout structure (title, metadata, description, CTA)
   * - Leverages existing CSS variables and transitions
   * 
   * This approach keeps the code DRY and ensures design consistency
   * across all components on the site.
   */
  private createPostCardStylePreviews(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      const bannerLink = slideElement.querySelector('.banner-link') as HTMLAnchorElement;
      
      if (bannerLink) {
        const url = new URL(bannerLink.href).pathname;
        const previewData = this.config.getLinkPreviewData(url);

        // Create PostCard-style preview overlay using existing classes
        // This structure mirrors PostCard.astro for visual consistency
        const previewOverlay = document.createElement('div');
        previewOverlay.className = 'banner-postcard-preview';
        previewOverlay.innerHTML = `
          <div class="card-base banner-preview-card">
            <div class="relative pt-4 pb-4 px-4 w-full">
              <!-- Title with PostCard styling - matches PostCard.astro link styling -->
              <div class="transition group w-full block font-bold mb-3 text-90 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] active:text-[var(--title-active)] dark:active:text-[var(--title-active)] text-xl flex items-center">
                <div class="meta-icon mr-3">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    ${this.config.getIconSVG(previewData.icon)}
                  </svg>
                </div>
                ${previewData.title}
              </div>

              <!-- URL metadata display (mirrors PostCard date/category display) -->
              <div class="text-black/30 dark:text-white/30 text-sm transition mb-4 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
                <span class="font-mono">${url}</span>
              </div>

              <!-- Description with PostCard styling - matches excerpt display -->
              <div class="transition text-75 mb-3.5 pr-4">
                ${previewData.description}
              </div>

              <!-- Call to action (mirrors word count display in PostCard) -->
              <div class="text-sm text-black/30 dark:text-white/30 transition">
                ${window.innerWidth <= 768 ? 'Tap to visit' : 'Click to visit'}
              </div>
            </div>
          </div>
        `;

        // Create enhanced hover overlay (darkening background for better readability)
        const hoverOverlay = document.createElement('div');
        hoverOverlay.className = 'banner-hover-overlay';

        // Create pause indicator using existing button styling (btn-regular class)
        const pauseIndicator = document.createElement('div');
        pauseIndicator.className = 'banner-pause-indicator btn-regular';
        pauseIndicator.innerHTML = `
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        `;

        // Insert overlays in proper z-index order
        bannerLink.appendChild(hoverOverlay);
        bannerLink.appendChild(previewOverlay);
        slideElement.appendChild(pauseIndicator);

        // Add mobile hint for clickable banners using existing icon styling
        // This helps mobile users understand the interaction model
        if (window.innerWidth <= 768) {
          const mobileHint = document.createElement('div');
          mobileHint.className = 'banner-mobile-hint btn-regular';
          mobileHint.innerHTML = `
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          `;
          slideElement.appendChild(mobileHint);
        }
      }
    });
  }

  /**
   * Setup interaction controls based on device type
   * Adapts UX patterns for desktop (hover) vs mobile (touch)
   */
  private setupInteractionControls(): void {
    if (window.innerWidth > 768) {
      this.setupDesktopHoverControls();
      console.log('Banner UX: Desktop hover controls enabled');
    } else {
      this.setupMobileTouchControls();
      console.log('Banner UX: Mobile touch controls enabled');
    }
  }

  /**
   * Desktop hover controls
   * Implements hover-to-pause behavior for better desktop UX
   */
  private setupDesktopHoverControls(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      const bannerLink = slideElement.querySelector('.banner-link') as HTMLAnchorElement;
      
      if (bannerLink) {
        bannerLink.addEventListener('mouseenter', () => {
          if (index === this.currentIndex) {
            this.pauseAnimation('hover');
          }
        });

        bannerLink.addEventListener('mouseleave', () => {
          if (index === this.currentIndex) {
            this.resumeAnimation('hover');
          }
        });
      }
    });
  }

  /**
   * Mobile touch controls
   * Implements tap-to-select, tap-again-to-navigate pattern for mobile
   */
  private setupMobileTouchControls(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      const bannerLink = slideElement.querySelector('.banner-link') as HTMLAnchorElement;
      
      if (bannerLink) {
        bannerLink.addEventListener('click', (e) => {
          if (index !== this.currentIndex) return;
          
          if (this.selectedBannerIndex === index) {
            console.log(`Mobile: Navigating to ${bannerLink.href}`);
            // Link will navigate naturally on second tap
          } else {
            e.preventDefault();
            this.selectBanner(index);
          }
        });
      }
    });

    // Deselect banner when clicking outside
    document.addEventListener('click', (e) => {
      const clickedElement = e.target as HTMLElement;
      const isInsideBanner = clickedElement.closest(`#${this.config.containerId}`);
      
      if (!isInsideBanner && this.selectedBannerIndex !== -1) {
        this.deselectBanner();
      }
    });
  }

  /**
   * Update interaction states for all slides
   * Manages which slide is interactive vs non-interactive
   */
  private updateInteractionStates(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      
      slideElement.classList.remove('banner-interactive', 'banner-non-interactive');
      
      if (index === this.currentIndex) {
        slideElement.classList.add('banner-interactive');
      } else {
        slideElement.classList.add('banner-non-interactive');
      }
    });
    
    // Debug logging for current slide state
    const currentSlide = this.bannerSlides[this.currentIndex] as HTMLElement;
    const bannerLink = currentSlide.querySelector('.banner-link') as HTMLAnchorElement;
    if (bannerLink) {
      console.log(`Banner: Active slide ${this.currentIndex} - Link: ${bannerLink.href}`);
    } else {
      console.log(`Banner: Active slide ${this.currentIndex} - No link (not clickable)`);
    }
  }

  /**
   * Pause animation with reason tracking
   * Supports multiple pause reasons to prevent conflicts
   */
  private pauseAnimation(reason: string): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.pauseReason = reason;
    
    if (this.animationTimeout) {
      clearInterval(this.animationTimeout);
      this.animationTimeout = 0;
    }
    
    if (this.bannerSlides) {
      const currentSlide = this.bannerSlides[this.currentIndex] as HTMLElement;
      currentSlide.classList.add('banner-paused');
    }
    
    console.log(`Banner animation: Paused (${reason})`);
  }

  /**
   * Resume animation with reason matching
   * Only resumes if the reason matches the original pause reason
   */
  private resumeAnimation(reason: string): void {
    if (!this.isPaused || this.pauseReason !== reason) return;
    
    this.isPaused = false;
    this.pauseReason = '';
    
    if (this.bannerSlides) {
      this.bannerSlides.forEach(slide => {
        (slide as HTMLElement).classList.remove('banner-paused');
      });
    }
    
    if (this.config.animationConfig.enabled) {
      this.animationTimeout = window.setInterval(() => this.animateToNextSlide(), this.config.animationConfig.interval);
      console.log(`Banner animation: Resumed (${reason})`);
    }
  }

  /**
   * Mobile banner selection
   * Handles first tap on mobile devices
   */
  private selectBanner(index: number): void {
    this.selectedBannerIndex = index;
    
    if (this.bannerSlides) {
      const slideElement = this.bannerSlides[index] as HTMLElement;
      slideElement.classList.add('banner-selected');
    }
    
    this.pauseAnimation('mobile-selection');
    console.log(`Mobile: Selected banner ${index}`);
  }

  /**
   * Mobile banner deselection
   * Handles tap outside or automatic deselection
   */
  private deselectBanner(): void {
    if (this.selectedBannerIndex === -1 || !this.bannerSlides) return;
    
    const slideElement = this.bannerSlides[this.selectedBannerIndex] as HTMLElement;
    slideElement.classList.remove('banner-selected');
    
    this.selectedBannerIndex = -1;
    this.resumeAnimation('mobile-selection');
    console.log('Mobile: Deselected banner');
  }

  /**
   * Smooth crossfade animation to next slide
   * Handles the core animation logic with proper timing and transitions
   */
  private animateToNextSlide(): void {
    if (this.isAnimating || this.isPaused || !this.bannerSlides) return;
    this.isAnimating = true;

    // Clear any mobile selection before transitioning
    if (this.selectedBannerIndex !== -1) {
      this.deselectBanner();
    }

    const currentSlide = this.bannerSlides[this.currentIndex] as HTMLElement;
    const nextIndex = (this.currentIndex + 1) % this.bannerSlides.length;
    const nextSlide = this.bannerSlides[nextIndex] as HTMLElement;

    console.log(`Banner: Transitioning from slide ${this.currentIndex} to ${nextIndex}`);

    const nextContent = nextSlide.querySelector('.banner-image, .banner-video') as HTMLImageElement | HTMLVideoElement;
    
    // Check if next content is ready (for images) or just proceed (for videos)
    if (nextContent && 'complete' in nextContent && !nextContent.complete) {
      nextContent.onload = () => this.executeTransition(currentSlide, nextSlide, nextIndex);
      nextContent.onerror = () => this.executeTransition(currentSlide, nextSlide, nextIndex);
    } else {
      this.executeTransition(currentSlide, nextSlide, nextIndex);
    }
  }

  /**
   * Execute the crossfade transition
   * Performs the actual opacity changes and state updates
   */
  private executeTransition(currentSlide: HTMLElement, nextSlide: HTMLElement, nextIndex: number): void {
    // Update interaction states first
    currentSlide.classList.remove('banner-paused', 'banner-interactive');
    currentSlide.classList.add('banner-non-interactive');
    
    // CROSSFADE: Start both transitions simultaneously for smooth effect
    currentSlide.style.opacity = '0';
    nextSlide.style.opacity = '1';
    
    // Update index and states after the transition completes
    setTimeout(() => {
      this.currentIndex = nextIndex;
      this.updateInteractionStates();
      this.isAnimating = false;
    }, this.config.animationConfig.transitionDuration);
  }

  /**
   * Start animation system
   * Initializes the timer-based animation loop
   */
  private startAnimation(): void {
    if (!this.config.animationConfig.enabled) {
      console.log('Banner animation: Animation disabled in config');
      return;
    }
    
    this.stopAnimation();
    
    if (!this.isPaused) {
      this.animationTimeout = window.setInterval(() => this.animateToNextSlide(), this.config.animationConfig.interval);
      console.log('Banner animation: Started enhanced UX');
    }
  }

  /**
   * Stop animation system
   * Clears the animation timer
   */
  private stopAnimation(): void {
    if (this.animationTimeout) {
      clearInterval(this.animationTimeout);
      this.animationTimeout = 0;
    }
  }

  /**
   * Setup visibility change handling
   * Pauses animation when tab is not visible for performance
   */
  private setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAnimation();
      } else if (!this.isPaused) {
        this.startAnimation();
      }
    });
  }

  /**
   * Expose global API for external control
   * Allows other scripts to control banner animation
   */
  private exposeGlobalAPI(): void {
    window.bannerAnimation = {
      start: () => this.startAnimation(),
      stop: () => this.stopAnimation(),
      next: () => this.animateToNextSlide(),
      pause: (reason = 'external') => this.pauseAnimation(reason),
      resume: (reason = 'external') => this.resumeAnimation(reason),
      isPaused: () => this.isPaused,
      getCurrentIndex: () => this.currentIndex,
      getCurrentLink: () => {
        if (!this.bannerSlides) return null;
        const currentSlide = this.bannerSlides[this.currentIndex] as HTMLElement;
        const bannerLink = currentSlide.querySelector('.banner-link') as HTMLAnchorElement;
        return bannerLink ? bannerLink.href : null;
      },
      selectBanner: (index: number) => this.selectBanner(index),
      deselectBanner: () => this.deselectBanner()
    };
  }

  /**
   * Public API methods
   * External interface for controlling banner animation
   */
  public start(): void {
    this.startAnimation();
  }

  public stop(): void {
    this.stopAnimation();
  }

  public pause(reason: string = 'external'): void {
    this.pauseAnimation(reason);
  }

  public resume(reason: string = 'external'): void {
    this.resumeAnimation(reason);
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }
}

/**
 * Convenience function to create and initialize banner animation
 * @param config - Banner animation configuration
 * @returns Banner animation controller instance
 */
export function createBannerAnimation(config: BannerAnimationControllerConfig): BannerAnimationController {
  const controller = new BannerAnimationController(config);
  return controller;
}

// Type declaration for global API
declare global {
  interface Window {
    bannerAnimation?: {
      start: () => void;
      stop: () => void;
      next: () => void;
      pause: (reason?: string) => void;
      resume: (reason?: string) => void;
      isPaused: () => boolean;
      getCurrentIndex: () => number;
      getCurrentLink: () => string | null;
      selectBanner: (index: number) => void;
      deselectBanner: () => void;
    };
  }
}