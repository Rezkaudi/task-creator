import { Effect, isShadowEffect, isBlurEffect } from '../../domain/entities/effect';

/**
 * Mapper for converting between Effect entities and Figma Effect objects
 */
export class EffectMapper {
  /**
   * Map Figma effects to Effect entities
   */
  static toEntity(effects: readonly Effect[]): Effect[] | null {
    if (!effects || effects.length === 0) return null;

    const exportedEffects: Effect[] = [];

    for (const effect of effects) {
      const mapped = EffectMapper.mapEffect(effect as unknown as FigmaEffect);
      if (mapped) {
        exportedEffects.push(mapped);
      }
    }

    return exportedEffects.length > 0 ? exportedEffects : null;
  }

  /**
   * Map Effect entities to Figma Effect objects
   */
  static toFigmaEffect(effects: Effect[]): FigmaEffect[] {
    if (!effects || effects.length === 0) return [];

    const validEffects: FigmaEffect[] = [];

    for (const effect of effects) {
      if (!effect || typeof effect !== 'object') continue;

      const mapped = EffectMapper.mapToFigmaEffect(effect);
      if (mapped) {
        validEffects.push(mapped);
      }
    }

    return validEffects;
  }

  private static mapEffect(effect: FigmaEffect): Effect | null {
    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      const shadowEffect = effect as DropShadowEffect | InnerShadowEffect;
      return {
        type: effect.type,
        visible: effect.visible,
        radius: shadowEffect.radius,
        color: {
          r: Math.round(shadowEffect.color.r * 1000) / 1000,
          g: Math.round(shadowEffect.color.g * 1000) / 1000,
          b: Math.round(shadowEffect.color.b * 1000) / 1000,
          a: shadowEffect.color.a,
        },
        offset: {
          x: shadowEffect.offset.x,
          y: shadowEffect.offset.y,
        },
        spread: shadowEffect.spread,
        blendMode: shadowEffect.blendMode,
      };
    }

    if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
      const blurEffect = effect as BlurEffect;
      return {
        type: effect.type,
        visible: effect.visible,
        radius: blurEffect.radius,
      };
    }

    return null;
  }

  private static mapToFigmaEffect(effect: Effect): FigmaEffect | null {
    switch (effect.type) {
      case 'DROP_SHADOW':
        return {
          type: 'DROP_SHADOW',
          visible: effect.visible !== false,
          radius: effect.radius || 0,
          color: {
            r: effect.color?.r || 0,
            g: effect.color?.g || 0,
            b: effect.color?.b || 0,
            a: effect.color?.a || 0.25,
          },
          offset: {
            x: effect.offset?.x || 0,
            y: effect.offset?.y || 4,
          },
          spread: effect.spread || 0,
          blendMode: (effect.blendMode as BlendMode) || 'NORMAL',
        } as DropShadowEffect;

      case 'INNER_SHADOW':
        return {
          type: 'INNER_SHADOW',
          visible: effect.visible !== false,
          radius: effect.radius || 0,
          color: {
            r: effect.color?.r || 0,
            g: effect.color?.g || 0,
            b: effect.color?.b || 0,
            a: effect.color?.a || 0.25,
          },
          offset: {
            x: effect.offset?.x || 0,
            y: effect.offset?.y || 4,
          },
          spread: effect.spread || 0,
          blendMode: (effect.blendMode as BlendMode) || 'NORMAL',
        } as InnerShadowEffect;

      case 'LAYER_BLUR':
      case 'BACKGROUND_BLUR':
        return {
          type: effect.type,
          visible: effect.visible !== false,
          radius: effect.radius || 0,
        } as BlurEffect;

      default:
        return null;
    }
  }
}

// Type alias for Figma's Effect type
type FigmaEffect = Effect;
