// avatarConfig.ts
import { profileConfig } from '../config';

// Define the avatars for specific pages (using slug-based naming)
export const avatarConfig: Record<string, string> = {
  'the-melencholy-adventures-of-steamboat-willie': '/content/posts/the-melencholy-adventures-of-steamboat-willie/thumb.png',
  // Add more posts as needed
};

// Function to get the appropriate avatar based on page slug
export function getAvatarForPage(pageSlug: string): string {
  return avatarConfig[pageSlug] || profileConfig.avatar; // Defaults to profileConfig avatar
}
