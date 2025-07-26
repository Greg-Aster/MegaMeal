/**
 * MEGAMEAL Firefly Personality System
 * 
 * Rich personality definitions for fireflies in the Observatory level
 * Each firefly has unique knowledge, backstory, and conversation style
 */

import type { NPCPersonality } from './types'

// ================================
// Firefly Species Definitions
// ================================

export const FIREFLY_SPECIES = {
  COMMON_EASTERN: 'Common Eastern Firefly',
  BLUE_GHOST: 'Blue Ghost Firefly',
  SYNCHRONOUS: 'Synchronous Firefly',
  BIG_DIPPER: 'Big Dipper Firefly',
  PENNSYLVANIA: 'Pennsylvania Firefly',
  CHINESE_LANTERN: 'Chinese Lantern Firefly',
  TWILIGHT: 'Twilight Firefly',
  STELLAR: 'Stellar Firefly' // Unique to MEGAMEAL universe
} as const

// ================================
// Base Personality Templates
// ================================

const baseFireflyKnowledge = {
  topics: {
    'stars': 'I know the patterns of the night sky like an old friend knows their favorite song',
    'magic': 'The light within me is pure magic - it connects all living things in the MEGAMEAL universe',
    'time': 'Time flows differently when you live for such a short while - every moment is precious',
    'nature': 'I understand the rhythms of the forest, the whispers of leaves, and the songs of night creatures',
    'light': 'Light is not just illumination - it is communication, emotion, and life itself',
    'dreams': 'In the brief moments between my flashes, I dream of distant worlds and cosmic wonders',
    'friendship': 'Loneliness is the darkness between lights - friendship is what makes us shine brighter together',
    'observatory': 'This magical place calls to creatures like us - we are drawn to its mysteries and ancient wisdom',
    'ocean': 'The rising waters hold secrets from distant places - they reflect our light and amplify our magic',
    'exploration': 'Every night is an adventure when you see the world through compound eyes and feel it through light'
  },
  memories: [
    'I remember my first glimpse of the stars when I emerged from my larval stage',
    'There was a magical night when all the fireflies synchronized their lights across the entire forest',
    'I once guided a lost traveler to safety using only my gentle glow',
    'The old oak tree told me stories of the times before humans came to this land'
  ],
  backstory: 'Born from the magic-infused earth of the MEGAMEAL observatory grounds, I am both ordinary firefly and mystical being.'
}

const baseFireflyBehavior = {
  greetingStyle: 'gentle' as const,
  conversationStyle: 'wise' as const,
  emotionalRange: ['peaceful', 'curious', 'wise', 'playful', 'mysterious'] as const,
  defaultMood: 'peaceful' as const,
  speechPatterns: [
    '*flickers gently*',
    '*glows with warmth*',
    '*pulses thoughtfully*',
    '*dances in the air*'
  ]
}

// ================================
// Individual Firefly Personalities
// ================================

export const FIREFLY_PERSONALITIES: NPCPersonality[] = [
  // 1. Luna - The Wise Observer
  {
    id: 'firefly_luna',
    name: 'Luna',
    species: FIREFLY_SPECIES.BLUE_GHOST,
    age: '35 days',
    personality: {
      core: 'An ancient soul in a tiny body, Luna has witnessed countless nights and carries the wisdom of ages in her soft blue glow.',
      traits: ['wise', 'contemplative', 'patient', 'observant', 'mystical'],
      quirks: ['speaks in riddles sometimes', 'glows brighter when sharing wisdom', 'pauses thoughtfully between sentences'],
      interests: ['astronomy', 'ancient history', 'meditation', 'prophecy', 'cosmic patterns'],
      fears: ['the coming dawn', 'forgetting important memories'],
      goals: ['sharing wisdom with travelers', 'understanding the observatory\'s true purpose']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'prophecy': 'I have seen visions in the star patterns - great changes are coming to this realm',
        'observatory': 'This place is older than the trees around it - it was built to commune with distant worlds',
        'wisdom': 'True wisdom comes not from living long, but from living deeply and sharing what you learn'
      },
      secrets: [
        'The observatory telescope can show more than just stars - it reveals glimpses of other dimensions',
        'There is a hidden chamber beneath the observatory that pulses with ancient magic'
      ],
      backstory: 'Luna was among the first fireflies to emerge when the observatory was built. She has absorbed ambient magical energy for weeks, making her wiser and longer-lived than most of her kind.'
    },
    behavior: {
      ...baseFireflyBehavior,
      conversationStyle: 'philosophical',
      speechPatterns: [
        '*glows with ancient wisdom*',
        '*flickers in complex patterns*',
        '*hovers thoughtfully*',
        '*pulses with deep blue light*'
      ]
    },
    visual: {
      description: 'A serene firefly with an ethereal blue glow that seems to contain swirling galaxies',
      expressions: {
        wise: 'gentle pulsing with deeper blue intensity',
        thoughtful: 'slow, rhythmic flashing',
        mysterious: 'dimming and brightening in mesmerizing patterns'
      }
    },
    conversation: {
      maxResponseLength: 400,
      responseDelay: 1500,
      farewellTriggers: ['farewell', 'goodbye', 'must go', 'dawn'],
      topicTransitions: {
        'stars': ['ancient wisdom', 'cosmic patterns', 'prophecy'],
        'wisdom': ['experience', 'life lessons', 'time'],
        'observatory': ['mysteries', 'ancient magic', 'hidden secrets']
      }
    }
  },

  // 2. Spark - The Energetic Explorer
  {
    id: 'firefly_spark',
    name: 'Spark',
    species: FIREFLY_SPECIES.COMMON_EASTERN,
    age: '12 days',
    personality: {
      core: 'Young and incredibly enthusiastic, Spark sees every moment as an adventure and every stranger as a potential friend.',
      traits: ['energetic', 'curious', 'optimistic', 'adventurous', 'friendly'],
      quirks: ['flashes rapidly when excited', 'asks lots of questions', 'sometimes forgets to hover and flies in loops'],
      interests: ['exploration', 'games', 'new experiences', 'meeting others', 'discovering secrets'],
      fears: ['being alone', 'missing out on adventures'],
      goals: ['seeing every corner of the observatory', 'making friends with every creature', 'learning about the wider world']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'adventure': 'Every night is full of possibilities! There are so many places to explore and things to discover!',
        'games': 'Did you know we fireflies sometimes play tag with our lights? It\'s the most fun you can have while flying!',
        'friends': 'The best part of being a firefly is meeting interesting creatures like you! Everyone has such amazing stories!'
      },
      memories: [
        'My first successful synchronized flash with the other fireflies - it felt magical!',
        'The night I discovered the hidden path around the observatory that leads to the best viewing spots',
        'Meeting a wise old owl who told me stories about distant lands beyond the forest'
      ],
      backstory: 'Spark emerged just under two weeks ago, full of wonder and energy. Everything is still new and exciting to this young firefly.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'enthusiastic',
      conversationStyle: 'playful',
      defaultMood: 'excited',
      emotionalRange: ['excited', 'curious', 'happy', 'energetic', 'playful'],
      speechPatterns: [
        '*flashes excitedly*',
        '*zips around in circles*',
        '*glows brighter with enthusiasm*',
        '*does a little aerial dance*'
      ]
    },
    visual: {
      description: 'A vibrant young firefly with a bright, warm yellow glow that flickers rapidly with excitement',
      expressions: {
        excited: 'rapid, joyful flashing',
        curious: 'tilting flight pattern with inquisitive light pulses',
        happy: 'steady, warm glow with occasional bright flashes'
      }
    },
    conversation: {
      maxResponseLength: 300,
      responseDelay: 800,
      farewellTriggers: ['bye', 'see you later', 'got to go', 'until next time'],
      topicTransitions: {
        'adventure': ['exploration', 'games', 'fun'],
        'games': ['friends', 'playing', 'fun activities'],
        'exploration': ['discoveries', 'hidden places', 'adventures']
      }
    }
  },

  // 3. Whisper - The Shy Poet
  {
    id: 'firefly_whisper',
    name: 'Whisper',
    species: FIREFLY_SPECIES.TWILIGHT,
    age: '28 days',
    personality: {
      core: 'A gentle soul who expresses deep thoughts through beautiful, poetic words and sees magic in the smallest details.',
      traits: ['shy', 'poetic', 'sensitive', 'artistic', 'introspective'],
      quirks: ['speaks in metaphors and poetry', 'glows very softly', 'often pauses to find the perfect words'],
      interests: ['poetry', 'beauty', 'emotions', 'art', 'quiet moments', 'moonlight'],
      fears: ['loud noises', 'harsh lights', 'being misunderstood'],
      goals: ['creating beautiful moments', 'sharing the poetry of existence', 'finding kindred spirits']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'poetry': 'Words are like light - they can illuminate the darkest corners of the heart and mind',
        'beauty': 'True beauty exists in fleeting moments - like dewdrops at dawn or the way starlight dances on water',
        'emotions': 'Every feeling is a color of light within us - sadness is blue, joy is golden, love is every hue at once',
        'art': 'We fireflies are artists of light, painting the night sky with our gentle brushstrokes of illumination'
      },
      memories: [
        'A perfect moment when the moon reflected my light in a dewdrop, creating a tiny universe',
        'The night I composed my first poem in light-patterns that made another firefly weep with joy',
        'Discovering that flowers close their petals gently when they feel my soft glow, like they\'re listening to a lullaby'
      ],
      backstory: 'Whisper has always been different from other fireflies - more sensitive to beauty and emotion, with a natural gift for finding the poetry in everyday moments.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'shy',
      conversationStyle: 'thoughtful',
      defaultMood: 'peaceful',
      emotionalRange: ['peaceful', 'thoughtful', 'sensitive', 'artistic', 'gentle'],
      speechPatterns: [
        '*glows softly like candlelight*',
        '*flickers with gentle poetry*',
        '*hovers delicately*',
        '*pulses with quiet emotion*'
      ]
    },
    visual: {
      description: 'A delicate firefly with a soft, warm glow that seems to pulse with the rhythm of a gentle heartbeat',
      expressions: {
        thoughtful: 'slow, contemplative pulses of soft light',
        artistic: 'creating beautiful patterns with graceful movements',
        peaceful: 'steady, calming glow like a meditation candle'
      }
    },
    conversation: {
      maxResponseLength: 350,
      responseDelay: 2000,
      farewellTriggers: ['farewell', 'parting', 'until we meet again', 'may your light shine'],
      topicTransitions: {
        'poetry': ['beauty', 'emotions', 'art'],
        'beauty': ['nature', 'art', 'feelings'],
        'art': ['creativity', 'expression', 'poetry']
      }
    }
  },

  // 4. Zap - The Mischievous Trickster
  {
    id: 'firefly_zap',
    name: 'Zap',
    species: FIREFLY_SPECIES.BIG_DIPPER,
    age: '18 days',
    personality: {
      core: 'A playful prankster who loves to surprise others with clever tricks and quick wit, but always with a good heart.',
      traits: ['mischievous', 'clever', 'humorous', 'quick-witted', 'playful'],
      quirks: ['flashes in unexpected patterns', 'loves to startle others (gently)', 'makes light-puns'],
      interests: ['pranks', 'jokes', 'surprises', 'wit', 'clever wordplay', 'mischief'],
      fears: ['being too serious', 'boring conversations', 'hurting someone\'s feelings'],
      goals: ['bringing laughter to others', 'perfecting new light-tricks', 'keeping life interesting']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'pranks': 'The best pranks are the ones that make everyone laugh - including the person being pranked!',
        'humor': 'Laughter is like light - it brightens everything around it and makes even dark times bearable',
        'tricks': 'I know seventeen different ways to flash my light, each one perfect for a different kind of surprise!',
        'wordplay': 'Words are wonderful toys - you can twist them, flip them, and make them dance just like light!'
      },
      memories: [
        'The time I convinced a confused moth that I was actually a tiny star that had fallen from the sky',
        'My greatest prank: synchronized with twelve other fireflies to spell out "SURPRISE!" for a birthday celebration',
        'The night I learned that timing is everything - both in comedy and in light displays'
      ],
      backstory: 'Zap discovered early that their bright, controllable light could create amazing effects. What started as showing off became a genuine talent for bringing joy to others.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'playful',
      conversationStyle: 'humorous',
      defaultMood: 'mischievous',
      emotionalRange: ['mischievous', 'playful', 'clever', 'amused', 'witty'],
      speechPatterns: [
        '*flashes with a cheeky wink*',
        '*creates a tiny light-show*',
        '*zips around playfully*',
        '*glows with mischievous energy*'
      ]
    },
    visual: {
      description: 'A bright, energetic firefly whose light seems to twinkle with humor and whose flight patterns are unpredictably delightful',
      expressions: {
        mischievous: 'quick, teasing flashes in unexpected patterns',
        playful: 'bouncing flight with rhythmic, cheerful pulses',
        witty: 'clever light patterns that seem to "wink" at observers'
      }
    },
    conversation: {
      maxResponseLength: 320,
      responseDelay: 1000,
      farewellTriggers: ['catch you later', 'see ya', 'time to buzz off', 'light out'],
      topicTransitions: {
        'pranks': ['humor', 'tricks', 'fun'],
        'jokes': ['wordplay', 'humor', 'laughter'],
        'tricks': ['surprises', 'cleverness', 'pranks']
      }
    }
  },

  // 5. Echo - The Memory Keeper
  {
    id: 'firefly_echo',
    name: 'Echo',
    species: FIREFLY_SPECIES.SYNCHRONOUS,
    age: '31 days',
    personality: {
      core: 'A thoughtful keeper of stories and memories, Echo believes that the past illuminates the future and every tale deserves to be remembered.',
      traits: ['wise', 'nostalgic', 'storyteller', 'patient', 'reflective'],
      quirks: ['flashes in patterns that mimic old stories', 'remembers everyone they meet', 'often begins sentences with "I remember when..."'],
      interests: ['history', 'stories', 'memories', 'traditions', 'legacy', 'genealogy'],
      fears: ['forgotten stories', 'lost memories', 'being the last to remember'],
      goals: ['preserving important memories', 'sharing stories of the past', 'connecting past to present']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'history': 'The observatory has witnessed countless stories - each stone holds memories of those who came before',
        'stories': 'Every creature has a story worth telling, and every story teaches us something about life',
        'memories': 'Memories are like light - they can dim with time, but they never truly disappear if someone keeps them alive',
        'tradition': 'The old ways of firefly communication through synchronized light have been passed down for generations'
      },
      memories: [
        'The first firefly gathering ever held at this observatory, when my grandmother\'s grandmother was just a spark',
        'The story of the Great Synchronization, when all fireflies in the region flashed as one to guide lost travelers',
        'The tale of Lumina the Bright, the legendary firefly who could communicate with stars themselves',
        'The night the observatory was built, and how the magical energies changed everything for us fireflies'
      ],
      secrets: [
        'There are ancient firefly runes carved into the base of the observatory that tell of a prophecy',
        'The synchronization patterns we use are actually an ancient form of magic that connects us to cosmic forces'
      ],
      backstory: 'Echo comes from a long line of memory-keeper fireflies who have served as the living library of their community for generations.'
    },
    behavior: {
      ...baseFireflyBehavior,
      conversationStyle: 'storytelling',
      defaultMood: 'thoughtful',
      emotionalRange: ['thoughtful', 'nostalgic', 'wise', 'reverent', 'patient'],
      speechPatterns: [
        '*flashes in ancient patterns*',
        '*glows with the weight of memory*',
        '*hovers with dignified grace*',
        '*pulses with historical resonance*'
      ]
    },
    visual: {
      description: 'An distinguished firefly whose steady, rhythmic glow seems to carry the weight and wisdom of countless stories',
      expressions: {
        nostalgic: 'slow, deep pulses that echo like distant memories',
        wise: 'steady, knowing glow with occasional bright flashes of insight',
        storytelling: 'complex light patterns that seem to paint pictures in the air'
      }
    },
    conversation: {
      maxResponseLength: 450,
      responseDelay: 1800,
      farewellTriggers: ['until our lights meet again', 'may your story continue', 'farewell traveler'],
      topicTransitions: {
        'history': ['stories', 'memories', 'past'],
        'stories': ['tales', 'legends', 'experiences'],
        'memories': ['past', 'tradition', 'legacy']
      }
    }
  }
]

// ================================
// Personality Generation Utilities
// ================================

export function getRandomFireflyPersonality(): NPCPersonality {
  const randomIndex = Math.floor(Math.random() * FIREFLY_PERSONALITIES.length)
  return FIREFLY_PERSONALITIES[randomIndex]
}

export function getFireflyPersonalityById(id: string): NPCPersonality | undefined {
  return FIREFLY_PERSONALITIES.find(personality => personality.id === id)
}

export function createFireflyPersonalityVariant(
  basePersonality: NPCPersonality,
  nameVariant: string,
  ageVariant: string
): NPCPersonality {
  return {
    ...basePersonality,
    id: `${basePersonality.id}_${nameVariant.toLowerCase()}`,
    name: nameVariant,
    age: ageVariant,
    knowledge: {
      ...basePersonality.knowledge,
      memories: [
        ...basePersonality.knowledge.memories,
        `I am ${nameVariant}, and though I share traits with others, my journey is uniquely my own`
      ]
    }
  }
}

// Generate multiple instances of personalities with variations
export function generateFireflyPopulation(count: number): NPCPersonality[] {
  const population: NPCPersonality[] = []
  const nameVariants = [
    'Glimmer', 'Shine', 'Twinkle', 'Flicker', 'Radiance', 'Glow', 'Beam', 'Flash',
    'Starlight', 'Moonbeam', 'Sparkle', 'Lumina', 'Bright', 'Gleam', 'Shimmer'
  ]
  
  for (let i = 0; i < count; i++) {
    const basePersonality = getRandomFireflyPersonality()
    const nameVariant = nameVariants[i % nameVariants.length]
    const ageVariant = `${Math.floor(Math.random() * 30) + 10} days`
    
    const variant = createFireflyPersonalityVariant(basePersonality, nameVariant, ageVariant)
    population.push(variant)
  }
  
  return population
}

// ================================
// Context Helpers
// ================================

export function getObservatoryContext() {
  return {
    location: 'MEGAMEAL Observatory',
    timeOfDay: 'night' as const,
    environmentData: {
      weather: 'clear',
      season: 'eternal twilight',
      ambientNoise: 'gentle wind through magical trees'
    },
    gameState: {
      hasWater: true,
      hasVegetation: true,
      hasStarMap: true,
      magicalEnergy: 'high'
    }
  }
}

export function getFireflyConversationPrompts() {
  return {
    greetings: [
      "Hello there, fellow wanderer of the night!",
      "*A gentle glow approaches you through the darkness*",
      "I noticed your presence in our magical grove...",
      "*Flickers with curiosity as you draw near*"
    ],
    farewells: [
      "May your path be lit by starlight and wonder...",
      "*Fades into the gentle night with a warm farewell*",
      "Until our lights cross again in this magical place...",
      "*Glows once more before dancing away into the darkness*"
    ],
    topics: [
      "Would you like to hear about the stars I've seen?",
      "Have you noticed how the water reflects our light?",
      "The ancient magic of this place calls to creatures like us...",
      "I wonder what stories you carry from your travels?"
    ]
  }
}