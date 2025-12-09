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
   * Apply fills to a node (async for image support)
   */
  protected async applyFillsAsync(node: SceneNode, fills?: Fill[]): Promise<void> {
    if (!fills || !Array.isArray(fills) || fills.length === 0 || !('fills' in node)) {
      return;
    }

    try {
      const validFills = await FillMapper.toPaintAsync(fills);
      if (validFills.length > 0) {
        (node as GeometryMixin).fills = validFills;
      }
    } catch (error) {
      console.warn('Error applying fills:', error);
      // Fallback to sync version
      this.applyFills(node, fills);
    }
  }

  /**
   * Apply fills to a node (sync version)
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
   * Apply strokes to a node (async for image support)
   */
  protected async applyStrokesAsync(
    node: SceneNode,
    strokes?: Fill[],
    weight?: number,
    align?: 'INSIDE' | 'OUTSIDE' | 'CENTER',
    cap?: string,
    join?: string,
    dashPattern?: number[],
    miterLimit?: number
  ): Promise<void> {
    if (!('strokes' in node)) {
      return;
    }

    // If no strokes provided, clear any default strokes
    if (!strokes || !Array.isArray(strokes) || strokes.length === 0) {
      (node as GeometryMixin).strokes = [];
      return;
    }

    try {
      const validStrokes = await FillMapper.toPaintAsync(strokes);
      if (validStrokes.length > 0) {
        (node as GeometryMixin).strokes = validStrokes as SolidPaint[];
        this.applyStrokeProperties(node, weight, align, cap, join, dashPattern, miterLimit);
      } else {
        (node as GeometryMixin).strokes = [];
      }
    } catch (error) {
      console.warn('Error applying strokes:', error);
      this.applyStrokes(node, strokes, weight, align, cap, join, dashPattern, miterLimit);
    }
  }

  /**
   * Apply strokes to a node (sync version)
   */
  protected applyStrokes(
    node: SceneNode,
    strokes?: Fill[],
    weight?: number,
    align?: 'INSIDE' | 'OUTSIDE' | 'CENTER',
    cap?: string,
    join?: string,
    dashPattern?: number[],
    miterLimit?: number
  ): void {
    if (!('strokes' in node)) {
      return;
    }

    // If no strokes provided, clear any default strokes
    if (!strokes || !Array.isArray(strokes) || strokes.length === 0) {
      (node as GeometryMixin).strokes = [];
      return;
    }

    const validStrokes = FillMapper.toPaint(strokes);
    if (validStrokes.length > 0) {
      (node as GeometryMixin).strokes = validStrokes as SolidPaint[];
      this.applyStrokeProperties(node, weight, align, cap, join, dashPattern, miterLimit);
    } else {
      (node as GeometryMixin).strokes = [];
    }
  }

  private applyStrokeProperties(
    node: SceneNode,
    weight?: number,
    align?: 'INSIDE' | 'OUTSIDE' | 'CENTER',
    cap?: string,
    join?: string,
    dashPattern?: number[],
    miterLimit?: number
  ): void {
    if (typeof weight === 'number' && weight >= 0) {
      (node as GeometryMixin).strokeWeight = weight;
    }

    if (align && 'strokeAlign' in node) {
      (node as any).strokeAlign = align;
    }

    if (cap && 'strokeCap' in node) {
      (node as any).strokeCap = cap;
    }

    if (join && 'strokeJoin' in node) {
      (node as any).strokeJoin = join;
    }

    if (dashPattern && Array.isArray(dashPattern) && dashPattern.length > 0 && 'dashPattern' in node) {
      (node as any).dashPattern = dashPattern;
    }

    if (typeof miterLimit === 'number' && 'strokeMiterLimit' in node) {
      (node as any).strokeMiterLimit = miterLimit;
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

    // Corner smoothing
    if (typeof nodeData.cornerSmoothing === 'number' && 'cornerSmoothing' in rectNode) {
      (rectNode as any).cornerSmoothing = nodeData.cornerSmoothing;
    }
  }

  /**
   * Apply effects to a node
   */
  protected applyEffects(node: SceneNode & MinimalBlendMixin, effects: Effect[]): void {
    if (!effects || !Array.isArray(effects) || effects.length === 0) return;

    const validEffects = EffectMapper.toFigmaEffects(effects);
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

    // Rotation (apply via relativeTransform for accuracy)
    if (typeof nodeData.rotation === 'number' && nodeData.rotation !== 0 && 'rotation' in node) {
      (node as any).rotation = nodeData.rotation;
    }

    // Relative transform (for precise positioning)
    if (nodeData.relativeTransform && 'relativeTransform' in node) {
      try {
        const transform: Transform = [
          [nodeData.relativeTransform[0][0], nodeData.relativeTransform[0][1], nodeData.relativeTransform[0][2]],
          [nodeData.relativeTransform[1][0], nodeData.relativeTransform[1][1], nodeData.relativeTransform[1][2]],
        ];
        (node as any).relativeTransform = transform;
      } catch (error) {
        console.warn('Error applying relative transform:', error);
      }
    }

    // Effects
    if (nodeData.effects && Array.isArray(nodeData.effects) && 'effects' in node) {
      this.applyEffects(node as SceneNode & MinimalBlendMixin, nodeData.effects);
    }

    // Constraints
    if (nodeData.constraints && 'constraints' in node) {
      (node as any).constraints = {
        horizontal: nodeData.constraints.horizontal,
        vertical: nodeData.constraints.vertical,
      };
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

    // Mask
    if (nodeData.isMask && 'isMask' in node) {
      (node as any).isMask = true;
    }

    // Export settings
    if (nodeData.exportSettings && nodeData.exportSettings.length > 0 && 'exportSettings' in node) {
      (node as any).exportSettings = nodeData.exportSettings.map(setting => ({
        format: setting.format,
        suffix: setting.suffix || '',
        contentsOnly: setting.contentsOnly || false,
        constraint: setting.constraint ? {
          type: setting.constraint.type,
          value: setting.constraint.value,
        } : { type: 'SCALE', value: 1 },
      }));
    }
  }

  /**
   * Apply auto-layout properties to a frame
   */
  protected applyAutoLayout(frameNode: FrameNode | ComponentNode, nodeData: DesignNode): void {
    if (!nodeData.layoutMode || nodeData.layoutMode === 'NONE') {
      return;
    }

    frameNode.layoutMode = nodeData.layoutMode;

    if (typeof nodeData.itemSpacing === 'number') {
      frameNode.itemSpacing = nodeData.itemSpacing;
    }
    if (typeof nodeData.paddingTop === 'number') {
      frameNode.paddingTop = nodeData.paddingTop;
    }
    if (typeof nodeData.paddingRight === 'number') {
      frameNode.paddingRight = nodeData.paddingRight;
    }
    if (typeof nodeData.paddingBottom === 'number') {
      frameNode.paddingBottom = nodeData.paddingBottom;
    }
    if (typeof nodeData.paddingLeft === 'number') {
      frameNode.paddingLeft = nodeData.paddingLeft;
    }

    if (nodeData.primaryAxisAlignItems) {
      frameNode.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
    }
    if (nodeData.counterAxisAlignItems && nodeData.counterAxisAlignItems !== 'BASELINE') {
      frameNode.counterAxisAlignItems = nodeData.counterAxisAlignItems;
    }
    if (nodeData.primaryAxisSizingMode) {
      frameNode.primaryAxisSizingMode = nodeData.primaryAxisSizingMode;
    }
    if (nodeData.counterAxisSizingMode) {
      frameNode.counterAxisSizingMode = nodeData.counterAxisSizingMode;
    }

    // Wrap and counter axis spacing
    if (nodeData.layoutWrap && 'layoutWrap' in frameNode) {
      (frameNode as any).layoutWrap = nodeData.layoutWrap;
    }
    if (typeof nodeData.counterAxisSpacing === 'number' && 'counterAxisSpacing' in frameNode) {
      (frameNode as any).counterAxisSpacing = nodeData.counterAxisSpacing;
    }
    if (nodeData.itemReverseZIndex && 'itemReverseZIndex' in frameNode) {
      (frameNode as any).itemReverseZIndex = nodeData.itemReverseZIndex;
    }
  }

  /**
   * Apply guides and grids to a frame
   */
  protected applyGridsAndGuides(frameNode: FrameNode | ComponentNode, nodeData: DesignNode): void {
    // Layout grids
    if (nodeData.layoutGrids && nodeData.layoutGrids.length > 0) {
      try {
        frameNode.layoutGrids = nodeData.layoutGrids.map(grid => {
          const layoutGrid: any = {
            pattern: grid.pattern,
            sectionSize: grid.sectionSize,
          };
          if (grid.visible !== undefined) layoutGrid.visible = grid.visible;
          if (grid.color) {
            layoutGrid.color = {
              r: grid.color.r,
              g: grid.color.g,
              b: grid.color.b,
              a: grid.color.a,
            };
          }
          if (grid.alignment) layoutGrid.alignment = grid.alignment;
          if (grid.gutterSize !== undefined) layoutGrid.gutterSize = grid.gutterSize;
          if (grid.offset !== undefined) layoutGrid.offset = grid.offset;
          if (grid.count !== undefined) layoutGrid.count = grid.count;
          return layoutGrid;
        });
      } catch (error) {
        console.warn('Error applying layout grids:', error);
      }
    }

    // Guides
    if (nodeData.guides && nodeData.guides.length > 0 && 'guides' in frameNode) {
      try {
        (frameNode as any).guides = nodeData.guides.map(guide => ({
          axis: guide.axis,
          offset: guide.offset,
        }));
      } catch (error) {
        console.warn('Error applying guides:', error);
      }
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
