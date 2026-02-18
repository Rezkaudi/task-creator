import { DesignNode } from '../entities/design-node';
import { FrameInfo, PrototypeConnection, ApplyPrototypeResult } from '../entities/prototype-connection.entity';

/**
 * Selection info returned from the canvas
 */
export interface SelectionInfo {
  readonly count: number;
  readonly names: string[];
}

/**
 * Component registry for tracking components during import
 */
export interface ComponentRegistry {
  readonly components: Map<string, ComponentNode>;
  readonly pendingInstances: Map<string, { nodeData: DesignNode; parent?: SceneNode }[]>;
}

/**
 * Export options
 */
export interface ExportOptions {
  readonly includeImages?: boolean;
  readonly includeVectors?: boolean;
  readonly preserveIds?: boolean;
}

/**
 * Import options
 */
export interface ImportOptions {
  readonly restoreComponents?: boolean;
  readonly preserveTransforms?: boolean;
}

/**
 * Repository interface for node operations
 */
export interface INodeRepository {
  /**
   * Create a node on the canvas
   */
  createNode(node: DesignNode, parent?: SceneNode, options?: ImportOptions): Promise<SceneNode | null>;

  /**
   * Export selected nodes from canvas
   */
  exportSelected(options?: ExportOptions): Promise<DesignNode[]>;

  /**
   * Export all nodes from current page
   */
  exportAll(options?: ExportOptions): Promise<DesignNode[]>;

  /**
   * Get current selection info
   */
  getSelectionInfo(): SelectionInfo;

  /**
   * Set current selection
   */
  setSelection(nodes: SceneNode[]): void;

  /**
   * Export a node by its ID
   */
  exportNodeById(nodeId: string): Promise<DesignNode | null>;

  /**
   * Scroll and zoom to view nodes
   */
  focusOnNodes(nodes: SceneNode[]): void;

  /**
   * Append node to page
   */
  appendToPage(node: SceneNode): void;

  /**
   * Get component registry for tracking during import
   */
  getComponentRegistry(): ComponentRegistry;

  /**
   * Clear component registry after import
   */
  clearComponentRegistry(): void;

  getHeaders(): Promise<HeadersInit>;

  /**
   * Get all frames from current page with their interactive elements
   */
  getFramesWithInteractiveElements(): Promise<FrameInfo[]>;

  /**
   * Apply prototype connections to Figma nodes
   */
  applyPrototypeConnections(connections: PrototypeConnection[]): Promise<ApplyPrototypeResult>;
}