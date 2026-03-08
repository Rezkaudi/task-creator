import { IconExtractorService } from './icon-extractor.service';

/**
 * Post-processes AI-generated Figma JSON to restore original icons from the reference.
 *
 * Flow:
 *   1. AI generates a design using Iconify placeholders, naming them after reference icons.
 *   2. This processor walks the generated tree.
 *   3. Any node whose name matches a key in the icon map is replaced with the
 *      original icon node from the reference, preserving only x/y from the generated layout.
 */
export class IconPostProcessorService {

    static restore(generatedDesign: any, iconMap: Map<string, any>): any {
        if (!iconMap.size || !generatedDesign) return generatedDesign;

        if (Array.isArray(generatedDesign)) {
            return generatedDesign.map(node => IconPostProcessorService.processNode(node, iconMap));
        }
        return IconPostProcessorService.processNode(generatedDesign, iconMap);
    }

    private static processNode(node: any, iconMap: Map<string, any>): any {
        if (!node || typeof node !== 'object') return node;

        // Only attempt replacement on plausible icon nodes
        if (IconPostProcessorService.isIconCandidate(node)) {
            const original = IconPostProcessorService.findMatch(node.name, iconMap);
            if (original) {
                // Replace with original icon; keep position from generated layout
                return {
                    ...original,
                    name: node.name,
                    x: node.x ?? original.x,
                    y: node.y ?? original.y,
                };
            }
        }

        // Recurse into children
        if (Array.isArray(node.children)) {
            return {
                ...node,
                children: node.children.map(child =>
                    IconPostProcessorService.processNode(child, iconMap)
                ),
            };
        }

        return node;
    }

    /**
     * Returns the original icon node if the name matches an entry in the map.
     * Tries exact normalized match first, then checks if the normalized node name
     * starts with a known icon key (handles AI adding "Icon" or "Logo" suffixes).
     */
    private static findMatch(name: string, iconMap: Map<string, any>): any | null {
        if (!name) return null;

        const normalized = IconExtractorService.normalizeName(name);

        // 1. Exact normalized match
        if (iconMap.has(normalized)) return iconMap.get(normalized)!;

        // 2. Normalized node name starts with a known icon key
        //    (e.g., node "googleicon" matches key "google")
        for (const [key, icon] of iconMap) {
            if (normalized === key) return icon;          // redundant but safe
            if (normalized.startsWith(key) && normalized.length <= key.length + 5) return icon;
            if (key.startsWith(normalized) && key.length <= normalized.length + 5) return icon;
        }

        return null;
    }

    /**
     * Limits replacement to nodes that could plausibly be icons:
     * - INSTANCE nodes
     * - VECTOR nodes
     * - RECTANGLE with IMAGE fill (Iconify-generated icon)
     * - Small FRAME/GROUP nodes with icon-like names
     */
    private static isIconCandidate(node: any): boolean {
        if (node.type === 'INSTANCE') return true;
        if (node.type === 'VECTOR') return true;

        if (node.type === 'RECTANGLE') {
            const hasImageFill = Array.isArray(node.fills) &&
                node.fills.some((f: any) => f.type === 'IMAGE');
            if (hasImageFill) return true;
        }

        // Small containers with icon-like names
        if ((node.type === 'FRAME' || node.type === 'GROUP') &&
            node.width <= 64 && node.height <= 64) {
            return /icon|logo|arrow|chevron/i.test(node.name || '');
        }

        return false;
    }
}
