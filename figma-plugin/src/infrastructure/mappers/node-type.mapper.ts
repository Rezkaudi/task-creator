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
    COMPONENT_SET: 'COMPONENT_SET',
    INSTANCE: 'INSTANCE',
    BOOLEAN_OPERATION: 'BOOLEAN_OPERATION',
    SECTION: 'SECTION',
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
    return ['FRAME', 'GROUP', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION'].includes(type);
  }

  /**
   * Check if type supports children
   */
  static supportsChildren(type: NodeType): boolean {
    return ['FRAME', 'GROUP', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'BOOLEAN_OPERATION', 'SECTION'].includes(type);
  }

  /**
   * Check if type is a shape
   */
  static isShape(type: NodeType): boolean {
    return ['RECTANGLE', 'ELLIPSE', 'LINE', 'POLYGON', 'STAR', 'VECTOR'].includes(type);
  }

  /**
   * Check if type is a component-related type
   */
  static isComponentRelated(type: NodeType): boolean {
    return ['COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
  }
}
