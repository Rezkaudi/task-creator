/**
 * Post-processes AI-generated Figma JSON to restore original pinned components.
 *
 * Flow:
 *   1. User selects components to "pin" from the reference design.
 *   2. AI generates a design using placeholder frames named __KEEP__ComponentName__.
 *   3. This processor walks the generated tree.
 *   4. Any node whose name matches __KEEP__<name>__ is replaced with the
 *      original node from the reference, preserving x/y from the generated layout.
 */

const KEEP_PREFIX = '__KEEP__';
const KEEP_SUFFIX = '__';

export class PinnedComponentPostProcessorService {

    restore(generatedDesign: any, pinnedMap: Map<string, any>): any {
        if (!pinnedMap.size || !generatedDesign) return generatedDesign;

        if (Array.isArray(generatedDesign)) {
            return generatedDesign.map(node => this.processNode(node, pinnedMap));
        }
        return this.processNode(generatedDesign, pinnedMap);
    }

    private processNode(node: any, pinnedMap: Map<string, any>): any {
        if (!node || typeof node !== 'object') return node;

        // Check if this is a placeholder node
        if (this.isPlaceholder(node.name)) {
            const originalName = this.extractOriginalName(node.name);
            const original = pinnedMap.get(originalName);
            if (original) {
                console.log(`🔁 Restoring pinned component: "${originalName}" at y=${node.y ?? original.y}`);
                // Restore original node; keep position from generated layout
                return {
                    ...original,
                    x: node.x ?? original.x ?? 0,
                    y: node.y ?? original.y ?? 0,
                    width: node.width ?? original.width ?? 0,
                    height: node.height ?? original.height ?? 0,
                };
            }
        }

        // Recurse into children
        if (Array.isArray(node.children)) {
            return {
                ...node,
                children: node.children.map(child => this.processNode(child, pinnedMap)),
            };
        }

        return node;
    }

    private isPlaceholder(name: string): boolean {
        if (!name) return false;
        return name.startsWith(KEEP_PREFIX) && name.endsWith(KEEP_SUFFIX) && name.length > KEEP_PREFIX.length + KEEP_SUFFIX.length;
    }

    private extractOriginalName(name: string): string {
        // Remove __KEEP__ prefix and trailing __
        return name.slice(KEEP_PREFIX.length, name.length - KEEP_SUFFIX.length);
    }
}
