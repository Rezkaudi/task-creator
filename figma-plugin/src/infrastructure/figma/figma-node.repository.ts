import { DesignNode, hasChildren, isTextNode } from '../../domain/entities/design-node';
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

      // Apply common properties
      this.applyCommonProperties(node, nodeData);

      // Append to parent or page
      if (parentNode && 'appendChild' in parentNode) {
        (parentNode as FrameNode).appendChild(node);
      } else {
        this.appendToPage(node);
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
   * Export a node by its ID
   */
  async exportNodeById(nodeId: string): Promise<DesignNode | null> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        return null;
      }

      // Clear image cache for fresh export
      this.nodeExporter.clearImageCache();

      const exported = await this.nodeExporter.export(node as SceneNode, 0);
      return exported || null;
    } catch (error) {
      console.error(`Error exporting node by ID ${nodeId}:`, error);
      return null;
    }
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

      // Apply common properties
      this.applyCommonProperties(childNode, childData);

      parentNode.appendChild(childNode);
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
          this.appendToPage(childNode);
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

      // Apply fills and strokes
      await this.applyFillsAsync(booleanNode, nodeData.fills);
      await this.applyStrokesAsync(
        booleanNode,
        nodeData.strokes,
        nodeData.strokeWeight,
        nodeData.strokeAlign
      );

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
    const sortedChildren = [...(nodeData.children || [])].sort((a, b) => {
      const indexA = a._layerIndex ?? 0;
      const indexB = b._layerIndex ?? 0;
      return indexA - indexB;
    });

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
        targetParent.appendChild(childNode);
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