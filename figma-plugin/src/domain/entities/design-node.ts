import { Fill } from './fill';
import { Effect } from './effect';
import { NodeType, LayoutMode, TextAutoResize, TextCase, TextDecoration, ConstraintType, LayoutAlign, LayoutPositioning, StrokeCap, StrokeJoin } from '../../shared/types/node-types';

/**
 * Arc data for ellipses
 */
export interface ArcData {
  startingAngle: number;
  endingAngle: number;
  innerRadius: number;
}

/**
 * Vector path data
 */
export interface VectorPath {
  windingRule: 'NONZERO' | 'EVENODD';
  data: string;
}

/**
 * Vector vertex
 */
export interface VectorVertex {
  x: number;
  y: number;
  strokeCap?: StrokeCap;
  strokeJoin?: StrokeJoin;
  cornerRadius?: number;
  handleMirroring?: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
}

/**
 * Vector segment
 */
export interface VectorSegment {
  start: number;
  end: number;
  tangentStart?: { x: number; y: number };
  tangentEnd?: { x: number; y: number };
}

/**
 * Vector region
 */
export interface VectorRegion {
  windingRule: 'NONZERO' | 'EVENODD';
  loops: number[][];
  fills?: Fill[];
  fillStyleId?: string;
}

/**
 * Vector network for complex vector shapes
 */
export interface VectorNetwork {
  vertices: VectorVertex[];
  segments: VectorSegment[];
  regions?: VectorRegion[];
}

/**
 * Export settings
 */
export interface ExportSetting {
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  suffix?: string;
  contentsOnly?: boolean;
  constraint?: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

/**
 * Guide definition
 */
export interface Guide {
  axis: 'X' | 'Y';
  offset: number;
}

/**
 * Layout grid
 */
export interface LayoutGrid {
  pattern: 'COLUMNS' | 'ROWS' | 'GRID' | string;
  sectionSize: number;
  visible?: boolean;
  color?: { r: number; g: number; b: number; a: number };
  alignment?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | string;
  gutterSize?: number;
  offset?: number;
  count?: number;
}

/**
 * Hyperlink data
 */
export interface HyperlinkTarget {
  type: 'URL' | 'NODE';
  value: string;
}

/**
 * Text segment for mixed styling
 */
export interface TextSegment {
  start: number;
  end: number;
  fontName?: { family: string; style: string };
  fontSize?: number;
  textCase?: TextCase;
  textDecoration?: TextDecoration;
  lineHeight?: { unit: 'AUTO' | 'PIXELS' | 'PERCENT'; value: number };
  letterSpacing?: { unit: 'PIXELS' | 'PERCENT'; value: number };
  fills?: Fill[];
  hyperlink?: HyperlinkTarget;
}

/**
 * Component property definition
 */
export interface ComponentPropertyDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue: any;
  variantOptions?: string[];
  preferredValues?: any[];
}

/**
 * Component property value
 */
export interface ComponentPropertyValue {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  value: any;
}

/**
 * Override info
 */
export interface OverrideInfo {
  id: string;
  overriddenFields: string[];
}

/**
 * Comprehensive Design Node interface
 * Represents ALL Figma node properties for lossless export/import
 */
export interface DesignNode {
  // Identity
  name: string;
  type: NodeType | string;

  // Position and dimensions
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  relativeTransform?: [[number, number, number], [number, number, number]];

  // Layer ordering (for preserving z-index during export/import)
  _layerIndex?: number;

  // Fills and strokes
  fills?: Fill[];
  strokes?: Fill[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  strokeCap?: StrokeCap;
  strokeJoin?: StrokeJoin;
  dashPattern?: number[];
  strokeMiterLimit?: number;

  // Corner radius
  cornerRadius?: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
  cornerSmoothing?: number;

  // Visual properties
  opacity?: number;
  blendMode?: string;
  effects?: Effect[];
  visible?: boolean;
  locked?: boolean;
  isMask?: boolean;
  maskType?: 'ALPHA' | 'VECTOR' | 'LUMINANCE';

  // Constraints
  constraints?: {
    horizontal: ConstraintType;
    vertical: ConstraintType;
  };

  // Auto-layout
  layoutMode?: LayoutMode;
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  layoutWrap?: 'NO_WRAP' | 'WRAP';
  counterAxisSpacing?: number;

  // Layout child properties
  layoutAlign?: LayoutAlign;
  layoutGrow?: number;
  layoutPositioning?: LayoutPositioning;
  itemReverseZIndex?: boolean;

  // Frame-specific
  clipsContent?: boolean;

  // Text properties
  characters?: string;
  fontName?: { family: string; style: string };
  fontSize?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  lineHeight?: { unit: 'AUTO' | 'PIXELS' | 'PERCENT'; value: number };
  letterSpacing?: { unit: 'PIXELS' | 'PERCENT'; value: number };
  textCase?: TextCase;
  textDecoration?: TextDecoration;
  textAutoResize?: TextAutoResize;
  paragraphIndent?: number;
  paragraphSpacing?: number;
  hyperlink?: HyperlinkTarget;
  textTruncation?: 'DISABLED' | 'ENDING';
  maxLines?: number;
  textSegments?: TextSegment[];

  // Shape-specific
  arcData?: ArcData;
  pointCount?: number;
  innerRadius?: number;

  // Vector properties
  vectorPaths?: VectorPath[];
  vectorNetwork?: VectorNetwork;

  // Boolean operations
  booleanOperation?: 'UNION' | 'INTERSECT' | 'SUBTRACT' | 'EXCLUDE';

  // Export settings
  exportSettings?: ExportSetting[];

  // Guides and grids
  guides?: Guide[];
  layoutGrids?: LayoutGrid[];

  // Component properties
  componentKey?: string;
  componentDescription?: string;
  componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>;
  mainComponentId?: string;
  componentProperties?: Record<string, ComponentPropertyValue>;
  isExposedInstance?: boolean;
  exposedInstances?: string[];
  overrides?: OverrideInfo[];

  // Children
  children?: DesignNode[];

  // Image data (for embedded images)
  imageData?: string;

  // Instance-specific (for finding local components)
  _mainComponentNodeId?: string;
}

/**
 * Type guard for nodes with children
 */
export function hasChildren(node: DesignNode): node is DesignNode & { children: DesignNode[] } {
  return Array.isArray(node.children) && node.children.length > 0;
}

/**
 * Type guard for text nodes
 */
export function isTextNode(node: DesignNode): boolean {
  return node.type === 'TEXT';
}

/**
 * Type guard for frame-like nodes
 */
export function isFrameLike(node: DesignNode): boolean {
  return ['FRAME', 'GROUP', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION'].includes(node.type);
}

/**
 * Type guard for shape nodes
 */
export function isShape(node: DesignNode): boolean {
  return ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'VECTOR'].includes(node.type);
}
