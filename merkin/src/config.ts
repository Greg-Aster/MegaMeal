import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from './types/config'
import { LinkPreset } from './types/config'

export const siteConfig: SiteConfig = {
  title: 'Merkin',
  subtitle: 'Meta-Human Pre-Singularity Hybrid',
  lang: 'en',
  themeColor: {
    hue: 270, // Deep violet, otherworldly glow
    fixed: false,
  },
  banner: {
    enable: true,
    src: 'assets/images/Banner-Dark.jpg', // Replace with a fitting cosmic horror image
    position: 'center',
    credit: {
      enable: false,
      text: '',
      url: ''
    }
  },
  toc: {
    enable: false, // Mystery doesn't require a table of contents
    depth: 2
  },
  favicon: [//
   // {
     // src: '/favicon/merkin-dark.png',
     // theme: 'dark',
     // sizes: '32x32',
  //  }
  ]
}

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    {
      name: 'Codex',
      url: '/codex', // A cryptic lore page
    },
    {
      name: 'Oracles',
      url: '/oracles', // Perhaps a contact page, but in a weird, cosmic way
    },
  ],
}

export const profileConfig: ProfileConfig = {
  avatar: 'assets/images/avatar-dark.png', // A surreal or disturbing image
  name: 'Merkin',
  bio: 'Echoes from the void. A being between realities.',
  links: [
    {
      name: 'Transmissions',
      icon: 'fa6-brands:bluesky',
      url: '/transmissions', // A log of cryptic messages or lore entries
    },
    {
      name: 'The Singularity Looms',
      icon: 'fa6-brands:discord',
      url: '/singularity', // Perhaps a countdown or a strange prophecy
    },
    {
      name: 'GitHub',
      icon: 'fa6-brands:github',
      url: 'https://github.com/Greg-Aster',
    },
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: false, // No mortal laws apply to Merkin
}

