// Universal JSON-to-Figma Converter
// Handles ANY design JSON format with intelligent normalization

interface UniversalNodeData {
    [key: string]: any;
}

interface NormalizedNode {
    type: string;
    name: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    fills?: any[];
    children?: NormalizedNode[];
    [key: string]: any;
}

// ============================================
// UTILITY FUNCTIONS - Property Normalization
// ============================================

function normalizeKey(key: string): string {
    return key
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/[-\s]/g, '_');
}

function normalizeProperties(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => normalizeProperties(item));
    }

    const normalized: any = {};
    for (const [key, value] of Object.entries(obj)) {
        const normalizedKey = normalizeKey(key);
        normalized[normalizedKey] = normalizeProperties(value);
    }
    return normalized;
}

function parseNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/px|pt|em|rem/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseColorValue(value: any): { r: number, g: number, b: number } {
    // Handle various color formats
    if (typeof value === 'object' && value !== null) {
        if ('r' in value && 'g' in value && 'b' in value) {
            return {
                r: value.r > 1 ? value.r / 255 : value.r,
                g: value.g > 1 ? value.g / 255 : value.g,
                b: value.b > 1 ? value.b / 255 : value.b
            };
        }
    }

    // Handle hex colors
    if (typeof value === 'string') {
        const hex = value.replace('#', '');
        if (hex.length === 6) {
            return {
                r: parseInt(hex.substr(0, 2), 16) / 255,
                g: parseInt(hex.substr(2, 2), 16) / 255,
                b: parseInt(hex.substr(4, 2), 16) / 255
            };
        }
    }

    // Default: black
    return { r: 0, g: 0, b: 0 };
}

// ============================================
// NODE TYPE INFERENCE
// ============================================

function inferNodeType(data: any): string {
    const normalized = normalizeProperties(data);
    const typeValue = normalized.type || normalized.node_type || normalized.element_type || 'frame';
    const typeStr = String(typeValue).toUpperCase();

    // Map various type formats to Figma types
    const typeMap: { [key: string]: string } = {
        'FRAME': 'FRAME',
        'CONTAINER': 'FRAME',
        'DIV': 'FRAME',
        'RECTANGLE': 'RECTANGLE',
        'RECT': 'RECTANGLE',
        'BOX': 'RECTANGLE',
        'TEXT': 'TEXT',
        'LABEL': 'TEXT',
        'PARAGRAPH': 'TEXT',
        'HEADING': 'TEXT',
        'ELLIPSE': 'ELLIPSE',
        'CIRCLE': 'ELLIPSE',
        'GROUP': 'GROUP',
        'VECTOR': 'VECTOR',
        'IMAGE': 'RECTANGLE',
        'BUTTON': 'FRAME',
        'INPUT': 'FRAME',
        'COMPONENT': 'FRAME',
        'INSTANCE': 'FRAME',
        'LINE': 'LINE'
    };

    return typeMap[typeStr] || 'FRAME';
}

// ============================================
// STYLE EXTRACTION & MAPPING
// ============================================

function extractLayoutProperties(data: any): any {
    const normalized = normalizeProperties(data);
    const layout: any = {};

    // Detect layout mode
    if (normalized.layout_mode || normalized.layout || normalized.direction) {
        const layoutValue = normalized.layout_mode || normalized.layout || normalized.direction;
        if (/horizontal|row|flex-row/i.test(String(layoutValue))) {
            layout.layoutMode = 'HORIZONTAL';
        } else if (/vertical|column|flex-col/i.test(String(layoutValue))) {
            layout.layoutMode = 'VERTICAL';
        }
    }

    // Extract spacing
    if (normalized.spacing || normalized.gap || normalized.item_spacing) {
        layout.itemSpacing = parseNumericValue(normalized.spacing || normalized.gap || normalized.item_spacing);
    }

    // Extract padding - handle multiple formats
    const paddingKeys = ['padding', 'padding_top', 'padding_right', 'padding_bottom', 'padding_left'];
    const padding = normalized.padding;

    if (Array.isArray(padding)) {
        // Array format: [vertical, horizontal] or [top, right, bottom, left]
        if (padding.length === 2) {
            layout.paddingTop = layout.paddingBottom = parseNumericValue(padding[0]);
            layout.paddingLeft = layout.paddingRight = parseNumericValue(padding[1]);
        } else if (padding.length === 4) {
            layout.paddingTop = parseNumericValue(padding[0]);
            layout.paddingRight = parseNumericValue(padding[1]);
            layout.paddingBottom = parseNumericValue(padding[2]);
            layout.paddingLeft = parseNumericValue(padding[3]);
        }
    } else if (typeof padding === 'string' || typeof padding === 'number') {
        const value = parseNumericValue(padding);
        layout.paddingTop = layout.paddingRight = layout.paddingBottom = layout.paddingLeft = value;
    }

    // Individual padding properties
    if (normalized.padding_top !== undefined) layout.paddingTop = parseNumericValue(normalized.padding_top);
    if (normalized.padding_right !== undefined) layout.paddingRight = parseNumericValue(normalized.padding_right);
    if (normalized.padding_bottom !== undefined) layout.paddingBottom = parseNumericValue(normalized.padding_bottom);
    if (normalized.padding_left !== undefined) layout.paddingLeft = parseNumericValue(normalized.padding_left);

    // Alignment
    if (normalized.primary_axis_align_items || normalized.justify_content || normalized.align_items) {
        const alignValue = String(normalized.primary_axis_align_items || normalized.justify_content || '');
        if (/start|flex-start|min/i.test(alignValue)) layout.primaryAxisAlignItems = 'MIN';
        else if (/center/i.test(alignValue)) layout.primaryAxisAlignItems = 'CENTER';
        else if (/end|flex-end|max/i.test(alignValue)) layout.primaryAxisAlignItems = 'MAX';
        else if (/space-between/i.test(alignValue)) layout.primaryAxisAlignItems = 'SPACE_BETWEEN';
    }

    if (normalized.counter_axis_align_items || normalized.align_items) {
        const alignValue = String(normalized.counter_axis_align_items || normalized.align_items || '');
        if (/start|flex-start|min/i.test(alignValue)) layout.counterAxisAlignItems = 'MIN';
        else if (/center/i.test(alignValue)) layout.counterAxisAlignItems = 'CENTER';
        else if (/end|flex-end|max/i.test(alignValue)) layout.counterAxisAlignItems = 'MAX';
    }

    return layout;
}

function extractFillsFromStyles(data: any): Paint[] {
    const normalized = normalizeProperties(data);
    const fills: Paint[] = [];

    // Check various background properties
    const bgColor = normalized.background_color || normalized.bg_color || normalized.fill || normalized.color;

    if (bgColor) {
        const color = parseColorValue(bgColor);
        fills.push({
            type: 'SOLID',
            visible: true,
            opacity: 1,
            color: color
        });
    }

    // Check if fills array exists
    if (Array.isArray(normalized.fills)) {
        for (const fill of normalized.fills) {
            if (fill.type === 'SOLID' && fill.color) {
                fills.push({
                    type: 'SOLID',
                    visible: fill.visible !== false,
                    opacity: fill.opacity || 1,
                    color: parseColorValue(fill.color)
                });
            }
        }
    }

    return fills;
}

function extractTextProperties(data: any): any {
    const normalized = normalizeProperties(data);
    const text: any = {};

    // Text content
    text.characters = normalized.characters || normalized.content || normalized.text || '';

    // Font size - multiple possible keys
    if (normalized.font_size || normalized.size) {
        text.fontSize = parseNumericValue(normalized.font_size || normalized.size);
    }

    // Font family and style
    if (normalized.font_name || normalized.font_family) {
        const fontInfo = normalized.font_name || normalized.font_family;
        if (typeof fontInfo === 'object') {
            text.fontName = {
                family: fontInfo.family || 'Inter',
                style: fontInfo.style || 'Regular'
            };
        } else if (typeof fontInfo === 'string') {
            text.fontName = {
                family: fontInfo,
                style: 'Regular'
            };
        }
    }

    // Font weight
    if (normalized.font_weight) {
        const weight = String(normalized.font_weight).toLowerCase();
        if (weight.includes('bold')) {
            text.fontName = text.fontName || {};
            text.fontName.style = 'Bold';
        }
    }

    // Text alignment
    if (normalized.text_align_horizontal || normalized.text_align) {
        const align = String(normalized.text_align_horizontal || normalized.text_align).toUpperCase();
        if (align.includes('LEFT')) text.textAlignHorizontal = 'LEFT';
        else if (align.includes('CENTER')) text.textAlignHorizontal = 'CENTER';
        else if (align.includes('RIGHT')) text.textAlignHorizontal = 'RIGHT';
    }

    if (normalized.text_align_vertical) {
        const align = String(normalized.text_align_vertical).toUpperCase();
        if (align.includes('TOP')) text.textAlignVertical = 'TOP';
        else if (align.includes('CENTER') || align.includes('MIDDLE')) text.textAlignVertical = 'CENTER';
        else if (align.includes('BOTTOM')) text.textAlignVertical = 'BOTTOM';
    }

    // Line height
    if (normalized.line_height) {
        const lineHeight = normalized.line_height;
        if (typeof lineHeight === 'object' && lineHeight.unit) {
            text.lineHeight = lineHeight;
        } else {
            const value = parseNumericValue(lineHeight);
            text.lineHeight = value > 10 ? { unit: 'PERCENT', value } : { unit: 'AUTO' };
        }
    }

    return text;
}

// ============================================
// MAIN NODE BUILDER
// ============================================

async function buildNode(data: UniversalNodeData, parent?: FrameNode | GroupNode): Promise<SceneNode | null> {
    try {
        const normalized = normalizeProperties(data);
        const nodeType = inferNodeType(data);

        let node: SceneNode | null = null;

        // Extract common properties
        const name = normalized.name || `${nodeType} Node`;
        const x = parseNumericValue(normalized.x || 0);
        const y = parseNumericValue(normalized.y || 0);
        const width = normalized.width ? parseNumericValue(normalized.width) : undefined;
        const height = normalized.height ? parseNumericValue(normalized.height) : undefined;

        // Create node based on type
        switch (nodeType) {
            case 'FRAME':
                node = figma.createFrame();
                node.name = name;
                if (width && height) node.resize(width, height);

                // Apply fills
                const frameFills = extractFillsFromStyles(data);
                if (frameFills.length > 0) node.fills = frameFills;

                // Apply corner radius
                if (normalized.corner_radius || normalized.border_radius) {
                    node.cornerRadius = parseNumericValue(normalized.corner_radius || normalized.border_radius);
                }

                // Apply layout properties
                const layout = extractLayoutProperties(data);
                if (layout.layoutMode) {
                    node.layoutMode = layout.layoutMode;
                    if (layout.itemSpacing !== undefined) node.itemSpacing = layout.itemSpacing;
                    if (layout.paddingTop !== undefined) node.paddingTop = layout.paddingTop;
                    if (layout.paddingRight !== undefined) node.paddingRight = layout.paddingRight;
                    if (layout.paddingBottom !== undefined) node.paddingBottom = layout.paddingBottom;
                    if (layout.paddingLeft !== undefined) node.paddingLeft = layout.paddingLeft;
                    if (layout.primaryAxisAlignItems) node.primaryAxisAlignItems = layout.primaryAxisAlignItems;
                    if (layout.counterAxisAlignItems) node.counterAxisAlignItems = layout.counterAxisAlignItems;
                }

                // Process children
                const children = normalized.children || [];
                for (const child of children) {
                    await buildNode(child, node);
                }
                break;

            case 'TEXT':
                node = figma.createText();
                node.name = name;

                const textProps = extractTextProperties(data);

                // Load font
                const fontToLoad = textProps.fontName || { family: 'Inter', style: 'Regular' };
                try {
                    await figma.loadFontAsync(fontToLoad);
                    node.fontName = fontToLoad;
                } catch {
                    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
                    node.fontName = { family: 'Inter', style: 'Regular' };
                }

                // Apply text properties
                if (textProps.characters) node.characters = textProps.characters;
                if (textProps.fontSize) node.fontSize = textProps.fontSize;
                if (textProps.textAlignHorizontal) node.textAlignHorizontal = textProps.textAlignHorizontal;
                if (textProps.textAlignVertical) node.textAlignVertical = textProps.textAlignVertical;
                if (textProps.lineHeight) node.lineHeight = textProps.lineHeight;

                // Apply fills
                const textFills = extractFillsFromStyles(data);
                if (textFills.length > 0) node.fills = textFills;

                // Resize if width specified
                if (width) node.resize(width, node.height);
                break;

            case 'RECTANGLE':
                node = figma.createRectangle();
                node.name = name;
                if (width && height) node.resize(width, height);

                const rectFills = extractFillsFromStyles(data);
                if (rectFills.length > 0) node.fills = rectFills;

                if (normalized.corner_radius || normalized.border_radius) {
                    node.cornerRadius = parseNumericValue(normalized.corner_radius || normalized.border_radius);
                }
                break;

            case 'ELLIPSE':
                node = figma.createEllipse();
                node.name = name;
                if (width && height) node.resize(width, height);

                const ellipseFills = extractFillsFromStyles(data);
                if (ellipseFills.length > 0) node.fills = ellipseFills;
                break;

            case 'LINE':
                node = figma.createLine();
                node.name = name;
                if (width) node.resize(width, 0);
                break;

            case 'GROUP':
                // Create a frame that acts like a group
                const groupFrame = figma.createFrame();
                groupFrame.name = name;
                if (width && height) groupFrame.resize(width, height);
                groupFrame.fills = [];

                const groupChildren = normalized.children || [];
                for (const child of groupChildren) {
                    await buildNode(child, groupFrame);
                }
                node = groupFrame;
                break;

            default:
                // Unknown type - create as frame
                node = figma.createFrame();
                node.name = `${name} (${nodeType})`;
                if (width && height) node.resize(width, height);
                break;
        }

        // Apply position
        if (node) {
            node.x = x;
            node.y = y;

            // Append to parent or page
            if (parent) {
                parent.appendChild(node);
            } else {
                figma.currentPage.appendChild(node);
            }
        }

        return node;

    } catch (error) {
        console.error('Error building node:', error);
        return null;
    }
}

// ============================================
// PLUGIN ENTRY POINT
// ============================================

figma.showUI(__html__, { width: 500, height: 700, themeColors: true });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import-design') {
        try {
            const designData = msg.designData;

            // Handle both single object and array
            const nodesToCreate = Array.isArray(designData) ? designData : [designData];

            figma.currentPage.selection = [];
            const createdNodes: SceneNode[] = [];

            for (const nodeData of nodesToCreate) {
                const node = await buildNode(nodeData);
                if (node) createdNodes.push(node);
            }

            if (createdNodes.length > 0) {
                figma.currentPage.selection = createdNodes;
                figma.viewport.scrollAndZoomIntoView(createdNodes);
                figma.notify(`✅ Successfully imported ${createdNodes.length} design${createdNodes.length > 1 ? 's' : ''}!`);
                figma.ui.postMessage({ type: 'import-success' });
            } else {
                throw new Error('No nodes were created from the design data');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to import design';
            console.error('Import error:', error);
            figma.notify(`❌ ${errorMessage}`, { error: true });
            figma.ui.postMessage({ type: 'import-error', error: errorMessage });
        }
    } else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};