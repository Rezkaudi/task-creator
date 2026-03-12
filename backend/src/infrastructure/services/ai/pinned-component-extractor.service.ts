/**
 * Extracts pinned components from a reference Figma JSON and stores them in a Map.
 * The map is kept server-side only — nothing is sent to the AI except dimensions/position.
 * The AI receives placeholder instructions, and a post-processor swaps them in after generation.
 *
 * A "pinned component" is a top-level child of the reference frame that the user explicitly
 * wants to keep unchanged in the new generated design.
 */
export class PinnedComponentExtractorService {

    /**
     * Builds a map of component-name → full original node.
     * Searches top-level nodes and their direct children for name matches.
     */
    extract(referenceJson: any, pinnedNames: string[]): Map<string, any> {
        const map = new Map<string, any>();
        if (!pinnedNames || pinnedNames.length === 0) return map;

        const nameSet = new Set(pinnedNames);
        const nodes = Array.isArray(referenceJson) ? referenceJson : [referenceJson];

        for (const node of nodes) {
            // Check if the top-level node itself matches
            if (node && node.name && nameSet.has(node.name) && !map.has(node.name)) {
                map.set(node.name, node);
            }

            // Check top-level children of the reference frame
            if (Array.isArray(node?.children)) {
                for (const child of node.children) {
                    if (child && child.name && nameSet.has(child.name) && !map.has(child.name)) {
                        map.set(child.name, child);
                    }
                }
            }
        }

        return map;
    }

    /**
     * Builds a formatted instruction string to inject into the LLM prompt.
     * Tells the LLM to output placeholder FRAME nodes for each pinned component.
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
