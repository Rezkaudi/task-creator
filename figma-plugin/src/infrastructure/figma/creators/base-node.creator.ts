import { DesignNode } from '../../../domain/entities/design-node';
import { Fill } from '../../../domain/entities/fill';
import { Effect } from '../../../domain/entities/effect';
import { FillMapper } from '../../mappers/fill.mapper';
import { EffectMapper } from '../../mappers/effect.mapper';

/**
 * Base class for node creators with common functionality
 */
export abstract class BaseNodeCreator {
  /**
   * Apply fills to a node
   */
  protected applyFills(node: SceneNode, fills?: Fill[]): void {
    if (!fills || !Array.isArray(fills) || fills.length === 0 || !('fills' in node)) {
      return;
    }

    const validFills = FillMapper.toPaint(fills);
    if (validFills.length > 0) {
      (node as GeometryMixin).fills = validFills;
    }
  }

  /**
   * Apply strokes to a node
   */
  protected applyStrokes(
    node: SceneNode,
    strokes?: Fill[],
    weight?: number,
    align?: 'INSIDE' | 'OUTSIDE' | 'CENTER'
  ): void {
    if (!strokes || !Array.isArray(strokes) || strokes.length === 0 || !('strokes' in node)) {
      return;
    }

    const validStrokes = FillMapper.toPaint(strokes);
    if (validStrokes.length > 0) {
      (node as GeometryMixin).strokes = validStrokes as SolidPaint[];

      if (typeof weight === 'number' && weight >= 0) {
        (node as GeometryMixin).strokeWeight = weight;
      }

      if (align && 'strokeAlign' in node) {
        (node as any).strokeAlign = align;
      }
    }
  }

  /**
   * Apply corner radius to a node
   */
  protected applyCornerRadius(node: SceneNode, nodeData: DesignNode): void {
    if (!('cornerRadius' in node)) return;

    const rectNode = node as RectangleNode | FrameNode | ComponentNode;

    // Check for individual corner radii first
    if (
      typeof nodeData.topLeftRadius === 'number' ||
      typeof nodeData.topRightRadius === 'number' ||
      typeof nodeData.bottomLeftRadius === 'number' ||
      typeof nodeData.bottomRightRadius === 'number'
    ) {
      rectNode.topLeftRadius = nodeData.topLeftRadius || 0;
      rectNode.topRightRadius = nodeData.topRightRadius || 0;
      rectNode.bottomLeftRadius = nodeData.bottomLeftRadius || 0;
      rectNode.bottomRightRadius = nodeData.bottomRightRadius || 0;
    } else if (typeof nodeData.cornerRadius === 'number') {
      rectNode.cornerRadius = nodeData.cornerRadius;
    }
  }

  /**
   * Apply effects to a node
   */
  protected applyEffects(node: SceneNode & MinimalBlendMixin, effects: Effect[]): void {
    if (!effects || !Array.isArray(effects) || effects.length === 0) return;

    const validEffects = EffectMapper.toFigmaEffect(effects);
    if (validEffects.length > 0 && 'effects' in node) {
      (node as any).effects = validEffects;
    }
  }

  /**
   * Apply common properties to a node
   */
  protected applyCommonProperties(node: SceneNode, nodeData: DesignNode): void {
    // Opacity
    if (typeof nodeData.opacity === 'number' && 'opacity' in node) {
      (node as any).opacity = Math.max(0, Math.min(1, nodeData.opacity));
    }

    // Blend mode
    if (nodeData.blendMode && 'blendMode' in node) {
      (node as any).blendMode = nodeData.blendMode;
    }

    // Visibility
    if (typeof nodeData.visible === 'boolean') {
      node.visible = nodeData.visible;
    }

    // Locked
    if (typeof nodeData.locked === 'boolean') {
      node.locked = nodeData.locked;
    }

    // Rotation
    if (typeof nodeData.rotation === 'number' && 'rotation' in node) {
      (node as any).rotation = nodeData.rotation;
    }

    // Effects
    if (nodeData.effects && Array.isArray(nodeData.effects) && 'effects' in node) {
      this.applyEffects(node as SceneNode & MinimalBlendMixin, nodeData.effects);
    }

    // Constraints
    if (nodeData.constraints && 'constraints' in node) {
      (node as any).constraints = nodeData.constraints;
    }

    // Layout properties for children in auto-layout
    if (typeof nodeData.layoutGrow === 'number' && 'layoutGrow' in node) {
      (node as any).layoutGrow = nodeData.layoutGrow;
    }
    if (nodeData.layoutAlign && 'layoutAlign' in node) {
      (node as any).layoutAlign = nodeData.layoutAlign;
    }
    if (nodeData.layoutPositioning && 'layoutPositioning' in node) {
      (node as any).layoutPositioning = nodeData.layoutPositioning;
    }
  }

  /**
   * Ensure minimum dimensions
   */
  protected ensureMinDimensions(width?: number, height?: number, defaultValue: number = 100): { width: number; height: number } {
    return {
      width: Math.max(1, width || defaultValue),
      height: Math.max(1, height || defaultValue),
    };
  }
}
