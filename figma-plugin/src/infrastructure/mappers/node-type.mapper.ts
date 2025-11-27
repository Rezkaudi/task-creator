import { NodeType } from '../../shared/types/node-types';

/**
 * Mapper for converting between Figma node types and domain node types
 */
export class NodeTypeMapper {
  private static readonly TYPE_MAP: Record<string, NodeType> = {
    FRAME: 'FRAME',
    GROUP: 'GROUP',
    RECTANGLE: 'RECTANGLE',
    TEXT: 'TEXT',
    ELLIPSE: 'ELLIPSE',
    VECTOR: 'VECTOR',
    LINE: 'LINE',
    POLYGON: 'POLYGON',
    STAR: 'STAR',
    COMPONENT: 'COMPONENT',
    COMPONENT_SET: 'FRAME',
    INSTANCE: 'INSTANCE',
    BOOLEAN_OPERATION: 'BOOLEAN_OPERATION',
  };

  /**
   * Map Figma node type to domain node type
   */
  static toDomain(figmaType: string): NodeType {
    return NodeTypeMapper.TYPE_MAP[figmaType] || 'FRAME';
  }

  /**
   * Normalize node type to uppercase
   */
  static normalize(type: string): NodeType {
    const upperType = (type || 'FRAME').toUpperCase();
    return NodeTypeMapper.TYPE_MAP[upperType] || 'FRAME';
  }

  /**
   * Check if type is frame-like
   */
  static isFrameLike(type: NodeType): boolean {
    return ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE'].includes(type);
  }

  /**
   * Check if type supports children
   */
  static supportsChildren(type: NodeType): boolean {
    return ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'BOOLEAN_OPERATION'].includes(type);
  }
}
