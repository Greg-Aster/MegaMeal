/**
 * ===================================================================
 * BANNER CONFIGURATION - CLEANED & SIMPLIFIED
 * ===================================================================
 */

// Import types from existing types.ts
import type {
  BannerType,
  BannerData,
  BannerDeterminationResult,
  PostBannerData,
  LinkPreviewInfo,
  BannerAnimationConfig,
} from './banners/types'

// Import banner configurations
import { standardBannerConfig } from './banners/standard'
import { videoBannerConfig } from './banners/video'
import { imageBannerConfig } from './banners/image'
import { timelineBannerConfig } from './banners/timeline'
import { assistantBannerConfig } from './banners/assistant'
import { noneBannerConfig } from './banners/none'

// Import type guards
import { isVideoBannerData } from './banners/video'
import { isImageBannerData } from './banners/image'
import { isTimelineBannerData } from './banners/timeline'
import { isAssistantBannerData } from './banners/assistant'
import { isNoneBannerData } from './banners/none'

// =====================================================================
// SIMPLIFIED INTERFACES - REMOVED UNUSED VALUES
// =====================================================================

/**
 * 🎯 ACTUAL BANNER DIMENSIONS - Only used by CSS
 */
export interface BannerDimensions {
  aspectRatio: string;           // 16:9 aspect ratio (critical)
  maxWidth: string;              // Max banner width (responsive)
  padding: string;               // Horizontal padding (responsive)
  borderRadius: string;          // Border radius
}

/**
 * 🎯 MAIN CONFIG - CLEANED UP
 */
export interface BannerConfig {
  // Banner type configs
  defaultBannerType: BannerType;
  defaultBannerData: BannerData;
  standardBannerConfig: typeof standardBannerConfig;
  videoBannerConfig: typeof videoBannerConfig;
  imageBannerConfig: typeof imageBannerConfig;
  timelineBannerConfig: typeof timelineBannerConfig;
  assistantBannerConfig: typeof assistantBannerConfig;
  noneBannerConfig: typeof noneBannerConfig;
  
  // Actual working configuration
  dimensions: BannerDimensions;
  
  // WORKING: Layout values used by MainGridLayout.astro
  layout: {
    height: string;
    maxWidth: number;
    mainContentOffset: string;
  };

  // WORKING: Visual config used by existing code
  visual: {
    objectFit: string;
    objectPosition: string;
    applyGradientOverlay: boolean;
    gradientOverlay: string;
    borderRadius: string;
  };

  // WORKING: Fallback configuration
  fallback: {
    enabled: boolean;
    type: string;
    value: string;
  };

  // WORKING: Navbar spacing for different banner types
  navbar: {
    height: string;
    spacing: {
      standard: string;
      timeline: string;
      video: string;
      image: string;
      assistant: string;
      none: string;
    };
  };

  // 🎯 WORKING: The REAL overlap system - this controls banner overlap!
  panel: {
    top: {
      video: string;
      image: string;
      timeline: string;
      assistant: string;
      standard: string;      // ⭐ THIS IS YOUR BANNER OVERLAP CONTROL!
      none: string;
    };
  };

  // WORKING: Parallax configuration
  parallax: {
    enabled: boolean;
    scrollFactor: number;
    easingFactor: number;
  };
  
  // WORKING: Navigation configuration
  navigation?: {
    enabled: boolean;
    showPositionIndicator: boolean;
    showBannerTitles: boolean;
    autoResumeDelay: number;
    keyboardNavigation: boolean;
    enabledForTypes: BannerType[];
    styling?: {
      buttonSize?: string;
      indicatorSize?: string;
      animationDuration?: string;
    };
  };
}

/**
 * ===================================================================
 * MAIN CONFIGURATION - CLEANED & WORKING
 * ===================================================================
 */
export const bannerConfig: BannerConfig = {
  // Default banner type
  defaultBannerType: 'standard',
  defaultBannerData: {} as any,
  
  // Banner type configurations
  standardBannerConfig,
  videoBannerConfig,
  imageBannerConfig,
  timelineBannerConfig,
  assistantBannerConfig,
  noneBannerConfig,
  
  // 🎯 WORKING: CSS dimensions system
  dimensions: {
    aspectRatio: '56.25%',       // 16:9 ratio (critical for your content)
    maxWidth: 'clamp(100vw, 90vw, 85vw)',    // Full width on mobile
    padding: 'clamp(0.0vw, 0vw, 4vw)',    // Even less padding
    borderRadius: '.5rem',      // Standard Tailwind radius
  },

  // WORKING: Layout used by MainGridLayout.astro
  layout: {
    height: '60vh',
    maxWidth: 3840,
    mainContentOffset: '1.5rem',
  },
  
  // WORKING: Visual config used by existing code
  visual: {
    objectFit: 'cover',
    objectPosition: 'center',
    applyGradientOverlay: true,
    gradientOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
    borderRadius: '0.5rem',
  },
  
  // WORKING: Fallback configuration
  fallback: {
    enabled: true,
    type: 'gradient',
    value: 'linear-gradient(135deg, oklch(0.6 0.2 var(--hue)), oklch(0.4 0.3 var(--hue)))'
  },

  // WORKING: Navbar spacing - NOW RESPONSIVE!
  navbar: {
    height: '5rem',
    spacing: {
      standard: "clamp(3rem, 4vw, 3rem)",    // 🎯 1.5rem mobile → 5rem desktop
      timeline: "5.5rem",
      video: "5.5rem",
      image: "clamp(1.5rem, 4vw, 5rem)",       // 🎯 Same responsive spacing
      assistant: "5.5rem",
      none: "-8rem"
    }
  },

  // 🎯 WORKING: THE REAL OVERLAP SYSTEM!
  // These values control how much content overlaps the banner
  panel: {
    top: {
      video: "-0.5rem",
      image: "-0.5rem",
      timeline: "-0.5rem",
      assistant: "-0.5rem",
      standard: "clamp(-5rem, -4vw, -2.5rem)",  // 🎯 1.5rem mobile → 5rem desktop overlap
      none: "12rem"
    }
  },

  // WORKING: Parallax configuration
  parallax: {
    enabled: true,
    scrollFactor: -0.02,
    easingFactor: 0.1
  },
  
  // WORKING: Navigation configuration
  navigation: {
    enabled: true,
    showPositionIndicator: true,
    showBannerTitles: true,
    autoResumeDelay: 5000,
    keyboardNavigation: true,
    enabledForTypes: ['standard', 'image', 'video'] as BannerType[],
    styling: {
      buttonSize: '2.75rem',
      indicatorSize: '0.4375rem',
      animationDuration: '0.3s'
    }
  }
}

// =====================================================================
// SIMPLIFIED HELPER FUNCTIONS - CLEANED UP
// =====================================================================

export function isFullscreenModeActive(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem('fullscreenBannerOverride') === 'true';
}

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

export function determineBannerType(post: any, postData: PostBannerData | null): BannerDeterminationResult {
  // Check for post-specific banners
  const hasPostTimelineBanner = post?.data?.bannerType === "timeline" && post?.data?.bannerData?.category;
  const hasPostVideoBanner = post?.data?.bannerType === "video" && post?.data?.bannerData?.videoId;
  const hasPostAssistantBanner = post?.data?.bannerType === "assistant";
  const hasPostImageBanner = !postData?.wantsNoDefaultBanner && 
    (post?.data?.image || (post?.data?.bannerType === "image" && post?.data?.bannerData?.imageUrl)) && 
    !hasPostVideoBanner && !hasPostTimelineBanner && !hasPostAssistantBanner;
  
  const hasPostBanner = hasPostVideoBanner || hasPostImageBanner || hasPostTimelineBanner || hasPostAssistantBanner;

  // Check for default banners
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

  // Determine banner flags
  const hasTimelineBanner = hasPostTimelineBanner || useDefaultTimeline;
  const hasVideoBanner = hasPostVideoBanner || useDefaultVideo;
  const hasImageBanner = hasPostImageBanner || useDefaultImage;
  const hasAssistantBanner = hasPostAssistantBanner || useDefaultAssistant;
  const hasStandardBanner = useDefaultStandard;

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

export function getBannerDataSources(bannerType: BannerDeterminationResult, post: any) {
  const { hasTimelineBanner, hasVideoBanner, hasImageBanner, hasAssistantBanner } = bannerType;

  let resolvedImageBannerData: any = null;
  if (hasImageBanner) {
    if (post?.data?.bannerType === "image") {
      const imageUrl = post.data.bannerData?.imageUrl || post.data.image;
      if (typeof imageUrl === 'string') {
        resolvedImageBannerData = { imageUrl: imageUrl };
      } else {
        console.warn("Banner config: Post-specific image banner lacks a valid imageUrl. Falling back to default.");
        resolvedImageBannerData = bannerConfig.imageBannerConfig.data;
      }
    } else {
      if (isImageBannerData(bannerConfig.imageBannerConfig.data)) {
        resolvedImageBannerData = bannerConfig.imageBannerConfig.data;
      } else {
        console.warn("Banner config: Mismatch in default image banner data type. Falling back to imageBannerConfig.data.");
        resolvedImageBannerData = bannerConfig.imageBannerConfig.data;
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
 * 🎯 MAIN API: Banner configuration determination
 */
export function determineBannerConfiguration(post: any, pageType: string, defaultBannerLink: string = '') {
  if (isFullscreenModeActive()) {
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
        mainPanelTop: bannerConfig.panel.top.none,
        navbarSpacing: "0rem",
        bannerHeight: '0',
        bannerOverlap: '0',
        dynamicOverlap: '0',
        mainContentOffset: bannerConfig.layout.mainContentOffset
      },
      finalBannerLink: '',
      currentBannerType: 'none' as BannerType
    };
  }

  const postData = getBannerDataFromPost(post);
  const bannerType = determineBannerType(post, postData);
  const bannerDataSources = getBannerDataSources(bannerType, post);
  
  // 🎯 THE REAL WORKING VALUES
  const mainPanelTop = getPanelTopPosition(bannerType.currentBannerType);
  const navbarSpacing = bannerConfig.navbar.spacing[bannerType.currentBannerType];
  const bannerHeight = bannerConfig.layout.height;
  const mainContentOffset = bannerConfig.layout.mainContentOffset;
  
  const finalBannerLink = postData?.bannerLink || defaultBannerLink;
  
  return {
    postData,
    bannerType,
    bannerDataSources,
    layout: {
      mainPanelTop,                    // 🎯 THIS CONTROLS OVERLAP!
      navbarSpacing,
      bannerHeight,
      bannerOverlap: '0',              // Removed unused value
      dynamicOverlap: '0',             // Removed unused value
      mainContentOffset
    },
    finalBannerLink,
    currentBannerType: bannerType.currentBannerType
  };
}

// =====================================================================
// SIMPLIFIED UTILITY FUNCTIONS - KEPT ONLY WORKING ONES
// =====================================================================

export function getResponsiveBannerDimensions(): { height: string; } {
  return {
    height: bannerConfig.layout.height,
  };
}

export function getFallbackBannerCSS(): string {
  if (!bannerConfig.fallback.enabled) return '';
  return bannerConfig.fallback.type === 'gradient' 
    ? bannerConfig.fallback.value
    : `${bannerConfig.fallback.value}`;
}

export function getBannerAnimationSettings(): BannerAnimationConfig {
  return bannerConfig.standardBannerConfig.getBannerAnimationSettings();
}

// 🎯 THE FUNCTION THAT CONTROLS OVERLAP!
export function getPanelTopPosition(bannerType: BannerType): string {
  switch(bannerType) {
    case 'video': return bannerConfig.panel.top.video;
    case 'image': return bannerConfig.panel.top.image;
    case 'timeline': return bannerConfig.panel.top.timeline;
    case 'assistant': return bannerConfig.panel.top.assistant;
    case 'none': return bannerConfig.panel.top.none;
    default: return bannerConfig.panel.top.standard;  // ⭐ THIS IS YOUR OVERLAP!
  }
}

export function getPageSpecificOverlap(pageType: string): string {
  // This function is no longer used but kept for compatibility
  return '0';
}

export function getNavbarHeight(): string {
  return bannerConfig.navbar.height;
}

export function getMainContentOffset(): string {
  return bannerConfig.layout.mainContentOffset;
}

export function getBannerLink(index: number): string | null {
  return bannerConfig.standardBannerConfig.getBannerLink(index);
}

export function hasAnyBannerLinks(): boolean {
  return bannerConfig.standardBannerConfig.hasAnyBannerLinks();
}

export function getLinkPreviewData(url: string): LinkPreviewInfo {
  return bannerConfig.standardBannerConfig.getLinkPreviewData(url);
}

export function getIconSVG(iconName: string): string {
  return bannerConfig.standardBannerConfig.getIconSVG(iconName);
}

// Re-export type guards and configurations
export { isVideoBannerData, isImageBannerData, isTimelineBannerData, isAssistantBannerData, isNoneBannerData }

export function isStandardBannerData(data: any): data is any {
  return data && typeof data === 'object' && Object.keys(data).length === 0;
}

export { standardBannerConfig, videoBannerConfig, imageBannerConfig, timelineBannerConfig, assistantBannerConfig, noneBannerConfig }

// Re-export types
export type { 
  BannerType, 
  BannerData, 
  BannerDeterminationResult, 
  PostBannerData, 
  LinkPreviewInfo,
  BannerAnimationConfig,
} from './banners/types'