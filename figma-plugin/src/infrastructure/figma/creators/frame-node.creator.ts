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

    // Apply fills and strokes with async image support
    await this.applyFillsAsync(frameNode, nodeData.fills);
    await this.applyStrokesAsync(
      frameNode,
      nodeData.strokes,
      nodeData.strokeWeight,
      nodeData.strokeAlign,
      nodeData.strokeCap,
      nodeData.strokeJoin,
      nodeData.dashPattern,
      nodeData.strokeMiterLimit
    );

    this.applyCornerRadius(frameNode, nodeData);

    // Apply clipsContent
    if (typeof nodeData.clipsContent === 'boolean') {
      frameNode.clipsContent = nodeData.clipsContent;
    }

    // Apply auto-layout properties
    this.applyAutoLayout(frameNode, nodeData);

    // Apply grids and guides
    this.applyGridsAndGuides(frameNode, nodeData);

    // Create children (sorted by layer index if available)
    if (nodeData.children && Array.isArray(nodeData.children)) {
      const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
      for (const child of sortedChildren) {
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
      const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
      for (const child of sortedChildren) {
        if (child && typeof child === 'object') {
          await createChildFn(child, groupFrame);
        }
      }
    }

    return groupFrame;
  }

  /**
   * Create a section node
   */
  async createSection(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: SectionNode) => Promise<void>
  ): Promise<SectionNode> {
    const sectionNode = figma.createSection();
    sectionNode.name = nodeData.name || 'Section';

    // Sections have different resize behavior
    if (nodeData.width && nodeData.height) {
      sectionNode.resizeWithoutConstraints(nodeData.width, nodeData.height);
    }

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
      const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
      for (const child of sortedChildren) {
        if (child && typeof child === 'object') {
          await createChildFn(child, sectionNode as unknown as SectionNode);
        }
      }
    }

    return sectionNode;
  }

  /**
   * Sort children by layer index to preserve z-order
   */
  private sortChildrenByLayerIndex(children: DesignNode[]): DesignNode[] {
    return [...children].sort((a, b) => {
      const indexA = a._layerIndex ?? 0;
      const indexB = b._layerIndex ?? 0;
      return indexA - indexB;
    });
  }
}
