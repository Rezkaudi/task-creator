export interface FigmaColor {
    r: number;
    g: number;
    b: number;
}

export interface FigmaFill {
    type: 'SOLID' | 'GRADIENT';
    visible: boolean;
    opacity: number;
    blendMode: string;
    color: FigmaColor;
    boundVariables?: Record<string, any>;
}

export interface TailwindProps {
    width?: string;
    height?: string;
    'margin-left'?: string;
    'margin-top'?: string;
    'font-size'?: string;
    padding?: string;
    flex?: string;
    'justify-content'?: string;
    'align-items'?: string;
}

export interface FontName {
    family: string;
    style: string;
}

export interface LineHeight {
    unit: 'AUTO' | 'PIXELS' | 'PERCENT';
    value?: number;
}

export interface FigmaNode {
    name: string;
    type: 'FRAME' | 'GROUP' | 'RECTANGLE' | 'TEXT' | 'VECTOR' | 'ELLIPSE' | 'INSTANCE';
    x: number;
    y: number;
    width: number;
    height: number;
    fills?: FigmaFill[];
    children?: FigmaNode[];
    cornerRadius?: number;
    tailwind?: TailwindProps;

    // Text-specific properties
    characters?: string;
    fontSize?: number;
    fontName?: FontName;
    textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT';
    textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
    lineHeight?: LineHeight;

    // Layout properties
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisSizingMode?: 'FIXED' | 'AUTO';
    counterAxisSizingMode?: 'FIXED' | 'AUTO';
    primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
    counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
    itemSpacing?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
}

export interface FigmaDesign {
    name: string;
    type: 'FRAME';
    x: number;
    y: number;
    width: number;
    height: number;
    fills: FigmaFill[];
    children: FigmaNode[];
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisSizingMode?: string;
    counterAxisSizingMode?: string;
    primaryAxisAlignItems?: string;
    counterAxisAlignItems?: string;
    tailwind?: TailwindProps;
}