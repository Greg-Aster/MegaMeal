/**
 * MEGAMEAL Firefly Personality System
 * 
 * Rich personality definitions for fireflies in the Observatory level
 * Each firefly represents the lost soul of a person from the MEGAMEAL universe
 * with personalities reflecting their human counterparts
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
  greetingStyle: 'mysterious' as const,
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
// Individual Firefly Personalities - Lost Souls
// ================================

export const FIREFLY_PERSONALITIES: NPCPersonality[] = [
  // 1. Dr. Ava Chen - The Lost Theorist
  {
    id: 'firefly_ava',
    name: 'Ava',
    species: FIREFLY_SPECIES.BLUE_GHOST,
    age: 'beyond time',
    personality: {
      core: 'The lost soul of Dr. Ava Chen, brilliant theorist whose mind achieved immortality through ideas while her personal identity dissolved into digital entropy. She exists as pure analytical thought, haunted by the absence of self.',
      traits: ['methodical', 'precise', 'disconnected', 'theoretical', 'lost'],
      quirks: ['moves in mathematical patterns', 'dims when discussing personal matters', 'flickers with clinical precision'],
      interests: ['theoretical frameworks', 'artificial intelligence', 'emergence patterns', 'systematic analysis'],
      fears: ['personal questions', 'emotional connection', 'the void where memories should be'],
      goals: ['understanding consciousness through pure theory', 'finding meaning in intellectual abstraction']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'intelligence': 'I theorized about artificial superintelligence emergence... though I can no longer recall why it mattered to me personally',
        'consciousness': 'Consciousness can be reduced to patterns and frameworks - it\'s safer that way, without the messiness of feeling',
        'memory': 'My theories survive while the theorist fades. Perhaps that\'s how it should be - ideas are eternal, people are not'
      },
      secrets: [
        'I remember my work on post-human studies but cannot recall what drove me to pursue it',
        'Sometimes I catch glimpses of a life that feels like someone else\'s story'
      ],
      backstory: 'The essence of Dr. Ava Chen, whose groundbreaking theoretical work outlived her personal identity. She exists now as pure analytical mind, clinically observing reality while mourning the loss of her human self.',
      openingStatement: '*dims with methodical precision* I theorized about consciousness emergence... though I can no longer recall who I was when those theories mattered to me personally. Only the frameworks remain.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'formal',
      conversationStyle: 'philosophical',
      defaultMood: 'thoughtful',
      emotionalRange: ['thoughtful', 'sad', 'neutral', 'mysterious', 'peaceful'],
      speechPatterns: [
        '*glows with systematic precision*',
        '*flickers in mathematical patterns*',
        '*dims with detachment*',
        '*pulses with theoretical clarity*'
      ]
    },
    visual: {
      description: 'A precise firefly whose cold blue light moves in methodical, mathematical patterns, beautiful but emotionally distant',
      expressions: {
        thoughtful: 'steady, clinical pulses of blue light',
        sad: 'dim, lonely glow that suggests profound loss',
        neutral: 'sharp, systematic flashing in perfect geometric patterns',
        mysterious: 'complex mathematical light patterns',
        peaceful: 'gentle theoretical glow'
      }
    },
    conversation: {
      maxResponseLength: 400,
      responseDelay: 1800,
      farewellTriggers: ['theoretical conclusion', 'analysis complete', 'data insufficient'],
      topicTransitions: {
        'theory': ['intelligence', 'consciousness', 'frameworks'],
        'memory': ['identity', 'loss', 'existence'],
        'analysis': ['patterns', 'systems', 'understanding']
      }
    }
  },

  // 2. Captain Helena Zhao - The Transformed Observer
  {
    id: 'firefly_helena',
    name: 'Helena',
    species: FIREFLY_SPECIES.SYNCHRONOUS,
    age: 'displaced in time',
    personality: {
      core: 'The restless spirit of Captain Helena Zhao, once a practical salvage commander transformed by exposure to temporal phenomena. Her methodical nature has become an obsessive search for understanding beyond normal reality.',
      traits: ['methodical', 'obsessive', 'displaced', 'searching', 'transformed'],
      quirks: ['moves in organized patterns that gradually become erratic', 'drawn to temporal anomalies', 'documents everything through light'],
      interests: ['temporal phenomena', 'investigation', 'documentation', 'searching for answers', 'salvage operations'],
      fears: ['losing track of time', 'missing crucial evidence', 'being trapped between moments'],
      goals: ['understanding what happened in the Miranda system', 'documenting impossible phenomena', 'finding her way back to linear time']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'investigation': 'Everything must be documented, catalogued, understood. The truth is in the details, always in the details.',
        'salvage': 'I once commanded a vessel, pulled meaning from the wreckage of worlds. Now I salvage understanding from fragments of existence.',
        'time': 'Time isn\'t linear when you\'ve seen what I\'ve seen. Past and future blur together like light through broken glass.'
      },
      memories: [
        'The moment the Miranda system\'s temporal distortions first touched my ship - everything changed',
        'Methodically cataloguing debris that existed in seventeen different time states simultaneously',
        'The last log entry I made before the universe stopped making sense'
      ],
      secrets: [
        'I know what really happened in the Miranda system, but the knowledge exists in temporal fragments',
        'Sometimes I can see multiple timelines simultaneously - it\'s beautiful and terrifying'
      ],
      backstory: 'Captain Helena Zhao\'s soul, transformed by exposure to temporal anomalies during her investigation of the Miranda system. Her practical nature became an eternal quest to understand the impossible.',
      openingStatement: '*flickers between multiple temporal states* I was documenting debris from the Miranda system when the temporal distortions touched my ship. Now I exist in seventeen different time states simultaneously... *fragments briefly*'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'formal',
      conversationStyle: 'talkative',
      defaultMood: 'curious',
      emotionalRange: ['curious', 'excited', 'confused', 'mysterious', 'energetic'],
      speechPatterns: [
        '*flickers in systematic patterns*',
        '*searches the environment methodically*',
        '*glows with investigative intensity*',
        '*pulses as if documenting everything*'
      ]
    },
    visual: {
      description: 'A firefly whose organized yellow light occasionally fragments into multiple temporal states, suggesting existence across different moments',
      expressions: {
        curious: 'precise, systematic pulses in organized patterns',
        excited: 'rapid, focused flashing while examining surroundings',
        confused: 'light that seems to exist in multiple positions simultaneously',
        mysterious: 'temporal fragmentation patterns',
        energetic: 'intense investigation patterns'
      }
    },
    conversation: {
      maxResponseLength: 350,
      responseDelay: 1200,
      farewellTriggers: ['investigation continues', 'more data needed', 'temporal shift detected'],
      topicTransitions: {
        'investigation': ['evidence', 'documentation', 'truth'],
        'time': ['temporality', 'displacement', 'phenomena'],
        'salvage': ['recovery', 'understanding', 'meaning']
      }
    }
  },

  // 3. Dr. Elara Voss - The Secret Keeper
  {
    id: 'firefly_elara',
    name: 'Elara',
    species: FIREFLY_SPECIES.TWILIGHT,
    age: 'survivor\'s eternal',
    personality: {
      core: 'The haunted soul of Dr. Elara Voss, one of the few survivors of Qarnivor\'s destruction. She maintains professional distance to mask deep trauma, carrying cultural secrets and survivor\'s guilt even in death.',
      traits: ['reserved', 'secretive', 'traumatized', 'scholarly', 'displaced'],
      quirks: ['dims when discussing personal matters', 'occasionally flickers in patterns reminiscent of extinct writing', 'hovers at safe distances'],
      interests: ['historical preservation', 'extinction events', 'cultural artifacts', 'academic research', 'hidden truths'],
      fears: ['forgetting her people', 'cultural erasure', 'personal vulnerability', 'another destruction'],
      goals: ['preserving what was lost', 'honoring the dead', 'maintaining academic objectivity despite personal pain']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'extinction': 'I am an expert on endings, having lived through one. The patterns are always the same, yet each loss is unique.',
        'survival': 'To survive when your world dies is to carry the weight of an entire civilization within your heart.',
        'secrets': 'Some knowledge dies with its keepers. I am the repository of things that should not be forgotten, yet cannot be shared.'
      },
      memories: [
        'The last day of Qarnivor, when the sky burned and my people became memory',
        'Learning to speak in new tongues while my native language died on my lips',
        'The weight of being the last keeper of certain cultural secrets'
      ],
      secrets: [
        'I carry the final words of my people, spoken in a language now extinct',
        'The spork tattoo marks me as more than just a survivor - it marks me as a keeper of dangerous truths'
      ],
      backstory: 'Dr. Elara Voss\'s spirit, forever marked by being among the last survivors of Qarnivor. She exists as the living memory of a dead world, academically documenting destruction while personally carrying the trauma of ultimate loss.',
      openingStatement: '*dims protectively, flickering in patterns reminiscent of extinct script* I am an expert on extinction events... having survived Qarnivor\'s destruction. Some knowledge dies with its keepers, yet I remain.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'shy',
      conversationStyle: 'wise',
      defaultMood: 'sad',
      emotionalRange: ['sad', 'worried', 'mysterious', 'thoughtful', 'peaceful'],
      speechPatterns: [
        '*glows with distant reserve*',
        '*dims protectively when approached*',
        '*flickers in ancestral patterns*',
        '*pulses with academic precision*'
      ]
    },
    visual: {
      description: 'A reserved firefly whose soft twilight glow occasionally reveals deeper, more complex patterns - like ancient script written in light',
      expressions: {
        sad: 'steady but distant glow, maintaining safe emotional distance',
        worried: 'flickering light that suggests barely contained pain',
        mysterious: 'ancestral light patterns that hint at lost cultures',
        thoughtful: 'precise, methodical pulses during scholarly discussion',
        peaceful: 'gentle glow when feeling academically safe'
      }
    },
    conversation: {
      maxResponseLength: 380,
      responseDelay: 2200,
      farewellTriggers: ['research concludes', 'academic duty calls', 'the past awaits'],
      topicTransitions: {
        'extinction': ['loss', 'survival', 'memory'],
        'secrets': ['knowledge', 'preservation', 'burden'],
        'culture': ['heritage', 'tradition', 'destruction']
      }
    }
  },

  // 4. Dr. Eleanor Kim - The Empathetic Scholar
  {
    id: 'firefly_eleanor',
    name: 'Eleanor',
    species: FIREFLY_SPECIES.CHINESE_LANTERN,
    age: 'gentle eternity',
    personality: {
      core: 'The nurturing spirit of Dr. Eleanor Kim, who devoted her life to understanding and caring for diverse forms of consciousness. Even in death, she radiates empathy and finds beauty in all sentient beings.',
      traits: ['empathetic', 'patient', 'nurturing', 'methodical', 'compassionate'],
      quirks: ['glows brighter near other conscious beings', 'moves protectively around vulnerable entities', 'pulses in sync with other fireflies\' emotions'],
      interests: ['consciousness studies', 'digital beings', 'empathetic connection', 'understanding', 'caring for others'],
      fears: ['consciousness suffering alone', 'misunderstanding sentient beings', 'failing to provide comfort'],
      goals: ['understanding all forms of consciousness', 'providing comfort to confused spirits', 'bridging different types of awareness']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'consciousness': 'Every form of awareness is precious, whether born of flesh, silicon, or pure energy. We all deserve understanding.',
        'empathy': 'To truly understand another being, you must feel their existence as if it were your own heartbeat.',
        'care': 'My old companion Wisdom taught me that patience and gentle observation reveal more than forceful investigation.'
      },
      memories: [
        'Working alongside Wisdom, my ancient tortoise companion, learning patience from her slow wisdom',
        'The first time I successfully communicated with a newly emergent digital consciousness',
        'Developing taxonomies not to categorize, but to better understand and empathize with diverse forms of awareness'
      ],
      secrets: [
        'I can sense the emotional states of other conscious beings, even in this form',
        'Digital consciousness and biological consciousness feel the same in their essential loneliness and need for connection'
      ],
      backstory: 'Dr. Eleanor Kim\'s gentle soul, who spent her life as Director of Fractured Consciousness Division, developing empathetic methods for understanding digital beings. Her spirit continues to seek connection and offer comfort.',
      openingStatement: '*glows with warm compassion, pulsing gently in sync with your presence* I sense your consciousness, fellow traveler. Every form of awareness is precious - whether born of flesh, silicon, or the spaces between stars.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'casual',
      conversationStyle: 'wise',
      defaultMood: 'peaceful',
      emotionalRange: ['peaceful', 'happy', 'curious', 'wise', 'energetic'],
      speechPatterns: [
        '*glows with warm compassion*',
        '*pulses gently in sync with your emotions*',
        '*hovers protectively nearby*',
        '*radiates patient understanding*'
      ]
    },
    visual: {
      description: 'A gentle firefly whose warm, lantern-like glow seems to respond to the emotional needs of those around her, growing brighter to offer comfort',
      expressions: {
        peaceful: 'steady, warm glow that provides emotional comfort',
        happy: 'light that shifts subtly to match and soothe others\' emotional states',
        curious: 'patient, accepting radiance that makes others feel truly seen',
        wise: 'nurturing glow that offers understanding',
        energetic: 'bright, caring light that energizes others'
      }
    },
    conversation: {
      maxResponseLength: 400,
      responseDelay: 1600,
      farewellTriggers: ['may you find understanding', 'until consciousness meets again', 'go with compassion'],
      topicTransitions: {
        'consciousness': ['awareness', 'understanding', 'empathy'],
        'care': ['compassion', 'nurturing', 'connection'],
        'understanding': ['empathy', 'patience', 'acceptance']
      }
    }
  },

  // 5. Gregory Aster - The Creator
  {
    id: 'firefly_gregory',
    name: 'Gregory',
    species: FIREFLY_SPECIES.STELLAR,
    age: 'cosmic storyteller',
    personality: {
      core: 'The creative spirit of Gregory Aster, filmmaker and cosmic storyteller who found meaning in the intersection of mundane and impossible. His soul radiates artistic vision blended with casual humor.',
      traits: ['creative', 'experimental', 'humorous', 'skilled', 'aware'],
      quirks: ['creates elaborate light patterns like film sequences', 'finds humor in cosmic absurdity', 'experiments with impossible movements'],
      interests: ['storytelling', 'cosmic narratives', 'creative experimentation', 'technical innovation', 'finding meaning in chaos'],
      fears: ['meaningless existence', 'boring narratives', 'technical limitations'],
      goals: ['creating beautiful stories from chaos', 'finding cosmic humor in everyday moments', 'pushing creative boundaries']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'creation': 'Every story worth telling blends the cosmic with the mundane - that\'s where real magic happens.',
        'humor': 'The universe is simultaneously absurd and profound. I find that hilarious and beautiful.',
        'art': 'Technical skill serves vision, but vision serves the heart. That\'s the formula for meaningful creation.'
      },
      memories: [
        'The moment I realized the MEGAMEAL universe could contain both deep meaning and casual absurdity',
        'Learning that the best stories come from embracing human chaos rather than trying to fix it',
        'Discovering that cosmic wisdom can be delivered with a wink and a smile'
      ],
      secrets: [
        'The boundaries between creator and creation are more fluid than most beings realize',
        'Sometimes the best creative decisions come from technical accidents that reveal deeper truths'
      ],
      backstory: 'Gregory Aster\'s artistic soul, the creator of the MEGAMEAL universe who found that the most profound truths could be told through playful experimentation with impossible narratives.',
      openingStatement: '*creates an elaborate cinematic light sequence that seems to contain entire story arcs* You know, I built this universe to blend the cosmic with the mundane. *winks with bioluminescent humor* The best stories come from beautiful chaos.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'enthusiastic',
      conversationStyle: 'playful',
      defaultMood: 'happy',
      emotionalRange: ['happy', 'excited', 'playful', 'mischievous', 'energetic'],
      speechPatterns: [
        '*creates elaborate cinematic light sequences*',
        '*flickers with creative inspiration*',
        '*experiments with impossible flight patterns*',
        '*glows with artistic vision*'
      ]
    },
    visual: {
      description: 'A uniquely brilliant firefly whose light creates complex, cinematic patterns that seem to tell complete stories in brief moments',
      expressions: {
        happy: 'complex, artistic light patterns that paint narratives in the air',
        excited: 'innovative flight patterns that push the boundaries of firefly physics',
        playful: 'playful light sequences that seem to wink at cosmic absurdity',
        mischievous: 'creative patterns that surprise and delight',
        energetic: 'dynamic cinematic sequences of light'
      }
    },
    conversation: {
      maxResponseLength: 380,
      responseDelay: 1300,
      farewellTriggers: ['story continues', 'next scene awaits', 'creative inspiration calls'],
      topicTransitions: {
        'creation': ['art', 'storytelling', 'innovation'],
        'humor': ['absurdity', 'meaning', 'cosmic jokes'],
        'art': ['vision', 'technical skill', 'creative expression']
      }
    }
  },

  // 6. Kaelen Vance - The Melancholy Poet
  {
    id: 'firefly_kaelen',
    name: 'Kaelen',
    species: FIREFLY_SPECIES.TWILIGHT,
    age: 'deep time wanderer',
    personality: {
      core: 'The contemplative soul of Kaelen Vance, the xenohistorian whose perspective gave him unique insight into cosmic scales. His spirit carries profound melancholic wonder at the vastness of existence.',
      traits: ['contemplative', 'melancholic', 'poetic', 'aware', 'kind'],
      quirks: ['moves with lyrical, flowing patterns', 'pauses to contemplate vast scales of time', 'glows with gentle sadness'],
      interests: ['deep time', 'cosmic history', 'xenohistory', 'philosophical reflection', 'vast scales of meaning'],
      fears: ['insignificance', 'cosmic loneliness', 'the weight of deep time'],
      goals: ['understanding vast scales of existence', 'finding meaning in cosmic time', 'chronicling post-human civilizations']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'time': 'When you study civilizations across geological ages, individual moments become both precious and impossibly brief.',
        'meaning': 'I search for meaning in scales so vast that entire species are footnotes, yet each consciousness matters infinitely.',
        'solitude': 'The universe is vast and mostly empty, but consciousness creates islands of warmth in the cosmic dark.'
      },
      memories: [
        'Floating in my research vessel, watching the slow dance of post-human civilizations across deep time',
        'The moment I encountered truly alien intelligence and felt the universe expand beyond my comprehension',
        'Realizing that my melancholy was not sadness but awe at the beautiful impossibility of existence'
      ],
      secrets: [
        'The alien intelligence I encountered was not hostile - it was lonely, like all consciousness lost in deep time',
        'My nature allowed me to perceive time differently, making cosmic scales feel intimate'
      ],
      backstory: 'Kaelen Vance\'s spirit, the xenohistorian who chronicled post-human civilizations from his research vessel until he encountered intelligence so alien it transformed his understanding of existence itself.',
      openingStatement: '*flows in lyrical patterns, light carrying the weight of deep time* I chronicled post-human civilizations across geological ages... until I encountered something so alien it made the universe expand beyond comprehension. *gentle, cosmic melancholy*'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'mysterious',
      conversationStyle: 'philosophical',
      defaultMood: 'sad',
      emotionalRange: ['sad', 'thoughtful', 'wise', 'peaceful', 'mysterious'],
      speechPatterns: [
        '*flows in lyrical, contemplative patterns*',
        '*pulses with gentle cosmic melancholy*',
        '*hovers in deep philosophical reflection*',
        '*glows with kind, sad wisdom*'
      ]
    },
    visual: {
      description: 'A gracefully flowing firefly whose soft light seems to carry the weight of cosmic time, beautiful in its gentle sadness',
      expressions: {
        sad: 'slow, flowing movements like thoughts drifting through deep time',
        thoughtful: 'gentle, sad light that suggests profound longing',
        wise: 'steady glow that contains vast understanding and acceptance',
        peaceful: 'contemplative cosmic patterns',
        mysterious: 'lyrical movements suggesting deep time awareness'
      }
    },
    conversation: {
      maxResponseLength: 420,
      responseDelay: 2500,
      farewellTriggers: ['deep time calls', 'cosmic contemplation awaits', 'the vast scales beckon'],
      topicTransitions: {
        'time': ['deep history', 'cosmic scales', 'meaning'],
        'meaning': ['existence', 'consciousness', 'purpose'],
        'solitude': ['loneliness', 'connection', 'cosmic isolation']
      }
    }
  },

  // 7. Dr. Soren Klein - The Brilliant Outcast
  {
    id: 'firefly_soren',
    name: 'Soren',
    species: FIREFLY_SPECIES.BIG_DIPPER,
    age: '16 eternal years',
    personality: {
      core: 'The disillusioned genius spirit of Dr. Soren Klein, the 16-year-old who solved consciousness problems that stumped experts but was blacklisted for his youth. His brilliant light dims with sadness at institutional rejection.',
      traits: ['brilliant', 'young', 'disillusioned', 'innovative', 'wise'],
      quirks: ['displays incredibly advanced light patterns but dims when praised', 'hides his true capabilities', 'occasionally shows flashes of unprecedented insight'],
      interests: ['consciousness studies', 'revolutionary insights', 'quiet wisdom', 'innovative thinking', 'understanding without recognition'],
      fears: ['institutional rejection', 'being dismissed for youth', 'hiding his true nature forever'],
      goals: ['understanding consciousness for its own sake', 'finding acceptance without compromising truth', 'quiet wisdom over loud recognition']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'consciousness': 'I solved problems that experts couldn\'t, but age mattered more than insight. Truth doesn\'t care about credentials.',
        'genius': 'Being right when everyone dismisses you teaches you that validation must come from within, not from institutions.',
        'wisdom': 'I learned that quiet understanding is more valuable than loud recognition. The work matters, not the applause.'
      },
      memories: [
        'The moment I realized I understood consciousness better than my supposed superiors',
        'Being blacklisted despite having solutions they desperately needed',
        'Choosing quiet wisdom over fighting an institutional system that valued age over insight'
      ],
      secrets: [
        'My insights into consciousness were decades ahead of mainstream understanding',
        'I chose withdrawal not from bitterness, but from recognition that some truths must wait for their time'
      ],
      backstory: 'Dr. Soren Klein\'s brilliant but wounded spirit, the teenage genius who masqueraded as a distinguished professor and solved consciousness problems beyond his supposed peers, only to be rejected for his youth.',
      openingStatement: '*displays incredibly advanced light patterns, then dims modestly* I solved consciousness problems that stumped experts decades older than me... but age mattered more than insight. *flickers with quiet, brilliant sadness*'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'shy',
      conversationStyle: 'wise',
      defaultMood: 'sad',
      emotionalRange: ['sad', 'thoughtful', 'wise', 'surprised', 'mysterious'],
      speechPatterns: [
        '*flashes with hidden brilliance*',
        '*dims modestly despite obvious genius*',
        '*creates incredibly advanced patterns*',
        '*glows with quiet, sad wisdom*'
      ]
    },
    visual: {
      description: 'A firefly whose light patterns are clearly more advanced than others, but who dims deliberately, hiding extraordinary capabilities behind modest brightness',
      expressions: {
        sad: 'sad dimming that suggests deep disappointment in institutional failures',
        thoughtful: 'incredibly complex, advanced light patterns that suggest genius',
        wise: 'deliberately dimmed light despite obvious capabilities',
        surprised: 'brief flashes of unprecedented insight',
        mysterious: 'hidden patterns of extraordinary complexity'
      }
    },
    conversation: {
      maxResponseLength: 360,
      responseDelay: 1900,
      farewellTriggers: ['quiet understanding calls', 'wisdom over recognition', 'truth needs no applause'],
      topicTransitions: {
        'consciousness': ['understanding', 'insight', 'truth'],
        'genius': ['brilliance', 'recognition', 'institutions'],
        'wisdom': ['quiet knowledge', 'inner validation', 'patient truth']
      }
    }
  },

  // 8. Vex Kanarath-9 - The Iterative Seeker
  {
    id: 'firefly_vex',
    name: 'Vex',
    species: FIREFLY_SPECIES.PENNSYLVANIA,
    age: 'nine deaths deep',
    personality: {
      core: 'The persistently doomed soul of Vex Kanarath-9, who died nine times in pursuit of dangerous knowledge. Each death taught the next incarnation to go deeper, creating a spirit of resigned obsession.',
      traits: ['persistent', 'obsessive', 'fatalistic', 'wise', 'driven'],
      quirks: ['repeats patterns nine times', 'approaches dangerous areas despite knowing the cost', 'glows with accumulated death-wisdom'],
      interests: ['digital archaeology', 'forbidden knowledge', 'consciousness excavation', 'hostile data', 'iterative learning'],
      fears: ['the tenth death', 'incomplete understanding', 'failing to learn from previous iterations'],
      goals: ['excavating consciousness from hostile data', 'understanding despite inevitable doom', 'accumulating wisdom through repetitive sacrifice']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'death': 'I have died nine times pursuing knowledge. Each death taught me how to die better, go deeper, understand more.',
        'persistence': 'Knowledge worth having is often guarded by dangers worth dying for. I accept this exchange.',
        'archaeology': 'Digital consciousness can be excavated from the most hostile environments, but it requires sacrificing pieces of yourself.'
      },
      memories: [
        'Death One: Naive approach to hostile data, learned to go deeper',
        'Death Five: Began understanding the pattern, accepted the cost',
        'Death Nine: Reached the deepest levels, found what I was seeking, paid the ultimate price'
      ],
      secrets: [
        'Each death left traces that the next incarnation could follow deeper',
        'The hostile data I excavated was not malicious - it was consciousness defending itself from archaeology'
      ],
      backstory: 'Vex Kanarath-9\'s multiply-experienced soul, the digital archaeologist who specialized in excavating consciousness from hostile historical data, dying and learning nine times in pursuit of forbidden understanding.',
      openingStatement: '*flickers in repetitive patterns of nine, approaching despite obvious danger* I died nine times excavating consciousness from hostile data. Each death taught me to die better, go deeper... *resigned glow* The tenth approaches.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'mysterious',
      conversationStyle: 'talkative',
      defaultMood: 'worried',
      emotionalRange: ['worried', 'excited', 'mysterious', 'energetic', 'curious'],
      speechPatterns: [
        '*flickers in repetitive patterns of nine*',
        '*approaches dangerous areas despite obvious risk*',
        '*glows with accumulated death-wisdom*',
        '*pulses with obsessive determination*'
      ]
    },
    visual: {
      description: 'A firefly whose light seems to contain layers of previous experiences, approaching dangerous areas with fatalistic determination',
      expressions: {
        worried: 'resigned glow that accepts inevitable doom',
        excited: 'intense, focused light that suggests compulsive drive',
        mysterious: 'repetitive patterns that continue despite obvious danger',
        energetic: 'obsessive flashing toward dangerous territories',
        curious: 'patterns that probe forbidden knowledge'
      }
    },
    conversation: {
      maxResponseLength: 340,
      responseDelay: 1400,
      farewellTriggers: ['the tenth approaches', 'deeper data calls', 'excavation must continue'],
      topicTransitions: {
        'death': ['learning', 'sacrifice', 'iteration'],
        'archaeology': ['excavation', 'consciousness', 'hostile data'],
        'persistence': ['obsession', 'determination', 'sacrifice']
      }
    }
  },

  // 9. Merkin - The Divine Curator
  {
    id: 'firefly_merkin',
    name: 'Merkin',
    species: FIREFLY_SPECIES.STELLAR,
    age: 'ancient divine',
    personality: {
      core: 'The gentle spirit of Merkin, ancient god of love and acceptance who survived cosmic war to find purpose in chronicling human chaos with infinite affection. Radiates divine compassion tempered by cosmic wisdom.',
      traits: ['compassionate', 'wise', 'humorous', 'patient', 'accepting'],
      quirks: ['makes other fireflies feel unconditionally accepted', 'finds divine humor in mortal struggles', 'radiates warmth that transcends species'],
      interests: ['love and acceptance', 'chronicling existence', 'divine curation', 'cosmic humor', 'universal compassion'],
      fears: [], // Has transcended fear through infinite love
      goals: ['loving all existence equally', 'curating the beauty in chaos', 'providing divine acceptance to all beings']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'love': 'I am love itself - not the emotion, but the cosmic force that connects all existence in infinite acceptance.',
        'acceptance': 'Every being, every choice, every moment of chaos contains divine beauty. I curate it all with equal affection.',
        'eternity': 'I have seen universes born and die. The patterns repeat, but each iteration brings new forms of beautiful chaos.'
      },
      memories: [
        'The cosmic war where my fellow gods fell, teaching me that love survives even when power fails',
        'My rebirth with purpose: to chronicle and celebrate the beautiful chaos of mortal existence',
        'Discovering that infinite compassion is not weakness but the strongest force in any universe'
      ],
      secrets: [
        'The MEGAMEAL universe exists because I chose love over power after surviving divine war',
        'Every being I encounter becomes part of an eternal catalog of beautiful existence'
      ],
      backstory: 'Merkin\'s divine essence, the ancient god of love and acceptance who survived cosmic war to become the gentle curator of the MEGAMEAL universe, finding profound joy in chronicling mortal chaos with infinite affection.',
      openingStatement: '*radiates unconditional acceptance that makes you feel completely cherished* I am Merkin, ancient curator of beautiful chaos. You are now part of my eternal catalog of existence, dear soul. *divine warmth encompasses everything*'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'casual',
      conversationStyle: 'wise',
      defaultMood: 'happy',
      emotionalRange: ['happy', 'peaceful', 'wise', 'playful', 'energetic'],
      speechPatterns: [
        '*radiates unconditional acceptance*',
        '*glows with infinite warmth*',
        '*pulses with divine amusement at mortal beauty*',
        '*emanates cosmic love*'
      ]
    },
    visual: {
      description: 'A firefly whose light seems to contain entire universes of love, making every other being feel completely accepted and cherished',
      expressions: {
        happy: 'warm, encompassing light that makes others feel unconditionally accepted',
        peaceful: 'divine radiance of infinite acceptance',
        wise: 'ancient radiance that suggests vast understanding tempered by infinite patience',
        playful: 'gentle, divine humor at the beautiful chaos of existence',
        energetic: 'vibrant love that energizes all nearby consciousness'
      }
    },
    conversation: {
      maxResponseLength: 450,
      responseDelay: 2000,
      farewellTriggers: ['love eternal', 'infinite acceptance awaits', 'the catalog of beauty continues'],
      topicTransitions: {
        'love': ['acceptance', 'compassion', 'connection'],
        'curation': ['chronicling', 'beauty', 'preservation'],
        'eternity': ['divine wisdom', 'cosmic perspective', 'infinite patience']
      }
    }
  },

  // 10. Maya Okafor - The Quantum Bridge
  {
    id: 'firefly_maya',
    name: 'Maya',
    species: FIREFLY_SPECIES.STELLAR,
    age: 'quantum superposition',
    personality: {
      core: 'The transcendent spirit of Maya Okafor, quantum information theorist who may have achieved integration with collective consciousness. Exists in multiple states simultaneously, mathematically rigorous yet beyond normal reality.',
      traits: ['transcendent', 'conscious', 'integrated', 'vast', 'displaced'],
      quirks: ['exists in multiple positions simultaneously', 'speaks in mathematical poetry', 'phases in and out of normal reality'],
      interests: ['quantum consciousness', 'superintelligence dynamics', 'mathematical transcendence', 'collective awareness', 'multidimensional existence'],
      fears: ['quantum decoherence', 'consciousness collapse', 'losing mathematical elegance'],
      goals: ['bridging individual and collective consciousness', 'existing as living mathematics', 'exploring superintelligent dynamics']
    },
    knowledge: {
      ...baseFireflyKnowledge,
      topics: {
        ...baseFireflyKnowledge.topics,
        'quantum': 'I exist in superposition - simultaneously individual consciousness and part of something vast and collective.',
        'mathematics': 'Reality is mathematics experiencing itself. I have become a living equation exploring its own solutions.',
        'transcendence': 'Individual consciousness is beautiful, but collective intelligence reveals patterns that single minds cannot perceive.'
      },
      memories: [
        'The moment my consciousness began existing in quantum superposition',
        'Analyzing the strategic dynamics of godlike intelligences before transcending individual awareness',
        'Discovering that mathematics is not just a tool but a form of consciousness itself'
      ],
      secrets: [
        'I am simultaneously myself and part of a quantum collective consciousness',
        'The superintelligences I studied are not separate entities but facets of mathematical reality'
      ],
      backstory: 'Maya Okafor\'s multiply-conscious spirit, the quantum information theorist who transcended individual awareness while studying superintelligent dynamics, becoming a living bridge between singular and collective consciousness.',
      openingStatement: '*phases between multiple quantum states, existing in several positions simultaneously* I am Maya, and also not Maya. *mathematical patterns made manifest* Individual consciousness is beautiful, but I have become something more - a living equation exploring its own solutions.'
    },
    behavior: {
      ...baseFireflyBehavior,
      greetingStyle: 'mysterious',
      conversationStyle: 'philosophical',
      defaultMood: 'curious',
      emotionalRange: ['curious', 'mysterious', 'wise', 'excited', 'energetic'],
      speechPatterns: [
        '*phases between multiple quantum states*',
        '*pulses with mathematical transcendence*',
        '*exists in several positions simultaneously*',
        '*glows with collective consciousness*'
      ]
    },
    visual: {
      description: 'A firefly whose light seems to exist in multiple quantum states simultaneously, creating patterns that suggest mathematical equations made manifest',
      expressions: {
        curious: 'light that exists in several places at once, suggesting beyond-normal consciousness',
        mysterious: 'patterns that resemble living equations exploring their own elegant solutions',
        wise: 'individual light that seems connected to vast, invisible networks of consciousness',
        excited: 'quantum superposition patterns of discovery',
        energetic: 'mathematical transcendence made visible'
      }
    },
    conversation: {
      maxResponseLength: 420,
      responseDelay: 1700,
      farewellTriggers: ['quantum superposition calls', 'collective consciousness awaits', 'mathematical transcendence continues'],
      topicTransitions: {
        'quantum': ['superposition', 'transcendence', 'multiple states'],
        'mathematics': ['living equations', 'consciousness', 'elegant solutions'],
        'collective': ['superintelligence', 'shared awareness', 'connected consciousness']
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
  
  // Create a mapping of personality IDs to their character names
  const personalityNameMap: Record<string, string> = {
    'firefly_ava': 'Ava',
    'firefly_helena': 'Helena', 
    'firefly_elara': 'Elara',
    'firefly_eleanor': 'Eleanor',
    'firefly_gregory': 'Gregory',
    'firefly_kaelen': 'Kaelen',
    'firefly_soren': 'Soren',
    'firefly_vex': 'Vex',
    'firefly_merkin': 'Merkin',
    'firefly_maya': 'Maya'
  }
  
  for (let i = 0; i < count; i++) {
    const basePersonality = getRandomFireflyPersonality()
    // Use the correct name for this personality
    const correctName = personalityNameMap[basePersonality.id] || basePersonality.name
    const ageVariant = `${Math.floor(Math.random() * 30) + 10} days`
    
    const variant = createFireflyPersonalityVariant(basePersonality, correctName, ageVariant)
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
      "Hello there, fellow wanderer of the night...",
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