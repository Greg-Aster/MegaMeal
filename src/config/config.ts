import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from '../types/config'
import { LinkPreset } from '../types/config'
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from '@constants/constants.ts'


export const siteConfig: SiteConfig = {
  title: "MEGA MEAL SAGA",
  subtitle: "Consuming Time Itself Since 3042",
  lang: "en",
  themeColor: {
    hue: 220, // Blue hue for cosmic horror
    fixed: false
  },
  transparency: 0.5, // Single value from 0 to 1
  defaultTheme: DARK_MODE, // Dark mode fits the cosmic horror vibe
  banner: {
    enable: true,
    src: "/posts/timeline/golden-era.png", // Using one of your timeline backgrounds
    position: "center",
    credit: {
      enable: false,
      text: "Corporate Archives Division",
      url: ""
    }
  },
  toc: {
    enable: true,
    depth: 3
  },
  favicon: []
}

export const navBarConfig: NavBarConfig = {
  links: [
    0,
    {
      name: "Gastronomy",
      url: "#",
      dropdown: [
        { name: "Cookbook", url: "/cookbook/" },
        { name: "Resturant Reviews", url: "/reviews/" }
      ]
    },
    3,
    1,
    2
  ]
}

export const profileConfig: ProfileConfig = {
  avatar: "/src/content/avatar/avatar.png",
  name: "MEGA MEAL SAGA",
  bio: "Cosmic Horror and Food.",
  links: [
    {
      name: "Interdimensional Transit",
      icon: "fa6-brands:discord",
      url: "https://discord.gg/megameal"
    },
    {
      name: "Temporal Archives",
      icon: "fa6-brands:github",
      url: "https://github.com/megameal"
    },
    {
      name: "Quantum Communications",
      icon: "fa6-brands:bluesky",
      url: "https://bsky.app/profile/megameal"
    }
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: "Corporate Holdings Act 3042-B",
  url: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
}