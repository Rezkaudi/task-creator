import { ColorWithAlpha } from '../value-objects/color';
import { EffectType } from '../../shared/types/node-types';

/**
 * Offset value object
 */
export interface Offset {
  readonly x: number;
  readonly y: number;
}

/**
 * Effect entity representing visual effects
 */
export interface Effect {
  readonly type: EffectType;
  readonly visible?: boolean;
  readonly radius?: number;
  readonly color?: ColorWithAlpha;
  readonly offset?: Offset;
  readonly spread?: number;
  readonly blendMode?: string;
}

/**
 * Type guard for shadow effects
 */
export function isShadowEffect(effect: Effect): effect is Effect & { offset: Offset } {
  return effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW';
}

/**
 * Type guard for blur effects
 */
export function isBlurEffect(effect: Effect): boolean {
  return effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR';
}
