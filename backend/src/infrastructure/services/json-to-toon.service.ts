export class JsonToToonService {

  convertToToon(data: any): string {
    return this.compress(data, 0);
  }

  private compress(value: any, depth: number): string {
    const indent = '  '.repeat(depth);

    if (value === null || value === undefined) {
      return 'null';
    }

    const type = typeof value;

    // Primitives
    if (type === 'string') {
      if (value.length > 50) {
        return `"${value.substring(0, 47)}..."`;
      }
      return `"${value}"`;
    }

    if (type === 'number') {
      return typeof value === 'number' && value % 1 !== 0
        ? value.toFixed(2)
        : String(value);
    }

    if (type === 'boolean') {
      return String(value);
    }

    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';

      if (value.every(item => typeof item !== 'object' || item === null)) {
        return '[' + value.map(v => this.compress(v, 0)).join(',') + ']';
      }

      let result = '';
      value.forEach((item, idx) => {
        result += `\n${indent}[${idx}]:${this.compress(item, depth + 1)}`;
      });
      return result;
    }

    // Objects
    if (type === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';

      const importantKeys = this.filterImportantKeys(keys, value);

      let result = '';
      importantKeys.forEach(key => {
        const val = value[key];
        const compactVal = this.compress(val, depth + 1);

        result += `\n${indent}${key}:${compactVal}`;
      });

      return result;
    }

    return String(value);
  }

  private filterImportantKeys(keys: string[], obj: any): string[] {
    const skipKeys = new Set([
      '_layerIndex',
      'x',
      'y',
      'reactions',
      'exportSettings',
      'constraints',
      'blendMode',
      'preserveRatio',
      'layoutGrow',
      'layoutAlign',
      'visible',
      'locked',
      'showShadowBehindNode',
      'strokeAlign',
      'textAutoResize',
      'letterSpacing',
      'primaryAxisSizingMode',
      'counterAxisSizingMode',
      'primaryAxisAlignItems',
      'counterAxisAlignItems',
      'clipsContent',
      'vectorPaths',
      // 'imageHash',
      'imageData',
      // 'imageUrl',
      'scaleMode',
      'imageTransform',
      'filters',
      'scalingFactor',
    ]);

    const alwaysKeep = new Set([
      'type',
      'name',
      'children',
      'fills',
      'strokes',
      'effects',
      'cornerRadius',
      'fontSize',
      'fontName',
      'characters',
      'width',
      'height',
      'layoutMode',
      'itemSpacing',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'textAlignHorizontal',
      'lineHeight',
    ]);

    return keys.filter(key => {
      if (alwaysKeep.has(key)) return true;
      if (skipKeys.has(key)) return false;

      if (key === 'opacity' && obj[key] !== 1) return true;

      return true;
    });
  }
}