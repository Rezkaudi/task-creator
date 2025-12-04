import { Effect, EffectType } from '../../domain/entities/effect';

/**
 * Mapper for converting between domain Effect entities and Figma Effect types
 */
export class EffectMapper {
  /**
   * Convert Figma effect to domain entity
   */
  static toEntity(figmaEffect: Effect): Effect {
    const effect: Effect = {
      type: figmaEffect.type,
      visible: figmaEffect.visible ?? true,
    };

    if (figmaEffect.type === 'DROP_SHADOW' || figmaEffect.type === 'INNER_SHADOW') {
      effect.radius = figmaEffect.radius ?? 0;
      effect.spread = figmaEffect.spread ?? 0;

      if (figmaEffect.color) {
        effect.color = {
          r: figmaEffect.color.r,
          g: figmaEffect.color.g,
          b: figmaEffect.color.b,
          a: figmaEffect.color.a ?? 1,
        };
      }

      if (figmaEffect.offset) {
        effect.offset = {
          x: figmaEffect.offset.x ?? 0,
          y: figmaEffect.offset.y ?? 0,
        };
      }

      if (figmaEffect.blendMode) {
        effect.blendMode = figmaEffect.blendMode;
      }

      if (figmaEffect.type === 'DROP_SHADOW' && figmaEffect.showShadowBehindNode !== undefined) {
        effect.showShadowBehindNode = figmaEffect.showShadowBehindNode;
      }
    } else if (figmaEffect.type === 'LAYER_BLUR' || figmaEffect.type === 'BACKGROUND_BLUR') {
      effect.radius = figmaEffect.radius ?? 0;
    }

    return effect;
  }

  /**
   * Convert domain entity to Figma effect
   */
  static toFigmaEffect(entity: Effect): DropShadowEffect | InnerShadowEffect | BlurEffect {
    if (entity.type === 'DROP_SHADOW') {
      const color = entity.color ?? { r: 0, g: 0, b: 0, a: 0.25 };
      const dropShadow: DropShadowEffect = {
        type: 'DROP_SHADOW',
        visible: entity.visible ?? true,
        radius: entity.radius ?? 10,
        spread: entity.spread ?? 0,
        color: { r: color.r, g: color.g, b: color.b, a: color.a },
        offset: entity.offset ?? { x: 0, y: 4 },
        blendMode: (entity.blendMode as BlendMode) ?? 'NORMAL',
        showShadowBehindNode: entity.showShadowBehindNode ?? false,
      };
      return dropShadow;
    }

    if (entity.type === 'INNER_SHADOW') {
      const color = entity.color ?? { r: 0, g: 0, b: 0, a: 0.25 };
      const innerShadow: InnerShadowEffect = {
        type: 'INNER_SHADOW',
        visible: entity.visible ?? true,
        radius: entity.radius ?? 10,
        spread: entity.spread ?? 0,
        color: { r: color.r, g: color.g, b: color.b, a: color.a },
        offset: entity.offset ?? { x: 0, y: 4 },
        blendMode: (entity.blendMode as BlendMode) ?? 'NORMAL',
      };
      return innerShadow;
    }

    // Blur effects
    const blurEffect = {
      type: entity.type as 'LAYER_BLUR' | 'BACKGROUND_BLUR',
      visible: entity.visible ?? true,
      radius: entity.radius ?? 10,
    } as BlurEffect;
    return blurEffect;
  }

  /**
   * Convert array of domain effects to Figma effects
   */
  static toFigmaEffects(entities: Effect[]): (DropShadowEffect | InnerShadowEffect | BlurEffect)[] {
    return entities
      .filter(e => e && e.type)
      .map(e => EffectMapper.toFigmaEffect(e));
  }

  /**
   * Convert array of Figma effects to domain entities
   */
  static toEntities(figmaEffects: readonly Effect[]): Effect[] {
    return figmaEffects.map(e => EffectMapper.toEntity(e));
  }

  /**
   * Create a default drop shadow effect
   */
  static createDefaultDropShadow(): DropShadowEffect {
    return {
      type: 'DROP_SHADOW',
      visible: true,
      radius: 10,
      spread: 0,
      color: { r: 0, g: 0, b: 0, a: 0.25 },
      offset: { x: 0, y: 4 },
      blendMode: 'NORMAL',
      showShadowBehindNode: false,
    };
  }

  /**
   * Create a default inner shadow effect
   */
  static createDefaultInnerShadow(): InnerShadowEffect {
    return {
      type: 'INNER_SHADOW',
      visible: true,
      radius: 10,
      spread: 0,
      color: { r: 0, g: 0, b: 0, a: 0.25 },
      offset: { x: 0, y: 4 },
      blendMode: 'NORMAL',
    };
  }

  /**
   * Create a layer blur effect
   */
  static createLayerBlur(radius: number = 10): BlurEffect {
    return {
      type: 'LAYER_BLUR',
      visible: true,
      radius,
    } as BlurEffect;
  }

  /**
   * Create a background blur effect
   */
  static createBackgroundBlur(radius: number = 10): BlurEffect {
    return {
      type: 'BACKGROUND_BLUR',
      visible: true,
      radius,
    } as BlurEffect;
  }
}
