/**
 * ===================================================================
 * BANNER CONFIGURATION - CLEAN, DRY & TAILWIND-FRIENDLY
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
// SIMPLIFIED, DRY INTERFACES
// =====================================================================

/**
 * 🎯 SINGLE RESPONSIVE SYSTEM - Tailwind-aligned
 */
export interface BannerDimensions {
  aspectRatio: string;           // Single aspect ratio (56.25% = 16:9)
  maxWidth: string;              // Max banner width (responsive)
  padding: string;               // Horizontal padding (responsive)
  borderRadius: string;          // Border radius
}

/**
 * 🎯 SIMPLIFIED SPACING - Just what's needed for overlaps
 */
export interface BannerSpacing {
  navbar: {
    withBanner: string;          // Navbar spacing when banner present
    withoutBanner: string;       // Navbar spacing when no banner
  };
  overlap: {
    home: string;                // Content overlap on home (your feature!)
    posts: string;               // Content overlap on posts
    other: string;               // Content overlap on other pages
  };
}

/**
 * 🎯 MAIN CONFIG - Simplified & DRY
 */
export interface BannerConfig {
  // Banner type configs (keep existing)
  defaultBannerType: BannerType;
  defaultBannerData: BannerData;
  standardBannerConfig: typeof standardBannerConfig;
  videoBannerConfig: typeof videoBannerConfig;
  imageBannerConfig: typeof imageBannerConfig;
  timelineBannerConfig: typeof timelineBannerConfig;
  assistantBannerConfig: typeof assistantBannerConfig;
  noneBannerConfig: typeof noneBannerConfig;
  
  // Simplified configuration
  dimensions: BannerDimensions;
  spacing: BannerSpacing;
  
  // PRESERVED: Existing layout structure (needed by MainGridLayout.astro)
  layout: {
    height: string;
    overlap: string;
    maxWidth: number;
    noneBannerPlaceholderHeight: string;
    mainContentOffset: string;
    pageOverlaps: {
      home: string;
      post: string;
      archive: string;
      about: string;
    };
  };

  // PRESERVED: Visual config (needed by existing code)
  visual: {
    objectFit: string;
    objectPosition: string;
    applyGradientOverlay: boolean;
    gradientOverlay: string;
    borderRadius: string;
    dimensions: {
      aspectRatio: string;
      maxWidth: string;
      padding: string;
      containerSpacing: string;
      borderRadius: string;
      aspectRatios: {
        standard: string;
        video: string;
        image: string;
        timeline: string;
        assistant: string;
        ultrawide: string;
        square: string;
        portrait: string;
      };
      responsive: {
        mobile: {
          maxWidth: string;
          padding: string;
        };
        desktop: {
          maxWidth: string;
        };
      };
    };
  };

  // PRESERVED: Existing structures that are being used
  fallback: {
    enabled: boolean;
    type: string;
    value: string;
  };

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

  panel: {
    top: {
      video: string;
      image: string;
      timeline: string;
      assistant: string;
      standard: string;
      none: string;
    };
  };

  parallax: {
    enabled: boolean;
    scrollFactor: number;
    easingFactor: number;
  };
  
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
 * MAIN CONFIGURATION - CLEAN & SIMPLE
 * ===================================================================
 */
export const bannerConfig: BannerConfig = {
  // Default banner type
  defaultBannerType: 'standard',
  defaultBannerData: {} as any, // Set automatically below
  
  // Banner type configurations (keep existing)
  standardBannerConfig,
  videoBannerConfig,
  imageBannerConfig,
  timelineBannerConfig,
  assistantBannerConfig,
  noneBannerConfig,
  
  // 🎯 SINGLE DIMENSIONS SYSTEM
  dimensions: {
    aspectRatio: '56.25%',       // 16:9 ratio
    maxWidth: '90vw',            // Responsive width
    padding: '2.5vw',            // Responsive padding
    borderRadius: '0.5rem',      // Standard Tailwind radius
  },
  
  // 🎯 SIMPLIFIED SPACING (preserves your overlap feature)
  spacing: {
    navbar: {
      withBanner: '0',           // No spacing when banner present
      withoutBanner: '5.5rem',   // Standard navbar height when no banner
    },
    overlap: {
      home: '10rem',             // Your home page overlap feature
      posts: '2.5rem',           // Post page overlap
      other: '4rem',             // Other pages overlap
    }
  },

  // PRESERVED: Original layout structure (used by MainGridLayout.astro)
  layout: {
    height: '60vh',
    overlap: '2rem',
    maxWidth: 3840,
    noneBannerPlaceholderHeight: '1.5rem',
    mainContentOffset: '1.5rem',
    pageOverlaps: {
      home: '10rem',
      post: '2.5rem', 
      archive: '4rem',
      about: '3rem'
    }
  },
  
  // PRESERVED: Visual config (used by existing code)
  visual: {
    objectFit: 'cover',
    objectPosition: 'center',
    applyGradientOverlay: true,
    gradientOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
    borderRadius: '0.5rem',
    
    dimensions: {
      aspectRatio: '56.25%',
      maxWidth: '120vw',
      padding: '2.5vw',
      containerSpacing: '0.5rem',
      borderRadius: '0.5rem',
      
      aspectRatios: {
        standard: '56.25%',
        video: '56.25%',
        image: '56.25%',
        timeline: '56.25%',
        assistant: '56.25%',
        ultrawide: '42.86%',
        square: '100%',
        portrait: '133.33%'
      },
      
      responsive: {
        mobile: {
          maxWidth: '95vw',
          padding: '1.5vw'
        },
        desktop: {
          maxWidth: '85vw'
        }
      }
    }
  },
  
  // PRESERVED: Other configurations
  fallback: {
    enabled: true,
    type: 'gradient',
    value: 'linear-gradient(135deg, oklch(0.6 0.2 var(--hue)), oklch(0.4 0.3 var(--hue)))'
  },

  navbar: {
    height: '5rem',
    spacing: {
      standard: "0",
      timeline: "5.5rem",
      video: "5.5rem",
      image: "0",
      assistant: "5.5rem",
      none: "-8rem"
    }
  },

  panel: {
    top: {
      video: "-0.5rem",
      image: "-0.5rem",
      timeline: "-0.5rem",
      assistant: "-0.5rem",
      standard: "-5.5rem",
      none: "12rem"
    }
  },

  parallax: {
    enabled: true,
    scrollFactor: -0.02,
    easingFactor: 0.1
  },
  
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
// SIMPLIFIED HELPER FUNCTIONS
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
 * 🎯 PRESERVED: Original determineBannerConfiguration API
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
        mainContentOffset: "1.5rem"
      },
      finalBannerLink: '',
      currentBannerType: 'none' as BannerType
    };
  }

  const postData = getBannerDataFromPost(post);
  const bannerType = determineBannerType(post, postData);
  const bannerDataSources = getBannerDataSources(bannerType, post);
  
  const mainPanelTop = getPanelTopPosition(bannerType.currentBannerType);
  const navbarSpacing = bannerConfig.navbar.spacing[bannerType.currentBannerType];
  const bannerHeight = bannerConfig.layout.height;
  const bannerOverlap = bannerConfig.layout.overlap;
  const mainContentOffset = bannerConfig.layout.mainContentOffset;
  const dynamicOverlap = getPageSpecificOverlap(pageType);
  
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
      dynamicOverlap,
      mainContentOffset
    },
    finalBannerLink,
    currentBannerType: bannerType.currentBannerType
  };
}

// =====================================================================
// SIMPLE UTILITY FUNCTIONS
// =====================================================================

// =====================================================================
// PRESERVED: All original utility functions
// =====================================================================

export function getResponsiveBannerDimensions(): { height: string; overlap: string; } {
  return {
    height: bannerConfig.layout.height,
    overlap: bannerConfig.layout.overlap
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

export function getPageSpecificOverlap(pageType: string): string {
  const overlaps = bannerConfig.layout.pageOverlaps;
  
  switch(pageType) {
    case 'home': return overlaps.home;
    case 'post':
    case 'posts':
    case 'blog': return overlaps.post;
    case 'archive':
    case 'categories':
    case 'tags': return overlaps.archive;
    case 'about': return overlaps.about;
    default: return bannerConfig.layout.overlap;
  }
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