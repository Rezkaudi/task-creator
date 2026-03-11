/**
 * Extracts icons from a reference Figma JSON and stores them in a Map.
 * The map is kept server-side only — nothing is sent to the AI.
 * The AI only receives the icon names, and a post-processor swaps them in after generation.
 */

const MAX_ICONS = 50;

export class IconExtractorService {

    /**
     * Builds a map of normalized-name → full original node.
     * The full node (including all children and vector data) is preserved
     * in memory for use by the post-processor.
     */
    buildIconMap(referenceJson: any): Map<string, any> {
        const map = new Map<string, any>();
        const nodes = Array.isArray(referenceJson) ? referenceJson : [referenceJson];
        for (const node of nodes) {
            this.walk(node, map);
        }
        return map;
    }

    /**
     * Returns a list of icon names from the map for inclusion in the AI prompt.
     * Only names are sent to the AI — no geometry, no IDs.
     */
    extractIconNames(iconMap: Map<string, any>): string[] {
        return Array.from(iconMap.keys());
    }

    /**
     * Normalizes an icon name for consistent matching:
     * - Lowercases
     * - Removes common prefixes: "icon/", "ic-", "logo/"
     * - Removes common suffixes: "-icon", " icon", " logo"
     * - Strips all separators (spaces, dashes, underscores, slashes)
     */
    normalizeName(name: string): string {
        return (name || '')
        // .toLowerCase()
        // .replace(/^(icon[s]?[\s/\-_]+|logo[s]?[\s/\-_]+|ic[\s/\-_]+)/i, '')
        // .replace(/([\s/\-_]+icon[s]?$|[\s/\-_]+logo[s]?$)/i, '')
        // .replace(/[\s\-_/]+/g, '')
        // .trim();
    }

    private walk(node: any, map: Map<string, any>): void {
        if (!node || typeof node !== 'object') return;
        if (map.size >= MAX_ICONS) return;

        if (this.isIconNode(node)) {
            const key = this.normalizeName(node.name);
            if (key && !map.has(key)) {
                map.set(key, node);
            }
            // Don't recurse into detected icon nodes
            return;
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                this.walk(child, map);
            }
        }
    }

    private isIconNode(node: any): boolean {
        const name = (node.name || '');
        const w: number = node.width ?? Infinity;
        const h: number = node.height ?? Infinity;
        const isSmall = w > 0 && h > 0 && w <= 64 && h <= 64;

        // 1. Name keywords
        if (/icon|logo|arrow|chevron|brand|glyph|symbol|badge/.test(name)) return true;

        // 2. Standalone vector path or boolean operation on paths → always icon content
        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') return true;

        // 3. Small node with IMAGE fill (bitmap or embedded SVG icon)
        if (isSmall && Array.isArray(node.fills) && node.fills.some((f: any) => f.type === 'IMAGE')) return true;

        // 4. Small container with predominantly vector descendants (any container type)
        const containerTypes = ['INSTANCE', 'FRAME', 'GROUP', 'COMPONENT', 'COMPONENT_SET'];
        if (isSmall && containerTypes.includes(node.type) && Array.isArray(node.children) && node.children.length > 0) {
            const vectorCount = this.countVectorDescendants(node.children);
            if (vectorCount / node.children.length >= 0.5) return true;
        }

        // 5. Small INSTANCE — trust size alone (component instances that fit an icon footprint)
        if (node.type === 'INSTANCE' && isSmall) return true;

        return false;
    }

    private countVectorDescendants(children: any[]): number {
        let count = 0;
        for (const child of children) {
            if (child.type === 'VECTOR' || child.type === 'BOOLEAN_OPERATION') {
                count++;
            } else if (Array.isArray(child.children)) {
                count += this.countVectorDescendants(child.children);
            }
        }
        return count;
    }
}
