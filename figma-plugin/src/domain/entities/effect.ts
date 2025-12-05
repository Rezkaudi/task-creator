import { EffectType } from '../../shared/types/node-types';

// Re-export EffectType for convenience
export { EffectType };

/**
 * Color with alpha for effects
 */
export interface EffectColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Offset for shadow effects
 */
export interface EffectOffset {
  x: number;
  y: number;
}

/**
 * Effect entity - represents visual effects in Figma
 */
export interface Effect {
  type: EffectType | string;
  visible?: boolean;

  // Shadow properties
  radius?: number;
  color?: EffectColor;
  offset?: EffectOffset;
  spread?: number;
  blendMode?: string;
  showShadowBehindNode?: boolean;
}

/**
 * Create a drop shadow effect
 */
export function createDropShadow(
  radius: number = 10,
  offsetX: number = 0,
  offsetY: number = 4,
  color: EffectColor = { r: 0, g: 0, b: 0, a: 0.25 },
  spread: number = 0
): Effect {
  return {
    type: 'DROP_SHADOW',
    visible: true,
    radius,
    offset: { x: offsetX, y: offsetY },
    color,
    spread,
    blendMode: 'NORMAL',
    showShadowBehindNode: false,
  };
}

/**
 * Create an inner shadow effect
 */
export function createInnerShadow(
  radius: number = 10,
  offsetX: number = 0,
  offsetY: number = 4,
  color: EffectColor = { r: 0, g: 0, b: 0, a: 0.25 },
  spread: number = 0
): Effect {
  return {
    type: 'INNER_SHADOW',
    visible: true,
    radius,
    offset: { x: offsetX, y: offsetY },
    color,
    spread,
    blendMode: 'NORMAL',
  };
}

/**
 * Create a layer blur effect
 */
export function createLayerBlur(radius: number = 10): Effect {
  return {
    type: 'LAYER_BLUR',
    visible: true,
    radius,
  };
}

/**
 * Create a background blur effect
 */
export function createBackgroundBlur(radius: number = 10): Effect {
  return {
    type: 'BACKGROUND_BLUR',
    visible: true,
    radius,
  };
}
