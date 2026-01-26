import { Fill, GradientStop, isSolidFill, isGradientFill, isImageFill } from '../../domain/entities/fill';
import { ColorFactory } from '../../domain/value-objects/color';

/**
 * Image hash to base64 data cache for import
 */
const imageImportCache = new Map<string, Image>();

/**
 * URL to Image cache to avoid re-fetching
 */
const imageUrlCache = new Map<string, Image>();

/**
 * Mapper for converting between Fill entities and Figma Paint objects
 */
export class FillMapper {
  /**
   * Map Figma paints to Fill entities (synchronous version for compatibility)
   */
  static toEntity(paints: readonly Paint[]): Fill[] | null {
    if (!paints || paints.length === 0) return null;

    const fills: Fill[] = [];

    for (const paint of paints) {
      const fill = FillMapper.mapPaintToFill(paint);
      if (fill) {
        fills.push(fill);
      }
    }

    return fills.length > 0 ? fills : null;
  }

  /**
   * Map Fill entities to Figma Paint objects
   */
  static toPaint(fills: Fill[]): Paint[] {
    const validFills: Paint[] = [];

    for (const fill of fills) {
      if (!fill || typeof fill !== 'object') continue;

      const paint = FillMapper.mapFillToPaint(fill);
      if (paint) {
        validFills.push(paint);
      }
    }

    return validFills;
  }

  /**
   * Map Fill entities to Figma Paint objects asynchronously (for images)
   */
  static async toPaintAsync(fills: Fill[]): Promise<Paint[]> {
    const validFills: Paint[] = [];

    for (const fill of fills) {
      if (!fill || typeof fill !== 'object') continue;

      const paint = await FillMapper.mapFillToPaintAsync(fill);
      if (paint) {
        validFills.push(paint);
      }
    }

    return validFills;
  }

  private static mapPaintToFill(paint: Paint): Fill | null {
    const baseFill: Partial<Fill> = {
      type: paint.type as Fill['type'],
      visible: paint.visible !== false,
      opacity: paint.opacity ?? 1,
      blendMode: paint.blendMode || 'NORMAL',
    };

    if (paint.type === 'SOLID') {
      return {
        ...baseFill,
        color: ColorFactory.round({
          r: paint.color.r,
          g: paint.color.g,
          b: paint.color.b,
        }, 6),
      } as Fill;
    }

    if (paint.type.startsWith('GRADIENT')) {
      const gradientPaint = paint as GradientPaint;
      return {
        ...baseFill,
        gradientStops: FillMapper.mapGradientStops(gradientPaint.gradientStops),
        gradientTransform: gradientPaint.gradientTransform ? [
          [...gradientPaint.gradientTransform[0]],
          [...gradientPaint.gradientTransform[1]],
        ] : undefined,
      } as Fill;
    }

    if (paint.type === 'IMAGE') {
      const imagePaint = paint as ImagePaint;
      return {
        ...baseFill,
        imageHash: imagePaint.imageHash,
        scaleMode: imagePaint.scaleMode,
        imageTransform: imagePaint.imageTransform ? [
          [...imagePaint.imageTransform[0]],
          [...imagePaint.imageTransform[1]],
        ] : undefined,
        scalingFactor: imagePaint.scalingFactor,
        rotation: imagePaint.rotation,
        filters: imagePaint.filters ? { ...imagePaint.filters } : undefined,
      } as Fill;
    }

    return null;
  }

  private static mapFillToPaint(fill: Fill): Paint | null {
    if (isSolidFill(fill)) {
      // Make sure we have a color object
      if (!fill.color) {
        console.warn('Solid fill missing color:', fill);
        return null;
      }

      const color = fill.color;

      // Ensure color values are valid numbers
      const r = typeof color.r === 'number' ? color.r : 0;
      const g = typeof color.g === 'number' ? color.g : 0;
      const b = typeof color.b === 'number' ? color.b : 0;

      console.log('Creating solid fill with color:', { r, g, b });

      return {
        type: 'SOLID',
        visible: fill.visible !== false,
        opacity: FillMapper.normalizeOpacity(fill.opacity),
        blendMode: (fill.blendMode as BlendMode) || 'NORMAL',
        color: {
          r: ColorFactory.normalize(r),
          g: ColorFactory.normalize(g),
          b: ColorFactory.normalize(b),
        },
      } as SolidPaint;
    }

    if (isGradientFill(fill)) {
      const stops = fill.gradientStops ?? [];
      const gradientPaint: any = {
        type: fill.type,
        visible: fill.visible !== false,
        opacity: FillMapper.normalizeOpacity(fill.opacity),
        blendMode: (fill.blendMode as BlendMode) || 'NORMAL',
        gradientStops: stops.map(stop => ({
          position: stop.position,
          color: {
            r: ColorFactory.normalize(stop.color.r || 0),
            g: ColorFactory.normalize(stop.color.g || 0),
            b: ColorFactory.normalize(stop.color.b || 0),
            a: stop.color.a ?? 1,
          },
        })),
      };

      if (fill.gradientTransform) {
        gradientPaint.gradientTransform = [
          [fill.gradientTransform[0][0], fill.gradientTransform[0][1], fill.gradientTransform[0][2]],
          [fill.gradientTransform[1][0], fill.gradientTransform[1][1], fill.gradientTransform[1][2]],
        ];
      }

      return gradientPaint as GradientPaint;
    }

    // Image fills need async handling - return null for sync version
    return null;
  }

  private static async mapFillToPaintAsync(fill: Fill): Promise<Paint | null> {
    // Try sync first
    const syncPaint = FillMapper.mapFillToPaint(fill);
    if (syncPaint) return syncPaint;

    // Handle image fills asynchronously
    if (isImageFill(fill)) {
      try {
        let image: Image | null = null;

        // Priority 1: If we have an imageUrl, fetch it
        if (fill.imageUrl) {
          image = await FillMapper.fetchImageFromUrl(fill.imageUrl);
        }
        // Priority 2: If we have base64 image data, create the image
        else if (fill.imageData) {
          const bytes = FillMapper.base64ToBytes(fill.imageData);
          image = await figma.createImage(bytes);
        }
        // Priority 3: Try to get existing image by hash
        else if (fill.imageHash) {
          image = figma.getImageByHash(fill.imageHash);
        }

        if (!image) {
          console.warn('Could not create or find image for fill');
          return null;
        }

        const imagePaint: ImagePaint = {
          type: 'IMAGE',
          visible: fill.visible !== false,
          opacity: FillMapper.normalizeOpacity(fill.opacity),
          blendMode: (fill.blendMode as BlendMode) || 'NORMAL',
          scaleMode: fill.scaleMode || 'FILL',
          imageHash: image.hash,
          imageTransform: fill.imageTransform ? [
            [fill.imageTransform[0][0], fill.imageTransform[0][1], fill.imageTransform[0][2]],
            [fill.imageTransform[1][0], fill.imageTransform[1][1], fill.imageTransform[1][2]],
          ] as Transform : undefined,
          scalingFactor: fill.scalingFactor,
          rotation: fill.rotation || 0,
          filters: fill.filters ? { ...fill.filters } as ImageFilters : undefined,
        };

        return imagePaint;
      } catch (error) {
        console.error('Error creating image fill:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Fetch an image from a URL and create a Figma Image
   * Note: Figma only supports PNG, JPEG, GIF, and WebP. SVG is converted via proxy.
   */
  private static async fetchImageFromUrl(url: string): Promise<Image | null> {
    // Check cache first
    if (imageUrlCache.has(url)) {
      console.log('Using cached image for URL:', url);
      return imageUrlCache.get(url)!;
    }

    try {
      console.log('Fetching image from URL:', url);

      // Convert SVG URLs to PNG via proxy service
      let fetchUrl = url;
      const isSvg = url.endsWith('.svg') || url.includes('/svg/') || url.includes('api.iconify.design');

      if (isSvg) {
        console.log('🔄 SVG detected - converting to PNG via proxy...');
        fetchUrl = FillMapper.convertSvgUrlToPng(url);
        console.log('   Converted URL:', fetchUrl);
      }

      const response = await fetch(fetchUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText || ''}`);
      }

      // Safely get content type - headers may be undefined in Figma sandbox
      let contentType = '';
      try {
        if (response.headers && typeof response.headers.get === 'function') {
          contentType = response.headers.get('content-type') || '';
        }
      } catch (e) {
        console.log('Could not read content-type header');
      }

      const arrayBuffer = await response.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Received empty image data');
      }

      console.log(`Image fetched: ${arrayBuffer.byteLength} bytes, type: ${contentType || 'unknown'}`);

      // Create the Figma image using our helper
      const image = await FillMapper.createFigmaImage(arrayBuffer);

      if (image) {
        // Cache using original URL as key
        imageUrlCache.set(url, image);
        console.log('✅ Successfully created image from URL:', url);
      }

      return image;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error fetching image from URL:', url);
      console.error('   Error:', errorMessage);
      return null;
    }
  }

  /**
   * Convert SVG URL to PNG via image proxy service
   * Uses wsrv.nl (weserv) - a free image proxy that converts SVG to PNG
   */
  private static convertSvgUrlToPng(svgUrl: string): string {
    // Use wsrv.nl to convert SVG to PNG
    // Documentation: https://wsrv.nl/docs/
    const encodedUrl = encodeURIComponent(svgUrl);

    // wsrv.nl parameters:
    // - output=png: convert to PNG format
    // - w=512: width (optional, for better quality)
    // - h=512: height (optional, for better quality)
    return `https://wsrv.nl/?url=${encodedUrl}&output=png&w=512&h=512`;
  }

  /**
   * Helper to create Figma image with proper typing
   */
  private static async createFigmaImage(arrayBuffer: ArrayBuffer): Promise<Image | null> {
    try {
      // @ts-ignore - Workaround for TypeScript Uint8Array<ArrayBuffer> vs Uint8Array<ArrayBufferLike> issue
      const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);
      return await figma.createImage(bytes);
    } catch (error) {
      console.error('Error creating Figma image:', error);
      return null;
    }
  }

  private static mapGradientStops(stops: readonly ColorStop[]): GradientStop[] {
    return stops.map((stop) => ({
      position: stop.position,
      color: {
        r: Math.round(stop.color.r * 1000000) / 1000000,
        g: Math.round(stop.color.g * 1000000) / 1000000,
        b: Math.round(stop.color.b * 1000000) / 1000000,
        a: stop.color.a,
      },
    }));
  }

  private static normalizeOpacity(opacity?: number): number {
    if (typeof opacity !== 'number') return 1;
    return Math.max(0, Math.min(1, opacity));
  }

  private static base64ToBytes(base64: string): Uint8Array {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');

      // Try using atob if available
      if (typeof atob === 'function') {
        const binaryString = atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      // Fallback: manual base64 decoding
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }

      let adjustedLength = Math.floor(cleanBase64.length * 0.75);
      if (cleanBase64[cleanBase64.length - 1] === '=') adjustedLength--;
      if (cleanBase64[cleanBase64.length - 2] === '=') adjustedLength--;

      const bytes = new Uint8Array(adjustedLength);
      let p = 0;

      for (let i = 0; i < cleanBase64.length; i += 4) {
        const encoded1 = lookup[cleanBase64.charCodeAt(i)];
        const encoded2 = lookup[cleanBase64.charCodeAt(i + 1)];
        const encoded3 = lookup[cleanBase64.charCodeAt(i + 2)];
        const encoded4 = lookup[cleanBase64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (p < adjustedLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        if (p < adjustedLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      return bytes;
    } catch (error) {
      console.error('Error decoding base64:', error);
      throw new Error('Failed to decode base64 image data');
    }
  }
  /**
   * Clear the URL cache
   */
  static clearUrlCache(): void {
    imageUrlCache.clear();
  }
}