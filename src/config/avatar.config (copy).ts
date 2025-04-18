// Import type - use import type syntax to fix verbatimModuleSyntax error
import type { ImageMetadata } from 'astro'

// Import avatar images
import avatar1 from '/src/content/avatar/avatar.png' // Primary mysterious witness
import avatar2 from '/src/content/avatar/avatar2.png' // Corporate CEO
import avatar3 from '/src/content/avatar/avatar3.png' // Santiago Chen (Bartender)
import avatar4 from '/src/content/avatar/avatar4.png' // The Sandwich Thief/Hamburgler
import avatar5 from '/src/content/avatar/avatar5.png' // Temporal Historian
import avatar6 from '/src/content/avatar/avatar6.png' // Snuggloid entity

// Define the avatar configuration type
export interface AvatarConfig {
  avatarList: ImageMetadata[]
  homeAvatar: ImageMetadata
  animationInterval: number
}

/**
 * Avatar configuration for the site
 * Controls which avatars are used for the home page and posts
 */
export const avatarConfig: AvatarConfig = {
  // List of all available avatars for post pages and rotation
  avatarList: [
    avatar1,
    avatar2,
    avatar3,
    avatar4,
    avatar5,
    avatar6
  ],
  
  // Avatar to use on the home page (site owner)
  homeAvatar: avatar1,
  
  // Animation interval in milliseconds - 3042 references the Miranda System destruction
  animationInterval: 3042
};

/**
 * Get a consistent avatar index for a given post slug
 * This ensures the same post always shows the same avatar
 */
export function getAvatarIndexFromSlug(slug: string = '', avatarCount: number): number {
  if (!slug) return 0 // Default to first avatar if no slug
  
  // Simple hash function to get consistent avatar for each slug
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Ensure positive index and map to available avatars
  return Math.abs(hash) % avatarCount
}