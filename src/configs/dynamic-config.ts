// src/configs/dynamic-config.ts

import { siteConfig, profileConfig } from '../config';

// Define dynamic avatars for different sections
const dynamicAvatars: Record<string, string> = {
  home: '/src/assets/images/avatar.png',
  about: '/src/assets/images/demo-avatar.png',
  contact: '/src/assets/images/demo-avatar.png',
  // Add more sections or pages as needed
};

// Example: Gather dynamic data (e.g., from blog posts or other sources)
const getDynamicData = () => {
  // Replace this with logic to fetch or compute dynamic data
  return {
    avatar: dynamicAvatars.home, // Default to home avatar
    themeColor: {
      hue: 300, // Example dynamic theme color
      fixed: true,
    },
  };
};



// Export dynamic configuration
export const dynamicConfig = {
  ...siteConfig,
  ...profileConfig,
  ...getDynamicData(), // Merge dynamic data into the base configuration
  dynamicAvatars, // Include the dynamic avatars object
};