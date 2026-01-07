import { IconLibraryService, IconSearchResult } from './icon-library.service';

export interface IconReplacement {
  originalNode: any;
  iconData: IconSearchResult;
  path: string[];
}

export class IconIntegrationService {
  constructor(private iconLibrary: IconLibraryService) {}

  async processDesignWithIcons(design: any): Promise<{
    design: any;
    iconsReplaced: number;
    replacements: IconReplacement[];
  }> {
    const replacements: IconReplacement[] = [];
    let iconsReplaced = 0;
    const processedDesign = JSON.parse(JSON.stringify(design));

    const processDesignTree = async (designPart: any, basePath: string[] = []) => {
      if (Array.isArray(designPart)) {
        for (let i = 0; i < designPart.length; i++) {
          const result = await this.processNode(designPart[i], [...basePath, i.toString()]);
          iconsReplaced += result.count;
          replacements.push(...result.replacements);
        }
      } else {
        const result = await this.processNode(designPart, basePath);
        iconsReplaced += result.count;
        replacements.push(...result.replacements);
      }
    };

    await processDesignTree(processedDesign);
    
    return {
      design: processedDesign,
      iconsReplaced,
      replacements
    };
  }

  private async processNode(
    node: any,
    path: string[]
  ): Promise<{ count: number; replacements: IconReplacement[] }> {
    let count = 0;
    const replacements: IconReplacement[] = [];

    if (this.isIconPlaceholder(node)) {
      const iconKeyword = this.extractIconKeyword(node);
      
      if (iconKeyword) {
        console.log(`🎨 Found icon placeholder: "${iconKeyword}" in node: ${node.name}`);
        
        const icons = await this.iconLibrary.searchIcons(iconKeyword, 1);
        
        if (icons.length > 0) {
          const icon = icons[0];
          
          this.replaceNodeWithIcon(node, icon);
          
          count++;
          replacements.push({
            originalNode: { ...node },
            iconData: icon,
            path
          });
          
          console.log(`✅ Replaced icon: "${iconKeyword}" → ${icon.iconifyId}`);
        } else {
          console.warn(`⚠️ No icon found for keyword: "${iconKeyword}"`);
          node._isIconPlaceholder = true;
          node._iconKeyword = iconKeyword;
        }
      }
    }

    if (node.children && Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        const result = await this.processNode(
          node.children[i],
          [...path, 'children', i.toString()]
        );
        count += result.count;
        replacements.push(...result.replacements);
      }
    }

    return { count, replacements };
  }

  private isIconPlaceholder(node: any): boolean {
    if (!node || !node.name) return false;
    
    if (node.name.startsWith('ICON:')) return true;
    if (node._iconKeyword) return true;
    
    if (node.type === 'RECTANGLE' && 
        node.width >= 16 && node.width <= 48 &&
        node.height >= 16 && node.height <= 48) {
      
      if (node.fills && node.fills.length > 0) {
        const fill = node.fills[0];
        if (fill.type === 'SOLID' && fill.color) {
          const { r, g, b } = fill.color;
          if (Math.abs(r - g) < 0.1 && Math.abs(g - b) < 0.1 && r > 0.7) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private extractIconKeyword(node: any): string | null {
    if (node.name && node.name.startsWith('ICON:')) {
      return node.name.substring(5).toLowerCase().trim();
    }

    if (node._iconKeyword) {
      return node._iconKeyword.toLowerCase().trim();
    }

    if (node.name) {
      const keywords = [
        'user', 'profile', 'account', 'avatar',
        'menu', 'home', 'back', 'close', 'search',
        'edit', 'delete', 'add', 'save', 'upload', 'download',
        'email', 'message', 'phone', 'notification', 'bell',
        'cart', 'payment', 'card', 'shopping',
        'settings', 'gear', 'cog'
      ];

      const nameLower = node.name.toLowerCase();
      for (const keyword of keywords) {
        if (nameLower.includes(keyword)) return keyword;
      }
    }

    return null;
  }

  /**
   */
  private replaceNodeWithIcon(node: any, icon: IconSearchResult): void {
    console.log(`🔧 Replacing placeholder with icon: ${icon.iconifyId}`);
    
    try {
      const vectorData = this.iconLibrary.svgToFigmaVector(icon.svg, node.width || 24);
      
      if (!vectorData.vectorPaths || vectorData.vectorPaths.length === 0) {
        console.warn(`⚠️ No vector paths generated for icon: ${icon.iconifyId}`);
        
        node._iconSource = icon.iconifyId;
        node._iconCategory = icon.category;
        node._iconKeyword = icon.name;
        node._isIcon = true;
        node._hasVectorPaths = false;
        return;
      }

      node.type = 'VECTOR';
      node.name = icon.name || node.name || `Icon: ${this.extractKeywordFromIconId(icon.iconifyId)}`;
      node.vectorPaths = vectorData.vectorPaths;
      node.width = vectorData.width || 24;
      node.height = vectorData.height || 24;
      
      node._iconSource = icon.iconifyId;
      node._iconCategory = icon.category || 'general';
      node._iconKeyword = this.extractKeywordFromIconId(icon.iconifyId);
      node._isIcon = true;
      node._hasVectorPaths = true;
      
      node.fills = [{
        type: 'SOLID',
        visible: true,
        opacity: 1,
        blendMode: 'NORMAL',
        color: { r: 0, g: 0, b: 0 }
      }];
      
      delete node.strokes;
      delete node.effects;
      
      console.log(`✅ Icon replaced: ${icon.iconifyId}`);
      console.log(`   Paths: ${vectorData.vectorPaths.length}`);
      console.log(`   Size: ${node.width}x${node.height}`);
      
    } catch (error) {
      console.error(`❌ Error replacing icon ${icon.iconifyId}:`, error);
      node._iconSource = icon.iconifyId;
      node._iconError = true;
      node._isIcon = true;
    }
  }

  private extractKeywordFromIconId(iconifyId: string): string {
    const parts = iconifyId.split(':');
    if (parts.length > 1) {
      return parts[1].split('-')[0];
    }
    return iconifyId.split('-')[0];
  }

  async suggestIconsForDesign(design: any): Promise<Map<string, IconSearchResult[]>> {
    const suggestions = new Map<string, IconSearchResult[]>();
    const contexts = this.analyzeDesignContext(design);

    for (const context of contexts) {
      const icons = await this.iconLibrary.suggestIconsForContext(context);
      if (icons.length > 0) suggestions.set(context, icons);
    }

    return suggestions;
  }

  private analyzeDesignContext(design: any): string[] {
    const contexts = new Set<string>();

    const extractContexts = (node: any) => {
      if (!node) return;

      if (node.name) {
        const nameLower = node.name.toLowerCase();
        if (nameLower.includes('login')) contexts.add('login');
        if (nameLower.includes('signup') || nameLower.includes('register')) contexts.add('signup');
        if (nameLower.includes('dashboard')) contexts.add('dashboard');
        if (nameLower.includes('profile')) contexts.add('profile');
        if (nameLower.includes('settings')) contexts.add('settings');
        if (nameLower.includes('search')) contexts.add('search');
        if (nameLower.includes('notification')) contexts.add('notification');
        if (nameLower.includes('menu')) contexts.add('menu');
        if (nameLower.includes('cart') || nameLower.includes('shop')) contexts.add('cart');
      }

      if (node.type === 'TEXT' && node.characters) {
        const textLower = node.characters.toLowerCase();
        if (textLower.includes('login') || textLower.includes('sign in')) contexts.add('login');
        if (textLower.includes('register') || textLower.includes('sign up')) contexts.add('signup');
        if (textLower.includes('home')) contexts.add('home');
        if (textLower.includes('back')) contexts.add('back');
        if (textLower.includes('next') || textLower.includes('forward')) contexts.add('next');
        if (textLower.includes('save')) contexts.add('save');
        if (textLower.includes('delete') || textLower.includes('remove')) contexts.add('delete');
        if (textLower.includes('edit')) contexts.add('edit');
        if (textLower.includes('add') || textLower.includes('new')) contexts.add('add');
        if (textLower.includes('share')) contexts.add('share');
        if (textLower.includes('favorite') || textLower.includes('like')) contexts.add('favorite');
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractContexts);
      }
    };

    if (Array.isArray(design)) {
      design.forEach(extractContexts);
    } else {
      extractContexts(design);
    }

    return Array.from(contexts);
  }
}