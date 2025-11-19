//code.ts

// Main plugin code that runs in Figma's sandbox - UNIVERSAL VERSION
// Handles any JSON design format (object or array of objects)

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
}

figma.showUI(__html__, { width: 500, height: 700, themeColors: true });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import-design') {
        try {
            await importDesign(msg.designData);
            figma.ui.postMessage({ type: 'import-success' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to import design';
            console.error('Import error:', error);
            figma.ui.postMessage({ type: 'import-error', error: errorMessage });
        }
    } else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};

async function importDesign(designData: FigmaNodeData | FigmaNodeData[]) {
    figma.currentPage.selection = [];
    const createdNodes: SceneNode[] = [];

    // Handle both single object and array of objects
    const nodesToCreate = Array.isArray(designData) ? designData : [designData];

    for (const nodeData of nodesToCreate) {
        const rootNode = await createNode(nodeData);
        if (rootNode) {
            createdNodes.push(rootNode);
        }
    }

    if (createdNodes.length > 0) {
        figma.currentPage.selection = createdNodes;
        figma.viewport.scrollAndZoomIntoView(createdNodes);
        figma.notify(`✅ Imported ${createdNodes.length} design${createdNodes.length > 1 ? 's' : ''}!`);
    } else {
        throw new Error('No nodes were created');
    }
}

async function createNode(nodeData: FigmaNodeData, parent?: FrameNode | GroupNode): Promise<SceneNode | null> {
    let node: SceneNode | null = null;

    try {
        switch (nodeData.type) {
            case 'FRAME':
                node = figma.createFrame();
                node.name = nodeData.name;
                if (nodeData.width && nodeData.height) {
                    node.resize(nodeData.width, nodeData.height);
                }
                applyFills(node, nodeData.fills);
                if (nodeData.cornerRadius !== undefined) node.cornerRadius = nodeData.cornerRadius;

                // Apply layout properties
                if (nodeData.layoutMode && nodeData.layoutMode !== 'NONE') {
                    node.layoutMode = nodeData.layoutMode;
                    if (nodeData.itemSpacing !== undefined) node.itemSpacing = nodeData.itemSpacing;
                    if (nodeData.paddingTop !== undefined) node.paddingTop = nodeData.paddingTop;
                    if (nodeData.paddingRight !== undefined) node.paddingRight = nodeData.paddingRight;
                    if (nodeData.paddingBottom !== undefined) node.paddingBottom = nodeData.paddingBottom;
                    if (nodeData.paddingLeft !== undefined) node.paddingLeft = nodeData.paddingLeft;
                    if (nodeData.primaryAxisAlignItems) {
                        node.primaryAxisAlignItems = nodeData.primaryAxisAlignItems as 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
                    }
                    if (nodeData.counterAxisAlignItems) {
                        node.counterAxisAlignItems = nodeData.counterAxisAlignItems as 'MIN' | 'CENTER' | 'MAX';
                    }
                }

                // Process children
                if (nodeData.children && nodeData.children.length > 0) {
                    for (const child of nodeData.children) {
                        await createNode(child, node);
                    }
                }
                break;

            case 'GROUP':
                // Create a frame first to hold children, then convert to group behavior
                const groupFrame = figma.createFrame();
                groupFrame.name = nodeData.name;
                if (nodeData.width && nodeData.height) {
                    groupFrame.resize(nodeData.width, nodeData.height);
                }
                groupFrame.fills = []; // Groups are typically transparent

                // Process children
                if (nodeData.children && nodeData.children.length > 0) {
                    for (const child of nodeData.children) {
                        await createNode(child, groupFrame);
                    }
                }
                node = groupFrame;
                break;

            case 'RECTANGLE':
                node = figma.createRectangle();
                node.name = nodeData.name;
                if (nodeData.width && nodeData.height) {
                    node.resize(nodeData.width, nodeData.height);
                }
                applyFills(node, nodeData.fills);
                if (nodeData.cornerRadius !== undefined) node.cornerRadius = nodeData.cornerRadius;

                // Handle rectangles with children (like buttons)
                if (nodeData.children && nodeData.children.length > 0) {
                    // Convert to frame to support children
                    const rectFrame = figma.createFrame();
                    rectFrame.name = nodeData.name;
                    if (nodeData.width && nodeData.height) {
                        rectFrame.resize(nodeData.width, nodeData.height);
                    }
                    applyFills(rectFrame, nodeData.fills);
                    if (nodeData.cornerRadius !== undefined) rectFrame.cornerRadius = nodeData.cornerRadius;

                    for (const child of nodeData.children) {
                        await createNode(child, rectFrame);
                    }
                    node = rectFrame;
                }
                break;

            case 'TEXT':
                node = figma.createText();
                node.name = nodeData.name;

                // Load font
                if (nodeData.fontName) {
                    try {
                        await figma.loadFontAsync({
                            family: nodeData.fontName.family,
                            style: nodeData.fontName.style
                        });
                        node.fontName = {
                            family: nodeData.fontName.family,
                            style: nodeData.fontName.style
                        };
                    } catch {
                        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
                        node.fontName = { family: "Inter", style: "Regular" };
                    }
                } else {
                    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
                }

                if (nodeData.characters !== undefined) node.characters = nodeData.characters;
                if (nodeData.fontSize !== undefined) node.fontSize = nodeData.fontSize;
                if (nodeData.textAlignHorizontal) node.textAlignHorizontal = nodeData.textAlignHorizontal;
                if (nodeData.textAlignVertical) node.textAlignVertical = nodeData.textAlignVertical;
                if (nodeData.lineHeight) {
                    if (nodeData.lineHeight.unit === 'PERCENT' && nodeData.lineHeight.value) {
                        node.lineHeight = { unit: 'PERCENT', value: nodeData.lineHeight.value };
                    } else if (nodeData.lineHeight.unit === 'PIXELS' && nodeData.lineHeight.value) {
                        node.lineHeight = { unit: 'PIXELS', value: nodeData.lineHeight.value };
                    } else {
                        node.lineHeight = { unit: 'AUTO' };
                    }
                }
                applyFills(node, nodeData.fills);

                // Resize text node if dimensions specified
                if (nodeData.width) node.resize(nodeData.width, node.height);
                break;

            case 'ELLIPSE':
                node = figma.createEllipse();
                node.name = nodeData.name;
                if (nodeData.width && nodeData.height) {
                    node.resize(nodeData.width, nodeData.height);
                }
                applyFills(node, nodeData.fills);
                break;

            case 'VECTOR':
            case 'INSTANCE':
            case 'COMPONENT':
                // Create a placeholder rectangle for vectors/instances
                node = figma.createRectangle();
                node.name = nodeData.name + ' (placeholder)';
                if (nodeData.width && nodeData.height) {
                    node.resize(nodeData.width, nodeData.height);
                }
                applyFills(node, nodeData.fills);
                if (nodeData.cornerRadius !== undefined) node.cornerRadius = nodeData.cornerRadius;

                // Handle children if any
                if (nodeData.children && nodeData.children.length > 0) {
                    const vectorFrame = figma.createFrame();
                    vectorFrame.name = nodeData.name;
                    if (nodeData.width && nodeData.height) {
                        vectorFrame.resize(nodeData.width, nodeData.height);
                    }
                    vectorFrame.fills = [];

                    for (const child of nodeData.children) {
                        await createNode(child, vectorFrame);
                    }
                    node = vectorFrame;
                }
                break;

            case 'LINE':
                node = figma.createLine();
                node.name = nodeData.name;
                if (nodeData.width) node.resize(nodeData.width, 0);
                applyFills(node, nodeData.fills);
                break;

            default:
                // Unknown node type - create as frame
                console.warn(`Unknown node type: ${nodeData.type}, creating as frame`);
                node = figma.createFrame();
                node.name = nodeData.name + ' (unknown type)';
                if (nodeData.width && nodeData.height) {
                    node.resize(nodeData.width, nodeData.height);
                }
                break;
        }

        // Apply position
        if (node && nodeData.x !== undefined && nodeData.y !== undefined) {
            node.x = nodeData.x;
            node.y = nodeData.y;
        }

        // Append to parent or page
        if (node) {
            if (parent) {
                parent.appendChild(node);
            } else {
                figma.currentPage.appendChild(node);
            }
        }

    } catch (error) {
        console.error(`Error creating node ${nodeData.name}:`, error);
        // Return null on error, but don't stop the entire import
    }

    return node;
}

function applyFills(node: SceneNode, fills?: FigmaFillData[]) {
    if (!fills || fills.length === 0) return;

    try {
        const validFills: Paint[] = fills
            .filter(f => f.type === 'SOLID' && f.color) // Only process SOLID fills for now
            .map(f => ({
                type: 'SOLID' as const,
                visible: f.visible !== false,
                opacity: f.opacity !== undefined ? f.opacity : 1,
                blendMode: (f.blendMode as BlendMode) || 'NORMAL',
                color: f.color!
            }));

        if (validFills.length > 0 && 'fills' in node) {
            node.fills = validFills;
        }
    } catch (error) {
        console.error('Error applying fills:', error);
    }
}