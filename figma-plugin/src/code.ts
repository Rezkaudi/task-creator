// code.ts - With Export Functionality

// --- Interfaces for strict type checking ---
interface FigmaColor {
    r: number;
    g: number;
    b: number;
}

interface FigmaGradientStop {
    position: number;
    color: FigmaColor & { a?: number };
}

interface FigmaFillData {
    type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
    visible?: boolean;
    opacity?: number;
    blendMode?: string;
    color?: FigmaColor;
    gradientStops?: FigmaGradientStop[];
    gradientTransform?: number[][];
    imageRef?: string;
    scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
}

interface FontNameData {
    readonly family: string;
    readonly style: string;
}

interface LineHeightData {
    unit: 'PIXELS' | 'PERCENT' | 'AUTO';
    value?: number;
}

interface LetterSpacingData {
    unit: 'PIXELS' | 'PERCENT';
    value: number;
}

interface EffectData {
    type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
    visible?: boolean;
    radius?: number;
    color?: FigmaColor & { a?: number };
    offset?: { x: number; y: number };
    spread?: number;
    blendMode?: string;
}

interface ConstraintsData {
    horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
    vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
}

interface FigmaNodeData {
    name: string;
    type: 'FRAME' | 'GROUP' | 'RECTANGLE' | 'TEXT' | 'ELLIPSE' | 'VECTOR' | 'INSTANCE' | 'COMPONENT' | 'LINE' | 'POLYGON' | 'STAR' | 'BOOLEAN_OPERATION';
    x: number;
    y: number;
    width?: number;
    height?: number;
    fills?: FigmaFillData[];
    children?: FigmaNodeData[];
    cornerRadius?: number;
    topLeftRadius?: number;
    topRightRadius?: number;
    bottomLeftRadius?: number;
    bottomRightRadius?: number;
    characters?: string;
    fontSize?: number;
    fontName?: FontNameData;
    textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
    lineHeight?: LineHeightData;
    letterSpacing?: LetterSpacingData;
    textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
    textDecoration?: 'NONE' | 'STRIKETHROUGH' | 'UNDERLINE';
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
    primaryAxisSizingMode?: 'FIXED' | 'AUTO';
    counterAxisSizingMode?: 'FIXED' | 'AUTO';
    primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
    itemSpacing?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    strokeWeight?: number;
    strokes?: FigmaFillData[];
    strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
    strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL' | 'DIAMOND_FILLED' | 'TRIANGLE_FILLED' | 'CIRCLE_FILLED';
    strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
    dashPattern?: number[];
    opacity?: number;
    blendMode?: BlendMode;
    effects?: EffectData[];
    constraints?: ConstraintsData;
    clipsContent?: boolean;
    visible?: boolean;
    locked?: boolean;
    rotation?: number;
    arcData?: { startingAngle: number; endingAngle: number; innerRadius: number };
    pointCount?: number;
    innerRadius?: number;
    layoutWrap?: 'NO_WRAP' | 'WRAP';
    counterAxisSpacing?: number;
    layoutGrow?: number;
    layoutAlign?: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';
    layoutPositioning?: 'AUTO' | 'ABSOLUTE';
    textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
    paragraphIndent?: number;
    paragraphSpacing?: number;
}

// --- Main Plugin Logic ---

figma.showUI(__html__, { width: 500, height: 700, themeColors: true });

// Listen for selection changes
figma.on('selectionchange', () => {
    sendSelectionInfo();
});

function sendSelectionInfo() {
    const selection = figma.currentPage.selection;
    figma.ui.postMessage({
        type: 'selection-changed',
        selection: {
            count: selection.length,
            names: selection.map(n => n.name)
        }
    });
}

figma.ui.onmessage = async (msg: { type: string, [key: string]: any }) => {
    const messageType = msg.type;

    const handlers: { [key: string]: () => Promise<void> | void } = {
        'design-generated-from-ai': () => importAiDesign(msg.designData),
        'generate-design-from-text': () => figma.ui.postMessage({ type: 'call-backend-for-claude', prompt: msg.prompt }),
        'import-design': () => importStandardDesign(msg.designData),
        'export-selected': () => exportSelectedNodes(),
        'export-all': () => exportAllNodes(),
        'get-selection-info': () => sendSelectionInfo(),
        'cancel': () => figma.closePlugin(),
    };

    const handler = handlers[messageType];

    if (handler) {
        try {
            await handler();
            if (messageType.startsWith('import') || messageType.startsWith('design-generated')) {
                figma.ui.postMessage({ type: 'import-success' });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `Failed to process: ${messageType}`;
            console.error(`Error during ${messageType}:`, error);
            if (messageType.startsWith('export')) {
                figma.ui.postMessage({ type: 'export-error', error: errorMessage });
            } else {
                figma.ui.postMessage({ type: 'import-error', error: errorMessage });
            }
        }
    }
};

// --- Export Functions ---

async function exportSelectedNodes() {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
        throw new Error('No layers selected. Please select at least one layer to export.');
    }

    const exportedNodes: FigmaNodeData[] = [];
    let totalNodeCount = 0;

    for (const node of selection) {
        const exported = exportNode(node);
        if (exported) {
            exportedNodes.push(exported);
            totalNodeCount += countNodes(exported);
        }
    }

    if (exportedNodes.length === 0) {
        throw new Error('No exportable layers found in selection.');
    }

    // Always return an array of objects
    figma.ui.postMessage({
        type: 'export-success',
        data: exportedNodes,
        nodeCount: totalNodeCount
    });

    figma.notify(`✅ Exported ${exportedNodes.length} layer${exportedNodes.length !== 1 ? 's' : ''} (${totalNodeCount} total nodes)!`);
}

async function exportAllNodes() {
    const pageChildren = figma.currentPage.children;

    if (pageChildren.length === 0) {
        throw new Error('No layers on current page to export.');
    }

    const exportedNodes: FigmaNodeData[] = [];
    let totalNodeCount = 0;

    for (const node of pageChildren) {
        const exported = exportNode(node);
        if (exported) {
            exportedNodes.push(exported);
            totalNodeCount += countNodes(exported);
        }
    }

    if (exportedNodes.length === 0) {
        throw new Error('No exportable layers found on page.');
    }

    // Always return an array of objects
    figma.ui.postMessage({
        type: 'export-success',
        data: exportedNodes,
        nodeCount: totalNodeCount
    });

    figma.notify(`✅ Exported ${exportedNodes.length} layer${exportedNodes.length !== 1 ? 's' : ''} (${totalNodeCount} total nodes) from page!`);
}

function countNodes(node: FigmaNodeData): number {
    let count = 1;
    if (node.children) {
        for (const child of node.children) {
            count += countNodes(child);
        }
    }
    return count;
}

function exportNode(node: SceneNode): FigmaNodeData | null {
    if (!node.visible && node.type !== 'COMPONENT') {
        // Skip invisible nodes unless they're components
        // return null;
    }

    const baseData: Partial<FigmaNodeData> = {
        name: node.name,
        type: mapNodeType(node.type),
        x: Math.round(node.x * 100) / 100,
        y: Math.round(node.y * 100) / 100,
    };

    // Add dimensions for nodes that have width/height
    if ('width' in node && 'height' in node) {
        baseData.width = Math.round(node.width * 100) / 100;
        baseData.height = Math.round(node.height * 100) / 100;
    }

    // Add common properties
    if ('opacity' in node && node.opacity !== 1) {
        baseData.opacity = node.opacity;
    }

    if ('visible' in node && !node.visible) {
        baseData.visible = false;
    }

    if ('locked' in node && node.locked) {
        baseData.locked = true;
    }

    if ('rotation' in node && node.rotation !== 0) {
        baseData.rotation = node.rotation;
    }

    if ('blendMode' in node && node.blendMode !== 'NORMAL' && node.blendMode !== 'PASS_THROUGH') {
        baseData.blendMode = node.blendMode;
    }

    // Add fills
    if ('fills' in node && node.fills !== figma.mixed) {
        const fills = exportFills(node.fills as readonly Paint[]);
        if (fills && fills.length > 0) {
            baseData.fills = fills;
        }
    }

    // Add strokes
    if ('strokes' in node) {
        const strokes = exportFills(node.strokes as readonly Paint[]);
        if (strokes && strokes.length > 0) {
            baseData.strokes = strokes;
        }
        if ('strokeWeight' in node && node.strokeWeight !== figma.mixed && node.strokeWeight !== 1) {
            baseData.strokeWeight = node.strokeWeight as number;
        }
        if ('strokeAlign' in node && node.strokeAlign !== 'INSIDE') {
            baseData.strokeAlign = node.strokeAlign;
        }
    }

    // Add corner radius
    if ('cornerRadius' in node) {
        if (node.cornerRadius !== figma.mixed && node.cornerRadius !== 0) {
            baseData.cornerRadius = node.cornerRadius;
        } else if (node.cornerRadius === figma.mixed) {
            // Individual corner radii
            if ('topLeftRadius' in node) {
                if (node.topLeftRadius !== 0) baseData.topLeftRadius = node.topLeftRadius;
                if ((node as any).topRightRadius !== 0) baseData.topRightRadius = (node as any).topRightRadius;
                if ((node as any).bottomLeftRadius !== 0) baseData.bottomLeftRadius = (node as any).bottomLeftRadius;
                if ((node as any).bottomRightRadius !== 0) baseData.bottomRightRadius = (node as any).bottomRightRadius;
            }
        }
    }

    // Add effects
    if ('effects' in node && node.effects.length > 0) {
        const effects = exportEffects(node.effects);
        if (effects && effects.length > 0) {
            baseData.effects = effects;
        }
    }

    // Add constraints
    if ('constraints' in node) {
        const constraints = node.constraints;
        if (constraints.horizontal !== 'MIN' || constraints.vertical !== 'MIN') {
            baseData.constraints = constraints;
        }
    }

    // Handle specific node types
    switch (node.type) {
        case 'FRAME':
        case 'COMPONENT':
        case 'COMPONENT_SET':
        case 'INSTANCE':
            return exportFrameNode(node as FrameNode | ComponentNode | InstanceNode, baseData);

        case 'GROUP':
            return exportGroupNode(node as GroupNode, baseData);

        case 'RECTANGLE':
            return { ...baseData, type: 'RECTANGLE' } as FigmaNodeData;

        case 'ELLIPSE':
            return exportEllipseNode(node as EllipseNode, baseData);

        case 'TEXT':
            return exportTextNode(node as TextNode, baseData);

        case 'LINE':
            return exportLineNode(node as LineNode, baseData);

        case 'VECTOR':
            return { ...baseData, type: 'VECTOR' } as FigmaNodeData;

        case 'POLYGON':
            return exportPolygonNode(node as PolygonNode, baseData);

        case 'STAR':
            return exportStarNode(node as StarNode, baseData);

        case 'BOOLEAN_OPERATION':
            return exportBooleanNode(node as BooleanOperationNode, baseData);

        default:
            // For unsupported types, try to export as generic node
            console.warn(`Unsupported node type: ${node.type}`);
            return { ...baseData, type: 'FRAME' } as FigmaNodeData;
    }
}

function mapNodeType(type: string): FigmaNodeData['type'] {
    const typeMap: { [key: string]: FigmaNodeData['type'] } = {
        'FRAME': 'FRAME',
        'GROUP': 'GROUP',
        'RECTANGLE': 'RECTANGLE',
        'TEXT': 'TEXT',
        'ELLIPSE': 'ELLIPSE',
        'VECTOR': 'VECTOR',
        'LINE': 'LINE',
        'POLYGON': 'POLYGON',
        'STAR': 'STAR',
        'COMPONENT': 'COMPONENT',
        'COMPONENT_SET': 'FRAME',
        'INSTANCE': 'INSTANCE',
        'BOOLEAN_OPERATION': 'BOOLEAN_OPERATION',
    };
    return typeMap[type] || 'FRAME';
}

function exportFrameNode(node: FrameNode | ComponentNode | InstanceNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const frameData: Partial<FigmaNodeData> = { ...baseData };

    // Map component types
    if (node.type === 'COMPONENT') {
        frameData.type = 'COMPONENT';
    } else if (node.type === 'INSTANCE') {
        frameData.type = 'INSTANCE';
    } else {
        frameData.type = 'FRAME';
    }

    // Clips content
    if ('clipsContent' in node && node.clipsContent !== true) {
        frameData.clipsContent = node.clipsContent;
    }

    // Auto-layout properties (skip GRID as it's not fully supported in JSON export)
    if (node.layoutMode !== 'NONE' && node.layoutMode !== 'GRID') {
        frameData.layoutMode = node.layoutMode;

        if (node.itemSpacing !== 0) {
            frameData.itemSpacing = node.itemSpacing;
        }

        if (node.paddingTop !== 0) frameData.paddingTop = node.paddingTop;
        if (node.paddingRight !== 0) frameData.paddingRight = node.paddingRight;
        if (node.paddingBottom !== 0) frameData.paddingBottom = node.paddingBottom;
        if (node.paddingLeft !== 0) frameData.paddingLeft = node.paddingLeft;

        if (node.primaryAxisAlignItems !== 'MIN') {
            frameData.primaryAxisAlignItems = node.primaryAxisAlignItems;
        }
        if (node.counterAxisAlignItems !== 'MIN') {
            frameData.counterAxisAlignItems = node.counterAxisAlignItems;
        }
        if (node.primaryAxisSizingMode !== 'FIXED') {
            frameData.primaryAxisSizingMode = node.primaryAxisSizingMode;
        }
        if (node.counterAxisSizingMode !== 'FIXED') {
            frameData.counterAxisSizingMode = node.counterAxisSizingMode;
        }

        // Layout wrap (newer Figma feature)
        if ('layoutWrap' in node && (node as any).layoutWrap !== 'NO_WRAP') {
            frameData.layoutWrap = (node as any).layoutWrap;
        }
        if ('counterAxisSpacing' in node && (node as any).counterAxisSpacing !== 0) {
            frameData.counterAxisSpacing = (node as any).counterAxisSpacing;
        }
    }

    // Export children
    if ('children' in node && node.children.length > 0) {
        const children: FigmaNodeData[] = [];
        for (const child of node.children) {
            const exportedChild = exportNode(child);
            if (exportedChild) {
                children.push(exportedChild);
            }
        }
        if (children.length > 0) {
            frameData.children = children;
        }
    }

    return frameData as FigmaNodeData;
}

function exportGroupNode(node: GroupNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const groupData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'GROUP'
    };

    // Export children
    if (node.children.length > 0) {
        const children: FigmaNodeData[] = [];
        for (const child of node.children) {
            const exportedChild = exportNode(child);
            if (exportedChild) {
                children.push(exportedChild);
            }
        }
        if (children.length > 0) {
            groupData.children = children;
        }
    }

    return groupData as FigmaNodeData;
}

function exportTextNode(node: TextNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const textData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'TEXT',
        characters: node.characters
    };

    // Font properties (handle mixed fonts)
    if (node.fontSize !== figma.mixed) {
        textData.fontSize = node.fontSize;
    }

    if (node.fontName !== figma.mixed) {
        textData.fontName = {
            family: node.fontName.family,
            style: node.fontName.style
        };
    }

    // Text alignment
    if (node.textAlignHorizontal !== 'LEFT') {
        textData.textAlignHorizontal = node.textAlignHorizontal;
    }
    if (node.textAlignVertical !== 'TOP') {
        textData.textAlignVertical = node.textAlignVertical;
    }

    // Line height
    if (node.lineHeight !== figma.mixed) {
        if (node.lineHeight.unit === 'AUTO') {
            textData.lineHeight = { unit: 'AUTO' };
        } else {
            textData.lineHeight = {
                unit: node.lineHeight.unit,
                value: node.lineHeight.value
            };
        }
    }

    // Letter spacing
    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) {
        textData.letterSpacing = {
            unit: node.letterSpacing.unit,
            value: node.letterSpacing.value
        };
    }

    // Text decoration (handle mixed)
    if (node.textDecoration !== figma.mixed && node.textDecoration !== 'NONE') {
        textData.textDecoration = node.textDecoration;
    }

    // Text case (handle mixed and all valid values)
    if (node.textCase !== figma.mixed && node.textCase !== 'ORIGINAL') {
        const validTextCases = ['UPPER', 'LOWER', 'TITLE', 'SMALL_CAPS', 'SMALL_CAPS_FORCED'];
        if (validTextCases.includes(node.textCase)) {
            textData.textCase = node.textCase as FigmaNodeData['textCase'];
        }
    }

    // Text auto resize
    if (node.textAutoResize !== 'WIDTH_AND_HEIGHT') {
        textData.textAutoResize = node.textAutoResize;
    }

    // Paragraph settings
    if (node.paragraphIndent !== 0) {
        textData.paragraphIndent = node.paragraphIndent;
    }
    if (node.paragraphSpacing !== 0) {
        textData.paragraphSpacing = node.paragraphSpacing;
    }

    return textData as FigmaNodeData;
}

function exportEllipseNode(node: EllipseNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const ellipseData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'ELLIPSE'
    };

    // Arc data for partial ellipses
    if (node.arcData.startingAngle !== 0 ||
        node.arcData.endingAngle !== 2 * Math.PI ||
        node.arcData.innerRadius !== 0) {
        ellipseData.arcData = {
            startingAngle: node.arcData.startingAngle,
            endingAngle: node.arcData.endingAngle,
            innerRadius: node.arcData.innerRadius
        };
    }

    return ellipseData as FigmaNodeData;
}

function exportLineNode(node: LineNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const lineData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'LINE'
    };

    // Handle strokeCap (can be figma.mixed)
    if (node.strokeCap !== figma.mixed && node.strokeCap !== 'NONE') {
        const validStrokeCaps = ['ROUND', 'SQUARE', 'ARROW_LINES', 'ARROW_EQUILATERAL', 'DIAMOND_FILLED', 'TRIANGLE_FILLED', 'CIRCLE_FILLED'];
        if (validStrokeCaps.includes(node.strokeCap)) {
            lineData.strokeCap = node.strokeCap as FigmaNodeData['strokeCap'];
        }
    }

    if (node.dashPattern.length > 0) {
        lineData.dashPattern = [...node.dashPattern];
    }

    return lineData as FigmaNodeData;
}

function exportPolygonNode(node: PolygonNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const polygonData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'POLYGON'
    };

    if (node.pointCount !== 3) {
        polygonData.pointCount = node.pointCount;
    }

    return polygonData as FigmaNodeData;
}

function exportStarNode(node: StarNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const starData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'STAR'
    };

    if (node.pointCount !== 5) {
        starData.pointCount = node.pointCount;
    }

    if (node.innerRadius !== 0.382) { // Default inner radius for 5-point star
        starData.innerRadius = node.innerRadius;
    }

    return starData as FigmaNodeData;
}

function exportBooleanNode(node: BooleanOperationNode, baseData: Partial<FigmaNodeData>): FigmaNodeData {
    const booleanData: Partial<FigmaNodeData> = {
        ...baseData,
        type: 'BOOLEAN_OPERATION'
    };

    // Export children
    if (node.children.length > 0) {
        const children: FigmaNodeData[] = [];
        for (const child of node.children) {
            const exportedChild = exportNode(child);
            if (exportedChild) {
                children.push(exportedChild);
            }
        }
        if (children.length > 0) {
            booleanData.children = children;
        }
    }

    return booleanData as FigmaNodeData;
}

function exportFills(paints: readonly Paint[]): FigmaFillData[] | null {
    if (!paints || paints.length === 0) return null;

    const fills: FigmaFillData[] = [];

    for (const paint of paints) {
        if (paint.type === 'SOLID') {
            fills.push({
                type: 'SOLID',
                visible: paint.visible !== false,
                opacity: paint.opacity ?? 1,
                blendMode: paint.blendMode || 'NORMAL',
                color: {
                    r: Math.round(paint.color.r * 1000) / 1000,
                    g: Math.round(paint.color.g * 1000) / 1000,
                    b: Math.round(paint.color.b * 1000) / 1000
                }
            });
        } else if (paint.type.startsWith('GRADIENT')) {
            fills.push({
                type: paint.type as FigmaFillData['type'],
                visible: paint.visible !== false,
                opacity: paint.opacity ?? 1,
                blendMode: paint.blendMode || 'NORMAL',
                gradientStops: (paint as GradientPaint).gradientStops.map(stop => ({
                    position: stop.position,
                    color: {
                        r: Math.round(stop.color.r * 1000) / 1000,
                        g: Math.round(stop.color.g * 1000) / 1000,
                        b: Math.round(stop.color.b * 1000) / 1000,
                        a: stop.color.a
                    }
                })),
                gradientTransform: (paint as GradientPaint).gradientTransform as number[][]
            });
        }
        // Skip image fills as they can't be easily exported to JSON
    }

    return fills.length > 0 ? fills : null;
}

function exportEffects(effects: readonly Effect[]): EffectData[] | null {
    if (!effects || effects.length === 0) return null;

    const exportedEffects: EffectData[] = [];

    for (const effect of effects) {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            const shadowEffect = effect as DropShadowEffect | InnerShadowEffect;
            exportedEffects.push({
                type: effect.type,
                visible: effect.visible,
                radius: shadowEffect.radius,
                color: {
                    r: Math.round(shadowEffect.color.r * 1000) / 1000,
                    g: Math.round(shadowEffect.color.g * 1000) / 1000,
                    b: Math.round(shadowEffect.color.b * 1000) / 1000,
                    a: shadowEffect.color.a
                },
                offset: {
                    x: shadowEffect.offset.x,
                    y: shadowEffect.offset.y
                },
                spread: shadowEffect.spread,
                blendMode: shadowEffect.blendMode
            });
        } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
            const blurEffect = effect as BlurEffect;
            exportedEffects.push({
                type: effect.type,
                visible: effect.visible,
                radius: blurEffect.radius
            });
        }
    }

    return exportedEffects.length > 0 ? exportedEffects : null;
}

// --- Design Import Functions ---

async function importStandardDesign(designData: any) {
    figma.currentPage.selection = [];
    const createdNodes: SceneNode[] = [];

    // Handle various data wrapper formats
    let data = designData;

    // Unwrap if wrapped in { success, data } or { data }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        if ('data' in data) {
            data = data.data;
        } else if ('design' in data) {
            data = data.design;
        } else if ('result' in data) {
            data = data.result;
        }
    }

    // Ensure nodesToCreate is always an array
    const nodesToCreate = Array.isArray(data) ? data : [data];

    // Filter out null/undefined entries
    const validNodes = nodesToCreate.filter((node: any) => node && typeof node === 'object');

    if (validNodes.length === 0) {
        throw new Error('No valid design data found in the provided input.');
    }

    for (const nodeData of validNodes) {
        const rootNode = await createNode(nodeData);
        if (rootNode) createdNodes.push(rootNode);
    }

    if (createdNodes.length > 0) {
        figma.currentPage.selection = createdNodes;
        figma.viewport.scrollAndZoomIntoView(createdNodes);
        figma.notify(`✅ Imported ${createdNodes.length} design element${createdNodes.length > 1 ? 's' : ''}!`);
    } else {
        throw new Error('No nodes were created from the provided data.');
    }
}

async function importAiDesign(designData: any) {
    figma.currentPage.selection = [];
    const createdNodes: SceneNode[] = [];

    // Handle various AI response formats
    let data = designData;

    // Unwrap common AI response wrappers
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        if ('design' in data) data = data.design;
        else if ('data' in data) data = data.data;
        else if ('result' in data) data = data.result;
        else if ('figmaDesign' in data) data = data.figmaDesign;
    }

    let nodesToCreate: FigmaNodeData[];

    if (Array.isArray(data)) {
        nodesToCreate = data;
    } else if (data && data.type === 'FRAME' && data.children && data.children.length > 1) {
        // If it's a single frame with multiple children, treat children as separate pages
        nodesToCreate = data.children;
    } else if (data && data.type) {
        nodesToCreate = [data];
    } else {
        throw new Error('Invalid AI design data format.');
    }

    for (const nodeData of nodesToCreate) {
        if (nodeData && typeof nodeData === 'object') {
            const rootNode = await createNode(nodeData);
            if (rootNode) createdNodes.push(rootNode);
        }
    }

    if (createdNodes.length > 0) {
        // Arrange multiple pages side by side
        if (createdNodes.length > 1) {
            let currentX = 0;
            for (const node of createdNodes) {
                node.x = currentX;
                node.y = 0;
                if ('width' in node && typeof node.width === 'number') {
                    currentX += node.width + 200;
                }
            }
        }
        figma.currentPage.selection = createdNodes;
        figma.viewport.scrollAndZoomIntoView(createdNodes);
        figma.notify(`✅ Imported ${createdNodes.length} AI-generated page${createdNodes.length > 1 ? 's' : ''}!`);
    } else {
        throw new Error('No nodes were created from the AI-generated data.');
    }
}

// --- Universal Node Creation Function ---

async function createNode(nodeData: FigmaNodeData, parent?: SceneNode & ChildrenMixin): Promise<SceneNode | null> {
    if (!nodeData || typeof nodeData !== 'object') {
        console.warn('Invalid node data received:', nodeData);
        return null;
    }

    // Normalize type to uppercase
    const nodeType = (nodeData.type || 'FRAME').toUpperCase() as FigmaNodeData['type'];

    let node: SceneNode | null = null;

    try {
        switch (nodeType) {
            case 'FRAME':
                node = await createFrameNode(nodeData);
                break;

            case 'GROUP':
                node = await createGroupNode(nodeData);
                break;

            case 'RECTANGLE':
                node = await createRectangleNode(nodeData);
                break;

            case 'TEXT':
                node = await createTextNode(nodeData);
                break;

            case 'ELLIPSE':
                node = await createEllipseNode(nodeData);
                break;

            case 'LINE':
                node = await createLineNode(nodeData);
                break;

            case 'VECTOR':
                node = await createVectorPlaceholder(nodeData);
                break;

            case 'POLYGON':
                node = await createPolygonNode(nodeData);
                break;

            case 'STAR':
                node = await createStarNode(nodeData);
                break;

            case 'COMPONENT':
                node = await createComponentNode(nodeData);
                break;

            case 'INSTANCE':
                // Instances need a component reference, create as frame placeholder
                node = await createFrameNode(nodeData);
                if (node) node.name = `${nodeData.name} (Instance placeholder)`;
                break;

            case 'BOOLEAN_OPERATION':
                // Boolean operations are complex, create as frame placeholder
                node = await createFrameNode(nodeData);
                if (node) node.name = `${nodeData.name} (Boolean placeholder)`;
                break;

            default:
                // Fallback: create a frame for unknown types
                console.warn(`Unknown node type "${nodeType}", creating frame placeholder`);
                node = await createFrameNode(nodeData);
                if (node) node.name = `${nodeData.name} (${nodeType} placeholder)`;
                break;
        }

        // Apply common properties
        if (node) {
            applyCommonProperties(node, nodeData);

            // Handle positioning
            if (typeof nodeData.x === 'number') node.x = nodeData.x;
            if (typeof nodeData.y === 'number') node.y = nodeData.y;

            // Append to parent or page
            if (parent) {
                parent.appendChild(node);
            } else {
                figma.currentPage.appendChild(node);
            }
        }
    } catch (error) {
        console.error(`Error creating node "${nodeData.name}" of type "${nodeType}":`, error);
        // Try to create a placeholder frame on error
        try {
            const placeholder = figma.createFrame();
            placeholder.name = `${nodeData.name || 'Unknown'} (Error: ${error instanceof Error ? error.message : 'Unknown error'})`;
            if (nodeData.width && nodeData.height) {
                placeholder.resize(Math.max(1, nodeData.width), Math.max(1, nodeData.height));
            }
            placeholder.fills = [{ type: 'SOLID', color: { r: 1, g: 0.8, b: 0.8 } }];
            if (parent) {
                parent.appendChild(placeholder);
            } else {
                figma.currentPage.appendChild(placeholder);
            }
            return placeholder;
        } catch (e) {
            console.error('Failed to create error placeholder:', e);
        }
    }

    return node;
}

// --- Specific Node Creation Functions ---

async function createFrameNode(nodeData: FigmaNodeData): Promise<FrameNode> {
    const frameNode = figma.createFrame();
    frameNode.name = nodeData.name || 'Frame';

    // Set dimensions (minimum 1x1)
    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    frameNode.resize(width, height);

    // Apply fills
    applyFills(frameNode, nodeData.fills);

    // Apply strokes
    applyStrokes(frameNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

    // Apply corner radius
    applyCornerRadius(frameNode, nodeData);

    // Apply clipsContent
    if (typeof nodeData.clipsContent === 'boolean') {
        frameNode.clipsContent = nodeData.clipsContent;
    }

    // Apply auto-layout properties
    if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
        frameNode.layoutMode = nodeData.layoutMode;

        if (typeof nodeData.itemSpacing === 'number') frameNode.itemSpacing = nodeData.itemSpacing;
        if (typeof nodeData.paddingTop === 'number') frameNode.paddingTop = nodeData.paddingTop;
        if (typeof nodeData.paddingRight === 'number') frameNode.paddingRight = nodeData.paddingRight;
        if (typeof nodeData.paddingBottom === 'number') frameNode.paddingBottom = nodeData.paddingBottom;
        if (typeof nodeData.paddingLeft === 'number') frameNode.paddingLeft = nodeData.paddingLeft;

        if (nodeData.primaryAxisAlignItems) {
            frameNode.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
        }
        if (nodeData.counterAxisAlignItems) {
            // Handle BASELINE separately as it's only valid in certain contexts
            if (nodeData.counterAxisAlignItems !== 'BASELINE') {
                frameNode.counterAxisAlignItems = nodeData.counterAxisAlignItems;
            }
        }
        if (nodeData.primaryAxisSizingMode) {
            frameNode.primaryAxisSizingMode = nodeData.primaryAxisSizingMode;
        }
        if (nodeData.counterAxisSizingMode) {
            frameNode.counterAxisSizingMode = nodeData.counterAxisSizingMode;
        }

        // Wrap and counter axis spacing (for newer Figma versions)
        if (nodeData.layoutWrap && 'layoutWrap' in frameNode) {
            (frameNode as any).layoutWrap = nodeData.layoutWrap;
        }
        if (typeof nodeData.counterAxisSpacing === 'number' && 'counterAxisSpacing' in frameNode) {
            (frameNode as any).counterAxisSpacing = nodeData.counterAxisSpacing;
        }
    }

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
        for (const child of nodeData.children) {
            if (child && typeof child === 'object') {
                await createNode(child, frameNode);
            }
        }
    }

    return frameNode;
}

async function createGroupNode(nodeData: FigmaNodeData): Promise<FrameNode> {
    // Groups in Figma require existing children, so we create a frame with no fill
    const groupFrame = figma.createFrame();
    groupFrame.name = nodeData.name || 'Group';

    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    groupFrame.resize(width, height);

    // Groups typically have no fill
    groupFrame.fills = [];
    groupFrame.clipsContent = false;

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
        for (const child of nodeData.children) {
            if (child && typeof child === 'object') {
                await createNode(child, groupFrame);
            }
        }
    }

    return groupFrame;
}

async function createRectangleNode(nodeData: FigmaNodeData): Promise<SceneNode> {
    // If rectangle has children, create as frame instead
    if (nodeData.children && nodeData.children.length > 0) {
        const rectFrame = figma.createFrame();
        rectFrame.name = nodeData.name || 'Rectangle';

        const width = Math.max(1, nodeData.width || 100);
        const height = Math.max(1, nodeData.height || 100);
        rectFrame.resize(width, height);

        applyFills(rectFrame, nodeData.fills);
        applyStrokes(rectFrame, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
        applyCornerRadius(rectFrame, nodeData);

        for (const child of nodeData.children) {
            if (child && typeof child === 'object') {
                await createNode(child, rectFrame);
            }
        }

        return rectFrame;
    }

    const rectNode = figma.createRectangle();
    rectNode.name = nodeData.name || 'Rectangle';

    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    rectNode.resize(width, height);

    applyFills(rectNode, nodeData.fills);
    applyStrokes(rectNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
    applyCornerRadius(rectNode, nodeData);

    return rectNode;
}

async function createTextNode(nodeData: FigmaNodeData): Promise<TextNode> {
    const textNode = figma.createText();
    textNode.name = nodeData.name || 'Text';

    // Load and apply font
    const defaultFont: FontName = { family: "Inter", style: "Regular" };
    let fontToUse = defaultFont;

    if (nodeData.fontName) {
        try {
            await figma.loadFontAsync(nodeData.fontName);
            fontToUse = nodeData.fontName;
        } catch (e) {
            console.warn(`Failed to load font ${nodeData.fontName.family} ${nodeData.fontName.style}, using default`);
            try {
                await figma.loadFontAsync(defaultFont);
            } catch (e2) {
                // Try Arial as last resort
                const arialFont: FontName = { family: "Arial", style: "Regular" };
                await figma.loadFontAsync(arialFont);
                fontToUse = arialFont;
            }
        }
    } else {
        await figma.loadFontAsync(defaultFont);
    }

    textNode.fontName = fontToUse;

    // Set characters (must be after font is set)
    if (nodeData.characters !== undefined && nodeData.characters !== null) {
        textNode.characters = String(nodeData.characters);
    } else {
        textNode.characters = '';
    }

    // Set font size
    if (typeof nodeData.fontSize === 'number' && nodeData.fontSize > 0) {
        textNode.fontSize = nodeData.fontSize;
    }

    // Text alignment
    if (nodeData.textAlignHorizontal) {
        textNode.textAlignHorizontal = nodeData.textAlignHorizontal;
    }
    if (nodeData.textAlignVertical) {
        textNode.textAlignVertical = nodeData.textAlignVertical;
    }

    // Text decoration
    if (nodeData.textDecoration && nodeData.textDecoration !== 'NONE') {
        textNode.textDecoration = nodeData.textDecoration;
    }

    // Text case
    if (nodeData.textCase && nodeData.textCase !== 'ORIGINAL') {
        textNode.textCase = nodeData.textCase;
    }

    // Line height
    if (nodeData.lineHeight) {
        if (nodeData.lineHeight.unit === 'AUTO') {
            textNode.lineHeight = { unit: 'AUTO' };
        } else if ((nodeData.lineHeight.unit === 'PIXELS' || nodeData.lineHeight.unit === 'PERCENT')
            && typeof nodeData.lineHeight.value === 'number') {
            textNode.lineHeight = { unit: nodeData.lineHeight.unit, value: nodeData.lineHeight.value };
        }
    }

    // Letter spacing
    if (nodeData.letterSpacing && typeof nodeData.letterSpacing.value === 'number') {
        textNode.letterSpacing = {
            unit: nodeData.letterSpacing.unit || 'PIXELS',
            value: nodeData.letterSpacing.value
        };
    }

    // Paragraph settings
    if (typeof nodeData.paragraphIndent === 'number') {
        textNode.paragraphIndent = nodeData.paragraphIndent;
    }
    if (typeof nodeData.paragraphSpacing === 'number') {
        textNode.paragraphSpacing = nodeData.paragraphSpacing;
    }

    // Text auto resize
    const isParentAutoLayout = nodeData.layoutAlign || typeof nodeData.layoutGrow === 'number';

    if (isParentAutoLayout) {
        if (nodeData.width && nodeData.width > 0) {
            textNode.textAutoResize = 'HEIGHT';
            textNode.resize(nodeData.width, textNode.height || 1);
        } else {
            textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
        }
    } else {
        if (nodeData.width && nodeData.height) {
            textNode.textAutoResize = 'NONE';
            textNode.resize(nodeData.width, nodeData.height);
        } else if (nodeData.width) {
            textNode.textAutoResize = 'HEIGHT';
            textNode.resize(nodeData.width, textNode.height || 1);
        } else {
            textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
        }
    }

    // Apply fills (text color)
    applyFills(textNode, nodeData.fills);

    return textNode;
}

async function createEllipseNode(nodeData: FigmaNodeData): Promise<EllipseNode> {
    const ellipseNode = figma.createEllipse();
    ellipseNode.name = nodeData.name || 'Ellipse';

    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    ellipseNode.resize(width, height);

    applyFills(ellipseNode, nodeData.fills);
    applyStrokes(ellipseNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

    // Arc data for partial ellipses
    if (nodeData.arcData) {
        ellipseNode.arcData = {
            startingAngle: nodeData.arcData.startingAngle || 0,
            endingAngle: nodeData.arcData.endingAngle || 2 * Math.PI,
            innerRadius: nodeData.arcData.innerRadius || 0
        };
    }

    return ellipseNode;
}

async function createLineNode(nodeData: FigmaNodeData): Promise<LineNode> {
    const lineNode = figma.createLine();
    lineNode.name = nodeData.name || 'Line';

    // Lines are resized differently - width is the length
    const width = Math.max(1, nodeData.width || 100);
    lineNode.resize(width, 0);

    // Lines typically use strokes, not fills
    if (nodeData.strokes && nodeData.strokes.length > 0) {
        applyStrokes(lineNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
    } else if (nodeData.fills && nodeData.fills.length > 0) {
        // If no strokes but has fills, use fills as strokes
        applyStrokes(lineNode, nodeData.fills, nodeData.strokeWeight || 1, nodeData.strokeAlign);
    } else {
        // Default stroke
        lineNode.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
        lineNode.strokeWeight = nodeData.strokeWeight || 1;
    }

    // Stroke caps and joins
    if (nodeData.strokeCap) {
        lineNode.strokeCap = nodeData.strokeCap;
    }

    // Dash pattern
    if (nodeData.dashPattern && Array.isArray(nodeData.dashPattern)) {
        lineNode.dashPattern = nodeData.dashPattern;
    }

    return lineNode;
}

async function createVectorPlaceholder(nodeData: FigmaNodeData): Promise<RectangleNode> {
    // Vectors require path data which is complex, create a placeholder
    const vectorPlaceholder = figma.createRectangle();
    vectorPlaceholder.name = `${nodeData.name || 'Vector'} (Vector placeholder)`;

    const width = Math.max(1, nodeData.width || 24);
    const height = Math.max(1, nodeData.height || 24);
    vectorPlaceholder.resize(width, height);

    applyFills(vectorPlaceholder, nodeData.fills);
    applyStrokes(vectorPlaceholder, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

    return vectorPlaceholder;
}

async function createPolygonNode(nodeData: FigmaNodeData): Promise<PolygonNode> {
    const polygonNode = figma.createPolygon();
    polygonNode.name = nodeData.name || 'Polygon';

    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    polygonNode.resize(width, height);

    if (typeof nodeData.pointCount === 'number' && nodeData.pointCount >= 3) {
        polygonNode.pointCount = nodeData.pointCount;
    }

    applyFills(polygonNode, nodeData.fills);
    applyStrokes(polygonNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

    return polygonNode;
}

async function createStarNode(nodeData: FigmaNodeData): Promise<StarNode> {
    const starNode = figma.createStar();
    starNode.name = nodeData.name || 'Star';

    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    starNode.resize(width, height);

    if (typeof nodeData.pointCount === 'number' && nodeData.pointCount >= 3) {
        starNode.pointCount = nodeData.pointCount;
    }
    if (typeof nodeData.innerRadius === 'number') {
        starNode.innerRadius = nodeData.innerRadius;
    }

    applyFills(starNode, nodeData.fills);
    applyStrokes(starNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);

    return starNode;
}

async function createComponentNode(nodeData: FigmaNodeData): Promise<ComponentNode> {
    const componentNode = figma.createComponent();
    componentNode.name = nodeData.name || 'Component';

    const width = Math.max(1, nodeData.width || 100);
    const height = Math.max(1, nodeData.height || 100);
    componentNode.resize(width, height);

    applyFills(componentNode, nodeData.fills);
    applyStrokes(componentNode, nodeData.strokes, nodeData.strokeWeight, nodeData.strokeAlign);
    applyCornerRadius(componentNode, nodeData);

    // Apply auto-layout if specified
    if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
        componentNode.layoutMode = nodeData.layoutMode;
        if (typeof nodeData.itemSpacing === 'number') componentNode.itemSpacing = nodeData.itemSpacing;
        if (typeof nodeData.paddingTop === 'number') componentNode.paddingTop = nodeData.paddingTop;
        if (typeof nodeData.paddingRight === 'number') componentNode.paddingRight = nodeData.paddingRight;
        if (typeof nodeData.paddingBottom === 'number') componentNode.paddingBottom = nodeData.paddingBottom;
        if (typeof nodeData.paddingLeft === 'number') componentNode.paddingLeft = nodeData.paddingLeft;
    }

    // Create children
    if (nodeData.children && Array.isArray(nodeData.children)) {
        for (const child of nodeData.children) {
            if (child && typeof child === 'object') {
                await createNode(child, componentNode);
            }
        }
    }

    return componentNode;
}

// --- Helper Functions ---

function applyCommonProperties(node: SceneNode, nodeData: FigmaNodeData) {
    // Opacity
    if (typeof nodeData.opacity === 'number' && 'opacity' in node) {
        (node as any).opacity = Math.max(0, Math.min(1, nodeData.opacity));
    }

    // Blend mode
    if (nodeData.blendMode && 'blendMode' in node) {
        (node as any).blendMode = nodeData.blendMode;
    }

    // Visibility
    if (typeof nodeData.visible === 'boolean') {
        node.visible = nodeData.visible;
    }

    // Locked
    if (typeof nodeData.locked === 'boolean') {
        node.locked = nodeData.locked;
    }

    // Rotation
    if (typeof nodeData.rotation === 'number' && 'rotation' in node) {
        (node as any).rotation = nodeData.rotation;
    }

    // Effects (shadows, blurs)
    if (nodeData.effects && Array.isArray(nodeData.effects) && 'effects' in node) {
        applyEffects(node as SceneNode & MinimalBlendMixin, nodeData.effects);
    }

    // Constraints
    if (nodeData.constraints && 'constraints' in node) {
        (node as any).constraints = nodeData.constraints;
    }

    // Layout properties for children in auto-layout
    if (typeof nodeData.layoutGrow === 'number' && 'layoutGrow' in node) {
        (node as any).layoutGrow = nodeData.layoutGrow;
    }
    if (nodeData.layoutAlign && 'layoutAlign' in node) {
        (node as any).layoutAlign = nodeData.layoutAlign;
    }
    if (nodeData.layoutPositioning && 'layoutPositioning' in node) {
        (node as any).layoutPositioning = nodeData.layoutPositioning;
    }
}

function applyFills(node: SceneNode, fills?: FigmaFillData[]) {
    if (!fills || !Array.isArray(fills) || fills.length === 0 || !('fills' in node)) return;

    const validFills: Paint[] = [];

    for (const f of fills) {
        if (!f || typeof f !== 'object') continue;

        if (f.type === 'SOLID' && f.color) {
            const solidPaint: SolidPaint = {
                type: 'SOLID',
                visible: f.visible !== false,
                opacity: typeof f.opacity === 'number' ? Math.max(0, Math.min(1, f.opacity)) : 1,
                blendMode: (f.blendMode as BlendMode) || 'NORMAL',
                color: {
                    r: Math.max(0, Math.min(1, f.color.r || 0)),
                    g: Math.max(0, Math.min(1, f.color.g || 0)),
                    b: Math.max(0, Math.min(1, f.color.b || 0))
                }
            };
            validFills.push(solidPaint);
        }
        // Add gradient support if needed in the future
    }

    if (validFills.length > 0) {
        (node as GeometryMixin).fills = validFills;
    }
}

function applyStrokes(node: SceneNode, strokes?: FigmaFillData[], weight?: number, align?: 'INSIDE' | 'OUTSIDE' | 'CENTER') {
    if (!strokes || !Array.isArray(strokes) || strokes.length === 0 || !('strokes' in node)) return;

    const validStrokes: SolidPaint[] = [];

    for (const s of strokes) {
        if (!s || typeof s !== 'object') continue;

        if (s.type === 'SOLID' && s.color) {
            const strokePaint: SolidPaint = {
                type: 'SOLID',
                visible: s.visible !== false,
                opacity: typeof s.opacity === 'number' ? Math.max(0, Math.min(1, s.opacity)) : 1,
                blendMode: (s.blendMode as BlendMode) || 'NORMAL',
                color: {
                    r: Math.max(0, Math.min(1, s.color.r || 0)),
                    g: Math.max(0, Math.min(1, s.color.g || 0)),
                    b: Math.max(0, Math.min(1, s.color.b || 0))
                }
            };
            validStrokes.push(strokePaint);
        }
    }

    if (validStrokes.length > 0) {
        (node as GeometryMixin).strokes = validStrokes;

        if (typeof weight === 'number' && weight >= 0) {
            (node as GeometryMixin).strokeWeight = weight;
        }

        if (align && 'strokeAlign' in node) {
            (node as any).strokeAlign = align;
        }
    }
}

function applyCornerRadius(node: SceneNode, nodeData: FigmaNodeData) {
    if (!('cornerRadius' in node)) return;

    const rectNode = node as RectangleNode | FrameNode | ComponentNode;

    // Check for individual corner radii first
    if (typeof nodeData.topLeftRadius === 'number' ||
        typeof nodeData.topRightRadius === 'number' ||
        typeof nodeData.bottomLeftRadius === 'number' ||
        typeof nodeData.bottomRightRadius === 'number') {

        rectNode.topLeftRadius = nodeData.topLeftRadius || 0;
        rectNode.topRightRadius = nodeData.topRightRadius || 0;
        rectNode.bottomLeftRadius = nodeData.bottomLeftRadius || 0;
        rectNode.bottomRightRadius = nodeData.bottomRightRadius || 0;
    } else if (typeof nodeData.cornerRadius === 'number') {
        rectNode.cornerRadius = nodeData.cornerRadius;
    }
}

function applyEffects(node: SceneNode & MinimalBlendMixin, effects: EffectData[]) {
    if (!effects || !Array.isArray(effects) || effects.length === 0) return;

    const validEffects: Effect[] = [];

    for (const effect of effects) {
        if (!effect || typeof effect !== 'object') continue;

        switch (effect.type) {
            case 'DROP_SHADOW':
                const dropShadow: DropShadowEffect = {
                    type: 'DROP_SHADOW',
                    visible: effect.visible !== false,
                    radius: effect.radius || 0,
                    color: {
                        r: effect.color?.r || 0,
                        g: effect.color?.g || 0,
                        b: effect.color?.b || 0,
                        a: effect.color?.a || 0.25
                    },
                    offset: {
                        x: effect.offset?.x || 0,
                        y: effect.offset?.y || 4
                    },
                    spread: effect.spread || 0,
                    blendMode: (effect.blendMode as BlendMode) || 'NORMAL'
                };
                validEffects.push(dropShadow);
                break;

            case 'INNER_SHADOW':
                const innerShadow: InnerShadowEffect = {
                    type: 'INNER_SHADOW',
                    visible: effect.visible !== false,
                    radius: effect.radius || 0,
                    color: {
                        r: effect.color?.r || 0,
                        g: effect.color?.g || 0,
                        b: effect.color?.b || 0,
                        a: effect.color?.a || 0.25
                    },
                    offset: {
                        x: effect.offset?.x || 0,
                        y: effect.offset?.y || 4
                    },
                    spread: effect.spread || 0,
                    blendMode: (effect.blendMode as BlendMode) || 'NORMAL'
                };
                validEffects.push(innerShadow);
                break;

            case 'LAYER_BLUR':
            case 'BACKGROUND_BLUR':
                // Use type assertion to handle both legacy and progressive blur types
                const blurEffect = {
                    type: effect.type,
                    visible: effect.visible !== false,
                    radius: effect.radius || 0
                } as Effect;
                validEffects.push(blurEffect);
                break;
        }
    }

    if (validEffects.length > 0 && 'effects' in node) {
        node.effects = validEffects;
    }
}