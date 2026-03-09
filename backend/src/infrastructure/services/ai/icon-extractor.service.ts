/**
 * Extracts icons from a reference Figma JSON and stores them in a Map.
 * The map is kept server-side only — nothing is sent to the AI.
 * The AI only receives the icon names, and a post-processor swaps them in after generation.
 */

const MAX_ICONS = 30;

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
            .toLowerCase()
            .replace(/^(icon[s]?[\s/\-_]+|logo[s]?[\s/\-_]+|ic[\s/\-_]+)/i, '')
            .replace(/([\s/\-_]+icon[s]?$|[\s/\-_]+logo[s]?$)/i, '')
            .replace(/[\s\-_/]+/g, '')
            .trim();
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
        const name = (node.name || '').toLowerCase();

        // Name-based: contains icon/logo keywords
        if (/icon|logo|arrow|chevron|brand/.test(name)) return true;

        // INSTANCE whose children are predominantly VECTORs (SVG component pattern)
        if (node.type === 'INSTANCE' && Array.isArray(node.children) && node.children.length > 0) {
            const vectorCount = node.children.filter((c: any) => c.type === 'VECTOR').length;
            if (vectorCount / node.children.length >= 0.7) return true;
        }

        return false;
    }
}
