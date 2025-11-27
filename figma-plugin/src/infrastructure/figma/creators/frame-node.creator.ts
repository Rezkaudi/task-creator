import { DesignNode } from '../../../domain/entities/design-node';
import { BaseNodeCreator } from './base-node.creator';

/**
 * Creator for Frame nodes
 */
export class FrameNodeCreator extends BaseNodeCreator {
  /**
   * Create a frame node from design data
   */
  async create(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const frameNode = figma.createFrame();
    frameNode.name = nodeData.name || 'Frame';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    frameNode.resize(width, height);

    this.applyFills(frameNode, nodeData.fills);
    this.applyStrokes(frameNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
    this.applyCornerRadius(frameNode, nodeData);

    // Apply clipsContent
    if (typeof nodeData.clipsContent === 'boolean') {
      frameNode.clipsContent = nodeData.clipsContent;
    }

    // Apply auto-layout properties
    this.applyAutoLayout(frameNode, nodeData);

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, frameNode);
        }
      }
    }

    return frameNode;
  }

  /**
   * Create a group-like frame (no fill, no clipping)
   */
  async createGroup(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>
  ): Promise<FrameNode> {
    const groupFrame = figma.createFrame();
    groupFrame.name = nodeData.name || 'Group';

    const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
    groupFrame.resize(width, height);

    // Groups typically have no fill
    groupFrame.fills = [];
    groupFrame.clipsContent = false;

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        if (child && typeof child === 'object') {
          await createChildFn(child, groupFrame);
        }
      }
    }

    return groupFrame;
  }

  private applyAutoLayout(frameNode: FrameNode, nodeData: DesignNode): void {
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

    // Wrap and counter axis spacing (for newer Figma versions)
    if (nodeData.layoutWrap && 'layoutWrap' in frameNode) {
      (frameNode as any).layoutWrap = nodeData.layoutWrap;
    }
    if (typeof nodeData.counterAxisSpacing === 'number' && 'counterAxisSpacing' in frameNode) {
      (frameNode as any).counterAxisSpacing = nodeData.counterAxisSpacing;
    }
  }
}
