import exp from 'node:constants'

export const UNCATEGORIZED = '__uncategorized__'

export const PAGE_SIZE = 8

export const LIGHT_MODE = 'light',
  DARK_MODE = 'dark',
  AUTO_MODE = 'auto'

// Banner height unit: vh
export const BANNER_HEIGHT = 50
export const BANNER_HEIGHT_MOBILE = 35 // Smaller height for mobile
export const BANNER_HEIGHT_EXTEND = 30
export const BANNER_HEIGHT_EXTEND_MOBILE = 20 // Smaller extend for mobile
export const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND
export const BANNER_HEIGHT_HOME_MOBILE =
  BANNER_HEIGHT_MOBILE + BANNER_HEIGHT_EXTEND_MOBILE // smaller height for mobile

// The height the main panel overlaps the banner, unit: rem
export const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT = 4.5
export const MAIN_PANEL_OVERLAPS_BANNER_HEIGHT_MOBILE = 2 // Smaller height for mobile

// Page width: rem
export const PAGE_WIDTH = 85
