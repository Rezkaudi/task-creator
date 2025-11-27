import { DesignNode, hasChildren, isTextNode } from '../../domain/entities/design-node';
import { INodeRepository, SelectionInfo } from '../../domain/interfaces/node-repository.interface';
import { NodeTypeMapper } from '../mappers/node-type.mapper';
import {
  FrameNodeCreator,
  RectangleNodeCreator,
  TextNodeCreator,
  ShapeNodeCreator,
  ComponentNodeCreator,
  BaseNodeCreator,
} from './creators';
import { NodeExporter } from './exporters/node.exporter';

/**
 * Figma implementation of the Node Repository
 */
export class FigmaNodeRepository extends BaseNodeCreator implements INodeRepository {
  private readonly frameCreator = new FrameNodeCreator();
  private readonly rectangleCreator = new RectangleNodeCreator();
  private readonly textCreator = new TextNodeCreator();
  private readonly shapeCreator = new ShapeNodeCreator();
  private readonly componentCreator = new ComponentNodeCreator();
  private readonly nodeExporter = new NodeExporter();

  /**
   * Create a node on the canvas
   */
  async createNode(nodeData: DesignNode, parent?: SceneNode): Promise<SceneNode | null> {
    try {
      const node = await this.createNodeByType(nodeData);

      if (!node) return null;

      // Apply position
      if (typeof nodeData.x === 'number') node.x = nodeData.x;
      if (typeof nodeData.y === 'number') node.y = nodeData.y;

      // Apply common properties
      this.applyCommonProperties(node, nodeData);

      // Append to parent or page
      if (parent && 'appendChild' in parent) {
        (parent as FrameNode).appendChild(node);
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

    for (const node of selection) {
      const exported = this.nodeExporter.export(node);
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

    for (const node of children) {
      const exported = this.nodeExporter.export(node);
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

  private async createNodeByType(nodeData: DesignNode): Promise<SceneNode | null> {
    const nodeType = NodeTypeMapper.normalize(nodeData.type);
    const createChildBound = this.createChild.bind(this);

    switch (nodeType) {
      case 'FRAME':
        return this.frameCreator.create(nodeData, createChildBound);

      case 'GROUP':
        return this.frameCreator.createGroup(nodeData, createChildBound);

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
        return this.shapeCreator.createVectorPlaceholder(nodeData);

      case 'COMPONENT':
        return this.componentCreator.create(nodeData, createChildBound as any);

      case 'INSTANCE':
        // Instances require existing components, create as frame
        return this.frameCreator.create(nodeData, createChildBound);

      default:
        // Fallback to frame for unknown types
        if (hasChildren(nodeData)) {
          return this.frameCreator.create(nodeData, createChildBound);
        }
        return this.rectangleCreator.create(nodeData);
    }
  }

  private async createChild(childData: DesignNode, parent: FrameNode | ComponentNode): Promise<void> {
    const childNode = await this.createNodeByType(childData);

    if (childNode) {
      // Apply position relative to parent
      if (typeof childData.x === 'number') childNode.x = childData.x;
      if (typeof childData.y === 'number') childNode.y = childData.y;

      // Apply common properties
      this.applyCommonProperties(childNode, childData);

      parent.appendChild(childNode);
    }
  }
}
