import { Fill, GradientStop, isSolidFill, isGradientFill, isImageFill } from '../../domain/entities/fill';
import { ColorFactory } from '../../domain/value-objects/color';

/**
 * Image hash to base64 data cache for import
 */
const imageImportCache = new Map<string, Image>();

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

        // If we have base64 image data, create the image
        if (fill.imageData) {
          const bytes = FillMapper.base64ToBytes(fill.imageData);
          image = await figma.createImage(bytes);
        } else if (fill.imageHash) {
          // Try to get existing image by hash
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
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
