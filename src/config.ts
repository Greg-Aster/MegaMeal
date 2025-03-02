import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from './types/config'
import { LinkPreset } from './types/config'

export const siteConfig: SiteConfig = {
  title: 'Greg Aster',
  subtitle: 'Experimental Videographer & Creator',
  lang: 'en',
  themeColor: {
    hue: 200,
    fixed: false,
  },
//banner is no longer needws but to keep the code from breaking I will keep it here
  banner: {
    enable: true,
    src: '/assets/banner/0001.png',
    position: 'center',
    credit: {
      enable: false,
      text: '',
      url: ''
    }
  },
  toc: {
    enable: true,
    depth: 2
  },
  favicon: [    // Leave this array empty to use the default favicon
    //{
      //src: '/favicon/mascot-180.png',    // Path of the favicon, relative to the /public directory
      //theme: 'dark',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
      //sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
     //}
]
}

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Community,
    LinkPreset.Archive,
    LinkPreset.About,
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/dndiy',
      external: true,
    },
  ],
}
export const profileConfig: ProfileConfig = {
  avatar: ''
  //[
   // '/src/assets/images/avatar.png',
   // '/src/assets/images/avatar2.jpg',
   //]
   ,
  name: 'Greg Aster',
  bio: 'Filmmaker, Animator, and Creator of Strange Worlds',
  links: [
    {
      name: 'Bluesky',
      icon: 'fa6-brands:bluesky',
      url: 'https://bsky.app/profile/astervisualarts.bsky.social',
    },
    {
      name: 'Discord',
      icon: 'fa6-brands:discord',
      url: 'https://discord.gg/e69ZEcnY',
    },
    {
      name: 'GitHub',
      icon: 'fa6-brands:github',
      url: 'https://github.com/Greg-Aster',
    },
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: 'CC BY-NC-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
}

