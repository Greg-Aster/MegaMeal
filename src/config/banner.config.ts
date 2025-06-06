/**
 * ===================================================================
 * BANNER CONFIGURATION FILE - SINGLE SOURCE OF TRUTH
 * ===================================================================
 * 
 * This file centralizes ALL banner-related configuration and logic for the site.
 * It supports multiple banner types and handles their display logic by importing
 * modular configuration files from /config/banners/.
 * 
 * BANNER TYPES SUPPORTED:
 * - 'standard': Animated cycling through multiple images
 * - 'video': YouTube video embeds
 * - 'image': Static single images  
 * - 'timeline': Interactive timeline displays
 * - 'assistant': AI assistant (Bleepy) interactive banners
 * - 'none': No banner display
 * 
 * MAIN FUNCTIONS:
 * - Defines banner animation settings (timing, transitions, direction)
 * - Manages layout dimensions for different screen sizes
 * - Provides helper functions for type checking and positioning
 * - Centralizes visual styling options (overlays, borders, etc.)
 * - Handles banner type determination logic
 * - Manages link preview data for interactive banners
 * 
 * ARCHITECTURE:
 * - Individual banner types are configured in /config/banners/*.ts
 * - This file imports and combines all banner configurations
 * - Type definitions are centralized in /config/banners/types.ts
 * - Each banner type has its own validation and helper functions
 * 
 * USAGE:
 * - Import functions like getPanelTopPosition(), getBannerAnimationSettings()
 * - Use type guards like isVideoBannerData() for safe type checking
 * - Use determineBannerConfiguration() for complete banner setup
 * - Modify bannerConfig object to change site-wide banner behavior
 * 
 * MAINTENANCE NOTES:
 * - When adding new banner types, create new file in /config/banners/
 * - Update BannerType union in types.ts for new banner types
 * - Add new banner type configurations to this main config object
 * - Import and integrate new banner configurations here
 * ===================================================================
 */

// =====================================================================
// IMPORTS - BANNER TYPE CONFIGURATIONS
// =====================================================================

// Import shared types
import type {
  BannerType,
  BannerData,
  ImageBannerData, // Added ImageBannerData
  BannerDeterminationResult,
  PostBannerData,
  LinkPreviewInfo,
  BannerAnimationConfig,
  BannerLayoutConfig,
  BannerVisualConfig,
  BannerFallbackConfig,
  BannerNavbarConfig,
  BannerPanelConfig,
  BannerParallaxConfig
} from './banners/types'

// Import banner type configurations
import { standardBannerConfig } from './banners/standard'
import { videoBannerConfig } from './banners/video'
import { imageBannerConfig } from './banners/image'
import { timelineBannerConfig } from './banners/timeline'
import { assistantBannerConfig } from './banners/assistant'
import { noneBannerConfig } from './banners/none'

// Import type guards for re-export
import { isVideoBannerData } from './banners/video'
import { isImageBannerData } from './banners/image'
import { isTimelineBannerData } from './banners/timeline'
import { isAssistantBannerData } from './banners/assistant'
import { isNoneBannerData } from './banners/none'

// Import type for Astro image metadata
import type { ImageMetadata } from 'astro'

// =====================================================================
// MAIN BANNER CONFIGURATION INTERFACE
// =====================================================================

/**
 * Main banner configuration interface
 * Combines all banner type configurations into unified config object
 */
export interface BannerConfig {
  // Default banner type for main pages
  defaultBannerType: BannerType;
  
  // Default banner data (differs based on banner type) - automatically set
  defaultBannerData: BannerData;
  
  // Type-specific configurations - imported from modular files
  standardBannerConfig: typeof standardBannerConfig;
  videoBannerConfig: typeof videoBannerConfig;
  imageBannerConfig: typeof imageBannerConfig;
  timelineBannerConfig: typeof timelineBannerConfig;
  assistantBannerConfig: typeof assistantBannerConfig;
  noneBannerConfig: typeof noneBannerConfig;
  
  // Layout settings
  layout: BannerLayoutConfig;
  
  // Visual settings
  visual: BannerVisualConfig;
  
  // Fallback settings (used if images fail to load)
  fallback: BannerFallbackConfig;
  
  // Navbar configuration
  navbar: BannerNavbarConfig;

  // Panel positioning (previously calculated in MainGridLayout.astro)
  panel: BannerPanelConfig;

  // Parallax effect settings
  parallax: BannerParallaxConfig;

  // Navigation settings
  navigation?: { // Make optional if not all configs will have it immediately
    enabled: boolean;
    showPositionIndicator: boolean;
    showBannerTitles: boolean;
    autoResumeDelay: number;
    keyboardNavigation: boolean;
    enabledForTypes: BannerType[];
    styling?: {
      buttonSize?: { desktop: string; mobile: string };
      indicatorSize?: { desktop: string; mobile: string };
      animationDuration?: string;
    };
  };
}

/**
 * ===================================================================
 * MAIN BANNER CONFIGURATION OBJECT
 * ===================================================================
 * 
 * This object controls ALL banner behavior for the site by combining
 * configurations from modular banner type files.
 * 
 * KEY SETTINGS TO MODIFY:
 * - defaultBannerType: Change this to set what banner type appears on main pages
 * - Individual banner configurations: Modify files in /config/banners/
 * - Layout settings: Adjust banner dimensions and positioning
 * - Visual settings: Control banner appearance and effects
 * 
 * BANNER TYPE CONFIGURATIONS:
 * - Standard banners: Edit /config/banners/standard.ts
 * - Video banners: Edit /config/banners/video.ts
 * - Image banners: Edit /config/banners/image.ts
 * - Timeline banners: Edit /config/banners/timeline.ts
 * - Assistant banners: Edit /config/banners/assistant.ts
 * ===================================================================
 */
export const bannerConfig: BannerConfig = {
  // =================================================================
  // BANNER TYPE CONFIGURATION - CHANGE THIS TO SWITCH BANNER TYPES
  // =================================================================
  // MAIN CONTROL: Change this value to switch the entire site's banner type
  defaultBannerType: 'standard', // 'standard' | 'timeline' | 'video' | 'image' | 'assistant' | 'none'
  
  // =================================================================
  // DEFAULT BANNER DATA - AUTOMATICALLY MATCHES THE TYPE ABOVE
  // =================================================================
  // This will automatically use the correct data structure based on defaultBannerType
  // DO NOT MANUALLY EDIT - This is calculated automatically below
  defaultBannerData: {} as any, // This gets set correctly below based on defaultBannerType
  
  // =================================================================
  // BANNER TYPE-SPECIFIC CONFIGURATIONS - IMPORTED FROM MODULAR FILES
  // =================================================================
  // Each banner type is configured in its own file for better organization
  
  standardBannerConfig,    // From /config/banners/standard.ts
  videoBannerConfig,       // From /config/banners/video.ts
  imageBannerConfig,       // From /config/banners/image.ts
  timelineBannerConfig,    // From /config/banners/timeline.ts
  assistantBannerConfig,   // From /config/banners/assistant.ts
  noneBannerConfig,        // From /config/banners/none.ts
  
  // =================================================================
  // LAYOUT AND SIZING CONFIGURATION - ALL BANNER DIMENSIONS
  // =================================================================
  /*
  For a standard banner on desktop with these settings:
  1. Banner height: 60vh
  2. Panel top position: 60vh - 8rem = (60vh - 8rem)
  3. Main content offset: +1.5rem additional spacing

  Result: Main panel starts at (60vh - 8rem), then content has 1.5rem gap

  For other pages (video, image, etc):
  - They use fixed overlap values (2-3rem) for better readability
  - Not affected by the overlap setting in layout

  To adjust:
  - For DEFAULT page overlap: Change layout.overlap values
  - For OTHER pages overlap: Change the calculations in panel.top
  - For additional spacing: Change mainContentOffset (keep positive!)
  */
  layout: {
    height: {
      desktop: '60vh',             // Banner height on desktop - ADJUST to change banner size
      mobile: '40vh'               // Banner height on mobile - ADJUST for mobile experience
    },
    overlap: {
      desktop: '2rem',             // How much content overlaps banner on desktop - ADJUST FOR MAIN CONTENT POSITIONING
      mobile: '1rem'               // How much content overlaps banner on mobile - ADJUST FOR MAIN CONTENT POSITIONING
    },
    maxWidth: 3840,                // Maximum banner width in pixels
    noneBannerPlaceholderHeight: '3.5rem', // Height when no banner is used
    
    // MAIN CONTENT POSITIONING - Controls where your main content appears relative to banners
    mainContentOffset: {
      desktop: '2rem',           // Space between banner and main content on desktop
      mobile: ' 1rem'               // Space between banner and main content on mobile
    },

    // PAGE-SPECIFIC OVERLAPS - Controls overlap for different page types
    pageOverlaps: {
      home: {
        desktop: '10rem',            // Large overlap for visual impact on home
        mobile: '5rem'
      },
      post: {
        desktop: '3rem',             // Minimal overlap for readability
        mobile: '2rem'
      },
      archive: {
        desktop: '5rem',             // Medium overlap for archive pages
        mobile: '3rem'
      },
      about: {
        desktop: '4rem',             // Subtle overlap for about page
        mobile: '2.5rem'
      }
    }
  },
  
  // =================================================================
  // VISUAL STYLING CONFIGURATION
  // =================================================================
  visual: {
    objectFit: 'cover',            // How images fit in banner: 'cover', 'contain', or 'fill'
    objectPosition: 'center',      // Image position: 'center', 'top', 'bottom', etc.
    applyGradientOverlay: true,    // Enable overlay for better text readability
    gradientOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
    borderRadius: '0.5rem'         // Border radius for banner corners
  },
  
  // =================================================================
  // FALLBACK CONFIGURATION (when images fail to load)
  // =================================================================
  fallback: {
    enabled: true,
    type: 'gradient',              // 'color' or 'gradient'
    value: 'linear-gradient(135deg, oklch(0.6 0.2 var(--hue)), oklch(0.4 0.3 var(--hue)))'
  },

  // =================================================================
  // NAVBAR CONFIGURATION
  // =================================================================
  // this navbar heigh cascades down to the panel positioning
  navbar: {
    height: {
      desktop: '4.5rem',          // 72px at 16px base font size
      mobile: '3.5rem'            // 56px at 16px base font size
    },
    spacing: {
      standard: "0",                 // Standard banners flow naturally from navbar
      timeline: "5.5rem",           // Timeline banners need extra space
      video: "5.5rem",              // Video banners need extra space  
      image: "0",                   // Image banners flow naturally
      assistant: "5.5rem",          // Assistant banners need extra space
      none: "3.5rem",                  // No banner = no extra spacing
    }
  },

  // =================================================================
  // PANEL POSITIONING CONFIGURATION  
  // =================================================================
  // Controls where the main content panel appears relative to different banner types
  // there was an dynamic option here that has been removed as it was not funcional - "calc(var(--banner-height) - var(--dynamic-overlap, 3rem))",
  panel: {
    top: {
      video: "-0.5rem",
      image: "-0.5rem",
      timeline: "7rem", // Simplified - no dynamic variable
      assistant: "-0.5rem",
      standard: "-6.5rem",
      none: "-40rem" // No banner = no extra spacing,
    }
  },

  // =================================================================
  // PARALLAX EFFECT CONFIGURATION
  // =================================================================
  // Controls the background parallax scrolling effect (if enabled in site config)
  parallax: {
    enabled: true,                // Enable/disable parallax effect
    scrollFactor: -0.02,          // How much background moves (-0.02 = 2% opposite of scroll)
    easingFactor: 0.1             // Smooth motion factor (0.1 = 10% of gap each frame)
  },
  
  // =================================================================
  // OPTIONAL: NAVIGATION CONFIGURATION
  // =================================================================
  // Add these optional settings to control navigation behavior
  // The system works great with defaults, but you can customize:
  
  navigation: {
    /** Enable/disable manual navigation controls */
    enabled: true,
    
    /** Show position indicator dots */
    showPositionIndicator: true,
    
    /** Show banner titles in preview overlay */
    showBannerTitles: true,
    
    /** Auto-resume delay after manual navigation (milliseconds) */
    autoResumeDelay: 5000, // 5 seconds
    
    /** Enable keyboard navigation (arrow keys, Home, End) */
    keyboardNavigation: true,
    
    /** Enable navigation for specific banner types */
    enabledForTypes: ['standard', 'image', 'video'] as BannerType[],
    
    /** Custom navigation button styling (optional) */
    styling: {
      buttonSize: {
        desktop: '3rem',
        mobile: '2.5rem'
      },
      indicatorSize: {
        desktop: '0.5rem', 
        mobile: '0.375rem'
      },
      animationDuration: '0.3s'
    }
  },
}

// =================================================================
// AUTOMATIC CONFIGURATION SETUP
// =================================================================
// This automatically sets the correct defaultBannerData based on defaultBannerType
// DO NOT MODIFY - This ensures type safety and correct configuration

// Set the correct defaultBannerData based on the defaultBannerType
switch (bannerConfig.defaultBannerType) {
  case 'timeline':
    bannerConfig.defaultBannerData = bannerConfig.timelineBannerConfig.data;
    break;
  case 'video':
    bannerConfig.defaultBannerData = bannerConfig.videoBannerConfig.data;
    break;
  case 'image':
    bannerConfig.defaultBannerData = bannerConfig.imageBannerConfig.data;
    break;
  case 'assistant':
    bannerConfig.defaultBannerData = bannerConfig.assistantBannerConfig.data;
    break;
  case 'none':
    bannerConfig.defaultBannerData = bannerConfig.noneBannerConfig.data;
    break;
  case 'standard':
  default:
    bannerConfig.defaultBannerData = bannerConfig.standardBannerConfig.data;
    break;
}

// =====================================================================
// HELPER FUNCTIONS FOR BANNER CONFIGURATION
// =====================================================================
// These functions provide safe access to banner configuration values
// and help with responsive design and type safety

  /**
   * Extract banner-related data from post object
   * Centralizes post data extraction to avoid repetition
   * 
   * @param post - The post object from Astro
   * @returns Extracted banner data or null if no post
   */
  /**
   * Check if fullscreen mode is currently active
   * This function checks localStorage for the fullscreen banner override setting
   * 
   * @returns True if fullscreen mode is active (banner should be hidden)
   */
  export function isFullscreenModeActive(): boolean {
    // Check if we're in a browser environment (not during SSR)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    
    // Check if fullscreen banner override is active
    const fullscreenOverride = localStorage.getItem('fullscreenBannerOverride');
    return fullscreenOverride === 'true';
  }

  /**
   * Extract banner-related data from post object
   * Centralizes post data extraction to avoid repetition
   * 
   * @param post - The post object from Astro
   * @returns Extracted banner data or null if no post
   */
  export function getBannerDataFromPost(post: any): PostBannerData | null {
    if (!post?.data) return null;
  
  return {
    bannerLink: post.data.bannerLink || '',
    customAvatar: post.data.avatarImage || '',
    customName: post.data.authorName || '',
    customBio: post.data.authorBio || '',
    slug: post.slug || '',
    wantsNoDefaultBanner: post.data.showImageOnPost === false
  };
}

/**
 * Determine which banner type should be displayed
 * Handles logic for post-specific banners vs site default banners
 * 
 * @param post - The post object from Astro
 * @param postData - Extracted post banner data
 * @returns Object with banner type flags and current banner type
 */
export function determineBannerType(post: any, postData: PostBannerData | null): BannerDeterminationResult {
  // Check for post-specific banner types first
  const hasPostTimelineBanner = post?.data?.bannerType === "timeline" && post?.data?.bannerData?.category;
  const hasPostVideoBanner = post?.data?.bannerType === "video" && post?.data?.bannerData?.videoId;
  const hasPostAssistantBanner = post?.data?.bannerType === "assistant";
  const hasPostImageBanner = !postData?.wantsNoDefaultBanner && 
    (post?.data?.image || (post?.data?.bannerType === "image" && post?.data?.bannerData?.imageUrl)) && 
    !hasPostVideoBanner && !hasPostTimelineBanner && !hasPostAssistantBanner;
  
  const hasPostBanner = hasPostVideoBanner || hasPostImageBanner || hasPostTimelineBanner || hasPostAssistantBanner;

  // Determine default banner types for non-post pages (uses banner.config.ts settings)
  const useDefaultVideo = !hasPostBanner && !postData?.wantsNoDefaultBanner && 
    bannerConfig.defaultBannerType === 'video' && isVideoBannerData(bannerConfig.defaultBannerData);
  const useDefaultImage = !hasPostBanner && !postData?.wantsNoDefaultBanner && 
    bannerConfig.defaultBannerType === 'image' && isImageBannerData(bannerConfig.defaultBannerData);
  const useDefaultTimeline = !hasPostBanner && !postData?.wantsNoDefaultBanner && 
    bannerConfig.defaultBannerType === 'timeline' && isTimelineBannerData(bannerConfig.defaultBannerData);
  const useDefaultAssistant = !hasPostBanner && !postData?.wantsNoDefaultBanner && 
    bannerConfig.defaultBannerType === 'assistant' && isAssistantBannerData(bannerConfig.defaultBannerData);
  const useDefaultStandard = !hasPostBanner && !postData?.wantsNoDefaultBanner && 
    (bannerConfig.defaultBannerType === 'standard' || 
     (!useDefaultVideo && !useDefaultImage && !useDefaultTimeline && !useDefaultAssistant));

  const hasTimelineBanner = hasPostTimelineBanner || useDefaultTimeline;
  const hasVideoBanner = hasPostVideoBanner || useDefaultVideo;
  const hasImageBanner = hasPostImageBanner || useDefaultImage;
  const hasAssistantBanner = hasPostAssistantBanner || useDefaultAssistant;
  const hasStandardBanner = useDefaultStandard;

  // Determine current banner type string
  const currentBannerType: BannerType = hasVideoBanner ? 'video'
    : hasImageBanner ? 'image'
    : hasTimelineBanner ? 'timeline'
    : hasAssistantBanner ? 'assistant'
    : hasStandardBanner ? 'standard'
    : 'none';

  return {
    hasTimelineBanner,
    hasVideoBanner,
    hasImageBanner,
    hasAssistantBanner,
    hasStandardBanner,
    hasPostBanner,
    isStandardPage: !hasPostBanner,
    currentBannerType
  };
}

/**
 * Get banner data sources based on determined banner type
 * Handles both post-specific and default banner data
 * 
 * @param bannerType - The determined banner type result
 * @param post - The post object from Astro
 * @returns Object with banner data for each type
 */
export function getBannerDataSources(bannerType: BannerDeterminationResult, post: any) {
  const { hasTimelineBanner, hasVideoBanner, hasImageBanner, hasAssistantBanner } = bannerType;

  let resolvedImageBannerData: ImageBannerData | null = null;
  if (hasImageBanner) {
    if (post?.data?.bannerType === "image") {
      // Ensure imageUrl is a string, provide a fallback if necessary, or handle potential undefined
      const imageUrl = post.data.bannerData?.imageUrl || post.data.image;
      if (typeof imageUrl === 'string') {
        resolvedImageBannerData = { imageUrl: imageUrl };
      } else {
        // Fallback if no valid image URL is found for a post-specific image banner
        console.warn("Banner config: Post-specific image banner lacks a valid imageUrl. Falling back to default image banner data.");
        resolvedImageBannerData = bannerConfig.imageBannerConfig.data; // Assumes imageBannerConfig.data is valid ImageBannerData
      }
    } else {
      // This means it's a default image banner.
      // determineBannerType ensures that if hasImageBanner is true due to default,
      // then bannerConfig.defaultBannerType === 'image' and isImageBannerData(bannerConfig.defaultBannerData) is true.
      if (isImageBannerData(bannerConfig.defaultBannerData)) {
        resolvedImageBannerData = bannerConfig.defaultBannerData;
      } else {
        // This case should ideally not be reached if determineBannerType is correct.
        console.warn("Banner config: Mismatch in default image banner data type. Expected ImageBannerData, got something else. Falling back to imageBannerConfig.data.");
        resolvedImageBannerData = bannerConfig.imageBannerConfig.data; // Fallback to the explicit image banner config data
      }
    }
  }
  
  return {
    videoBannerData: hasVideoBanner && post?.data?.bannerType === "video"
      ? post.data.bannerData
      : hasVideoBanner ? bannerConfig.defaultBannerData : null,
    
    imageBannerData: resolvedImageBannerData,
    
    timelineBannerData: hasTimelineBanner && post?.data?.bannerType === "timeline"
      ? post.data.bannerData
      : hasTimelineBanner ? bannerConfig.defaultBannerData : null,
    
    assistantBannerData: hasAssistantBanner && post?.data?.bannerType === "assistant"
      ? post.data.bannerData
      : hasAssistantBanner ? bannerConfig.defaultBannerData : null
  };
}

/**
 * Get complete banner configuration for a page
 * This is the main function to use in MainGridLayout.astro
 * 
 * @param post - The post object from Astro
 * @param defaultBannerLink - Default banner link if not in post
 * @returns Complete banner configuration including type, data, and layout
 */
/**
 * Modified determineBannerConfiguration function
 * Add this check at the beginning of the existing function
 */
export function determineBannerConfiguration(post: any, pageType: string, defaultBannerLink: string = '') {
  // Check for fullscreen mode override
  if (isFullscreenModeActive()) {
    // Return configuration for "none" banner type
    return {
      postData: getBannerDataFromPost(post),
      bannerType: {
        hasTimelineBanner: false,
        hasVideoBanner: false,
        hasImageBanner: false,
        hasAssistantBanner: false,
        hasStandardBanner: false,
        hasPostBanner: false,
        isStandardPage: false,
        currentBannerType: 'none' as BannerType
      },
      bannerDataSources: {
        videoBannerData: null,
        imageBannerData: null,
        timelineBannerData: null,
        assistantBannerData: null
      },
      layout: {
        mainPanelTop: bannerConfig.panel.top.none, // Stays "0rem" as per 'none' banner config
        navbarSpacing: "0rem", // Banner container will be display:none, so its margin is irrelevant
        bannerHeight: '0', // Ensures banner takes no height if not display:none
        bannerOverlap: '0', // No overlap if no banner
        dynamicOverlap: '0', // No dynamic overlap if no banner
        mainContentOffset: "1.5rem" // Positions main grid (5.5rem current + 3rem additional) below navbar
      },
      finalBannerLink: '',
      currentBannerType: 'none' as BannerType
    };
  }

  // Extract post data
  const postData = getBannerDataFromPost(post);
  
  // Determine banner type
  const bannerType = determineBannerType(post, postData);
  
  // Get banner data sources
  const bannerDataSources = getBannerDataSources(bannerType, post);
  
  // Get layout configuration
  const mainPanelTop = getPanelTopPosition(bannerType.currentBannerType);
  const navbarSpacing = bannerConfig.navbar.spacing[bannerType.currentBannerType];
  const { height: bannerHeight, overlap: bannerOverlap } = getResponsiveBannerDimensions(false);
  const mainContentOffset = getMainContentOffset(false);
  const dynamicOverlap = getPageSpecificOverlap(pageType, false); // Get desktop-specific overlap
  
  // Finalize banner link
  const finalBannerLink = postData?.bannerLink || defaultBannerLink;
  
  return {
    postData,
    bannerType,
    bannerDataSources,
    layout: {
      mainPanelTop,
      navbarSpacing,
      bannerHeight,
      bannerOverlap,
      dynamicOverlap, // Add page-specific overlap
      mainContentOffset
    },
    finalBannerLink,
    currentBannerType: bannerType.currentBannerType
  };
}

/**
 * Get appropriate banner dimensions based on screen size
 * Used by MainGridLayout.astro to set responsive banner heights
 * 
 * @param isMobile - Whether to get mobile dimensions (default: false)
 * @returns Object with height and overlap CSS values
 */
export function getResponsiveBannerDimensions(isMobile: boolean = false): {
  height: string;
  overlap: string;
} {
  return {
    height: isMobile ? bannerConfig.layout.height.mobile : bannerConfig.layout.height.desktop,
    overlap: isMobile ? bannerConfig.layout.overlap.mobile : bannerConfig.layout.overlap.desktop
  };
}

/**
 * Get CSS for fallback banner when images fail to load
 * Provides a graceful fallback experience for users
 * 
 * @returns CSS string for background (color or gradient)
 */
export function getFallbackBannerCSS(): string {
  if (!bannerConfig.fallback.enabled) return '';
  
  return bannerConfig.fallback.type === 'gradient' 
    ? bannerConfig.fallback.value
    : `${bannerConfig.fallback.value}`;
}

/**
 * Get animation settings for banner cycling
 * Used by the banner animation JavaScript to configure timing and behavior
 * 
 * @returns Object with all animation configuration values
 */
export function getBannerAnimationSettings(): BannerAnimationConfig {
  return bannerConfig.standardBannerConfig.getBannerAnimationSettings();
}

/**
 * Get panel top position based on banner type
 * Calculates where the main content should start relative to different banner types
 * 
 * @param bannerType - The type of banner being displayed
 * @returns CSS value for top position (e.g., "0", "calc(100vh - 2rem)")
 */
export function getPanelTopPosition(bannerType: BannerType): string {
  switch(bannerType) {
    case 'video': return bannerConfig.panel.top.video;
    case 'image': return bannerConfig.panel.top.image;
    case 'timeline': return bannerConfig.panel.top.timeline;
    case 'assistant': return bannerConfig.panel.top.assistant;
    case 'none': return bannerConfig.panel.top.none;
    default: return bannerConfig.panel.top.standard;
  }
}

/**
 * Get page-specific overlap based on page type
 * Returns appropriate overlap value for different page contexts
 * 
 * @param pageType - Type of page (home, post, archive, about)
 * @param isMobile - Whether to get mobile overlap (default: false)
 * @returns CSS overlap value
 */
export function getPageSpecificOverlap(pageType: string, isMobile: boolean = false): string {
  const overlaps = bannerConfig.layout.pageOverlaps;
  const device = isMobile ? 'mobile' : 'desktop';
  
  // Return specific overlap or fall back to default
  switch(pageType) {
    case 'home':
      return overlaps.home[device];
    case 'post':
    case 'posts':
    case 'blog':
      return overlaps.post[device];
    case 'archive':
    case 'categories':
    case 'tags':
      return overlaps.archive[device];
    case 'about':
      return overlaps.about[device];
    default:
      // Fall back to default overlap
      return isMobile ? bannerConfig.layout.overlap.mobile : bannerConfig.layout.overlap.desktop;
  }
}

/**
 * Get navbar height based on screen size
 * Provides responsive navbar height for layout calculations
 * 
 * @param isMobile - Whether to get mobile height (default: false)
 * @returns CSS value for navbar height
 */
export function getNavbarHeight(isMobile: boolean = false): string {
  return isMobile ? bannerConfig.navbar.height.mobile : bannerConfig.navbar.height.desktop;
}

/**
 * Get main content offset based on screen size
 * Controls spacing between banner and main content
 * 
 * @param isMobile - Whether to get mobile offset (default: false)
 * @returns CSS value for main content offset
 */
export function getMainContentOffset(isMobile: boolean = false): string {
  return isMobile ? bannerConfig.layout.mainContentOffset.mobile : bannerConfig.layout.mainContentOffset.desktop;
}

/**
 * Get banner link for a specific image index
 * Used to make banner images clickable
 * 
 * @param index - Index of the banner image (0-based)
 * @returns URL string if link exists, null if no link or index out of range
 */
export function getBannerLink(index: number): string | null {
  return bannerConfig.standardBannerConfig.getBannerLink(index);
}

/**
 * Check if banner images have any clickable links
 * Used to determine if hover effects should be applied
 * 
 * @returns True if any banner image has a link
 */
export function hasAnyBannerLinks(): boolean {
  return bannerConfig.standardBannerConfig.hasAnyBannerLinks();
}

/**
 * Get link preview data for a URL
 * Returns enhanced preview information for banner links
 * 
 * @param url - The URL to get preview data for
 * @returns LinkPreviewInfo with title, description, and icon
 */
export function getLinkPreviewData(url: string): LinkPreviewInfo {
  return bannerConfig.standardBannerConfig.getLinkPreviewData(url);
}

/**
 * Get icon SVG for link previews
 * Returns simplified inline SVG for the specified icon
 * 
 * @param iconName - Name of the icon (without fa6-solid: prefix)
 * @returns SVG path string
 */
export function getIconSVG(iconName: string): string {
  return bannerConfig.standardBannerConfig.getIconSVG(iconName);
}

// =====================================================================
// RE-EXPORT TYPE GUARDS FOR CONVENIENCE
// =====================================================================
// These functions provide safe type checking for banner data
// They prevent runtime errors by validating data structure before use

/**
 * Check if data is valid VideoBannerData
 * Ensures the data has a videoId string before using it for video banners
 */
export { isVideoBannerData }

/**
 * Check if data is valid ImageBannerData  
 * Ensures the data has an imageUrl string before using it for image banners
 */
export { isImageBannerData }

/**
 * Check if data is valid TimelineBannerData
 * Ensures the data has a category string (required) before using it for timeline banners
 */
export { isTimelineBannerData }

/**
 * Check if data is valid AssistantBannerData
 * Validates assistant banner data structure (currently minimal requirements)
 */
export { isAssistantBannerData }

/**
 * Check if data is valid StandardBannerData
 * Standard banners use the bannerList array, so data should be empty
 */
export function isStandardBannerData(data: any): data is import('./banners/types').StandardBannerData {
  return data && typeof data === 'object' && Object.keys(data).length === 0;
}

/**
 * Check if data is valid NoneBannerData
 * Used when no banner should be displayed - data should be empty
 */
export { isNoneBannerData }

// =====================================================================
// RE-EXPORT BANNER TYPE CONFIGURATIONS FOR DIRECT ACCESS
// =====================================================================
// Export individual banner configurations for direct access when needed

export { standardBannerConfig, videoBannerConfig, imageBannerConfig, timelineBannerConfig, assistantBannerConfig, noneBannerConfig }

// =====================================================================
// RE-EXPORT TYPE DEFINITIONS FOR CONVENIENCE
// =====================================================================
// Re-export types for easier importing in other files

export type { 
  BannerType, 
  BannerData, 
  BannerDeterminationResult, 
  PostBannerData, 
  LinkPreviewInfo,
  BannerAnimationConfig,
  BannerLayoutConfig,
  BannerVisualConfig,
  BannerFallbackConfig,
  BannerNavbarConfig,
  BannerPanelConfig,
  BannerParallaxConfig
} from './banners/types'