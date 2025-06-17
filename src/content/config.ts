import { defineCollection, z } from 'astro:content';

// Define the 'posts' collection
const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    published: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional().default(''),
    image: z.string().optional().default(''),
    // Custom author profile fields
    avatarImage: z.string().optional(), // Custom path to avatar image
    authorName: z.string().optional(),  // Custom author name 
    authorBio: z.string().optional(),   // Custom author bio
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().default(''),
    lang: z.string().optional().default(''),
    showImageOnPost: z.boolean().optional(),
    mascotContext: z.string().optional(),

    // DYNAMIC BACKGROUND IMAGE SUPPORT - Add this field
    backgroundImage: z.string().optional(),

    // Add bannerType field
    bannerType: z.enum(['image', 'video', 'timeline', 'assistant']).optional(),
    bannerLink: z.string().optional(),// for image banners link

    // Banner data
    bannerData: z.object({
      videoId: z.string().optional(),
      imageUrl: z.string().optional(), // for image banners
      category: z.string().optional(),
      startYear: z.number().optional(),
      endYear: z.number().optional(),
      background: z.string().optional(),
      title: z.string().optional(), // Optional but useful
      height: z.string().optional(), // Optional for custom heights
      compact: z.boolean().optional(),
    }).optional(),

    // Timeline properties
    timelineYear: z.number().optional(),
    timelineEra: z.string().optional(),
    timelineLocation: z.string().optional(),
    isKeyEvent: z.boolean().optional(),
    yIndex: z.number().optional(),

    /* For internal use */
    prevTitle: z.string().default(''),
    prevSlug: z.string().default(''),
    nextTitle: z.string().default(''),
    nextSlug: z.string().default(''),
  }),
});

// Rest of collections
const specCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const teamCollection = defineCollection({
  schema: z.object({
    name: z.string(),
    role: z.string(),
    image: z.string(),
    email: z.string(),
    featured: z.boolean().optional(),
    order: z.number().default(0),
  }),
});

// Define the friends collection
const friendsCollection = defineCollection({
  schema: z.object({
    name: z.string(),
    url: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    lastSynced: z.string().optional(),
  }),
});

// Define the 'products' collection
const productsCollection = defineCollection({
  schema: z.object({
    name: z.string(), // The name of the product
    tagline: z.string(), // The sinister tagline for the product
    description: z.string().optional(), // A more detailed description, optional
    price: z.number().optional(), // The price of the product, optional
    image: z.string().optional(), // Path to the product image, optional
    sku: z.string().optional(), // A unique stock keeping unit, optional
    draft: z.boolean().optional().default(false), // To mark if the product is a draft
    // New fields for product frontmatter
    rating: z.number().optional(),
    additionalImages: z.array(z.string()).optional(),
    specifications: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    qanda: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    preWrittenReviews: z.array(
      z.object({
        author: z.string(),
        rating: z.number().optional(),
        date: z.string().optional(),
        comment: z.string(),
      })
    ).optional(),
  }),
});

// Export the collections
export const collections = {
  posts: postsCollection,
  spec: specCollection,
  team: teamCollection,
  friends: friendsCollection,
  products: productsCollection,
};