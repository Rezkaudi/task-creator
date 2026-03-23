import { DesignNode, hasChildren } from '../../domain/entities/design-node';
import { FrameInfo, InteractiveElement, PrototypeConnection, ApplyPrototypeResult } from '../../domain/entities/prototype-connection.entity';
import { INodeRepository, SelectionInfo, ComponentRegistry as IComponentRegistry } from '../../domain/interfaces/node-repository.interface';
import { NodeTypeMapper } from '../mappers/node-type.mapper';
import {
  FrameNodeCreator,
  RectangleNodeCreator,
  TextNodeCreator,
  ShapeNodeCreator,
  ComponentNodeCreator,
  ComponentRegistry,
  BaseNodeCreator,
} from './creators';
import { NodeExporter } from './exporters/node.exporter';

/**
 * Figma implementation of the Node Repository
 * Handles comprehensive import/export of all Figma node types
 */
export class FigmaNodeRepository extends BaseNodeCreator implements INodeRepository {
  private readonly frameCreator = new FrameNodeCreator();
  private readonly rectangleCreator = new RectangleNodeCreator();
  private readonly textCreator = new TextNodeCreator();
  private readonly shapeCreator = new ShapeNodeCreator();
  private readonly componentRegistry = new ComponentRegistry();
  private readonly componentCreator = new ComponentNodeCreator(this.componentRegistry);
  private readonly nodeExporter = new NodeExporter();

  /**
  * Create a node on the canvas
  */
  async createNode(nodeData: DesignNode, parentNode?: SceneNode): Promise<SceneNode | null> {
    try {
      const node = await this.createNodeByType(nodeData, parentNode);

      if (!node) return null;

      // Apply position
      if (typeof nodeData.x === 'number') node.x = nodeData.x;
      if (typeof nodeData.y === 'number') node.y = nodeData.y;

      // Apply common properties (opacity, effects, constraints, etc.)
      this.applyCommonProperties(node, nodeData);
      // Apply style IDs via async setters (read-only with dynamic-page documentAccess)
      await this.applyStyleIdsAsync(node, nodeData);
      // Apply Figma Variable bindings (after fills are set, after style IDs)
      await this.applyBoundVariablesAsync(node, nodeData);

      // Append to parent or page first so node.parent is set
      if (parentNode && 'appendChild' in parentNode) {
        (parentNode as FrameNode).appendChild(node);
      } else {
        this.appendToPage(node);
      }

      // Apply layout child properties after appending (needs parent context)
      this.applyLayoutChildProperties(node, nodeData);

      // Reattach global styles by matching raw values against local document styles
      // (handles AI-generated nodes that have raw colors/fonts matching a global style)
      if (!parentNode) {
        const [styleMaps, variableMaps] = await Promise.all([
          this.buildStyleMaps(),
          this.buildVariableMaps(),
        ]);
        await this.reattachStyles(node, styleMaps);
        await this.reattachVariables(node, variableMaps);
      }

      return node;
    } catch (error) {
      console.error(`Error creating node ${nodeData.name}:`, error);
      return null;
    }
  }

  /**
   * Export selected nodes from canvas
   */
  async exportSelected(): Promise<DesignNode[]> {
    const selection = figma.currentPage.selection;
    const exported = await selection[0].exportAsync({ format: 'JSON_REST_V1' });
    console.log("Figma JSON export:", JSON.stringify(exported, null, 2));
    const exportedNodes: DesignNode[] = [];

    // Clear image cache for fresh export
    this.nodeExporter.clearImageCache();

    for (let i = 0; i < selection.length; i++) {
      const node = selection[i];
      const exported = await this.nodeExporter.export(node, i);
      if (exported) {
        exportedNodes.push(exported);
      }
    }

    return exportedNodes;
  }

  /**
   * Export all nodes from current page
   */
  async exportAll(): Promise<DesignNode[]> {
    const children = figma.currentPage.children;
    const exportedNodes: DesignNode[] = [];

    // Clear image cache for fresh export
    this.nodeExporter.clearImageCache();

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      const exported = await this.nodeExporter.export(node, i);
      if (exported) {
        exportedNodes.push(exported);
      }
    }

    return exportedNodes;
  }

  /**
   * Get current selection info
   */
  getSelectionInfo(): SelectionInfo {
    const selection = figma.currentPage.selection;
    return {
      count: selection.length,
      names: selection.map((node) => node.name),
      nodes: selection.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        width: 'width' in node ? (node as any).width : 0,
        height: 'height' in node ? (node as any).height : 0,
      })),
    };
  }

  /**
   * Set current selection
   */
  setSelection(nodes: SceneNode[]): void {
    figma.currentPage.selection = nodes;
  }

  /**
   * Scroll and zoom to view nodes
   */
  focusOnNodes(nodes: SceneNode[]): void {
    if (nodes.length > 0) {
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
  }

  /**
   * Append node to current page
   */
  appendToPage(node: SceneNode): void {
    figma.currentPage.appendChild(node);
  }

  /**
   * Get component registry for tracking during import
   */
  getComponentRegistry(): IComponentRegistry {
    return {
      components: this.componentRegistry.getAllComponents(),
      pendingInstances: new Map(),
    };
  }

  /**
   * Clear component registry after import
   */
  clearComponentRegistry(): void {
    this.componentRegistry.clear();
  }

  /**
   * Returns the SVG URL from nodeData.svgUrl or from an IMAGE fill with an SVG URL.
   * Returns null if no SVG source is found.
   */
  private getSvgIconUrl(nodeData: DesignNode): string | null {
    if (nodeData.svgUrl) return nodeData.svgUrl;
    if (!nodeData.fills) return null;
    for (const fill of nodeData.fills) {
      if (fill.type === 'IMAGE' && fill.imageUrl) {
        const url = fill.imageUrl;
        if (url.endsWith('.svg') || url.includes('/svg/') || url.includes('api.iconify.design')) {
          return url;
        }
      }
    }
    return null;
  }

  /**
   * Fetch an SVG from a URL and create a Figma node using figma.createNodeFromSvg().
   * Falls back to null on error (caller will use a rectangle placeholder instead).
   */
  private async createNodeFromSvgUrl(svgUrl: string, nodeData: DesignNode): Promise<FrameNode | null> {
    try {
      const response = await fetch(svgUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const svgString = await response.text();
      const svgNode = figma.createNodeFromSvg(svgString);
      // Derive name from Iconify URL as "prefix:name" (e.g. "mdi:car"), fallback to nodeData.name
      const iconifyMatch = svgUrl.match(/api\.iconify\.design\/([^/]+)\/([^/?#]+?)(?:\.svg)?(?:[?#]|$)/);
      svgNode.name = iconifyMatch ? `${iconifyMatch[1]}:${iconifyMatch[2]}` : (nodeData.name || 'Icon');
      const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height, 24);
      svgNode.resize(width, height);
      return svgNode;
    } catch (error) {
      console.error('Error creating node from SVG URL:', svgUrl, error);
      return null;
    }
  }

  /**
   * Get all frames from current page with their interactive elements
   */
  async getFramesWithInteractiveElements(): Promise<FrameInfo[]> {
    const frames: FrameInfo[] = [];
    const page = figma.currentPage;

    for (const node of page.children) {
      if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        const frameInfo = await this.extractFrameInfo(node as FrameNode);
        frames.push(frameInfo);
      }
    }

    return frames;
  }

  /**
   * Extract frame info with interactive elements
   */
  private async extractFrameInfo(frame: FrameNode | ComponentNode | ComponentSetNode): Promise<FrameInfo> {
    const interactiveElements: InteractiveElement[] = [];

    const findInteractiveElements = (node: SceneNode, parentFrameId: string, parentFrameName: string) => {
      // Check if this node could be interactive (buttons, links, icons, etc.)
      const isInteractive = this.isInteractiveElement(node);

      if (isInteractive) {
        interactiveElements.push({
          nodeId: node.id,
          name: node.name,
          type: node.type,
          parentFrameId,
          parentFrameName
        });
      }

      // Recursively search children
      if ('children' in node) {
        for (const child of node.children) {
          findInteractiveElements(child, parentFrameId, parentFrameName);
        }
      }
    };

    // Search for interactive elements in this frame
    if ('children' in frame) {
      for (const child of frame.children) {
        findInteractiveElements(child, frame.id, frame.name);
      }
    }

    return {
      id: frame.id,
      name: frame.name,
      width: frame.width,
      height: frame.height,
      interactiveElements
    };
  }

  /**
   * Check if a node is likely to be interactive
   */
  private isInteractiveElement(node: SceneNode): boolean {
    const name = node.name.toLowerCase();

    // Check by name patterns
    const interactivePatterns = [
      'button', 'btn', 'cta', 'link', 'nav', 'menu', 'tab',
      'icon', 'arrow', 'close', 'back', 'next', 'prev',
      'submit', 'cancel', 'confirm', 'delete', 'edit',
      'login', 'signup', 'sign up', 'sign in', 'logout',
      'card', 'item', 'option', 'select', 'dropdown',
      'toggle', 'switch', 'checkbox', 'radio',
      'input', 'field', 'search', 'filter'
    ];

    for (const pattern of interactivePatterns) {
      if (name.includes(pattern)) {
        return true;
      }
    }

    // Check by node type
    if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
      return true;
    }

    // Check if it's a small-ish clickable area (likely a button/icon)
    if ('width' in node && 'height' in node) {
      const isSmallEnough = node.width < 400 && node.height < 200;
      const isNotTooSmall = node.width > 20 && node.height > 20;
      if (isSmallEnough && isNotTooSmall && (node.type === 'FRAME' || node.type === 'GROUP')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Apply prototype connections to Figma nodes
   */
  async applyPrototypeConnections(connections: PrototypeConnection[]): Promise<ApplyPrototypeResult> {
    const errors: string[] = [];
    let appliedCount = 0;

    for (const connection of connections) {
      try {
        // Get source node
        const sourceNode = await figma.getNodeByIdAsync(connection.sourceNodeId);
        if (!sourceNode) {
          errors.push(`Source node not found: ${connection.sourceNodeId} (${connection.sourceNodeName})`);
          continue;
        }

        // Get target frame
        const targetNode = await figma.getNodeByIdAsync(connection.targetFrameId);
        if (!targetNode) {
          errors.push(`Target frame not found: ${connection.targetFrameId} (${connection.targetFrameName})`);
          continue;
        }

        // Check if source node supports reactions
        if (!('reactions' in sourceNode)) {
          errors.push(`Source node doesn't support reactions: ${connection.sourceNodeName}`);
          continue;
        }

        // Build the reaction
        const reaction = this.buildReaction(connection, targetNode as FrameNode);

        // Apply the reaction using async method
        const reactionsNode = sourceNode as ReactionMixin;
        const existingReactions = [...(reactionsNode.reactions || [])];

        // Check if similar reaction already exists
        const hasExisting = existingReactions.some(r =>
          r.trigger?.type === reaction.trigger?.type &&
          r.actions?.[0]?.type === 'NODE' &&
          (r.actions[0] as any).destinationId === connection.targetFrameId
        );

        if (!hasExisting) {
          await reactionsNode.setReactionsAsync([...existingReactions, reaction]);
          appliedCount++;
          console.log(`✅ Applied connection: ${connection.sourceNodeName} → ${connection.targetFrameName}`);
        } else {
          console.log(`⏭️ Skipped (already exists): ${connection.sourceNodeName} → ${connection.targetFrameName}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Error applying ${connection.sourceNodeName} → ${connection.targetFrameName}: ${errorMsg}`);
        console.error('Error applying connection:', error);
      }
    }

    return {
      success: errors.length === 0,
      appliedCount,
      errors
    };
  }
  /**
   * Build a Figma reaction from connection data
   */
  private buildReaction(connection: PrototypeConnection, targetNode: FrameNode): Reaction {
    // Map trigger type
    const triggerMap: Record<string, Trigger> = {
      'ON_CLICK': { type: 'ON_CLICK' },
      'ON_HOVER': { type: 'ON_HOVER' },
      'ON_PRESS': { type: 'ON_PRESS' },
      'ON_DRAG': { type: 'ON_DRAG' }
    };

    // TODO: Re-enable animation support in future
    // Animation implementation commented out - uncomment to restore
    /*
    // Map animation type
    const transitionMap: Record<string, Transition | null> = {
      'INSTANT': null,
      'DISSOLVE': { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300 },
      'SMART_ANIMATE': { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300 },
      'MOVE_IN': { type: 'MOVE_IN', direction: connection.animation.direction || 'LEFT', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300, matchLayers: false },
      'MOVE_OUT': { type: 'MOVE_OUT', direction: connection.animation.direction || 'LEFT', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300, matchLayers: false },
      'PUSH': { type: 'PUSH', direction: connection.animation.direction || 'LEFT', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300, matchLayers: false },
      'SLIDE_IN': { type: 'SLIDE_IN', direction: connection.animation.direction || 'LEFT', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300, matchLayers: false },
      'SLIDE_OUT': { type: 'SLIDE_OUT', direction: connection.animation.direction || 'LEFT', easing: { type: 'EASE_OUT' }, duration: connection.animation.duration || 300, matchLayers: false }
    };

    // Map easing
    const easingMap: Record<string, Easing> = {
      'LINEAR': { type: 'EASE_IN_AND_OUT' },
      'EASE_IN': { type: 'EASE_IN' },
      'EASE_OUT': { type: 'EASE_OUT' },
      'EASE_IN_AND_OUT': { type: 'EASE_IN_AND_OUT' },
      'EASE_IN_BACK': { type: 'EASE_IN_BACK' },
      'EASE_OUT_BACK': { type: 'EASE_OUT_BACK' },
      'EASE_IN_AND_OUT_BACK': { type: 'EASE_IN_AND_OUT_BACK' }
    };

    let transition = transitionMap[connection.animation.type] || null;

    // Apply custom easing if transition exists
    if (transition && connection.animation.easing) {
      transition = {
        ...transition,
        easing: easingMap[connection.animation.easing] || { type: 'EASE_OUT' }
      };
    }
    */

    // No animation - instant transition
    const transition = null;

    const action: Action = {
      type: 'NODE',
      destinationId: targetNode.id,
      navigation: 'NAVIGATE',
      transition,
      preserveScrollPosition: false
    };

    return {
      trigger: triggerMap[connection.trigger] || { type: 'ON_CLICK' },
      actions: [action]
    };
  }

  /**
   * Create a node by its type
   */
  private async createNodeByType(nodeData: DesignNode, parentNode?: SceneNode): Promise<SceneNode | null> {
    const nodeType = NodeTypeMapper.normalize(nodeData.type);
    const createChildBound = this.createChild.bind(this);

    switch (nodeType) {
      case 'FRAME':
        return this.frameCreator.create(nodeData, createChildBound);

      case 'GROUP':
        return this.createGroupNode(nodeData, parentNode);

      case 'SECTION':
        return this.frameCreator.createSection(nodeData, createChildBound as any);

      case 'RECTANGLE':
        // If rectangle has children, create as frame
        if (hasChildren(nodeData)) {
          return this.rectangleCreator.createAsFrame(nodeData, createChildBound);
        }
        // If rectangle has an SVG fill/url, create as SVG node
        {
          const svgUrl = this.getSvgIconUrl(nodeData);
          if (svgUrl) return this.createNodeFromSvgUrl(svgUrl, nodeData);
        }
        return this.rectangleCreator.create(nodeData);

      case 'TEXT':
        return this.textCreator.create(nodeData);

      case 'ELLIPSE':
        return this.shapeCreator.createEllipse(nodeData);

      case 'POLYGON':
        return this.shapeCreator.createPolygon(nodeData);

      case 'STAR':
        return this.shapeCreator.createStar(nodeData);

      case 'LINE':
        return this.shapeCreator.createLine(nodeData);

      case 'VECTOR':
        // Check if we have vector path data
        if (nodeData.vectorPaths || nodeData.vectorNetwork) {
          return this.shapeCreator.createVector(nodeData);
        }
        // If vector has an SVG fill/url, create as SVG node
        {
          const svgUrl = this.getSvgIconUrl(nodeData);
          if (svgUrl) return this.createNodeFromSvgUrl(svgUrl, nodeData);
        }
        return this.shapeCreator.createVectorPlaceholder(nodeData);

      case 'COMPONENT':
        return this.componentCreator.create(nodeData, createChildBound as any);

      case 'COMPONENT_SET':
        return this.componentCreator.createComponentSet(nodeData, createChildBound);

      case 'INSTANCE':
        return this.componentCreator.createInstance(nodeData, createChildBound);

      case 'BOOLEAN_OPERATION':
        return this.createBooleanOperation(nodeData);

      default:
        // Fallback to frame for unknown types
        if (hasChildren(nodeData)) {
          return this.frameCreator.create(nodeData, createChildBound);
        }
        return this.rectangleCreator.create(nodeData);
    }
  }

  /**
  * Create a child node within a parent
  */
  private async createChild(childData: DesignNode, parentNode: FrameNode | ComponentNode): Promise<void> {
    const childNode = await this.createNodeByType(childData, parentNode);

    if (childNode) {
      // Apply position relative to parent
      if (typeof childData.x === 'number') childNode.x = childData.x;
      if (typeof childData.y === 'number') childNode.y = childData.y;

      // Apply common properties (opacity, effects, constraints, etc.)
      this.applyCommonProperties(childNode, childData);
      // Apply style IDs via async setters (read-only with dynamic-page documentAccess)
      await this.applyStyleIdsAsync(childNode, childData);
      // Apply variable bindings (must come after fills/strokes are set)
      await this.applyBoundVariablesAsync(childNode, childData);

      // Append to parent first so node.parent is set
      parentNode.appendChild(childNode);

      // Apply layout child properties after appending (needs parent context)
      this.applyLayoutChildProperties(childNode, childData);
    }
  }

  /**
   * Create a boolean operation node
   */
  private async createBooleanOperation(nodeData: DesignNode): Promise<SceneNode | null> {
    // Boolean operations require at least 2 children
    if (!nodeData.children || nodeData.children.length < 2) {
      console.warn('Boolean operation requires at least 2 children');
      return this.frameCreator.create(nodeData, this.createChild.bind(this));
    }

    try {
      // Create children first
      const childNodes: SceneNode[] = [];
      for (const childData of nodeData.children) {
        const childNode = await this.createNodeByType(childData);
        if (childNode) {
          if (typeof childData.x === 'number') childNode.x = childData.x;
          if (typeof childData.y === 'number') childNode.y = childData.y;
          this.applyCommonProperties(childNode, childData);
          await this.applyStyleIdsAsync(childNode, childData);
          await this.applyBoundVariablesAsync(childNode, childData);
          this.appendToPage(childNode);
          this.applyLayoutChildProperties(childNode, childData);
          childNodes.push(childNode);
        }
      }

      if (childNodes.length < 2) {
        console.warn('Not enough valid children for boolean operation');
        // Clean up and return frame fallback
        for (const node of childNodes) {
          node.remove();
        }
        return this.frameCreator.create(nodeData, this.createChild.bind(this));
      }

      // Determine boolean operation type
      const booleanOp = nodeData.booleanOperation || 'UNION';

      // Create the boolean operation
      let booleanNode: BooleanOperationNode;
      switch (booleanOp) {
        case 'UNION':
          booleanNode = figma.union(childNodes, figma.currentPage);
          break;
        case 'INTERSECT':
          booleanNode = figma.intersect(childNodes, figma.currentPage);
          break;
        case 'SUBTRACT':
          booleanNode = figma.subtract(childNodes, figma.currentPage);
          break;
        case 'EXCLUDE':
          booleanNode = figma.exclude(childNodes, figma.currentPage);
          break;
        default:
          booleanNode = figma.union(childNodes, figma.currentPage);
      }

      booleanNode.name = nodeData.name || 'Boolean';

      // Apply fills and strokes in parallel
      await this.applyFillsAndStrokesAsync(booleanNode, nodeData);

      return booleanNode;
    } catch (error) {
      console.error('Error creating boolean operation:', error);
      return this.frameCreator.create(nodeData, this.createChild.bind(this));
    }
  }

  /**
   * Create a group node with proper parent context
   */
  private async createGroupNode(nodeData: DesignNode, parentNode?: SceneNode): Promise<SceneNode | null> {
    if (!nodeData.children || nodeData.children.length === 0) {
      // Empty group - create as frame fallback
      return this.frameCreator.createGroup(nodeData, this.createChild.bind(this));
    }

    // First create all children
    const childNodes: SceneNode[] = [];
    const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children || []);

    // Determine target parent for grouping
    const targetParent = (parentNode && 'appendChild' in parentNode)
      ? parentNode as FrameNode | GroupNode
      : figma.currentPage;

    for (const childData of sortedChildren) {
      const childNode = await this.createNodeByType(childData);
      if (childNode) {
        if (typeof childData.x === 'number') childNode.x = childData.x;
        if (typeof childData.y === 'number') childNode.y = childData.y;
        this.applyCommonProperties(childNode, childData);
        await this.applyStyleIdsAsync(childNode, childData);
        await this.applyBoundVariablesAsync(childNode, childData);
        targetParent.appendChild(childNode);
        this.applyLayoutChildProperties(childNode, childData);
        childNodes.push(childNode);
      }
    }

    if (childNodes.length === 0) {
      // Fallback to frame if no children created
      const fallbackFrame = figma.createFrame();
      fallbackFrame.name = nodeData.name || 'Group';
      fallbackFrame.fills = [];
      fallbackFrame.clipsContent = false;
      return fallbackFrame;
    }

    // Create the actual group from children
    const group = figma.group(childNodes, targetParent);
    group.name = nodeData.name || 'Group';

    // Apply group-supported properties
    if (typeof nodeData.opacity === 'number') {
      group.opacity = Math.max(0, Math.min(1, nodeData.opacity));
    }
    if (nodeData.blendMode) {
      (group as any).blendMode = nodeData.blendMode;
    }
    if (typeof nodeData.visible === 'boolean') {
      group.visible = nodeData.visible;
    }
    if (typeof nodeData.locked === 'boolean') {
      group.locked = nodeData.locked;
    }

    return group;
  }

  /**
   * Build lookup maps from all local Figma styles for value-based matching.
   * Uses async APIs to avoid deprecation warnings.
   */
  private async buildStyleMaps(): Promise<{
    fillStyleMap: Map<string, string>;
    textStyleMap: Map<string, string>;
    effectStyleMap: Array<{ id: string; key: string; effects: readonly Effect[] }>;
    gridStyleMap: Array<{ id: string; grids: ReadonlyArray<LayoutGrid> }>;
  }> {
    const fillStyleMap = new Map<string, string>();
    const textStyleMap = new Map<string, string>();
    const effectStyleMap: Array<{ id: string; key: string; effects: readonly Effect[] }> = [];
    const gridStyleMap: Array<{ id: string; grids: ReadonlyArray<LayoutGrid> }> = [];

    const [paintStyles, textStyles, effectStyles, gridStyles] = await Promise.all([
      figma.getLocalPaintStylesAsync(),
      figma.getLocalTextStylesAsync(),
      figma.getLocalEffectStylesAsync(),
      figma.getLocalGridStylesAsync(),
    ]);

    for (const style of paintStyles) {
      for (const paint of style.paints) {
        if (paint.type === 'SOLID') {
          const key = `${Math.round(paint.color.r * 255)},${Math.round(paint.color.g * 255)},${Math.round(paint.color.b * 255)},${Math.round((paint.opacity ?? 1) * 100)}`;
          if (!fillStyleMap.has(key)) fillStyleMap.set(key, style.id);
        }
      }
    }

    for (const style of textStyles) {
      const key = `${style.fontName.family}:${style.fontName.style}:${style.fontSize}`;
      if (!textStyleMap.has(key)) textStyleMap.set(key, style.id);
    }

    for (const style of effectStyles) {
      effectStyleMap.push({ id: style.id, key: style.key, effects: style.effects });
    }

    for (const style of gridStyles) {
      gridStyleMap.push({ id: style.id, grids: style.layoutGrids });
    }

    return { fillStyleMap, textStyleMap, effectStyleMap, gridStyleMap };
  }


  /**
   * Walk a node tree and attach matching local style IDs via async setters.
   * For AI-generated nodes (no fillStyleId) falls back to color-value matching.
   * For round-trip nodes that already had applyStyleIdsAsync called, this is
   * a no-op (fillStyleId will already be linked).
   */
  private async reattachStyles(
    node: SceneNode,
    styleMaps: Awaited<ReturnType<FigmaNodeRepository['buildStyleMaps']>>
  ): Promise<void> {
    const { fillStyleMap, textStyleMap, effectStyleMap, gridStyleMap } = styleMaps;

    // Fill style — only for nodes with no style already linked
    if ('fills' in node && !((node as any).fillStyleId) && 'setFillStyleIdAsync' in node) {
      const fills = (node as GeometryMixin).fills;
      if (Array.isArray(fills) && fills.length === 1 && fills[0].type === 'SOLID') {
        const p = fills[0] as SolidPaint;
        const key = `${Math.round(p.color.r * 255)},${Math.round(p.color.g * 255)},${Math.round(p.color.b * 255)},${Math.round((p.opacity ?? 1) * 100)}`;
        const id = fillStyleMap.get(key);
        if (id) await (node as any).setFillStyleIdAsync(id).catch(() => {});
      }
    }

    // Stroke style
    if ('strokes' in node && !((node as any).strokeStyleId) && 'setStrokeStyleIdAsync' in node) {
      const strokes = (node as GeometryMixin).strokes;
      if (Array.isArray(strokes) && strokes.length === 1 && strokes[0].type === 'SOLID') {
        const p = strokes[0] as SolidPaint;
        const key = `${Math.round(p.color.r * 255)},${Math.round(p.color.g * 255)},${Math.round(p.color.b * 255)},${Math.round((p.opacity ?? 1) * 100)}`;
        const id = fillStyleMap.get(key);
        if (id) await (node as any).setStrokeStyleIdAsync(id).catch(() => {});
      }
    }

    // Effect style — match by comparing effects JSON against each local effect style
    if ('effects' in node && !((node as any).effectStyleId) && 'setEffectStyleIdAsync' in node) {
      const effects = (node as any).effects as readonly Effect[];
      if (effects && effects.length > 0) {
        for (const entry of effectStyleMap) {
          if (this.effectsMatch(effects, entry.effects)) {
            await (node as any).setEffectStyleIdAsync(entry.id).catch(() => {});
            break;
          }
        }
      }
    }

    // Grid style — match by comparing layoutGrids values
    if ('layoutGrids' in node && !((node as any).gridStyleId) && 'setGridStyleIdAsync' in node) {
      const grids = (node as any).layoutGrids as ReadonlyArray<LayoutGrid>;
      if (grids && grids.length > 0) {
        for (const entry of gridStyleMap) {
          if (this.gridsMatch(grids, entry.grids)) {
            await (node as any).setGridStyleIdAsync(entry.id).catch(() => {});
            break;
          }
        }
      }
    }

    // Text style — guard against figma.mixed symbol (mixed styles)
    if (node.type === 'TEXT' && !((node as any).textStyleId) && 'setTextStyleIdAsync' in node) {
      const t = node as TextNode;
      const fontName = t.fontName;
      if (fontName !== figma.mixed && fontName && typeof fontName === 'object') {
        const fn = fontName as FontName;
        const fontSize = t.fontSize;
        if (fontSize !== figma.mixed) {
          const key = `${fn.family}:${fn.style}:${fontSize}`;
          const id = textStyleMap.get(key);
          if (id) await (node as any).setTextStyleIdAsync(id).catch(() => {});
        }
      }
    }

    // Recurse into children
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        await this.reattachStyles(child, styleMaps);
      }
    }
  }

  /**
   * Build a lookup map from the default-mode RGB value of every local COLOR
   * variable to its variable ID. Used by reattachVariables for value-based matching.
   */
  private async buildVariableMaps(): Promise<{ colorVarMap: Map<string, string> }> {
    const colorVarMap = new Map<string, string>();
    try {
      const colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
      for (const variable of colorVars) {
        try {
          const collection = await figma.variables.getVariableCollectionByIdAsync(
            variable.variableCollectionId
          );
          if (!collection) continue;
          const value = variable.valuesByMode[collection.defaultModeId];
          if (value && typeof value === 'object' && 'r' in value) {
            const rgb = value as { r: number; g: number; b: number };
            const key = `${Math.round(rgb.r * 255)},${Math.round(rgb.g * 255)},${Math.round(rgb.b * 255)}`;
            if (!colorVarMap.has(key)) colorVarMap.set(key, variable.id);
          }
        } catch { /* variable or collection not readable */ }
      }
    } catch { /* variables API not available */ }
    return { colorVarMap };
  }

  /**
   * Walk a node tree and bind SOLID fill colors to matching local COLOR variables.
   * Skips paints that already have a color variable bound (round-trip case).
   */
  private async reattachVariables(
    node: SceneNode,
    variableMaps: { colorVarMap: Map<string, string> }
  ): Promise<void> {
    const { colorVarMap } = variableMaps;

    if ('fills' in node) {
      const fills = (node as GeometryMixin).fills;
      if (Array.isArray(fills) && fills.length > 0) {
        const updated = [...fills];
        let changed = false;

        for (let i = 0; i < fills.length; i++) {
          const paint = fills[i];
          if (paint.type !== 'SOLID') continue;
          if ((paint as any).boundVariables?.color) continue; // already bound
          const solid = paint as SolidPaint;
          const key = `${Math.round(solid.color.r * 255)},${Math.round(solid.color.g * 255)},${Math.round(solid.color.b * 255)}`;
          const varId = colorVarMap.get(key);
          if (!varId) continue;
          try {
            const variable = await figma.variables.getVariableByIdAsync(varId);
            if (variable) {
              updated[i] = figma.variables.setBoundVariableForPaint(updated[i], 'color', variable);
              changed = true;
            }
          } catch {}
        }

        if (changed) {
          try { (node as GeometryMixin).fills = updated as Paint[]; } catch {}
        }
      }
    }

    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        await this.reattachVariables(child, variableMaps);
      }
    }
  }

  private gridsMatch(a: ReadonlyArray<LayoutGrid>, b: ReadonlyArray<LayoutGrid>): boolean {
    if (a.length !== b.length) return false;
    return a.every((g, i) => JSON.stringify(g) === JSON.stringify(b[i]));
  }

  private effectsMatch(a: readonly Effect[], b: readonly Effect[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((e, i) => JSON.stringify(e) === JSON.stringify(b[i]));
  }

  async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get auth token from storage
    try {
      const token = await figma.clientStorage.getAsync('rio_auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to get auth token from storage:', e);
    }

    const user = figma.currentUser;

    if (user) {
      // Safely handle null values
      if (user.id) {
        headers['x-figma-user-id'] = user.id;
      }
      if (user.name) {
        headers['x-figma-user-name'] = this.encodeHeaderValue(user.name);
      }

      try {
        const storageUser = await figma.clientStorage.getAsync(`figment:traits:${user.id}`);

        if (storageUser) {
          if (storageUser.name) {
            headers['x-figma-user-name'] = this.encodeHeaderValue(String(storageUser.name));
          }
          if (storageUser.email) {
            headers['x-figma-user-email'] = this.encodeHeaderValue(String(storageUser.email));
          }
        }
      } catch (storageError) {
        console.warn('Failed to read client storage:', storageError);
      }
    }

    return headers;
  }

  /**
   * Encode a string to be safe for HTTP headers (ISO-8859-1 compatible)
   */
  private encodeHeaderValue(value: string | null | undefined): string {
    // Handle null/undefined
    if (value == null) return '';

    // Ensure it's a string
    const strValue = String(value);
    if (!strValue) return '';

    try {
      // Check if the string contains non-ASCII characters
      if (/[^\x00-\x7F]/.test(strValue)) {
        return encodeURIComponent(strValue);
      }
      return strValue;
    } catch (error) {
      console.warn('Error encoding header value:', error);
      // Fallback: remove non-ASCII characters entirely
      return strValue.replace(/[^\x00-\x7F]/g, '');
    }
  }
}