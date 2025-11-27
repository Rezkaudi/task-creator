import { Fill } from './fill';
import { Effect } from './effect';
import { Constraints } from './constraints';
import { FontName, LineHeight, LetterSpacing } from '../value-objects/typography';
import {
  NodeType,
  LayoutMode,
  HorizontalAlignment,
  VerticalAlignment,
  AxisAlignment,
  CounterAxisAlignment,
  SizingMode,
  StrokeAlign,
  StrokeCap,
  StrokeJoin,
  TextAutoResize,
  TextCase,
  TextDecoration,
  LayoutWrap,
  LayoutPositioning,
  LayoutAlign,
} from '../../shared/types/node-types';

/**
 * Arc data for ellipses
 */
export interface ArcData {
  readonly startingAngle: number;
  readonly endingAngle: number;
  readonly innerRadius: number;
}

/**
 * Main Design Node entity
 * Represents a node in the design tree
 */
export interface DesignNode {
  // Identity
  readonly name: string;
  readonly type: NodeType;

  // Position
  readonly x: number;
  readonly y: number;

  // Dimensions
  readonly width?: number;
  readonly height?: number;

  // Fills and Strokes
  readonly fills?: Fill[];
  readonly strokes?: Fill[];
  readonly strokeWeight?: number;
  readonly strokeAlign?: StrokeAlign;
  readonly strokeCap?: StrokeCap;
  readonly strokeJoin?: StrokeJoin;
  readonly dashPattern?: number[];

  // Corner Radius
  readonly cornerRadius?: number;
  readonly topLeftRadius?: number;
  readonly topRightRadius?: number;
  readonly bottomLeftRadius?: number;
  readonly bottomRightRadius?: number;

  // Text Properties
  readonly characters?: string;
  readonly fontSize?: number;
  readonly fontName?: FontName;
  readonly textAlignHorizontal?: HorizontalAlignment;
  readonly textAlignVertical?: VerticalAlignment;
  readonly lineHeight?: LineHeight;
  readonly letterSpacing?: LetterSpacing;
  readonly textCase?: TextCase;
  readonly textDecoration?: TextDecoration;
  readonly textAutoResize?: TextAutoResize;
  readonly paragraphIndent?: number;
  readonly paragraphSpacing?: number;

  // Layout Properties
  readonly layoutMode?: LayoutMode;
  readonly primaryAxisSizingMode?: SizingMode;
  readonly counterAxisSizingMode?: SizingMode;
  readonly primaryAxisAlignItems?: AxisAlignment;
  readonly counterAxisAlignItems?: CounterAxisAlignment;
  readonly itemSpacing?: number;
  readonly paddingTop?: number;
  readonly paddingRight?: number;
  readonly paddingBottom?: number;
  readonly paddingLeft?: number;
  readonly layoutWrap?: LayoutWrap;
  readonly counterAxisSpacing?: number;
  readonly layoutGrow?: number;
  readonly layoutAlign?: LayoutAlign;
  readonly layoutPositioning?: LayoutPositioning;

  // Visual Properties
  readonly opacity?: number;
  readonly blendMode?: BlendMode;
  readonly effects?: Effect[];
  readonly constraints?: Constraints;
  readonly clipsContent?: boolean;
  readonly visible?: boolean;
  readonly locked?: boolean;
  readonly rotation?: number;

  // Shape-specific Properties
  readonly arcData?: ArcData;
  readonly pointCount?: number;
  readonly innerRadius?: number;

  // Children
  readonly children?: DesignNode[];
}

/**
 * Type guard for frame-like nodes
 */
export function isFrameNode(node: DesignNode): boolean {
  return ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE'].includes(node.type);
}

/**
 * Type guard for text nodes
 */
export function isTextNode(node: DesignNode): node is DesignNode & { characters: string } {
  return node.type === 'TEXT';
}

/**
 * Type guard for nodes with children
 */
export function hasChildren(node: DesignNode): node is DesignNode & { children: DesignNode[] } {
  return node.children !== undefined && node.children.length > 0;
}
