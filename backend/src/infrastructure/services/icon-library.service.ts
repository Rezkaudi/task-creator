// src/infrastructure/services/icon-library.service.ts

export interface IconSearchResult {
  name: string;
  iconifyId: string; // e.g., "mdi:home"
  svg: string;
  category?: string;
  tags?: string[];
}

export interface IconLibraryConfig {
  provider: 'iconify' | 'fontawesome' | 'lucide';
  apiKey?: string;
}

export class IconLibraryService {
  private readonly ICONIFY_API = 'https://api.iconify.design';
  private cache: Map<string, string> = new Map();

  constructor(private config: IconLibraryConfig = { provider: 'iconify' }) {}

  /**
   * Search for icons by keyword
   */
  async searchIcons(keyword: string, limit: number = 10): Promise<IconSearchResult[]> {
    try {
      // Iconify search endpoint
      const response = await fetch(
        `${this.ICONIFY_API}/search?query=${encodeURIComponent(keyword)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Icon search failed: ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // Transform results
      const icons: IconSearchResult[] = [];
      
      if (data.icons && Array.isArray(data.icons)) {
        for (const iconId of data.icons.slice(0, limit)) {
          const svg = await this.getIconSvg(iconId);
          if (svg) {
            icons.push({
              name: this.getIconName(iconId),
              iconifyId: iconId,
              svg,
              category: this.getIconCategory(iconId),
              tags: this.getIconTags(keyword, iconId)
            });
          }
        }
      }

      return icons;
    } catch (error) {
      console.error('Error searching icons:', error);
      return this.getFallbackIcons(keyword);
    }
  }

  /**
   * Get specific icon by ID
   */
  async getIconSvg(iconId: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.cache.has(iconId)) {
        return this.cache.get(iconId)!;
      }

      const response = await fetch(`${this.ICONIFY_API}/${iconId}.svg`);
      
      if (!response.ok) {
        return null;
      }

      const svg = await response.text();
      
      // Cache the result
      this.cache.set(iconId, svg);
      
      return svg;
    } catch (error) {
      console.error(`Error fetching icon ${iconId}:`, error);
      return null;
    }
  }

  /**
   * Get multiple icons in batch
   */
  async getIconsBatch(iconIds: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
      iconIds.map(async (iconId) => {
        const svg = await this.getIconSvg(iconId);
        if (svg) {
          results.set(iconId, svg);
        }
      })
    );

    return results;
  }

  /**
   * Suggest icons based on context (AI-powered)
   */
  async suggestIconsForContext(context: string): Promise<IconSearchResult[]> {
    // Map common UI elements to icon keywords
    const contextMap: Record<string, string[]> = {
      'login': ['user', 'lock', 'email', 'password'],
      'signup': ['user-plus', 'register', 'account'],
      'dashboard': ['dashboard', 'chart', 'analytics'],
      'profile': ['user', 'account', 'person'],
      'settings': ['settings', 'gear', 'cog'],
      'search': ['search', 'magnify', 'find'],
      'notification': ['bell', 'notification', 'alert'],
      'menu': ['menu', 'hamburger', 'bars'],
      'close': ['close', 'x', 'cross'],
      'home': ['home', 'house'],
      'back': ['arrow-left', 'back', 'chevron-left'],
      'next': ['arrow-right', 'next', 'chevron-right'],
      'edit': ['edit', 'pencil', 'pen'],
      'delete': ['trash', 'delete', 'bin'],
      'add': ['plus', 'add', 'new'],
      'save': ['save', 'floppy', 'check'],
      'upload': ['upload', 'cloud-upload', 'arrow-up'],
      'download': ['download', 'cloud-download', 'arrow-down'],
      'favorite': ['heart', 'star', 'favorite'],
      'share': ['share', 'forward'],
      'calendar': ['calendar', 'date', 'schedule'],
      'email': ['email', 'mail', 'envelope'],
      'phone': ['phone', 'call', 'telephone'],
      'message': ['message', 'chat', 'comment'],
      'cart': ['cart', 'shopping', 'basket'],
      'payment': ['credit-card', 'payment', 'money'],
    };

    const lowerContext = context.toLowerCase();
    let keywords: string[] = [];

    // Find matching keywords
    for (const [key, values] of Object.entries(contextMap)) {
      if (lowerContext.includes(key)) {
        keywords.push(...values);
      }
    }

    // If no specific match, use the context itself
    if (keywords.length === 0) {
      keywords = [context];
    }

    // Get icons for first keyword
    const primaryKeyword = keywords[0];
    return this.searchIcons(primaryKeyword, 5);
  }

  /**
   * Convert SVG to Figma-compatible format
   */
  svgToFigmaVector(svg: string, size: number = 24): {
  width: number;
  height: number;
  vectorPaths: any[];
} {
    console.log(`🎨 Converting SVG to Figma vector (size: ${size})`);

    // Parse SVG and extract paths
    const pathMatches = svg.matchAll(/<path[^>]*d="([^"]*)"[^>]*\/>/g);
    const paths: any[] = [];

    for (const match of pathMatches) {
      paths.push({
        windingRule: 'NONZERO',
        data: match[1]
      });
    }

    return {
      width: size,
      height: size,
      vectorPaths: paths
    };
  }

  /**
   * Get icon name from ID
   */
  private getIconName(iconId: string): string {
    const parts = iconId.split(':');
    return parts[parts.length - 1].replace(/-/g, ' ');
  }

  /**
   * Get icon category from ID
   */
  private getIconCategory(iconId: string): string {
    const parts = iconId.split(':');
    return parts[0];
  }

  /**
   * Get icon tags
   */
  private getIconTags(keyword: string, iconId: string): string[] {
    return [keyword, this.getIconCategory(iconId), this.getIconName(iconId)];
  }

  /**
   * Fallback icons when API fails
   */
  private getFallbackIcons(keyword: string): IconSearchResult[] {
    const fallbackMap: Record<string, string> = {
      'user': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>',
      'home': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
      'search': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
      'menu': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
      'close': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
    };

    const svg = fallbackMap[keyword.toLowerCase()] || fallbackMap['user'];
    
    return [{
      name: keyword,
      iconifyId: `fallback:${keyword}`,
      svg,
      category: 'fallback',
      tags: [keyword]
    }];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}