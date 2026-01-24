import { DesignNode, hasChildren, isTextNode } from '../../domain/entities/design-node';
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

    const user = figma.currentUser;

    if (user) {
      headers['x-figma-user-id'] = user.id!;
      // Encode username to handle non-ASCII characters (Japanese, Arabic, emoji, etc.)
      headers['x-figma-user-name'] = this.encodeHeaderValue(user.name);

      const storageUser = await figma.clientStorage.getAsync(`figment:traits:${user.id!}`);

      console.log("storageUser", storageUser);
      if (storageUser) {
        if (storageUser.name) headers['x-figma-user-name'] = this.encodeHeaderValue(storageUser.name);
        if (storageUser.email) headers['x-figma-user-email'] = this.encodeHeaderValue(storageUser.email);
      }
    }
    return headers;
  }

  /**
   * Encode a string to be safe for HTTP headers (ISO-8859-1 compatible)
   * Uses URL encoding for non-ASCII characters
   */
  private encodeHeaderValue(value: string): string {
    if (!value) return '';

    try {
      // Check if the string contains non-ASCII characters
      const hasNonAscii = /[^\x00-\x7F]/.test(value);

      if (hasNonAscii) {
        // URL-encode the value to make it ASCII-safe
        return encodeURIComponent(value);
      }

      return value;
    } catch (error) {
      console.warn('Error encoding header value:', error);
      // Fallback: remove non-ASCII characters
      return value.replace(/[^\x00-\x7F]/g, '');
    }
  }
}