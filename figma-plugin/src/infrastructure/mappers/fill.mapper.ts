import { Fill, GradientStop, isSolidFill } from '../../domain/entities/fill';
import { ColorFactory } from '../../domain/value-objects/color';

/**
 * Mapper for converting between Fill entities and Figma Paint objects
 */
export class FillMapper {
  /**
   * Map Figma paints to Fill entities
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

      if (isSolidFill(fill)) {
        const solidPaint: SolidPaint = {
          type: 'SOLID',
          visible: fill.visible !== false,
          opacity: FillMapper.normalizeOpacity(fill.opacity),
          blendMode: (fill.blendMode as BlendMode) || 'NORMAL',
          color: {
            r: ColorFactory.normalize(fill.color.r || 0),
            g: ColorFactory.normalize(fill.color.g || 0),
            b: ColorFactory.normalize(fill.color.b || 0),
          },
        };
        validFills.push(solidPaint);
      }
      // Gradient support can be added here
    }

    return validFills;
  }

  private static mapPaintToFill(paint: Paint): Fill | null {
    if (paint.type === 'SOLID') {
      return {
        type: 'SOLID',
        visible: paint.visible !== false,
        opacity: paint.opacity ?? 1,
        blendMode: paint.blendMode || 'NORMAL',
        color: ColorFactory.round({
          r: paint.color.r,
          g: paint.color.g,
          b: paint.color.b,
        }),
      };
    }

    if (paint.type.startsWith('GRADIENT')) {
      const gradientPaint = paint as GradientPaint;
      return {
        type: paint.type as Fill['type'],
        visible: paint.visible !== false,
        opacity: paint.opacity ?? 1,
        blendMode: paint.blendMode || 'NORMAL',
        gradientStops: FillMapper.mapGradientStops(gradientPaint.gradientStops),
        gradientTransform: gradientPaint.gradientTransform as number[][],
      };
    }

    // Skip image fills as they can't be easily exported to JSON
    return null;
  }

  private static mapGradientStops(stops: readonly ColorStop[]): GradientStop[] {
    return stops.map((stop) => ({
      position: stop.position,
      color: {
        r: Math.round(stop.color.r * 1000) / 1000,
        g: Math.round(stop.color.g * 1000) / 1000,
        b: Math.round(stop.color.b * 1000) / 1000,
        a: stop.color.a,
      },
    }));
  }

  private static normalizeOpacity(opacity?: number): number {
    if (typeof opacity !== 'number') return 1;
    return Math.max(0, Math.min(1, opacity));
  }
}
