import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Component nodes
 */
export class ComponentNodeCreator extends BaseNodeCreator {
  /**
   * Create a component node from design data
   */
  async create(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: ComponentNode) => Promise<void>
  ): Promise<ComponentNode> {
    const componentNode = figma.createComponent();
    componentNode.name = nodeData.name || 'Component';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    componentNode.resize(width, height);

    this.applyFills(componentNode, nodeData.fills);
    this.applyStrokes(componentNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
    this.applyCornerRadius(componentNode, nodeData);

    // Apply auto-layout if specified
    if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
      componentNode.layoutMode = nodeData.layoutMode;

      if (typeof nodeData.itemSpacing === 'number') {
        componentNode.itemSpacing = nodeData.itemSpacing;
      }
      if (typeof nodeData.paddingTop === 'number') {
        componentNode.paddingTop = nodeData.paddingTop;
      }
      if (typeof nodeData.paddingRight === 'number') {
        componentNode.paddingRight = nodeData.paddingRight;
      }
      if (typeof nodeData.paddingBottom === 'number') {
        componentNode.paddingBottom = nodeData.paddingBottom;
      }
      if (typeof nodeData.paddingLeft === 'number') {
        componentNode.paddingLeft = nodeData.paddingLeft;
      }
    }

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, componentNode);
        }
      }
    }

    return componentNode;
  }
}
