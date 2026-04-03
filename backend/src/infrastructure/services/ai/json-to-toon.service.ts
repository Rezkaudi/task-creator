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
            colorSet.add(`rgba(${r},${g},${b},${a})`);
          } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
            if (fill.gradientStops) {
              const key = JSON.stringify({
                type: fill.type,
                stops: fill.gradientStops.map((s: any) => ({
                  pos: parseFloat(s.position),
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
            colorSet.add(`rgba(${r},${g},${b},${a})`);
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
  // Shared helpers
  // ---------------------------------------------------------------------------

  private readonly STRIP_KEYS = new Set([
    'x', 'y', 'reactions', 'exportSettings', 'constraints', 'blendMode',
    'visible', 'locked', 'clipsContent', 'imageData', 'imageTransform',
    'filters', 'scalingFactor', 'vectorPaths', 'textSegments',
    'showShadowBehindNode', 'preserveRatio',
  ]);

  private readonly PATTERNS: Record<string, string[]> = {
    button: ['button', 'btn', 'cta'],
    input: ['input', 'field', 'textfield', 'search'],
    card: ['card', 'container', 'panel', 'box'],
    heading: ['header', 'heading', 'title', 'hero'],
    body: ['body', 'subtitle', 'label', 'caption', 'paragraph'],
    icon: ['icon'],
    divider: ['divider', 'separator'],
    navbar: ['navbar', 'navigation', 'nav', 'topbar', 'appbar'],
    footer: ['footer', 'bottombar', 'bottom-bar'],
    badge: ['badge', 'tag', 'chip', 'pill'],
    avatar: ['avatar', 'profile'],
    list: ['list', 'listitem', 'list-item', 'row'],
    modal: ['modal', 'dialog', 'overlay', 'popup', 'drawer'],
    toggle: ['toggle', 'switch', 'checkbox', 'radio'],
  };

  private matchPattern(name: string): string | null {
    const lower = (name || '').toLowerCase();
    for (const [key, keywords] of Object.entries(this.PATTERNS)) {
      if (keywords.some(k => lower.includes(k))) return key;
    }
    return null;
  }

  private stripNode(node: any, depth: number, maxDepth = 2): any {
    const result: any = {};

    for (const [key, value] of Object.entries(node)) {
      if (this.STRIP_KEYS.has(key)) continue;
      if (value === null || value === undefined) continue;
      if (Array.isArray(value) && value.length === 0) continue;

      if (key === 'characters' && typeof value === 'string') {
        result[key] = value.length > 30 ? value.substring(0, 30) + '…' : value;
        continue;
      }

      if (key === 'children' && Array.isArray(value)) {
        if (depth >= maxDepth) continue;
        result[key] = value.map(child => this.stripNode(child, depth + 1, maxDepth));
        continue;
      }

      result[key] = value;
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Component Sampling approach (legacy — kept for backward compatibility)
  // ---------------------------------------------------------------------------

  convertToSample(data: any): string {
    const nodes = Array.isArray(data) ? data : [data];
    const samples: Record<string, any> = {};
    const fallbackFrames: any[] = [];

    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;

      const pattern = this.matchPattern(node.name || '');
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

  // ---------------------------------------------------------------------------
  // Compact component style extractor
  // Extracts only the key styling properties from a matched component node,
  // producing a flat object instead of a deep tree.
  // ---------------------------------------------------------------------------

  private extractComponentStyle(node: any): any {
    const style: any = {};

    // Layout
    if (node.layoutMode) style.layoutMode = node.layoutMode;
    if (node.primaryAxisSizingMode) style.primaryAxisSizingMode = node.primaryAxisSizingMode;
    if (node.counterAxisSizingMode) style.counterAxisSizingMode = node.counterAxisSizingMode;
    if (typeof node.itemSpacing === 'number' && node.itemSpacing > 0) style.itemSpacing = node.itemSpacing;
    if (node.layoutAlign) style.layoutAlign = node.layoutAlign;
    if (typeof node.layoutGrow === 'number') style.layoutGrow = node.layoutGrow;

    // Padding
    for (const k of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) {
      if (typeof node[k] === 'number' && node[k] > 0) style[k] = node[k];
    }

    // Size (only if fixed — HUG/FILL is captured by sizing modes)
    if (typeof node.width === 'number' && node.primaryAxisSizingMode === 'FIXED') style.width = node.width;
    if (typeof node.height === 'number' && node.counterAxisSizingMode === 'FIXED') style.height = node.height;

    // Shape
    if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) style.cornerRadius = node.cornerRadius;
    if (typeof node.cornerSmoothing === 'number' && node.cornerSmoothing > 0) style.cornerSmoothing = node.cornerSmoothing;

    // Strokes
    if (Array.isArray(node.strokes) && node.strokes.length > 0) style.strokes = node.strokes;
    if (typeof node.strokeWeight === 'number') style.strokeWeight = node.strokeWeight;
    if (node.strokeAlign) style.strokeAlign = node.strokeAlign;

    // Fills (cap at 2)
    if (Array.isArray(node.fills) && node.fills.length > 0) style.fills = node.fills.slice(0, 2);

    // Shadows/effects
    if (Array.isArray(node.effects) && node.effects.length > 0) style.effects = node.effects;

    // Typography (if this is a TEXT node)
    if (node.type === 'TEXT') {
      if (node.fontName) style.fontName = node.fontName;
      if (node.fontSize) style.fontSize = node.fontSize;
      if (node.lineHeight) style.lineHeight = node.lineHeight;
      if (node.letterSpacing) style.letterSpacing = node.letterSpacing;
      if (node.textCase) style.textCase = node.textCase;
      if (node.textAutoResize) style.textAutoResize = node.textAutoResize;
    }

    // Pull typography from first TEXT descendant
    const findFirstText = (n: any): any => {
      if (!n || typeof n !== 'object') return null;
      if (n.type === 'TEXT') return n;
      if (Array.isArray(n.children)) {
        for (const c of n.children) {
          const found = findFirstText(c);
          if (found) return found;
        }
      }
      return null;
    };

    if (node.type !== 'TEXT') {
      const textNode = findFirstText(node);
      if (textNode) {
        if (textNode.fontName) style.textFontName = textNode.fontName;
        if (textNode.fontSize) style.textFontSize = textNode.fontSize;
        if (textNode.lineHeight) style.textLineHeight = textNode.lineHeight;
        if (textNode.letterSpacing) style.textLetterSpacing = textNode.letterSpacing;
        if (textNode.textCase) style.textCase = textNode.textCase;
        if (textNode.fills?.length) style.textFills = textNode.fills.slice(0, 1);
      }
    }

    return style;
  }

  // ---------------------------------------------------------------------------
  // Rich reference context — used for "create by reference"
  // Extracts design tokens + backgrounds + compact component styles + icons
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Spacing structure — hierarchical view of frames with their padding/spacing
  // Captures per-node spacing context (up to maxDepth levels) for AI reference
  // ---------------------------------------------------------------------------

  private buildSpacingStructure(nodes: any[], depth = 0, maxDepth = 4): any[] {
    if (depth >= maxDepth) return [];

    const result: any[] = [];

    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      if (node.type !== 'FRAME' && node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET') continue;

      const hasPadding =
        (typeof node.paddingTop === 'number' && node.paddingTop > 0) ||
        (typeof node.paddingRight === 'number' && node.paddingRight > 0) ||
        (typeof node.paddingBottom === 'number' && node.paddingBottom > 0) ||
        (typeof node.paddingLeft === 'number' && node.paddingLeft > 0);
      const hasSpacing = typeof node.itemSpacing === 'number' && node.itemSpacing > 0;
      const hasAutoLayout = !!node.layoutMode && node.layoutMode !== 'NONE';

      // Skip top-level frames (depth 0) — already captured in `backgrounds`
      // For deeper nodes: only include if they have auto-layout with padding or spacing
      if (depth === 0) {
        if (Array.isArray(node.children)) {
          const childSpacing = this.buildSpacingStructure(node.children, depth + 1, maxDepth);
          result.push(...childSpacing);
        }
        continue;
      }

      if (!hasAutoLayout && !hasPadding && !hasSpacing) {
        if (Array.isArray(node.children)) {
          const childSpacing = this.buildSpacingStructure(node.children, depth + 1, maxDepth);
          result.push(...childSpacing);
        }
        continue;
      }

      const entry: any = { name: node.name };
      if (node.layoutMode) entry.layoutMode = node.layoutMode;
      if (node.primaryAxisSizingMode) entry.primaryAxisSizingMode = node.primaryAxisSizingMode;
      if (node.counterAxisSizingMode) entry.counterAxisSizingMode = node.counterAxisSizingMode;
      if (node.primaryAxisAlignItems) entry.primaryAxisAlignItems = node.primaryAxisAlignItems;
      if (node.counterAxisAlignItems) entry.counterAxisAlignItems = node.counterAxisAlignItems;
      if (hasSpacing) entry.itemSpacing = node.itemSpacing;
      if (typeof node.paddingTop === 'number' && node.paddingTop > 0) entry.paddingTop = node.paddingTop;
      if (typeof node.paddingRight === 'number' && node.paddingRight > 0) entry.paddingRight = node.paddingRight;
      if (typeof node.paddingBottom === 'number' && node.paddingBottom > 0) entry.paddingBottom = node.paddingBottom;
      if (typeof node.paddingLeft === 'number' && node.paddingLeft > 0) entry.paddingLeft = node.paddingLeft;

      if (Array.isArray(node.children)) {
        const childSpacing = this.buildSpacingStructure(node.children, depth + 1, maxDepth);
        if (childSpacing.length > 0) entry.children = childSpacing;
      }

      result.push(entry);
    }

    return result;
  }

  buildReferenceContext(data: any, iconNames?: string[], wireframe?: import('./wireframe-builder.service').WireframeNode): string {
    const nodes = Array.isArray(data) ? data : [data];

    // Token accumulators
    const colorMap = new Map<string, any>(); // key = rgba string for dedup, value = {color, boundVariables?}
    const gradientSet = new Set<string>();
    const fontSet = new Set<string>();
    const spacingSet = new Set<number>();
    const radiusSet = new Set<number>();
    const shadowSet = new Set<string>();
    const strokeSet = new Set<string>();

    // Compact component styles: first match per category
    const componentStyles: Record<string, any> = {};

    // Top-level frame backgrounds
    const backgrounds: any[] = [];

    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // Colors from fills
      if (Array.isArray(node.fills)) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b } = fill.color;
            const a = fill.opacity ?? fill.color.a ?? 1;
            const key = `rgba(${r},${g},${b},${a})`;
            if (!colorMap.has(key)) {
              const entry: any = { color: { r, g, b } };
              if (fill.boundVariables?.color) entry.boundVariables = { color: fill.boundVariables.color };
              colorMap.set(key, entry);
            } else if (fill.boundVariables?.color && !colorMap.get(key).boundVariables) {
              colorMap.get(key).boundVariables = { color: fill.boundVariables.color };
            }
          } else if (
            (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') &&
            fill.gradientStops && gradientSet.size < 20
          ) {
            gradientSet.add(JSON.stringify({
              type: fill.type,
              stops: fill.gradientStops.map((s: any) => ({
                pos: parseFloat(s.position),
                color: s.color,
              })),
            }));
          }
        }
      }

      // Colors + stroke metadata from strokes
      if (Array.isArray(node.strokes) && node.strokes.length > 0) {
        for (const stroke of node.strokes) {
          if (stroke.type === 'SOLID' && stroke.color) {
            const { r, g, b } = stroke.color;
            const a = stroke.opacity ?? stroke.color.a ?? 1;
            const key = `rgba(${r},${g},${b},${a})`;
            if (!colorMap.has(key)) {
              const entry: any = { color: { r, g, b } };
              if (stroke.boundVariables?.color) entry.boundVariables = { color: stroke.boundVariables.color };
              colorMap.set(key, entry);
            } else if (stroke.boundVariables?.color && !colorMap.get(key).boundVariables) {
              colorMap.get(key).boundVariables = { color: stroke.boundVariables.color };
            }
          }
        }
        const strokeEntry: any = {};
        if (typeof node.strokeWeight === 'number') strokeEntry.weight = node.strokeWeight;
        if (node.strokeAlign) strokeEntry.align = node.strokeAlign;
        if (Array.isArray(node.dashPattern) && node.dashPattern.length > 0) {
          strokeEntry.dashPattern = node.dashPattern;
        }
        if (Object.keys(strokeEntry).length > 0) strokeSet.add(JSON.stringify(strokeEntry));
      }

      // Typography
      if (node.fontName && node.fontSize) {
        const entry: any = { family: node.fontName.family, style: node.fontName.style, size: node.fontSize };
        if (node.lineHeight && typeof node.lineHeight === 'object') entry.lineHeight = node.lineHeight;
        if (node.letterSpacing && typeof node.letterSpacing === 'object') entry.letterSpacing = node.letterSpacing;
        fontSet.add(JSON.stringify(entry));
      }

      // Spacing
      for (const key of ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) {
        if (typeof node[key] === 'number' && node[key] > 0) spacingSet.add(node[key]);
      }

      // Corner radius
      if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) radiusSet.add(node.cornerRadius);

      // Shadows
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

      // Component matching — first match per category, stored as compact style summary
      const pattern = this.matchPattern(node.name || '');
      if (pattern && !componentStyles[pattern]) {
        componentStyles[pattern] = this.extractComponentStyle(node);
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) walk(child);
      }
    };

    for (const node of nodes) {
      // Capture top-level FRAME fills and auto-layout as background reference
      if (node.type === 'FRAME') {
        const bg: any = { name: node.name, width: node.width, height: node.height };
        if (Array.isArray(node.fills) && node.fills.length > 0) bg.fills = node.fills;
        if (node.layoutMode) bg.layoutMode = node.layoutMode;
        if (node.primaryAxisSizingMode) bg.primaryAxisSizingMode = node.primaryAxisSizingMode;
        if (node.counterAxisSizingMode) bg.counterAxisSizingMode = node.counterAxisSizingMode;
        if (typeof node.itemSpacing === 'number' && node.itemSpacing > 0) bg.itemSpacing = node.itemSpacing;
        if (typeof node.paddingTop === 'number' && node.paddingTop > 0) bg.paddingTop = node.paddingTop;
        if (typeof node.paddingRight === 'number' && node.paddingRight > 0) bg.paddingRight = node.paddingRight;
        if (typeof node.paddingBottom === 'number' && node.paddingBottom > 0) bg.paddingBottom = node.paddingBottom;
        if (typeof node.paddingLeft === 'number' && node.paddingLeft > 0) bg.paddingLeft = node.paddingLeft;
        backgrounds.push(bg);
      }
      walk(node);
    }

    const parsedFonts = Array.from(fontSet).map(s => JSON.parse(s));
    const families = [...new Set(parsedFonts.map((f: any) => f.family))];

    const output: any = {
      designTokens: {
        colors: Array.from(colorMap.values()),
        gradients: Array.from(gradientSet).map(s => JSON.parse(s)),
        typography: {
          families,
          scale: parsedFonts.sort((a: any, b: any) => a.size - b.size),
        },
        spacing: Array.from(spacingSet).sort((a, b) => a - b),
        radii: Array.from(radiusSet).sort((a, b) => a - b),
        shadows: Array.from(shadowSet).map(s => JSON.parse(s)),
        strokes: Array.from(strokeSet).map(s => JSON.parse(s)),
      },
      backgrounds,
      componentStyles,
    };

    const spacingStructure = this.buildSpacingStructure(nodes);
    if (spacingStructure.length > 0) output.spacingStructure = spacingStructure;

    if (iconNames && iconNames.length > 0) output.availableIcons = iconNames;

    if (wireframe) output.wireframe = wireframe;

    return JSON.stringify(output);
  }
}
