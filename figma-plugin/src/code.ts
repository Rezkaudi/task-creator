// code.ts

// --- Interfaces for strict type checking ---
interface FigmaColor {
    r: number;
    g: number;
    b: number;
}

interface FigmaFillData {
    type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
    visible?: boolean;
    opacity?: number;
    blendMode?: string;
    color?: FigmaColor;
}

interface FontNameData {
    readonly family: string;
    readonly style: string;
}

interface LineHeightData {
    unit: 'PIXELS' | 'PERCENT' | 'AUTO';
    value?: number;
}

interface FigmaNodeData {
    name: string;
    type: 'FRAME' | 'GROUP' | 'RECTANGLE' | 'TEXT' | 'ELLIPSE' | 'VECTOR' | 'INSTANCE' | 'COMPONENT' | 'LINE' | 'POLYGON' | 'STAR';
    x: number;
    y: number;
    width?: number;
    height?: number;
    fills?: FigmaFillData[];
    children?: FigmaNodeData[];
    cornerRadius?: number;
    characters?: string;
    fontSize?: number;
    fontName?: FontNameData;
    textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT';
    textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
    lineHeight?: LineHeightData;
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisSizingMode?: 'FIXED' | 'AUTO';
    counterAxisSizingMode?: 'FIXED' | 'AUTO';
    primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
    itemSpacing?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    strokeWeight?: number;
    strokes?: FigmaFillData[];
    textDecoration?: 'STRIKETHROUGH' | 'UNDERLINE';
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
    
    // --- FIX STARTS HERE ---
    // Extract the actual design data, whether it's wrapped in { success, data } or not.
    const data = designData.data || designData;
    // Ensure nodesToCreate is always an array.
    const nodesToCreate = Array.isArray(data) ? data : [data];
    // --- FIX ENDS HERE ---

    for (const nodeData of nodesToCreate) {
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

async function importAiDesign(designData: FigmaNodeData) {
    figma.currentPage.selection = [];
    const createdNodes: SceneNode[] = [];
    let nodesToCreate: FigmaNodeData[];

    if (designData.type === 'FRAME' && designData.children && designData.children.length > 1) {
        nodesToCreate = designData.children;
    } else {
        nodesToCreate = [designData];
    }

    for (const nodeData of nodesToCreate) {
        const rootNode = await createNode(nodeData);
        if (rootNode) createdNodes.push(rootNode);
    }

    if (createdNodes.length > 0) {
        if (createdNodes.length > 1) {
            let currentX = 0;
            for (const node of createdNodes) {
                node.x = currentX;
                if ('width' in node && node.width) currentX += node.width + 200;
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
    let node: SceneNode | null = null;
    try {
        switch (nodeData.type) {
            case 'FRAME':
                const frameNode = figma.createFrame();
                node = frameNode;
                frameNode.name = nodeData.name;
                if (nodeData.width && nodeData.height) frameNode.resize(nodeData.width, nodeData.height);
                applyFills(frameNode, nodeData.fills);
                applyStrokes(frameNode, nodeData.strokes, nodeData.strokeWeight);
                if (nodeData.cornerRadius !== undefined) frameNode.cornerRadius = nodeData.cornerRadius;
                if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
                    frameNode.layoutMode = nodeData.layoutMode;
                    if (nodeData.itemSpacing !== undefined) frameNode.itemSpacing = nodeData.itemSpacing;
                    if (nodeData.paddingTop !== undefined) frameNode.paddingTop = nodeData.paddingTop;
                    if (nodeData.paddingRight !== undefined) frameNode.paddingRight = nodeData.paddingRight;
                    if (nodeData.paddingBottom !== undefined) frameNode.paddingBottom = nodeData.paddingBottom;
                    if (nodeData.paddingLeft !== undefined) frameNode.paddingLeft = nodeData.paddingLeft;
                    if (nodeData.primaryAxisAlignItems) frameNode.primaryAxisAlignItems = nodeData.primaryAxisAlignItems;
                    if (nodeData.counterAxisAlignItems) frameNode.counterAxisAlignItems = nodeData.counterAxisAlignItems;
                }
                if (nodeData.children) {
                    for (const child of nodeData.children) await createNode(child, frameNode);
                }
                break;

            case 'GROUP':
                const groupFrame = figma.createFrame();
                node = groupFrame;
                groupFrame.name = nodeData.name;
                if (nodeData.width && nodeData.height) groupFrame.resize(nodeData.width, nodeData.height);
                groupFrame.fills = [];
                if (nodeData.children) {
                    for (const child of nodeData.children) await createNode(child, groupFrame);
                }
                break;

            case 'RECTANGLE':
                if (nodeData.children && nodeData.children.length > 0) {
                    const rectFrame = figma.createFrame();
                    node = rectFrame;
                    rectFrame.name = nodeData.name;
                    if (nodeData.width && nodeData.height) rectFrame.resize(nodeData.width, nodeData.height);
                    applyFills(rectFrame, nodeData.fills);
                    applyStrokes(rectFrame, nodeData.strokes, nodeData.strokeWeight);
                    if (nodeData.cornerRadius !== undefined) rectFrame.cornerRadius = nodeData.cornerRadius;
                    for (const child of nodeData.children) await createNode(child, rectFrame);
                } else {
                    const rectNode = figma.createRectangle();
                    node = rectNode;
                    rectNode.name = nodeData.name;
                    if (nodeData.width && nodeData.height) rectNode.resize(nodeData.width, nodeData.height);
                    applyFills(rectNode, nodeData.fills);
                    applyStrokes(rectNode, nodeData.strokes, nodeData.strokeWeight);
                    if (nodeData.cornerRadius !== undefined) rectNode.cornerRadius = nodeData.cornerRadius;
                }
                break;

            case 'TEXT':
                const textNode = figma.createText();
                node = textNode;
                textNode.name = nodeData.name;
                const defaultFont = { family: "Inter", style: "Regular" };
                try {
                    await figma.loadFontAsync(nodeData.fontName || defaultFont);
                    textNode.fontName = nodeData.fontName || defaultFont;
                } catch (e) {
                    await figma.loadFontAsync(defaultFont);
                    textNode.fontName = defaultFont;
                }
                if (nodeData.characters !== undefined) textNode.characters = nodeData.characters;
                if (nodeData.fontSize !== undefined) textNode.fontSize = nodeData.fontSize;
                if (nodeData.textAlignHorizontal) textNode.textAlignHorizontal = nodeData.textAlignHorizontal;
                if (nodeData.textAlignVertical) textNode.textAlignVertical = nodeData.textAlignVertical;
                if (nodeData.textDecoration) textNode.textDecoration = nodeData.textDecoration;
                if (nodeData.lineHeight) {
                    if ((nodeData.lineHeight.unit === 'PIXELS' || nodeData.lineHeight.unit === 'PERCENT') && typeof nodeData.lineHeight.value === 'number') {
                        textNode.lineHeight = { unit: nodeData.lineHeight.unit, value: nodeData.lineHeight.value };
                    } else if (nodeData.lineHeight.unit === 'AUTO') {
                        textNode.lineHeight = { unit: 'AUTO' };
                    }
                }
                applyFills(textNode, nodeData.fills);
                if (nodeData.width) textNode.resize(nodeData.width, textNode.height);
                break;
            
            case 'VECTOR':
                const vectorPlaceholder = figma.createRectangle();
                node = vectorPlaceholder;
                vectorPlaceholder.name = nodeData.name + ' (Vector)';
                if (nodeData.width && nodeData.height) vectorPlaceholder.resize(nodeData.width, nodeData.height);
                applyFills(vectorPlaceholder, nodeData.fills);
                break;

            default:
                const placeholder = figma.createFrame();
                node = placeholder;
                placeholder.name = `${nodeData.name} (${(nodeData as any).type} unhandled)`;
                if (nodeData.width && nodeData.height) placeholder.resize(nodeData.width, nodeData.height);
                break;
        }

        if (node) {
            if (nodeData.x !== undefined) node.x = nodeData.x;
            if (nodeData.y !== undefined) node.y = nodeData.y;
            if (parent) {
                parent.appendChild(node);
            } else {
                figma.currentPage.appendChild(node);
            }
        }
    } catch (error) {
        console.error(`Error creating node "${nodeData.name}" of type "${nodeData.type}":`, error);
    }
    return node;
}

// --- Helper Functions ---

function applyFills(node: SceneNode, fills?: FigmaFillData[]) {
    if (!fills || fills.length === 0 || !('fills' in node)) return;
    
    const validFills: SolidPaint[] = fills
        .filter((f): f is FigmaFillData & { type: 'SOLID', color: FigmaColor } => f.type === 'SOLID' && !!f.color)
        .map(f => ({
            type: 'SOLID',
            visible: f.visible !== false,
            opacity: f.opacity ?? 1,
            blendMode: (f.blendMode as BlendMode) || 'NORMAL',
            color: f.color,
        }));

    if (validFills.length > 0) {
        node.fills = validFills;
    }
}

function applyStrokes(node: SceneNode, strokes?: FigmaFillData[], weight?: number) {
    if (!strokes || strokes.length === 0 || !('strokes' in node)) return;
    
    const validStrokes: SolidPaint[] = strokes
        .filter((s): s is FigmaFillData & { type: 'SOLID', color: FigmaColor } => s.type === 'SOLID' && !!s.color)
        .map(s => ({
            type: 'SOLID',
            visible: s.visible !== false,
            opacity: s.opacity ?? 1,
            blendMode: (s.blendMode as BlendMode) || 'NORMAL',
            color: s.color,
        }));

    if (validStrokes.length > 0) {
        node.strokes = validStrokes;
        if (typeof weight === 'number') {
            node.strokeWeight = weight;
        }
    }
}
