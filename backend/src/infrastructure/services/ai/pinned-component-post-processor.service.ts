/**
 * Post-processes AI-generated Figma JSON to inject pinned components.
 *
 * Primary flow (deterministic injection via `inject()`):
 *   1. User selects components to "pin" from the reference design.
 *   2. Extractor classifies them as top/bottom based on Y position.
 *   3. AI generates content for the available space only.
 *   4. This processor injects the original pinned components at the correct positions,
 *      shifting AI content down and adjusting the root frame height.
 *
 * Fallback flow (legacy `restore()` for __KEEP__ placeholders):
 *   If the AI happens to generate __KEEP__<name>__ nodes, they still get swapped.
 */

import { PinnedLayout } from './pinned-component-extractor.service';

const KEEP_PREFIX = '__KEEP__';
const KEEP_SUFFIX = '__';

export class PinnedComponentPostProcessorService {

    /**
     * Deterministically injects pinned components into the generated design.
     * Does NOT depend on the AI generating any specific placeholder nodes.
     */
    inject(generatedDesign: any, layout: PinnedLayout): any {
        if (!generatedDesign) return generatedDesign;
        if (layout.top.length === 0 && layout.bottom.length === 0) return generatedDesign;

        if (Array.isArray(generatedDesign)) {
            return generatedDesign.map(rootFrame => this.injectIntoFrame(rootFrame, layout));
        }
        return this.injectIntoFrame(generatedDesign, layout);
    }

    private injectIntoFrame(rootFrame: any, layout: PinnedLayout): any {
        if (!rootFrame || rootFrame.type !== 'FRAME') return rootFrame;

        const availableHeight = layout.availableHeight;

        // ── Top pinned components ────────────────────────────────
        const topNodes: any[] = [];
        for (const item of layout.top) {
            topNodes.push({
                ...item.node,
                x: item.node.x ?? 0,
                y: item.originalY,
                width: item.width,
                height: item.height,
            });
        }

        // ── AI content container ─────────────────────────────────
        // Instead of extracting children and shifting/stretching them, we keep
        // the AI root frame intact and re-purpose it as a content container.
        // This preserves all internal layout (auto-layout, padding, gaps, etc.)
        // and forces it to fill the exact available space — no white gaps.
        const aiContentContainer: any = {
            ...rootFrame,
            name: rootFrame.name || 'Content',
            x: 0,
            y: layout.topReservedHeight,
            width: layout.rootWidth,
            height: availableHeight,
            clipsContent: true,
        };
        // Force fixed sizing so the container fills the available space exactly,
        // regardless of whether the AI's internal content is shorter.
        if (aiContentContainer.layoutMode && aiContentContainer.layoutMode !== 'NONE') {
            aiContentContainer.primaryAxisSizingMode = 'FIXED';
            aiContentContainer.counterAxisSizingMode = 'FIXED';
        }

        // ── Bottom pinned components ─────────────────────────────
        const bottomNodes: any[] = [];
        for (const item of layout.bottom) {
            bottomNodes.push({
                ...item.node,
                x: item.node.x ?? 0,
                y: item.originalY,
                width: item.width,
                height: item.height,
            });
        }

        // ── Assemble final children ──────────────────────────────
        const finalChildren: any[] = [...topNodes, aiContentContainer, ...bottomNodes];

        // Fix _layerIndex to preserve injection order during Figma import.
        // Without this, the plugin's sortChildrenByLayerIndex() re-sorts children
        // using the original _layerIndex from reference nodes, breaking our order.
        for (let i = 0; i < finalChildren.length; i++) {
            if (finalChildren[i]) {
                finalChildren[i]._layerIndex = i;
            }
        }

        // ── New root frame with exact reference dimensions ───────
        // Build a clean root frame — the AI's original root becomes the content
        // container inside, so we don't spread rootFrame here (avoids duplicating
        // auto-layout props, fills, etc. on the outer wrapper).
        const result: any = {
            type: 'FRAME',
            name: rootFrame.name || 'Generated Design',
            x: rootFrame.x ?? 0,
            y: rootFrame.y ?? 0,
            width: layout.rootWidth,
            height: layout.rootHeight,
            children: finalChildren,
            clipsContent: true,
        };

        // Copy background fills from AI root if present (for the outermost frame)
        if (rootFrame.fills) result.fills = rootFrame.fills;
        if (rootFrame.backgrounds) result.backgrounds = rootFrame.backgrounds;

        console.log(`📌 Injected ${topNodes.length} top + ${bottomNodes.length} bottom pinned components`);
        console.log(`📐 Root frame: ${layout.rootWidth}x${layout.rootHeight} (top=${layout.topReservedHeight}, content=${availableHeight}, bottom=${layout.bottomReservedHeight})`);

        return result;
    }

    // ==================== WIREFRAME-BASED INJECTION ====================

    /**
     * Recursively injects pinned components by name.
     *
     * Handles both flat pinned (Header, Sidebar at root level) and nested pinned
     * (Logo inside Sidebar). Walks the AI-generated tree; when a node's name
     * matches a key in pinnedMap, replaces the entire node with the original.
     * Unmatched nodes are recursed into so nested matches are found.
     */
    recursiveInject(design: any, pinnedMap: Map<string, any>): any {
        if (!design || !pinnedMap.size) return design;
        if (Array.isArray(design)) {
            return design.map(node => this.injectIntoNode(node, pinnedMap));
        }
        return this.injectIntoNode(design, pinnedMap);
    }

    private injectIntoNode(node: any, pinnedMap: Map<string, any>): any {
        if (!node || typeof node !== 'object') return node;

        // Replace this node wholesale with the original pinned node
        if (pinnedMap.has(node.name)) {
            const original = pinnedMap.get(node.name);
            console.log(`📌 Injecting pinned component: "${node.name}"`);
            return original;
        }

        // Recurse into children to find nested pinned components
        if (Array.isArray(node.children) && node.children.length > 0) {
            return {
                ...node,
                children: node.children.map((child: any) => this.injectIntoNode(child, pinnedMap)),
            };
        }

        return node;
    }

    // ==================== LEGACY FALLBACK ====================

    /**
     * @deprecated Kept as fallback for AI-generated __KEEP__ placeholders.
     * The primary path is now `recursiveInject()`.
     */
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
