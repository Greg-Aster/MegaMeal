// Import types
import type { 
  CommunityConfig,
  DiscordConfig,
  ContactConfig,
  NewsletterConfig,
  EventsConfig,
  GuidelinesConfig,
  HeroConfig
} from '../types/communityconfig';

// Community page configuration
export const communityConfig: CommunityConfig = {
  hero: {
    title: "Join Our Community",
    description: "Connect with other members, share ideas, get help, and stay updated on the latest developments.",
    showGraphic: true,
    options: []
  },
  discord: {
    enabled: true,
    title: "Discord Community",
    description: "",
    inviteUrl: "",
    buttonText: "",
    features: [],
    channels: []
  },
  contact: {
    enabled: true,
    title: "Get in Touch",
    description: "",
    formActionUrl: "",
    buttonText: "",
    features: [],
    formFields: {
      name: {},
      email: {},
      subject: {},
      message: {}
    }
  },
  newsletter: {
    enabled: false,
    title: "Newsletter",
    description: "",
    buttonText: "",
    features: [],
    consentText: ""
  },
  events: {
    enabled: false,
    title: "Events",
    description: "",
    calendarButtonText: "",
    calendarUrl: ""
  },
  guidelines: {
    enabled: true,
    title: "Community Guidelines",
    description: "",
    items: []
  }
}