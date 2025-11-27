import { DesignNode } from '../entities/design-node';

/**
 * Selection info returned from the canvas
 */
export interface SelectionInfo {
  readonly count: number;
  readonly names: string[];
}

/**
 * Repository interface for node operations
 */
export interface INodeRepository {
  /**
   * Create a node on the canvas
   */
  createNode(node: DesignNode, parent?: SceneNode): Promise<SceneNode | null>;

  /**
   * Export selected nodes from canvas
   */
  exportSelected(): Promise<DesignNode[]>;

  /**
   * Export all nodes from current page
   */
  exportAll(): Promise<DesignNode[]>;

  /**
   * Get current selection info
   */
  getSelectionInfo(): SelectionInfo;

  /**
   * Set current selection
   */
  setSelection(nodes: SceneNode[]): void;

  /**
   * Scroll and zoom to view nodes
   */
  focusOnNodes(nodes: SceneNode[]): void;

  /**
   * Append node to page
   */
  appendToPage(node: SceneNode): void;
}
