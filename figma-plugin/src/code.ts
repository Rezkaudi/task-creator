// code.ts - Fixed and Enhanced Version

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
    textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
    textDecoration?: 'NONE' | 'STRIKETHROUGH' | 'UNDERLINE';
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
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
    strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
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
    // Additional properties for specific node types
    arcData?: { startingAngle: number; endingAngle: number; innerRadius: number };
    pointCount?: number;
    innerRadius?: number;
    // Auto-layout specific
    layoutWrap?: 'NO_WRAP' | 'WRAP';
    counterAxisSpacing?: number;
    layoutGrow?: number;
    layoutAlign?: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX';
    layoutPositioning?: 'AUTO' | 'ABSOLUTE';
    // Text specific
    textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
    paragraphIndent?: number;
    paragraphSpacing?: number;
}

// --- Main Plugin Logic ---

figma.showUI(__html__, { width: 500, height: 700, themeColors: true });

figma.ui.onmessage = async (msg: { type: string, [key: string]: any }) => {
    const messageType = msg.type;

    const handlers: { [key: string]: () => Promise<void> | void } = {
        'design-generated-from-ai': () => importAiDesign(msg.designData),
        'generate-design-from-text': () => figma.ui.postMessage({ type: 'call-backend-for-claude', prompt: msg.prompt }),
        'import-design': () => importStandardDesign(msg.designData),
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
            figma.ui.postMessage({ type: 'import-error', error: errorMessage });
        }
    }
};

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
    if (nodeData.textAutoResize) {
        textNode.textAutoResize = nodeData.textAutoResize;
    }

    // Apply fills (text color)
    applyFills(textNode, nodeData.fills);

    // Resize text box if dimensions provided
    if (nodeData.width && nodeData.width > 0) {
        // Set auto resize mode to allow width setting
        if (textNode.textAutoResize === 'WIDTH_AND_HEIGHT') {
            textNode.textAutoResize = 'HEIGHT';
        }
        textNode.resize(nodeData.width, textNode.height);
    }

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