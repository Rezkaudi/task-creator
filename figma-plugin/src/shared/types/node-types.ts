/**
 * Supported Figma node types
 */
export type NodeType =
  | 'FRAME'
  | 'GROUP'
  | 'RECTANGLE'
  | 'TEXT'
  | 'ELLIPSE'
  | 'VECTOR'
  | 'INSTANCE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'LINE'
  | 'POLYGON'
  | 'STAR'
  | 'BOOLEAN_OPERATION'
  | 'SLICE'
  | 'CONNECTOR'
  | 'SHAPE_WITH_TEXT'
  | 'STICKY'
  | 'STAMP'
  | 'HIGHLIGHT'
  | 'WASHI_TAPE'
  | 'SECTION';

/**
 * Fill types
 */
export type FillType =
  | 'SOLID'
  | 'GRADIENT_LINEAR'
  | 'GRADIENT_RADIAL'
  | 'GRADIENT_ANGULAR'
  | 'GRADIENT_DIAMOND'
  | 'IMAGE'
  | 'VIDEO';

/**
 * Effect types
 */
export type EffectType =
  | 'DROP_SHADOW'
  | 'INNER_SHADOW'
  | 'LAYER_BLUR'
  | 'BACKGROUND_BLUR';

/**
 * Layout modes
 */
export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';

/**
 * Alignment types
 */
export type HorizontalAlignment = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
export type VerticalAlignment = 'TOP' | 'CENTER' | 'BOTTOM';
export type AxisAlignment = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
export type CounterAxisAlignment = 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';

/**
 * Sizing modes
 */
export type SizingMode = 'FIXED' | 'AUTO';

/**
 * Stroke alignment
 */
export type StrokeAlign = 'INSIDE' | 'OUTSIDE' | 'CENTER';

/**
 * Stroke cap types
 */
export type StrokeCap =
  | 'NONE'
  | 'ROUND'
  | 'SQUARE'
  | 'ARROW_LINES'
  | 'ARROW_EQUILATERAL'
  | 'DIAMOND_FILLED'
  | 'TRIANGLE_FILLED'
  | 'CIRCLE_FILLED';

/**
 * Stroke join types
 */
export type StrokeJoin = 'MITER' | 'BEVEL' | 'ROUND';

/**
 * Constraint types
 */
export type ConstraintType = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';

/**
 * Text auto resize modes
 */
export type TextAutoResize = 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';

/**
 * Text case options
 */
export type TextCase =
  | 'ORIGINAL'
  | 'UPPER'
  | 'LOWER'
  | 'TITLE'
  | 'SMALL_CAPS'
  | 'SMALL_CAPS_FORCED';

/**
 * Text decoration options
 */
export type TextDecoration = 'NONE' | 'STRIKETHROUGH' | 'UNDERLINE';

/**
 * Layout wrap options
 */
export type LayoutWrap = 'NO_WRAP' | 'WRAP';

/**
 * Layout positioning
 */
export type LayoutPositioning = 'AUTO' | 'ABSOLUTE';

/**
 * Layout align options
 */
export type LayoutAlign = 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';

/**
 * Boolean operation types
 */
export type BooleanOperationType = 'UNION' | 'INTERSECT' | 'SUBTRACT' | 'EXCLUDE';

/**
 * Blend modes
 */
export type BlendModeType =
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

/**
 * Mask types
 */
export type MaskType = 'ALPHA' | 'VECTOR' | 'LUMINANCE';

/**
 * Export format types
 */
export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF';

/**
 * Scale constraint types
 */
export type ScaleConstraintType = 'SCALE' | 'WIDTH' | 'HEIGHT';
