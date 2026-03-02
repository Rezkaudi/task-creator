interface DesignSystem {
  colors: string[];
  gradients: object[];
  fonts: { family: string; style: string; size: number }[];
  fontSizes: number[];
  spacing: number[];
  radii: number[];
  shadows: object[];
  layoutModes: string[];
  structure: object;
}

export class JsonToToonService {

  convertToToon(data: any): string {
    const ds: DesignSystem = {
      colors: [],
      gradients: [],
      fonts: [],
      fontSizes: [],
      spacing: [],
      radii: [],
      shadows: [],
      layoutModes: [],
      structure: {},
    };

    const colorSet = new Set<string>();
    const gradientSet = new Set<string>();
    const fontSet = new Set<string>();
    const fontSizeSet = new Set<number>();
    const spacingSet = new Set<number>();
    const radiusSet = new Set<number>();
    const shadowSet = new Set<string>();
    const layoutModeSet = new Set<string>();

    const nodes = Array.isArray(data) ? data : [data];

    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Colors from fills
      if (Array.isArray(node.fills)) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b } = fill.color;
            const a = fill.opacity ?? fill.color.a ?? 1;
            colorSet.add(`rgba(${r.toFixed(2)},${g.toFixed(2)},${b.toFixed(2)},${a.toFixed(2)})`);
          } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
            if (fill.gradientStops) {
              const key = JSON.stringify({
                type: fill.type,
                stops: fill.gradientStops.map((s: any) => ({
                  pos: parseFloat(s.position.toFixed(2)),
                  color: s.color,
                })),
              });
              gradientSet.add(key);
            }
          }
        }
      }

      // Colors from strokes
      if (Array.isArray(node.strokes)) {
        for (const stroke of node.strokes) {
          if (stroke.type === 'SOLID' && stroke.color) {
            const { r, g, b } = stroke.color;
            const a = stroke.opacity ?? stroke.color.a ?? 1;
            colorSet.add(`rgba(${r.toFixed(2)},${g.toFixed(2)},${b.toFixed(2)},${a.toFixed(2)})`);
          }
        }
      }

      // Typography
      if (node.fontName && node.fontSize) {
        const fontKey = JSON.stringify({ family: node.fontName.family, style: node.fontName.style, size: node.fontSize });
        fontSet.add(fontKey);
        fontSizeSet.add(node.fontSize);
      }

      // Spacing
      for (const key of ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) {
        if (typeof node[key] === 'number' && node[key] > 0) {
          spacingSet.add(node[key]);
        }
      }

      // Corner radius
      if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
        radiusSet.add(node.cornerRadius);
      }

      // Shadows from effects
      if (Array.isArray(node.effects)) {
        for (const effect of node.effects) {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            shadowSet.add(JSON.stringify({
              type: effect.type,
              radius: effect.radius,
              spread: effect.spread,
              offset: effect.offset,
              color: effect.color,
            }));
          }
        }
      }

      // Layout modes
      if (node.layoutMode) {
        layoutModeSet.add(node.layoutMode);
      }

      // Recurse into children
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          walk(child);
        }
      }
    };

    for (const node of nodes) {
      walk(node);
    }

    ds.colors = Array.from(colorSet);
    ds.gradients = Array.from(gradientSet).map(s => JSON.parse(s));
    ds.fonts = Array.from(fontSet).map(s => JSON.parse(s));
    ds.fontSizes = Array.from(fontSizeSet).sort((a, b) => a - b);
    ds.spacing = Array.from(spacingSet).sort((a, b) => a - b);
    ds.radii = Array.from(radiusSet).sort((a, b) => a - b);
    ds.shadows = Array.from(shadowSet).map(s => JSON.parse(s));
    ds.layoutModes = Array.from(layoutModeSet);
    ds.structure = this.buildStructure(Array.isArray(data) ? data : [data]);

    return JSON.stringify(ds);
  }

  private buildStructure(nodes: any[]): object[] {
    return nodes.map(node => {
      const s: any = { type: node.type, name: node.name };
      if (node.width) s.width = node.width;
      if (node.height) s.height = node.height;
      if (Array.isArray(node.children) && node.children.length > 0) {
        s.children = this.buildStructure(node.children);
      }
      return s;
    });
  }

  // ---------------------------------------------------------------------------
  // Component Sampling approach
  // ---------------------------------------------------------------------------

  private static readonly STRIP_KEYS = new Set([
    'x', 'y', 'reactions', 'exportSettings', 'constraints', 'blendMode',
    'visible', 'locked', 'clipsContent', 'imageData', 'imageTransform',
    'filters', 'scalingFactor', 'vectorPaths', 'textSegments',
    'showShadowBehindNode', 'preserveRatio',
  ]);

  private static readonly PATTERNS: Record<string, string[]> = {
    button:  ['button', 'btn', 'cta'],
    input:   ['input', 'field', 'textfield', 'search'],
    card:    ['card', 'container', 'panel', 'box'],
    heading: ['header', 'heading', 'title', 'hero'],
    body:    ['body', 'subtitle', 'label', 'caption', 'paragraph'],
    icon:    ['icon'],
    divider: ['divider', 'separator'],
  };

  convertToSample(data: any): string {
    const nodes = Array.isArray(data) ? data : [data];
    const samples: Record<string, any> = {};
    const fallbackFrames: any[] = [];

    const matchPattern = (name: string): string | null => {
      const lower = name.toLowerCase();
      for (const [key, keywords] of Object.entries(JsonToToonService.PATTERNS)) {
        if (keywords.some(k => lower.includes(k))) return key;
      }
      return null;
    };

    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;

      const pattern = matchPattern(node.name || '');
      if (pattern && !samples[pattern]) {
        samples[pattern] = this.stripNode(node, 0);
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) walk(child);
      }
    };

    for (const node of nodes) {
      // Collect top-level frames as fallback
      if (node.type === 'FRAME' && fallbackFrames.length < 2) {
        fallbackFrames.push(this.stripNode(node, 0));
      }
      walk(node);
    }

    const components = Object.values(samples);

    // If no named components found, fall back to top-level frames
    if (components.length === 0) {
      components.push(...fallbackFrames);
    }

    return JSON.stringify({
      note: 'Representative component samples extracted from reference design',
      components,
    });
  }

  private stripNode(node: any, depth: number): any {
    const result: any = {};

    for (const [key, value] of Object.entries(node)) {
      if (JsonToToonService.STRIP_KEYS.has(key)) continue;
      if (value === null || value === undefined) continue;
      if (Array.isArray(value) && value.length === 0) continue;

      if (key === 'characters' && typeof value === 'string') {
        result[key] = value.length > 30 ? value.substring(0, 30) + '…' : value;
        continue;
      }

      if (key === 'children' && Array.isArray(value)) {
        if (depth >= 2) continue; // cap nesting at 2 levels
        result[key] = value.map(child => this.stripNode(child, depth + 1));
        continue;
      }

      result[key] = value;
    }

    return result;
  }
}
