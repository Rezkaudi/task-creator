import { DesignNode, hasChildren } from '../../domain/entities/design-node';

/**
 * Service for counting nodes in a design tree
 */
export class NodeCounter {
  /**
   * Count all nodes including children recursively
   */
  count(node: DesignNode): number {
    let count = 1;

    if (hasChildren(node)) {
      for (const child of node.children) {
        count += this.count(child);
      }
    }

    return count;
  }

  /**
   * Count total nodes in an array of nodes
   */
  countTotal(nodes: DesignNode[]): number {
    return nodes.reduce((total, node) => total + this.count(node), 0);
  }
}
