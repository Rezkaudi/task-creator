import { Color, ColorWithAlpha } from '../value-objects/color';
import { FillType } from '../../shared/types/node-types';

/**
 * Gradient stop entity
 */
export interface GradientStop {
  readonly position: number;
  readonly color: ColorWithAlpha;
}

/**
 * Fill entity representing paint fills
 */
export interface Fill {
  readonly type: FillType;
  readonly visible?: boolean;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly color?: Color;
  readonly gradientStops?: GradientStop[];
  readonly gradientTransform?: number[][];
  readonly imageRef?: string;
  readonly scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
}

/**
 * Type guard for solid fills
 */
export function isSolidFill(fill: Fill): fill is Fill & { color: Color } {
  return fill.type === 'SOLID' && fill.color !== undefined;
}

/**
 * Type guard for gradient fills
 */
export function isGradientFill(fill: Fill): fill is Fill & { gradientStops: GradientStop[] } {
  return fill.type.startsWith('GRADIENT') && fill.gradientStops !== undefined;
}
