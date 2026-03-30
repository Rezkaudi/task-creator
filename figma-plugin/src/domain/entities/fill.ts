import { FillType, BlendModeType } from '../../shared/types/node-types';
import { Color, ColorWithAlpha } from '../value-objects/color';

// Re-export for convenience
export type { Color, ColorWithAlpha };

/**
 * Gradient stop
 */
export interface GradientStop {
  position: number;
  color: ColorWithAlpha;
}

/**
 * Image filters
 */
export interface ImageFilters {
  exposure?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
}

/**
 * Serialised reference to a Figma Variable.
 * id  — node-scope ID for fast direct lookup
 * key — cross-file key used as fallback when id mismatches
 */
export interface VariableRef {
  id: string;
  key: string;
}

/**
 * Variable bindings on a single fill/stroke paint.
 * Mirrors the shape of paint.boundVariables in the Figma Plugin API.
 */
export interface FillBoundVariables {
  color?: VariableRef;
  opacity?: VariableRef;
}

/**
 * Fill entity - represents all types of fills in Figma
 */
export interface Fill {
  type: FillType | string;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendModeType | string;

  // Solid fill
  color?: Color;

  // Gradient fill
  gradientStops?: GradientStop[];
  gradientTransform?: [[number, number, number], [number, number, number]];

  // Image fill
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageHash?: string;
  // imageData?: string; // Base64 encoded image data for export/import (disabled)
  imageUrl?: string; // URL to fetch image from (for import)
  imageTransform?: [[number, number, number], [number, number, number]];
  scalingFactor?: number;
  rotation?: number;
  filters?: ImageFilters;

  // Variable bindings for this paint
  boundVariables?: FillBoundVariables;
}

/**
 * Create a solid fill
 */
export function createSolidFill(
  r: number,
  g: number,
  b: number,
  opacity: number = 1
): Fill {
  return {
    type: 'SOLID',
    visible: true,
    opacity,
    blendMode: 'NORMAL',
    color: { r, g, b },
  };
}

/**
 * Create a gradient fill
 */
export function createGradientFill(
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND',
  stops: GradientStop[],
  transform?: [[number, number, number], [number, number, number]]
): Fill {
  return {
    type,
    visible: true,
    opacity: 1,
    blendMode: 'NORMAL',
    gradientStops: stops,
    gradientTransform: transform,
  };
}

/**
 * Create an image fill
 */
export function createImageFill(
  imageHash: string,
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE' = 'FILL'
): Fill {
  return {
    type: 'IMAGE',
    visible: true,
    opacity: 1,
    blendMode: 'NORMAL',
    scaleMode,
    imageHash,
  };
}

/**
 * Create an image fill from URL
 */
export function createImageFillFromUrl(
  imageUrl: string,
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE' = 'FILL'
): Fill {
  return {
    type: 'IMAGE',
    visible: true,
    opacity: 1,
    blendMode: 'NORMAL',
    scaleMode,
    imageUrl,
  };
}

/**
 * Type guard for solid fills
 */
export function isSolidFill(fill: Fill): boolean {
  return fill.type === 'SOLID';
}

/**
 * Type guard for gradient fills
 */
export function isGradientFill(fill: Fill): boolean {
  return fill.type === 'GRADIENT_LINEAR' ||
    fill.type === 'GRADIENT_RADIAL' ||
    fill.type === 'GRADIENT_ANGULAR' ||
    fill.type === 'GRADIENT_DIAMOND';
}

/**
 * Type guard for image fills
 */
export function isImageFill(fill: Fill): boolean {
  return fill.type === 'IMAGE';
}