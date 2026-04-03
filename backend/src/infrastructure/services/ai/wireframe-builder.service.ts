export interface WireframeNode {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    __KEEP__?: true;
    children?: WireframeNode[];
}

/**
 * Builds a simplified wireframe JSON from a reference Figma design.
 *
 * The wireframe preserves only spatial properties (name, type, x, y, width, height)
 * and marks pinned components with __KEEP__: true. This is sent to the LLM so it
 * can understand the 2D spatial layout and generate content only for non-pinned areas.
 *
 * Example output (sidebar + header pinned):
 * {
 *   name: "Root", type: "FRAME", x: 0, y: 0, width: 1440, height: 1213,
 *   children: [
 *     { name: "Sidebar", __KEEP__: true, x: 0, y: 0, width: 256, height: 1213 },
 *     { name: "Header",  __KEEP__: true, x: 256, y: 0, width: 1184, height: 77 },
 *     { name: "Content Area", x: 256, y: 77, width: 1183, height: 1053.6 }
 *   ]
 * }
 *
 * Nested pinned (logo inside sidebar):
 * {
 *   children: [
 *     {
 *       name: "Sidebar", x: 0, y: 0, width: 256, height: 1213,
 *       children: [
 *         { name: "Logo", __KEEP__: true, x: 0, y: 0, width: 50, height: 50 }
 *       ]
 *     },
 *     { name: "Header", __KEEP__: true, ... },
 *     { name: "Content Area", ... }
 *   ]
 * }
 */
export class WireframeBuilderService {

    /**
     * Entry point. Handles both array-root and object-root reference designs.
     * Returns the wireframe for the first (or only) root FRAME node.
     */
    build(referenceDesign: any, pinnedNames: string[]): WireframeNode | null {
        if (!referenceDesign || pinnedNames.length === 0) return null;

        const pinnedSet = new Set(pinnedNames);
        const root = Array.isArray(referenceDesign) ? referenceDesign[0] : referenceDesign;

        if (!root) return null;

        return this.buildNode(root, pinnedSet);
    }

    private buildNode(node: any, pinnedSet: Set<string>): WireframeNode {
        const basic: WireframeNode = {
            name: node.name ?? '',
            type: node.type ?? 'FRAME',
            x: node.x ?? 0,
            y: node.y ?? 0,
            width: node.width ?? 0,
            height: node.height ?? 0,
        };

        // This node is pinned — mark it and stop recursion.
        // The entire subtree is kept server-side; LLM only needs its bounding box.
        if (pinnedSet.has(node.name)) {
            return { ...basic, __KEEP__: true };
        }

        // Recurse into children only when a pinned descendant exists at this branch.
        // Including ALL siblings at each level gives the LLM the full spatial context.
        if (Array.isArray(node.children) && node.children.length > 0 &&
            this.hasPinnedDescendants(node, pinnedSet)) {
            return {
                ...basic,
                children: node.children.map((child: any) => this.buildNode(child, pinnedSet)),
            };
        }

        // No pinned descendants — leaf node (content area to generate).
        return basic;
    }

    private hasPinnedDescendants(node: any, pinnedSet: Set<string>): boolean {
        if (!Array.isArray(node.children)) return false;
        return node.children.some((child: any) =>
            pinnedSet.has(child.name) || this.hasPinnedDescendants(child, pinnedSet)
        );
    }
}
