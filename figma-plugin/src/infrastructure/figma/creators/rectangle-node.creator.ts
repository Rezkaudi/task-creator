import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Rectangle nodes
 */
export class RectangleNodeCreator extends BaseNodeCreator {
  /**
   * Create a rectangle node from design data
   */
  async create(nodeData: DesignNode): Promise<RectangleNode> {
    const rectNode = figma.createRectangle();
    rectNode.name = nodeData.name || 'Rectangle';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    rectNode.resize(width, height);

    await this.applyFillsAndStrokesAsync(rectNode, nodeData);
    this.applyCornerRadius(rectNode, nodeData);

    return rectNode;
  }

  /**
   * Create a rectangle as a frame (when it has children)
   */
  async createAsFrame(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const rectFrame = figma.createFrame();
    rectFrame.name = nodeData.name || 'Rectangle';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    rectFrame.resize(width, height);

    await this.applyFillsAndStrokesAsync(rectFrame, nodeData);
    this.applyCornerRadius(rectFrame, nodeData);

    const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children || []);

    for (const child of sortedChildren) {
      if (child && typeof child === 'object') {
        await createChildFn(child, rectFrame);
      }
    }

    return rectFrame;
  }
}
