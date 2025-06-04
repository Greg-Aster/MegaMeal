/**
 * ===================================================================
 * BANNER ANIMATION UTILITY - FIXED VERSION WITH VIDEO LAZY LOADING
 * ===================================================================
 * 
 * This is a clean, fixed version that eliminates the infinite recursion
 * issue by using clear, distinct method names and proper encapsulation.
 * 
 * FIXES APPLIED:
 * - Renamed private method to avoid naming conflicts
 * - Fixed all method references to use correct names
 * - Cleaned up method signatures and implementations
 * - Added proper error handling and logging
 * 
 * FEATURES:
 * - Professional crossfade transitions
 * - PostCard-style link previews using existing site styling
 * - Mobile and desktop interaction handling
 * - Pause/resume functionality
 * - Mixed video and image content support
 * - Configuration-driven behavior
 * - Manual navigation controls with previous/next buttons
 * - Position indicator dots for direct navigation
 * - Keyboard navigation support
 * - Enhanced mobile touch controls
 * - **FIXED: Intelligent video lazy loading system**
 * - **FIXED: Preload next video while current plays**
 * - **FIXED: Video loading state management**
 * - **FIXED: Fallback handling for failed video loads**
 * 
 * ===================================================================
 */

import type { BannerAnimationConfig } from '@/config/banners/types'

/**
 * Configuration interface for banner animation controller
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
 * Video loading states for tracking video readiness
 */
enum VideoLoadingState {
  UNLOADED = 'unloaded',
  LOADING = 'loading', 
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * Video loading info for tracking individual video states
 */
interface VideoLoadingInfo {
  state: VideoLoadingState;
  element?: HTMLVideoElement;
  loadPromise?: Promise<void>;
  lastAccessed?: number;
}

/**
 * Banner Animation Controller Class with Video Lazy Loading
 * 
 * FIXED VERSION - All naming conflicts resolved
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
  
  // Manual navigation properties
  private isManualNavigation: boolean = false;
  private manualNavigationTimeout: number = 0;
  private manualNavigationDelay: number = 5000; // 5 seconds

  // Video lazy loading properties
  private videoLoadingInfo: Map<number, VideoLoadingInfo> = new Map();
  private preloadDistance: number = 1; // How many videos ahead to preload
  private maxLoadedVideos: number = 3; // Maximum videos to keep in memory
  private videoLoadTimeout: number = 10000; // 10 second timeout for video loading

  constructor(config: BannerAnimationControllerConfig) {
    this.config = config;
  }

  /**
   * ===================================================================
   * INITIALIZATION METHODS
   * ===================================================================
   */

  /**
   * Initialize the banner animation system
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

    console.log('Banner animation: Starting enhanced UX with video lazy loading', this.config.animationConfig);

    // Initialize all components in proper order
    this.initializeSlideOpacity();
    this.initializeVideoLazyLoading();
    this.createPostCardStylePreviews();
    this.setupInteractionControls();
    this.setupKeyboardNavigation();
    this.updateInteractionStates();
    this.setupVisibilityHandling();
    this.startAnimation();

    // Expose API to window for external control
    this.exposeGlobalAPI();

    return true;
  }

  /**
   * Initialize all slides with proper opacity
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
   * ===================================================================
   * VIDEO LAZY LOADING SYSTEM - FIXED IMPLEMENTATION
   * ===================================================================
   */

  /**
   * Initialize video lazy loading system
   */
  private initializeVideoLazyLoading(): void {
    if (!this.bannerSlides) return;

    // Initialize loading state for all slides
    this.bannerSlides.forEach((_, index) => {
      this.videoLoadingInfo.set(index, {
        state: VideoLoadingState.UNLOADED,
        lastAccessed: Date.now()
      });
    });

    // Load the current video immediately
    this.loadVideoAtIndex(this.currentIndex);
    
    // Preload the next video
    this.preloadNextVideo();

    console.log('Video lazy loading: Initialized for', this.bannerSlides.length, 'slides');
  }

  /**
   * FIXED: Check if slide contains a video element
   * Using a clear, distinct name to avoid any naming conflicts
   */
  private checkIfSlideContainsVideo(index: number): boolean {
    if (!this.bannerSlides || index < 0 || index >= this.bannerSlides.length) {
      return false;
    }
    
    const slide = this.bannerSlides[index] as HTMLElement;
    const hasVideo = !!slide.querySelector('.banner-video');
    
    return hasVideo;
  }

  /**
   * Load video at specific index
   */
  private async loadVideoAtIndex(index: number): Promise<void> {
    if (!this.bannerSlides || index < 0 || index >= this.bannerSlides.length) {
      return Promise.reject('Invalid video index');
    }

    const videoInfo = this.videoLoadingInfo.get(index);
    if (!videoInfo || videoInfo.state === VideoLoadingState.LOADED || videoInfo.state === VideoLoadingState.LOADING) {
      return Promise.resolve();
    }

    const slide = this.bannerSlides[index] as HTMLElement;
    const videoElement = slide.querySelector('.banner-video') as HTMLVideoElement;
    
    if (!videoElement) {
      // Not a video slide, mark as loaded
      this.videoLoadingInfo.set(index, {
        ...videoInfo,
        state: VideoLoadingState.LOADED,
        lastAccessed: Date.now()
      });
      return Promise.resolve();
    }

    // Check if this video uses lazy loading
    if (!this.checkIfSlideContainsVideo(index)) {
      return Promise.resolve();
    }

    console.log(`Video lazy loading: Starting load for video ${index}`);

    // Update state to loading
    this.videoLoadingInfo.set(index, {
      ...videoInfo,
      state: VideoLoadingState.LOADING,
      element: videoElement,
      lastAccessed: Date.now()
    });

    // Create loading promise with timeout
    const loadPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn(`Video lazy loading: Timeout loading video ${index}`);
        this.handleVideoLoadError(index);
        reject(new Error(`Video load timeout for index ${index}`));
      }, this.videoLoadTimeout);

      const onCanPlay = () => {
        clearTimeout(timeout);
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
        
        console.log(`Video lazy loading: Successfully loaded video ${index}`);
        this.videoLoadingInfo.set(index, {
          ...this.videoLoadingInfo.get(index)!,
          state: VideoLoadingState.LOADED,
          lastAccessed: Date.now()
        });
        resolve();
      };

      const onError = () => {
        clearTimeout(timeout);
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
        
        console.error(`Video lazy loading: Failed to load video ${index}`);
        this.handleVideoLoadError(index);
        reject(new Error(`Video load error for index ${index}`));
      };

      videoElement.addEventListener('canplay', onCanPlay, { once: true });
      videoElement.addEventListener('error', onError, { once: true });

      // Start loading the video
      if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
        onCanPlay();
      } else {
        videoElement.load();
      }
    });

    // Store the promise for potential cancellation
    this.videoLoadingInfo.set(index, {
      ...this.videoLoadingInfo.get(index)!,
      loadPromise
    });

    return loadPromise;
  }

  /**
   * Handle video loading error by falling back to image
   */
  private handleVideoLoadError(index: number): void {
    if (!this.bannerSlides) return;

    const slide = this.bannerSlides[index] as HTMLElement;
    const videoElement = slide.querySelector('.banner-video') as HTMLVideoElement;
    const imageElement = slide.querySelector('.banner-image') as HTMLImageElement;

    if (videoElement && imageElement) {
      // Hide video and show fallback image
      videoElement.style.display = 'none';
      imageElement.style.display = 'block';
      
      console.log(`Video lazy loading: Fallback to image for slide ${index}`);
      
      // Update loading state
      this.videoLoadingInfo.set(index, {
        ...this.videoLoadingInfo.get(index)!,
        state: VideoLoadingState.ERROR,
        lastAccessed: Date.now()
      });
    }
  }

  /**
   * Preload the next video in sequence
   */
  private preloadNextVideo(): void {
    if (!this.bannerSlides) return;

    const nextIndex = (this.currentIndex + 1) % this.bannerSlides.length;
    
    // Only preload if it's a video and not already loaded/loading
    if (this.checkIfSlideContainsVideo(nextIndex)) {
      const videoInfo = this.videoLoadingInfo.get(nextIndex);
      if (videoInfo && videoInfo.state === VideoLoadingState.UNLOADED) {
        console.log(`Video lazy loading: Preloading next video ${nextIndex}`);
        this.loadVideoAtIndex(nextIndex).catch(err => {
          console.warn('Failed to preload next video:', err);
        });
      }
    }
  }

  /**
   * Wait for video at index to be ready for playback
   */
  private async waitForVideoReady(index: number): Promise<void> {
    if (!this.checkIfSlideContainsVideo(index)) return Promise.resolve();

    const videoInfo = this.videoLoadingInfo.get(index);
    if (!videoInfo) return Promise.reject('No video info found');

    if (videoInfo.state === VideoLoadingState.LOADED) {
      return Promise.resolve();
    }

    if (videoInfo.state === VideoLoadingState.ERROR) {
      return Promise.reject('Video failed to load');
    }

    if (videoInfo.state === VideoLoadingState.LOADING && videoInfo.loadPromise) {
      return videoInfo.loadPromise;
    }

    // Start loading if not already started
    if (videoInfo.state === VideoLoadingState.UNLOADED) {
      return this.loadVideoAtIndex(index);
    }

    return Promise.reject('Unknown video state');
  }

  /**
   * Cleanup old videos to manage memory usage
   */
  private cleanupDistantVideos(): void {
    if (!this.bannerSlides) return;

    const now = Date.now();
    const cleanupThreshold = 30000; // 30 seconds

    this.videoLoadingInfo.forEach((info, index) => {
      // Don't cleanup current video or next video
      const nextIndex = (this.currentIndex + 1) % this.bannerSlides!.length;
      if (index === this.currentIndex || index === nextIndex) return;

      // Don't cleanup if recently accessed
      if (info.lastAccessed && (now - info.lastAccessed) < cleanupThreshold) return;

      // Count loaded videos
      const loadedCount = Array.from(this.videoLoadingInfo.values())
        .filter(v => v.state === VideoLoadingState.LOADED).length;

      if (loadedCount > this.maxLoadedVideos && info.state === VideoLoadingState.LOADED && info.element) {
        console.log(`Video lazy loading: Cleaning up distant video ${index}`);
        
        // Reset video element
        info.element.pause();
        info.element.currentTime = 0;
        info.element.src = '';
        
        // Update state
        this.videoLoadingInfo.set(index, {
          state: VideoLoadingState.UNLOADED,
          lastAccessed: now
        });
      }
    });
  }

  /**
   * ===================================================================
   * PREVIEW AND NAVIGATION CREATION METHODS
   * ===================================================================
   */

  /**
   * Create PostCard-style link preview overlays with navigation controls
   */
  private createPostCardStylePreviews(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      const bannerLink = slideElement.querySelector('.banner-link') as HTMLAnchorElement;
      
      if (bannerLink) {
        const url = new URL(bannerLink.href).pathname;
        const previewData = this.config.getLinkPreviewData(url);

        // Create PostCard-style preview overlay with navigation controls and loading indicator
        const previewOverlay = document.createElement('div');
        previewOverlay.className = 'banner-postcard-preview';
        previewOverlay.innerHTML = `
          <!-- Navigation Controls -->
          <div class="banner-navigation-controls">
            <button 
              class="banner-nav-btn banner-nav-prev" 
              data-direction="prev"
              aria-label="Previous banner item"
              title="Previous"
            >
              <svg class="banner-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            
            <button 
              class="banner-nav-btn banner-nav-next" 
              data-direction="next"
              aria-label="Next banner item"
              title="Next"
            >
              <svg class="banner-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>

          <!-- Video Loading Indicator -->
          <div class="banner-loading-indicator" style="display: none;">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading video...</span>
          </div>

          <!-- PostCard-style content -->
          <div class="card-base banner-preview-card">
            <div class="relative pt-4 pb-4 px-4 w-full">
              <div class="transition group w-full block font-bold mb-3 text-90 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] active:text-[var(--title-active)] dark:active:text-[var(--title-active)] text-xl flex items-center">
                <div class="meta-icon mr-3">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    ${this.config.getIconSVG(previewData.icon)}
                  </svg>
                </div>
                ${previewData.title}
              </div>

              <div class="text-black/30 dark:text-white/30 text-sm transition mb-4 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
                <span class="font-mono">${url}</span>
              </div>

              <div class="transition text-75 mb-3.5 pr-4">
                ${previewData.description}
                ${this.checkIfSlideContainsVideo(index) ? '<br><small class="text-sm opacity-60"></small>' : ''}
              </div>

              <div class="text-sm text-black/30 dark:text-white/30 transition">
                ${window.innerWidth <= 768 ? 'Tap to visit' : 'Click to visit'}
              </div>
            </div>
          </div>

          <!-- Position Indicator -->
          <div class="banner-position-indicator">
            ${this.createPositionIndicators(index)}
          </div>
        `;

        // Create enhanced hover overlay
        const hoverOverlay = document.createElement('div');
        hoverOverlay.className = 'banner-hover-overlay';

        // Create pause indicator
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

        // Add mobile hint for clickable banners
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

        // Setup navigation button event listeners
        this.setupNavigationButtonListeners(previewOverlay);
      }
    });
  }

  /**
   * Create position indicator dots
   */
  private createPositionIndicators(currentIndex: number): string {
    if (!this.bannerSlides) return '';
    
    return Array.from({length: this.bannerSlides.length}, (_, i) => 
      `<div class="banner-position-dot ${i === currentIndex ? 'active' : ''}" data-index="${i}"></div>`
    ).join('');
  }

  /**
   * Show loading indicator for a slide
   */
  private showLoadingIndicator(index: number): void {
    if (!this.bannerSlides) return;

    const slide = this.bannerSlides[index] as HTMLElement;
    const loadingIndicator = slide.querySelector('.banner-loading-indicator') as HTMLElement;
    
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }
  }

  /**
   * Hide loading indicator for a slide
   */
  private hideLoadingIndicator(index: number): void {
    if (!this.bannerSlides) return;

    const slide = this.bannerSlides[index] as HTMLElement;
    const loadingIndicator = slide.querySelector('.banner-loading-indicator') as HTMLElement;
    
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }

  /**
   * ===================================================================
   * NAVIGATION EVENT HANDLING METHODS
   * ===================================================================
   */

  /**
   * Setup navigation button event listeners
   */
  private setupNavigationButtonListeners(previewOverlay: HTMLElement): void {
    const prevBtn = previewOverlay.querySelector('.banner-nav-prev') as HTMLButtonElement;
    const nextBtn = previewOverlay.querySelector('.banner-nav-next') as HTMLButtonElement;

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleNavigateToPrevious();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleNavigateToNext();
      });
    }

    // Position indicator event listeners
    const positionDots = previewOverlay.querySelectorAll('.banner-position-dot');
    positionDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetIndex = parseInt((dot as HTMLElement).dataset.index || '0');
        this.handleNavigateToIndex(targetIndex);
      });
    });
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      const focusedBanner = document.querySelector('.banner-slide.banner-selected, .banner-slide:focus-within');
      if (!focusedBanner) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.handleNavigateToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.handleNavigateToNext();
          break;
        case 'Home':
          e.preventDefault();
          this.handleNavigateToIndex(0);
          break;
        case 'End':
          e.preventDefault();
          this.handleNavigateToIndex(this.bannerSlides ? this.bannerSlides.length - 1 : 0);
          break;
      }
    });
  }

  /**
   * ===================================================================
   * NAVIGATION LOGIC METHODS
   * ===================================================================
   */

  /**
   * Handle navigation to previous banner item
   */
  private handleNavigateToPrevious(): void {
    if (!this.bannerSlides) return;
    const newIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.bannerSlides.length - 1;
    this.handleNavigateToIndex(newIndex);
  }

  /**
   * Handle navigation to next banner item
   */
  private handleNavigateToNext(): void {
    if (!this.bannerSlides) return;
    const newIndex = this.currentIndex < this.bannerSlides.length - 1 ? this.currentIndex + 1 : 0;
    this.handleNavigateToIndex(newIndex);
  }

  /**
   * Handle navigation to specific banner index with video loading
   */
  private async handleNavigateToIndex(targetIndex: number): Promise<void> {
    if (!this.bannerSlides || targetIndex < 0 || targetIndex >= this.bannerSlides.length || targetIndex === this.currentIndex) {
      return;
    }

    console.log(`Manual navigation: Moving from ${this.currentIndex} to ${targetIndex}`);

    // Set manual navigation flag
    this.isManualNavigation = true;

    // Pause automatic cycling
    this.pauseAnimation('manual-navigation');

    // Show loading indicator if target is a video that's not ready
    if (this.checkIfSlideContainsVideo(targetIndex)) {
      const videoInfo = this.videoLoadingInfo.get(targetIndex);
      if (videoInfo && videoInfo.state !== VideoLoadingState.LOADED) {
        this.showLoadingIndicator(targetIndex);
      }
    }

    try {
      // Wait for target video to be ready
      await this.waitForVideoReady(targetIndex);
      this.hideLoadingIndicator(targetIndex);

      // Perform the transition
      const currentSlide = this.bannerSlides[this.currentIndex] as HTMLElement;
      const targetSlide = this.bannerSlides[targetIndex] as HTMLElement;

      this.executeTransition(currentSlide, targetSlide, targetIndex);

      // Update position indicators
      this.updatePositionIndicators();

      // Schedule automatic resume
      this.scheduleAutomaticResume();

      // Announce change for screen readers
      this.announceNavigationChange(targetIndex);

      // Preload next video after transition
      this.preloadNextVideo();

      // Cleanup distant videos
      this.cleanupDistantVideos();

    } catch (error) {
      console.error('Failed to navigate to video:', error);
      this.hideLoadingIndicator(targetIndex);
      
      // Fall back to showing the slide anyway (might show fallback image)
      const currentSlide = this.bannerSlides[this.currentIndex] as HTMLElement;
      const targetSlide = this.bannerSlides[targetIndex] as HTMLElement;
      this.executeTransition(currentSlide, targetSlide, targetIndex);
      this.updatePositionIndicators();
      this.scheduleAutomaticResume();
    }
  }

  /**
   * Update position indicators across all slides
   */
  private updatePositionIndicators(): void {
    if (!this.bannerSlides) return;

    this.bannerSlides.forEach((slide) => {
      const indicators = slide.querySelectorAll('.banner-position-dot');
      indicators.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentIndex);
      });
    });
  }

  /**
   * Schedule automatic cycling resume after manual navigation
   */
  private scheduleAutomaticResume(): void {
    // Clear any existing timeout
    if (this.manualNavigationTimeout) {
      clearTimeout(this.manualNavigationTimeout);
    }

    // Resume automatic cycling after delay
    this.manualNavigationTimeout = window.setTimeout(() => {
      this.isManualNavigation = false;
      this.resumeAnimation('manual-navigation');
      console.log('Manual navigation timeout: Resuming automatic cycling');
    }, this.manualNavigationDelay);
  }

  /**
   * Announce navigation change for screen readers
   */
  private announceNavigationChange(index: number): void {
    if (!this.bannerSlides) return;

    const currentSlide = this.bannerSlides[index] as HTMLElement;
    const bannerLink = currentSlide.querySelector('.banner-link') as HTMLAnchorElement;
    
    let message = `Banner ${index + 1} of ${this.bannerSlides.length}`;
    if (bannerLink) {
      const url = new URL(bannerLink.href).pathname;
      const previewData = this.config.getLinkPreviewData(url);
      message += `: ${previewData.title || 'Banner item'}`;
    }
    
    // Add video/image indicator
    if (this.checkIfSlideContainsVideo(index)) {
      message += ' (Video)';
    }
    
    // Create or update screen reader announcement
    let announcer = document.getElementById('banner-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'banner-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(announcer);
    }
    
    announcer.textContent = message;
  }

  /**
   * ===================================================================
   * INTERACTION CONTROL METHODS
   * ===================================================================
   */

  /**
   * Setup interaction controls based on device type
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
          if (index === this.currentIndex && !this.isManualNavigation) {
            this.resumeAnimation('hover');
          }
        });
      }
    });
  }

  /**
   * Mobile touch controls
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
    
    // Update position indicators when interaction states change
    this.updatePositionIndicators();
    
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
   * ===================================================================
   * ANIMATION CONTROL METHODS
   * ===================================================================
   */

  /**
   * Pause animation with reason tracking
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
   * Smooth crossfade animation to next slide with video loading
   */
  private async animateToNextSlide(): Promise<void> {
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

    try {
      // Show loading indicator if next slide is a video that's not ready
      if (this.checkIfSlideContainsVideo(nextIndex)) {
        const videoInfo = this.videoLoadingInfo.get(nextIndex);
        if (videoInfo && videoInfo.state !== VideoLoadingState.LOADED) {
          this.showLoadingIndicator(nextIndex);
        }
      }

      // Wait for next content to be ready
      await this.waitForVideoReady(nextIndex);
      this.hideLoadingIndicator(nextIndex);

      // Execute the transition
      this.executeTransition(currentSlide, nextSlide, nextIndex);

      // Preload the next video after transition
      this.preloadNextVideo();

      // Cleanup distant videos
      this.cleanupDistantVideos();

    } catch (error) {
      console.error('Failed to load next video, falling back to image:', error);
      this.hideLoadingIndicator(nextIndex);
      
      // Continue with transition anyway (fallback image will show)
      this.executeTransition(currentSlide, nextSlide, nextIndex);
    }
  }

  /**
   * Execute the crossfade transition
   */
  private executeTransition(currentSlide: HTMLElement, nextSlide: HTMLElement, nextIndex: number): void {
    // Update interaction states first
    currentSlide.classList.remove('banner-paused', 'banner-interactive');
    currentSlide.classList.add('banner-non-interactive');
    
    // CROSSFADE: Start both transitions simultaneously for smooth effect
    currentSlide.style.opacity = '0';
    nextSlide.style.opacity = '1';
    
    // If next slide is a video, start playing it
    if (this.checkIfSlideContainsVideo(nextIndex)) {
      const videoElement = nextSlide.querySelector('.banner-video') as HTMLVideoElement;
      if (videoElement && this.videoLoadingInfo.get(nextIndex)?.state === VideoLoadingState.LOADED) {
        videoElement.currentTime = 0;
        videoElement.play().catch(err => {
          console.warn('Failed to play video:', err);
        });
      }
    }
    
    // Update index and states after the transition completes
    setTimeout(() => {
      this.currentIndex = nextIndex;
      this.updateInteractionStates();
      this.isAnimating = false;
    }, this.config.animationConfig.transitionDuration);
  }

  /**
   * Start animation system
   */
  private startAnimation(): void {
    if (!this.config.animationConfig.enabled) {
      console.log('Banner animation: Animation disabled in config');
      return;
    }
    
    this.stopAnimation();
    
    if (!this.isPaused) {
      this.animationTimeout = window.setInterval(() => this.animateToNextSlide(), this.config.animationConfig.interval);
      console.log('Banner animation: Started enhanced UX with video lazy loading');
    }
  }

  /**
   * Stop animation system
   */
  private stopAnimation(): void {
    if (this.animationTimeout) {
      clearInterval(this.animationTimeout);
      this.animationTimeout = 0;
    }
    
    if (this.manualNavigationTimeout) {
      clearTimeout(this.manualNavigationTimeout);
      this.manualNavigationTimeout = 0;
    }
  }

  /**
   * Setup visibility change handling
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
   * ===================================================================
   * GLOBAL API METHODS - FIXED
   * ===================================================================
   */

  /**
   * Expose global API for external control
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
      deselectBanner: () => this.deselectBanner(),
      // Manual navigation methods
      navigateToIndex: (index: number) => this.handleNavigateToIndex(index),
      navigateToPrevious: () => this.handleNavigateToPrevious(),
      navigateToNext: () => this.handleNavigateToNext(),
      setCurrentIndex: (index: number) => {
        this.handleNavigateToIndex(index);
      },
      getTotalSlides: () => this.bannerSlides ? this.bannerSlides.length : 0,
      isManuallyNavigating: () => this.isManualNavigation,
      // FIXED: Video loading API - uses correct private method
      getVideoLoadingState: (index: number) => {
        const info = this.videoLoadingInfo.get(index);
        return info ? info.state : VideoLoadingState.UNLOADED;
      },
      preloadVideo: (index: number) => this.loadVideoAtIndex(index),
      isVideoSlide: (index: number) => this.checkIfSlideContainsVideo(index),
      getLoadedVideoCount: () => {
        return Array.from(this.videoLoadingInfo.values())
          .filter(info => info.state === VideoLoadingState.LOADED).length;
      }
    };
  }

  /**
   * ===================================================================
   * PUBLIC API METHODS - FIXED
   * ===================================================================
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

  public navigateToIndex(index: number): void {
    this.handleNavigateToIndex(index);
  }

  public navigateToPrevious(): void {
    this.handleNavigateToPrevious();
  }

  public navigateToNext(): void {
    this.handleNavigateToNext();
  }

  public getTotalSlides(): number {
    return this.bannerSlides ? this.bannerSlides.length : 0;
  }

  public isManuallyNavigating(): boolean {
    return this.isManualNavigation;
  }

  // FIXED: Video loading public methods
  public async preloadVideo(index: number): Promise<void> {
    return this.loadVideoAtIndex(index);
  }

  public getVideoLoadingState(index: number): VideoLoadingState {
    const info = this.videoLoadingInfo.get(index);
    return info ? info.state : VideoLoadingState.UNLOADED;
  }

  public isVideoSlide(index: number): boolean {
    return this.checkIfSlideContainsVideo(index);
  }

  public getLoadedVideoCount(): number {
    return Array.from(this.videoLoadingInfo.values())
      .filter(info => info.state === VideoLoadingState.LOADED).length;
  }
}

/**
 * ===================================================================
 * UTILITY FUNCTIONS
 * ===================================================================
 */

/**
 * Convenience function to create and initialize banner animation
 */
export function createBannerAnimation(config: BannerAnimationControllerConfig): BannerAnimationController {
  const controller = new BannerAnimationController(config);
  return controller;
}

/**
 * ===================================================================
 * TYPE DECLARATIONS
 * ===================================================================
 */

// Export video loading state enum
export { VideoLoadingState };

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
      navigateToIndex: (index: number) => void;
      navigateToPrevious: () => void;
      navigateToNext: () => void;
      setCurrentIndex: (index: number) => void;
      getTotalSlides: () => number;
      isManuallyNavigating: () => boolean;
      getVideoLoadingState: (index: number) => VideoLoadingState;
      preloadVideo: (index: number) => Promise<void>;
      isVideoSlide: (index: number) => boolean;
      getLoadedVideoCount: () => number;
    };
  }
}