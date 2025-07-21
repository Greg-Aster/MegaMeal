/**
 * Simplified ContentAnalyzer - Just detects basic content types for Cuppy
 */

export interface ContentInsights {
  contentType:
    | 'cooking'
    | 'horror'
    | 'mystery'
    | 'restaurant'
    | 'story'
    | 'game'
    | 'history'
    | 'general'
  sentiment: 'positive' | 'neutral' | 'negative'
  pageTitle: string
  contentSummary: string
  lastAnalyzed: number
}

export class ContentAnalyzer {
  private cookingTerms: Set<string>
  private analysisCache: Map<string, ContentInsights> = new Map()

  constructor() {
    this.initializeTerms()
  }

  private initializeTerms() {
    // Key cooking indicators
    this.cookingTerms = new Set([
      'recipe',
      'recipes',
      'ingredients',
      'cook',
      'cooking',
      'bake',
      'baking',
      'prep time',
      'cook time',
      'servings',
      'serves',
      'tablespoon',
      'teaspoon',
      'cup',
      'cups',
      'oven',
      'temperature',
      'degrees',
      'flour',
      'butter',
      'eggs',
      'salt',
      'pepper',
      'oil',
      'onion',
      'garlic',
      'chicken',
      'beef',
      'pork',
    ])
  }

  /**
   * Analyze page content and return basic insights
   */
  public async analyzePageContent(): Promise<ContentInsights> {
    const pageSignature = this.getPageSignature()

    // Check cache (5 minute expiry)
    if (this.analysisCache.has(pageSignature)) {
      const cached = this.analysisCache.get(pageSignature)!
      if (Date.now() - cached.lastAnalyzed < 300000) {
        return cached
      }
    }

    try {
      const pageText = this.extractPageText()
      const insights = this.analyzeText(pageText)

      this.analysisCache.set(pageSignature, insights)
      return insights
    } catch (error) {
      console.error('Content analysis failed:', error)
      return this.getDefaultInsights()
    }
  }

  /**
   * Extract readable text from page
   */
  private extractPageText(): string {
    const contentSelectors = ['h1', 'h2', 'h3', 'p', 'li', 'article', 'main']
    let text = ''

    contentSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        text += ' ' + (el.textContent || '')
      })
    })

    return text.toLowerCase().trim()
  }

  /**
   * Analyze text and determine content type
   */
  private analyzeText(text: string): ContentInsights {
    const contentType = this.detectContentType(text)
    const sentiment = this.detectSentiment(text)

    return {
      contentType,
      sentiment,
      pageTitle: document.title || 'Untitled Page',
      contentSummary: this.generateSummary(contentType, text),
      lastAnalyzed: Date.now(),
    }
  }

  /**
   * Detect primary content type
   */
  private detectContentType(text: string): ContentInsights['contentType'] {
    // Count cooking terms
    let cookingScore = 0
    for (const term of this.cookingTerms) {
      if (text.includes(term)) {
        cookingScore++
      }
    }

    // If substantial cooking content, it's cooking
    if (cookingScore > 8) {
      return 'cooking'
    }

    // Check for other content types
    if (
      text.includes('horror') ||
      text.includes('terror') ||
      text.includes('nightmare') ||
      text.includes('scary')
    ) {
      return 'horror'
    }

    if (
      text.includes('mystery') ||
      text.includes('investigation') ||
      text.includes('detective') ||
      text.includes('clue')
    ) {
      return 'mystery'
    }

    if (
      text.includes('restaurant') ||
      text.includes('review') ||
      text.includes('dining') ||
      text.includes('menu')
    ) {
      return 'restaurant'
    }

    if (
      text.includes('story') ||
      text.includes('tale') ||
      text.includes('chapter') ||
      text.includes('character')
    ) {
      return 'story'
    }

    if (
      text.includes('game') ||
      text.includes('play') ||
      text.includes('interactive') ||
      text.includes('puzzle')
    ) {
      return 'game'
    }

    if (
      text.includes('history') ||
      text.includes('historical') ||
      text.includes('century') ||
      text.includes('ancient')
    ) {
      return 'history'
    }

    return 'general'
  }

  /**
   * Basic sentiment detection
   */
  private detectSentiment(text: string): ContentInsights['sentiment'] {
    const positiveWords = [
      'good',
      'great',
      'amazing',
      'excellent',
      'wonderful',
      'love',
      'perfect',
      'delicious',
    ]
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'hate',
      'disgusting',
      'worst',
    ]

    let positiveCount = 0
    let negativeCount = 0

    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++
    })

    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++
    })

    if (positiveCount > negativeCount + 1) return 'positive'
    if (negativeCount > positiveCount + 1) return 'negative'
    return 'neutral'
  }

  /**
   * Generate simple content summary
   */
  private generateSummary(contentType: string, text: string): string {
    const summaries = {
      cooking: 'This page contains cooking or recipe content.',
      horror: 'This page contains horror or scary content.',
      mystery: 'This page contains mystery or investigation content.',
      restaurant: 'This page contains restaurant or food review content.',
      story: 'This page contains story or narrative content.',
      game: 'This page contains game or interactive content.',
      history: 'This page contains historical content.',
      general: 'This page contains general blog content.',
    }

    return summaries[contentType as keyof typeof summaries] || summaries.general
  }

  /**
   * Get page signature for caching
   */
  private getPageSignature(): string {
    return `${window.location.href}-${document.title}-${document.body.textContent?.length || 0}`
  }

  /**
   * Default insights when analysis fails
   */
  private getDefaultInsights(): ContentInsights {
    return {
      contentType: 'general',
      sentiment: 'neutral',
      pageTitle: document.title || 'Untitled Page',
      contentSummary: 'Unable to analyze page content.',
      lastAnalyzed: Date.now(),
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.analysisCache.clear()
  }
}
