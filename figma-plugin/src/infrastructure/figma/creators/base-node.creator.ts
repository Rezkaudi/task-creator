import { DesignNode, NodeBoundVariables } from '../../../domain/entities/design-node';
import { Fill, VariableRef } from '../../../domain/entities/fill';
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
    if (!('fills' in node)) {
      return;
    }

    // Explicitly clear fills if none provided or empty
    if (!fills || !Array.isArray(fills) || fills.length === 0) {
      (node as GeometryMixin).fills = [];
      return;
    }

    try {
      const validFills = await FillMapper.toPaintAsync(fills);
      (node as GeometryMixin).fills = validFills.length > 0 ? validFills : [];
    } catch (error) {
      console.warn('Error applying fills:', error);
      this.applyFills(node, fills);
    }
  }

  /**
   * Apply fills to a node (sync version)
   */
  protected applyFills(node: SceneNode, fills?: Fill[]): void {
    if (!('fills' in node)) {
      return;
    }

    if (!fills || !Array.isArray(fills) || fills.length === 0) {
      (node as GeometryMixin).fills = [];
      return;
    }

    const validFills = FillMapper.toPaint(fills);
    (node as GeometryMixin).fills = validFills.length > 0 ? validFills : [];
  }

  /**
   * Apply fills and strokes in parallel (they write to different properties)
   */
  protected async applyFillsAndStrokesAsync(
    node: SceneNode,
    nodeData: DesignNode
  ): Promise<void> {
    await Promise.all([
      this.applyFillsAsync(node, nodeData.fills),
      this.applyStrokesAsync(
        node,
        nodeData.strokes,
        nodeData.strokeWeight,
        nodeData.strokeAlign,
        nodeData.strokeCap,
        nodeData.strokeJoin,
        nodeData.dashPattern,
        nodeData.strokeMiterLimit
      ),
    ]);
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

    // NOTE: style IDs (fillStyleId etc.) must be applied via setFillStyleIdAsync and friends
    // (they are read-only when manifest has "documentAccess": "dynamic-page").
    // Callers must invoke applyStyleIdsAsync(node, nodeData) separately after awaiting this method.

    // Constraints
    if (nodeData.constraints && 'constraints' in node) {
      (node as any).constraints = {
        horizontal: nodeData.constraints.horizontal,
        vertical: nodeData.constraints.vertical,
      };
    }

    // NOTE: Layout child properties (layoutGrow, layoutAlign, layoutPositioning)
    // are applied separately via applyLayoutChildProperties() AFTER the node
    // has been appended to its parent, so that node.parent is available.

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
   * Apply global style IDs to a node using the async setters required by
   * "documentAccess": "dynamic-page" manifests.  Direct property assignment
   * is silently ignored in that mode — only the async methods actually work.
   *
   * Must be called AFTER raw fills/effects are set so the style reference
   * takes precedence (linking a style overwrites the node's raw fills).
   */
  protected async applyStyleIdsAsync(node: SceneNode, nodeData: DesignNode): Promise<void> {
    const ops: Promise<void>[] = [];

    if (nodeData.fillStyleId && 'setFillStyleIdAsync' in node) {
      ops.push(
        (node as any).setFillStyleIdAsync(nodeData.fillStyleId)
          .catch((e: unknown) => console.warn('setFillStyleIdAsync failed:', e))
      );
    }
    if (nodeData.strokeStyleId && 'setStrokeStyleIdAsync' in node) {
      ops.push(
        (node as any).setStrokeStyleIdAsync(nodeData.strokeStyleId)
          .catch((e: unknown) => console.warn('setStrokeStyleIdAsync failed:', e))
      );
    }
    if (nodeData.effectStyleId && 'setEffectStyleIdAsync' in node) {
      ops.push(
        (node as any).setEffectStyleIdAsync(nodeData.effectStyleId)
          .catch((e: unknown) => console.warn('setEffectStyleIdAsync failed:', e))
      );
    }
    if (nodeData.gridStyleId && 'setGridStyleIdAsync' in node) {
      ops.push(
        (node as any).setGridStyleIdAsync(nodeData.gridStyleId)
          .catch((e: unknown) => console.warn('setGridStyleIdAsync failed:', e))
      );
    }
    if (nodeData.textStyleId && node.type === 'TEXT' && 'setTextStyleIdAsync' in node) {
      ops.push(
        (node as any).setTextStyleIdAsync(nodeData.textStyleId)
          .catch((e: unknown) => console.warn('setTextStyleIdAsync failed:', e))
      );
    }

    if (ops.length > 0) await Promise.all(ops);
  }

  /**
   * Resolve a VariableRef to a live Figma Variable.
   * First tries the node-scope ID, then falls back to searching all local
   * variables by their cross-file key.
   */
  private async getVariableByIdOrKey(ref: VariableRef): Promise<Variable | null> {
    try {
      const v = await figma.variables.getVariableByIdAsync(ref.id);
      if (v) return v;
    } catch { /* id not found in this file */ }

    for (const type of ['COLOR', 'FLOAT', 'BOOLEAN', 'STRING'] as VariableResolvedDataType[]) {
      try {
        const locals = await figma.variables.getLocalVariablesAsync(type);
        const match = locals.find(v => v.key === ref.key);
        if (match) return match;
      } catch {}
    }
    return null;
  }

  /**
   * Apply Figma Variable bindings to a node.
   * Must be called AFTER raw fills/strokes are set and AFTER applyStyleIdsAsync,
   * so that setBoundVariableForPaint operates on the correct current paint array.
   */
  protected async applyBoundVariablesAsync(node: SceneNode, nodeData: DesignNode): Promise<void> {
    // 1. Fill-level variables (color / opacity per paint)
    for (const prop of ['fills', 'strokes'] as const) {
      const fillData = prop === 'fills' ? nodeData.fills : nodeData.strokes;
      if (!fillData?.length || !(prop in node)) continue;

      const rawPaints = (node as any)[prop];
      if (!Array.isArray(rawPaints)) continue;
      const paints = [...rawPaints] as Paint[];
      let changed = false;

      for (let i = 0; i < fillData.length && i < paints.length; i++) {
        const bv = fillData[i].boundVariables;
        if (!bv) continue;
        let paint = paints[i];

        if (bv.color) {
          const v = await this.getVariableByIdOrKey(bv.color);
          if (v) { paint = figma.variables.setBoundVariableForPaint(paint as SolidPaint, 'color', v); changed = true; }
        }
        paints[i] = paint;
      }

      if (changed) (node as any)[prop] = paints;
    }

    // 2. Node-level scalar variables
    const bv = nodeData.boundVariables;
    if (!bv) return;

    const FIELDS: (keyof NodeBoundVariables)[] = [
      'opacity', 'width', 'height',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'itemSpacing', 'counterAxisSpacing',
      'cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
      'fontSize', 'letterSpacing', 'lineHeight', 'strokeWeight',
      'visible', 'characters',
    ];

    for (const field of FIELDS) {
      const ref = (bv as any)[field] as VariableRef | undefined;
      if (!ref) continue;
      const v = await this.getVariableByIdOrKey(ref);
      if (!v) continue;
      try {
        (node as any).setBoundVariable(field, v);
      } catch (e) {
        console.warn(`setBoundVariable(${field}) failed:`, e);
      }
    }
  }

  /**
   * Apply layout child properties (layoutGrow, layoutAlign, layoutPositioning).
   * Must be called AFTER the node has been appended to its parent,
   * so that node.parent is available for the auto-layout check.
   */
  protected applyLayoutChildProperties(node: SceneNode, nodeData: DesignNode): void {
    if ('layoutGrow' in node || 'layoutAlign' in node || 'layoutPositioning' in node) {
      const parent = node.parent;
      const parentHasAutoLayout = parent &&
        'layoutMode' in parent &&
        (parent as any).layoutMode !== 'NONE';

      if (parentHasAutoLayout) {
        if (typeof nodeData.layoutGrow === 'number' && 'layoutGrow' in node) {
          (node as any).layoutGrow = nodeData.layoutGrow;
        }
        if (nodeData.layoutAlign && 'layoutAlign' in node) {
          (node as any).layoutAlign = nodeData.layoutAlign;
        }
        if (nodeData.layoutPositioning && 'layoutPositioning' in node) {
          (node as any).layoutPositioning = nodeData.layoutPositioning;
        }
      } else {
        if (nodeData.layoutPositioning === 'ABSOLUTE') {
          console.warn(`Cannot set layoutPositioning to ABSOLUTE on "${nodeData.name}" - parent doesn't have auto-layout`);
        }
      }
    }
  }

  /**
   * Apply auto-layout properties to a frame
   */
  protected applyAutoLayout(frameNode: FrameNode | ComponentNode, nodeData: DesignNode): void {
    const validLayoutModes = ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'];
    if (!nodeData.layoutMode || !validLayoutModes.includes(nodeData.layoutMode)) {
      if (nodeData.layoutMode) {
        console.warn(
          `Invalid layoutMode "${nodeData.layoutMode}" on "${nodeData.name}". Skipping auto-layout.`,
        );
      }
      return;
    }

    if (nodeData.layoutMode === 'NONE') {
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

    const validPrimaryAxisAlignItems = ['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'];
    if (
      nodeData.primaryAxisAlignItems &&
      validPrimaryAxisAlignItems.includes(nodeData.primaryAxisAlignItems)
    ) {
      frameNode.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
    }
    // Valid values for counterAxisAlignItems are: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE'
    // 'STRETCH' is NOT valid for counterAxisAlignItems (it's valid for layoutAlign on children)
    const validCounterAxisAlignItems = ['MIN', 'MAX', 'CENTER', 'BASELINE'];
    if (nodeData.counterAxisAlignItems && nodeData.counterAxisAlignItems !== 'BASELINE' && validCounterAxisAlignItems.includes(nodeData.counterAxisAlignItems)) {
      frameNode.counterAxisAlignItems = nodeData.counterAxisAlignItems;
    }
    const validSizingModes = ['FIXED', 'AUTO'];
    if (
      nodeData.primaryAxisSizingMode &&
      validSizingModes.includes(nodeData.primaryAxisSizingMode)
    ) {
      frameNode.primaryAxisSizingMode = nodeData.primaryAxisSizingMode;
    }
    if (
      nodeData.counterAxisSizingMode &&
      validSizingModes.includes(nodeData.counterAxisSizingMode)
    ) {
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
   * Sort children by _layerIndex to preserve z-order.
   * Fast-paths when no child has _layerIndex (common for most JSON imports).
   */
  protected sortChildrenByLayerIndex(children: DesignNode[]): DesignNode[] {
    if (children.length <= 1) return children;
    let hasIndex = false;
    for (let i = 0; i < children.length; i++) {
      if (children[i]._layerIndex !== undefined) { hasIndex = true; break; }
    }
    if (!hasIndex) return children;
    return [...children].sort((a, b) => (a._layerIndex ?? 0) - (b._layerIndex ?? 0));
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
