export interface ProductFrontmatter {
  // Existing fields based on src/content/config.ts productsCollection
  name: string;
  tagline: string;
  description?: string;
  price?: number;
  image?: string; // Primary image
  sku?: string;
  draft?: boolean;

  // New fields
  rating?: number;
  additionalImages?: string[];
  specifications?: Array<{ label: string; value: string }>;
  qanda?: Array<{ question: string; answer: string }>;
  preWrittenReviews?: Array<{
    author: string;
    rating?: number;
    date?: string;
    comment: string;
  }>;

  // Potentially other relevant fields (can be added if needed)
  // category?: string;
  // tags?: string[];
  // published?: Date; // Or string, depending on how it's handled
}