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
import { IconNodeCreator } from './creators/icon-node.creator';
import { NodeExporter } from './exporters/node.exporter';

export class FigmaNodeRepository extends BaseNodeCreator implements INodeRepository {
  private readonly frameCreator = new FrameNodeCreator();
  private readonly rectangleCreator = new RectangleNodeCreator();
  private readonly textCreator = new TextNodeCreator();
  private readonly shapeCreator = new ShapeNodeCreator();
  private readonly componentRegistry = new ComponentRegistry();
  private readonly componentCreator = new ComponentNodeCreator(this.componentRegistry);
  private readonly iconCreator = new IconNodeCreator();
  private readonly nodeExporter = new NodeExporter();

  async createNode(nodeData: DesignNode, parentNode?: SceneNode): Promise<SceneNode | null> {
    try {
      const node = await this.createNodeByType(nodeData, parentNode);
      if (!node) return null;

      if (typeof nodeData.x === 'number') node.x = nodeData.x;
      if (typeof nodeData.y === 'number') node.y = nodeData.y;

      this.applyCommonProperties(node, nodeData);

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

  async exportSelected(): Promise<DesignNode[]> {
    const selection = figma.currentPage.selection;
    const exportedNodes: DesignNode[] = [];
    this.nodeExporter.clearImageCache();

    for (let i = 0; i < selection.length; i++) {
      const node = selection[i];
      const exported = await this.nodeExporter.export(node, i);
      if (exported) exportedNodes.push(exported);
    }

    return exportedNodes;
  }

  async exportAll(): Promise<DesignNode[]> {
    const children = figma.currentPage.children;
    const exportedNodes: DesignNode[] = [];
    this.nodeExporter.clearImageCache();

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      const exported = await this.nodeExporter.export(node, i);
      if (exported) exportedNodes.push(exported);
    }

    return exportedNodes;
  }

  getSelectionInfo(): SelectionInfo {
    const selection = figma.currentPage.selection;
    return {
      count: selection.length,
      names: selection.map((node) => node.name),
    };
  }

  setSelection(nodes: SceneNode[]): void {
    figma.currentPage.selection = nodes;
  }

  focusOnNodes(nodes: SceneNode[]): void {
    if (nodes.length > 0) figma.viewport.scrollAndZoomIntoView(nodes);
  }

  appendToPage(node: SceneNode): void {
    figma.currentPage.appendChild(node);
  }

  getComponentRegistry(): IComponentRegistry {
    return {
      components: this.componentRegistry.getAllComponents(),
      pendingInstances: new Map(),
    };
  }

  clearComponentRegistry(): void {
    this.componentRegistry.clear();
  }

  private isIconNode(nodeData: DesignNode): boolean {
    if (nodeData.vectorPaths && nodeData.vectorPaths.length > 0) return true;
    if (nodeData._iconSource || nodeData._iconCategory || nodeData._iconKeyword) return true;
    if (nodeData.vectorNetwork) return true;
    if (nodeData._isIcon) return true; 
    return false;
  }

  private isIconPlaceholder(nodeData: DesignNode): boolean {
    if (nodeData.type !== 'RECTANGLE') return false;
    if (nodeData.name && nodeData.name.startsWith('ICON:')) return true;
    if (nodeData._iconKeyword) return true;
    return false;
  }

  private async createNodeByType(nodeData: DesignNode, parentNode?: SceneNode): Promise<SceneNode | null> {
    const nodeType = NodeTypeMapper.normalize(nodeData.type);
    
    const createChildBound = this.createChild.bind(this);
    
    if (nodeType === 'VECTOR' || this.isIconNode(nodeData)) {
        console.log(`🎨 Creating icon/vector node: ${nodeData.name} (type: ${nodeType})`);
        console.log(`   Has vectorPaths: ${!!nodeData.vectorPaths}`);
        console.log(`   Has icon metadata: ${!!nodeData._iconSource || !!nodeData._iconKeyword}`);
        
        try {
            const iconNode = await this.iconCreator.create(nodeData);
            console.log(`✅ Icon node created: ${iconNode.name}`);
            return iconNode;
        } catch (error) {
            console.error(`❌ Failed to create icon: ${nodeData.name}`, error);
            return this.shapeCreator.createVector(nodeData);
        }
    }

    switch (nodeType) {
      case 'FRAME':
        return this.frameCreator.create(nodeData, createChildBound);

      case 'GROUP':
        return this.createGroupNode(nodeData, parentNode);

      case 'SECTION':
        return this.frameCreator.createSection(nodeData, createChildBound as any);

      case 'RECTANGLE':
        if (this.isIconPlaceholder(nodeData)) {
          console.log(`🔄 Converting rectangle to icon: ${nodeData.name}`);
          try {
            return await this.iconCreator.create(nodeData);
          } catch (error) {
            console.error(`Failed to convert placeholder to icon:`, error);
          }
        }
        
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

      case 'COMPONENT':
        return this.componentCreator.create(nodeData, createChildBound as any);

      case 'COMPONENT_SET':
        return this.componentCreator.createComponentSet(nodeData, createChildBound);

      case 'INSTANCE':
        return this.componentCreator.createInstance(nodeData, createChildBound);

      case 'BOOLEAN_OPERATION':
        return this.createBooleanOperation(nodeData);

      default:
        if (hasChildren(nodeData)) {
          return this.frameCreator.create(nodeData, createChildBound);
        }
        return this.rectangleCreator.create(nodeData);
    }
  }

  private async createChild(childData: DesignNode, parentNode: FrameNode | ComponentNode): Promise<void> {
    const childNode = await this.createNodeByType(childData, parentNode);
    if (childNode) {
      if (typeof childData.x === 'number') childNode.x = childData.x;
      if (typeof childData.y === 'number') childNode.y = childData.y;
      this.applyCommonProperties(childNode, childData);
      parentNode.appendChild(childNode);
    }
  }

  private async createBooleanOperation(nodeData: DesignNode): Promise<SceneNode | null> {
    if (!nodeData.children || nodeData.children.length < 2) {
      console.warn('Boolean operation requires at least 2 children');
      return this.frameCreator.create(nodeData, this.createChild.bind(this));
    }

    try {
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
        childNodes.forEach(node => node.remove());
        return this.frameCreator.create(nodeData, this.createChild.bind(this));
      }

      const booleanOp = nodeData.booleanOperation || 'UNION';
      let booleanNode: BooleanOperationNode;

      switch (booleanOp) {
        case 'UNION': booleanNode = figma.union(childNodes, figma.currentPage); break;
        case 'INTERSECT': booleanNode = figma.intersect(childNodes, figma.currentPage); break;
        case 'SUBTRACT': booleanNode = figma.subtract(childNodes, figma.currentPage); break;
        case 'EXCLUDE': booleanNode = figma.exclude(childNodes, figma.currentPage); break;
        default: booleanNode = figma.union(childNodes, figma.currentPage);
      }

      booleanNode.name = nodeData.name || 'Boolean';
      await this.applyFillsAsync(booleanNode, nodeData.fills);
      await this.applyStrokesAsync(booleanNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

      return booleanNode;
    } catch (error) {
      console.error('Error creating boolean operation:', error);
      return this.frameCreator.create(nodeData, this.createChild.bind(this));
    }
  }

  private async createGroupNode(nodeData: DesignNode, parentNode?: SceneNode): Promise<SceneNode | null> {
    if (!nodeData.children || nodeData.children.length === 0) {
      return this.frameCreator.createGroup(nodeData, this.createChild.bind(this));
    }

    const childNodes: SceneNode[] = [];
    const sortedChildren = [...(nodeData.children || [])].sort((a, b) => {
      const indexA = a._layerIndex ?? 0;
      const indexB = b._layerIndex ?? 0;
      return indexA - indexB;
    });

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
      const fallbackFrame = figma.createFrame();
      fallbackFrame.name = nodeData.name || 'Group';
      fallbackFrame.fills = [];
      fallbackFrame.clipsContent = false;
      return fallbackFrame;
    }

    const group = figma.group(childNodes, targetParent);
    group.name = nodeData.name || 'Group';

    if (typeof nodeData.opacity === 'number') group.opacity = Math.max(0, Math.min(1, nodeData.opacity));
    if (nodeData.blendMode) (group as any).blendMode = nodeData.blendMode;
    if (typeof nodeData.visible === 'boolean') group.visible = nodeData.visible;
    if (typeof nodeData.locked === 'boolean') group.locked = nodeData.locked;

    return group;
  }
}