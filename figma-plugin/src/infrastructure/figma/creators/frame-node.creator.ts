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
  * Create an actual Figma GROUP node
  * Groups in Figma must be created by grouping existing nodes
  */
  async createGroup(
    nodeData: DesignNode,
    createChildFn: (child: DesignNode, parent: FrameNode) => Promise<void>,
    parentForGroup?: BaseNode & ChildrenMixin
  ): Promise<GroupNode | FrameNode> {
    // Groups require children - if no children, fallback to frame
    if (!nodeData.children || nodeData.children.length === 0) {
      const fallbackFrame = figma.createFrame();
      fallbackFrame.name = nodeData.name || 'Group';
      fallbackFrame.fills = [];
      fallbackFrame.clipsContent = false;
      const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
      fallbackFrame.resize(width, height);
      return fallbackFrame;
    }

    // Create a temporary frame to hold children during creation
    const tempFrame = figma.createFrame();
    tempFrame.name = '__temp_group_container__';
    tempFrame.fills = [];

    // Create children inside temp frame
    const sortedChildren = this.sortChildrenByLayerIndex(nodeData.children);
    for (const child of sortedChildren) {
      if (child && typeof child === 'object') {
        await createChildFn(child, tempFrame);
      }
    }

    // Get created children
    const childNodes = [...tempFrame.children] as SceneNode[];

    if (childNodes.length === 0) {
      // No children were created, return as frame fallback
      tempFrame.name = nodeData.name || 'Group';
      const { width, height } = this.ensureMinDimensions(nodeData.width, nodeData.height);
      tempFrame.resize(width, height);
      tempFrame.clipsContent = false;
      return tempFrame;
    }

    // Determine the parent for the group
    const groupParent = parentForGroup || figma.currentPage;

    // Move children to the parent first (required for figma.group)
    for (const child of childNodes) {
      groupParent.appendChild(child);
    }

    // Create the actual group
    const group = figma.group(childNodes, groupParent);
    group.name = nodeData.name || 'Group';

    // Remove the temporary frame
    tempFrame.remove();

    // Apply blend properties that groups support
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
