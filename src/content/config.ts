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
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().default(''),
    lang: z.string().optional().default(''),
    showImageOnPost: z.boolean().optional(),
    
    // New fields for video banner
  bannerType: z.enum(['image', 'video', 'timeline']).optional(),
  bannerData: z.object({
    videoId: z.string().optional(), // Change this from required to optional
    category: z.string().optional(), // For timeline banners
    startYear: z.number().optional(), // For timeline banners
    endYear: z.number().optional(), // For timeline banners
    background: z.string().optional(), // For timeline banners
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

// Define the 'spec' collection
const specCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

// Define the 'team' collection
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

// Export the collections
export const collections = {
  posts: postsCollection,
  spec: specCollection,
  team: teamCollection,
};