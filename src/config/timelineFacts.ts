export interface TimelineFact {
  text: string;
  type: 'fact' | 'advertisement' | 'lore';
  link?: string;
}

export const megaMealUniverseFacts: TimelineFact[] = [
  // From current file (as of last read)
  { text: "Visit W Corporation's towering headquarters! Home of the Secret Recipe.", type: 'lore', link: 'Mega-Meal-Explained' },
  { text: "Beware the sentient mayo and the dancing cockroaches!", type: 'lore', link: 'Mega-Meal-Explained' },
  { text: "The Infinite Dip: What secrets does it hold?", type: 'lore', link: 'Mega-Meal-Explained' },
  { text: "MegaMeal™ will be released in 32066!.", type: 'lore', link: 'Mega-Meal-Explained' },
  { text: "Dine at Ouroboros: Where the menu is a never-ending cycle of delight! Reservations required.", type: 'advertisement', link: 'timelines/boudin-noir-restaurant-review' },
  { text: "Snuggaloids™: Your cuddly companions for the cold void of space. Now with 10% more fluff!", type: 'advertisement', link: 'timelines/Snuggaliod-Emergence' },
  { text: "Try the 'Perfect Miranda Mary' at the Last Stop Saloon – a drink to die for (or from).", type: 'advertisement', link: 'timelines/perfect-mary-recipe' },
  { text: "Zelephant Truffle Roasts: A delicacy from the farthest reaches of the gastronomic galaxy. Limited time only!", type: 'advertisement' },
  { text: "Puppy Chow™: Now with REAL puppies! (Disclaimer: Ethical sourcing protocols strictly adhered to... mostly.)", type: 'advertisement' },
  { text: "Visit the Chronos Cafe for the best MegaMeal™ Fruzzy shakes across all timelines!", type: 'advertisement' },
  { text: "Warning: Consumption of too much MegaMeal™ may lead to existential condiment crises.", type: 'fact' },

  // Newly generated ads for other posts
  { text: "Witness the Snuggloid emergence on Qarnivor: A MEGA MEAL SAGA awaits!", type: 'advertisement', link: 'Mega-Meal-3' },
  { text: "Explore 'The Transcendence of Causality' and how singularities manipulate time!", type: 'advertisement', link: 'timelines/quantum-time-travel' },
  { text: "New to the universe? Start with the 'Introduction to MEGAMEAL Saga'!", type: 'advertisement', link: 'Explainer' },
  { text: "Witness the dawn of a new era: 'The First Singularities'. Learn more!", type: 'advertisement', link: 'timelines/the-first-singularities' },
  { text: "Journey to 'The Beginning of Time' and explore the cosmic menu!", type: 'advertisement', link: 'Timeline' },
  { text: "Enter 'The Era of Competing Singularities'. Discover their evolution!", type: 'advertisement', link: 'timelines/competing-singularities' },
  { text: "Explore 'The Height of the Corporate Empire' and the Big Seven!", type: 'advertisement', link: 'timelines/corporate-empire' },
  { text: "When the Internet Became Self-Aware: Explore 'The Digital Awakening'!", type: 'advertisement', link: 'timelines/digital-awakening' },
  { text: "Contemplate 'The End of Time' and the universe's final moments.", type: 'advertisement', link: 'timelines/end-of-time' },
  { text: "What happens when data wakes up? Discover 'The Emergence of Metadata Sentience'.", type: 'advertisement', link: 'timelines/metadata-sentience' },
  { text: "Uncover the mystery of the Miranda System and the 'Lost Bloody Mary'!", type: 'advertisement', link: 'timelines/miranda-bloody-mary' },
  { text: "SNUGGLOIDS™ - Your Perfect Companion! Get yours before the apocalypse!", type: 'advertisement', link: 'timelines/Snuggloids-Commercial' },
  { text: "Learn about 'The Spork Uprising' and the fate of Planet Quarnivor!", type: 'advertisement', link: 'timelines/spork-uprising' },
];