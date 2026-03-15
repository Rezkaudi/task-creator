/**
 * Extracts pinned components from a reference Figma JSON and stores them in a Map.
 * The map is kept server-side only — nothing is sent to the AI except space constraints.
 *
 * A "pinned component" is a top-level child of the reference frame that the user explicitly
 * wants to keep unchanged in the new generated design.
 *
 * Instead of asking the AI to generate __KEEP__ placeholders (which it often ignores),
 * we classify pinned components by position (top/bottom), tell the AI about the available
 * space, and deterministically inject the originals after generation.
 */

export interface PinnedLayoutItem {
    name: string;
    node: any;
    width: number;
    height: number;
    originalY: number;
}

export interface PinnedLayout {
    top: PinnedLayoutItem[];
    bottom: PinnedLayoutItem[];
    topReservedHeight: number;
    bottomReservedHeight: number;
    availableHeight: number;
    rootWidth: number;
    rootHeight: number;
}

export class PinnedComponentExtractorService {

    /**
     * Builds a map of component-name → full original node.
     * Recursively searches all children at every depth for name matches.
     */
    extract(referenceJson: any, pinnedNames: string[]): Map<string, any> {
        const map = new Map<string, any>();
        if (!pinnedNames || pinnedNames.length === 0) return map;

        const nameSet = new Set(pinnedNames);
        const nodes = Array.isArray(referenceJson) ? referenceJson : [referenceJson];

        const searchRecursive = (node: any): void => {
            if (!node) return;
            if (node.name && nameSet.has(node.name) && !map.has(node.name)) {
                map.set(node.name, node);
            }
            if (Array.isArray(node.children)) {
                for (const child of node.children) {
                    searchRecursive(child);
                }
            }
        };

        for (const node of nodes) {
            searchRecursive(node);
        }

        return map;
    }

    /**
     * Classifies pinned components by their vertical position in the reference design.
     * Components in the top ~20% are "top" (headers), bottom ~20% are "bottom" (navbars/footers).
     */
    classifyLayout(referenceJson: any, pinnedMap: Map<string, any>): PinnedLayout {
        const nodes = Array.isArray(referenceJson) ? referenceJson : [referenceJson];
        const rootNode = nodes[0];
        const rootWidth = rootNode?.width ?? 390;
        const rootHeight = rootNode?.height ?? 844;

        const top: PinnedLayoutItem[] = [];
        const bottom: PinnedLayoutItem[] = [];

        for (const [name, node] of pinnedMap) {
            const w = node.width ?? 0;
            const h = node.height ?? 0;
            const y = node.y ?? 0;

            const item: PinnedLayoutItem = { name, node, width: w, height: h, originalY: y };

            const relativeY = y / rootHeight;
            const relativeEnd = (y + h) / rootHeight;

            if (relativeY < 0.2) {
                top.push(item);
            } else if (relativeEnd > 0.8) {
                bottom.push(item);
            } else {
                // Middle components — default to top classification to ensure they're included
                top.push(item);
            }
        }

        // Sort by original Y position
        top.sort((a, b) => a.originalY - b.originalY);
        bottom.sort((a, b) => a.originalY - b.originalY);

        const topReservedHeight = top.length > 0
            ? Math.max(...top.map(item => item.originalY + item.height))
            : 0;
        const bottomReservedHeight = bottom.length > 0
            ? rootHeight - Math.min(...bottom.map(item => item.originalY))
            : 0;
        const availableHeight = Math.max(0, rootHeight - topReservedHeight - bottomReservedHeight);

        return {
            top,
            bottom,
            topReservedHeight,
            bottomReservedHeight,
            availableHeight,
            rootWidth,
            rootHeight,
        };
    }

    /**
     * Builds a space constraint instruction string for the AI prompt.
     * Instead of asking the AI to generate __KEEP__ placeholders,
     * we tell it the available space and what NOT to generate.
     */
    buildSpaceConstraints(layout: PinnedLayout): string {
        if (layout.top.length === 0 && layout.bottom.length === 0) return '';

        const lines: string[] = ['LAYOUT CONSTRAINTS (reserved space for pinned components):'];
        lines.push(`Canvas dimensions: ${layout.rootWidth} x ${layout.rootHeight}`);

        if (layout.top.length > 0) {
            const topNames = layout.top.map(c => `"${c.name}"`).join(', ');
            lines.push(`Top reserved: 0px to ${layout.topReservedHeight}px — occupied by: ${topNames}`);
        }

        if (layout.bottom.length > 0) {
            const bottomNames = layout.bottom.map(c => `"${c.name}"`).join(', ');
            const bottomStart = layout.rootHeight - layout.bottomReservedHeight;
            lines.push(`Bottom reserved: ${bottomStart}px to ${layout.rootHeight}px — occupied by: ${bottomNames}`);
        }

        lines.push('');
        lines.push(`Generate content ONLY for the available region (height: ${layout.availableHeight}px).`);
        lines.push(`Set your root FRAME height to ${layout.availableHeight}.`);
        lines.push(`Set your root FRAME width to ${layout.rootWidth}.`);
        lines.push('Position all generated children starting at y=0 within the available space.');
        lines.push('Do NOT generate any header, navigation bar, tab bar, or footer — those are injected automatically after generation.');

        return lines.join('\n');
    }

    /**
     * @deprecated Use buildSpaceConstraints() instead.
     * Kept for backward compatibility — builds __KEEP__ placeholder instructions.
     */
    buildPlaceholderInstructions(pinnedMap: Map<string, any>): string {
        if (pinnedMap.size === 0) return '';

        const lines: string[] = [];
        for (const [name, node] of pinnedMap) {
            const w = node.width ?? 0;
            const h = node.height ?? 0;
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            lines.push(`- "${name}": width=${w}, height=${h}, x=${x}, original_y=${y}`);
        }

        return `PINNED COMPONENTS (must be preserved from the reference design):
The user wants to keep these components exactly as-is from the reference. Do NOT generate content for them.
For each pinned component below, output a placeholder FRAME node with EXACTLY these properties:
${lines.join('\n')}

For each pinned component, use this exact structure:
{"name": "__KEEP__<ComponentName>__", "type": "FRAME", "width": <exact_width>, "height": <exact_height>, "x": 0, "y": <position_in_new_layout>, "fills": [], "children": []}

RULES for pinned components:
- Use exactly the name format: __KEEP__ComponentName__ (double underscores on each side)
- Set width and height to the EXACT values listed above
- Position them logically (e.g., header at y=0, footer at the bottom of the design)
- Set fills to empty array [], children to empty array []
- Generate all OTHER content of the design normally, positioned BETWEEN the pinned components`;
    }
}
