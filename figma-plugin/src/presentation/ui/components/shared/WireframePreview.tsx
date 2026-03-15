import React from 'react';

const MAX_PREVIEW_WIDTH = 260;
const MAX_PREVIEW_HEIGHT = 340;
const MIN_NODE_SIZE = 4;

interface WireframeNode {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    depth: number;
    hasChildren?: boolean;
}

interface WireframePreviewProps {
    nodes: WireframeNode[];
    frameWidth: number;
    frameHeight: number;
    pinnedNames: Set<string>;
    onToggle: (name: string) => void;
    onDrillDown?: (name: string) => void;
}

function WireframePreview({ nodes, frameWidth, frameHeight, pinnedNames, onToggle, onDrillDown }: WireframePreviewProps): React.JSX.Element {
    // Compute the actual bounding box including nodes that extend beyond the frame
    let actualHeight = frameHeight;
    let actualWidth = frameWidth;
    for (const node of nodes) {
        if (node.width <= 0 || node.height <= 0) continue;
        actualHeight = Math.max(actualHeight, node.y + node.height);
        actualWidth = Math.max(actualWidth, node.x + node.width);
    }

    const scale = Math.min(MAX_PREVIEW_WIDTH / actualWidth, MAX_PREVIEW_HEIGHT / actualHeight);
    const scaledW = Math.round(actualWidth * scale);
    const scaledH = Math.round(actualHeight * scale);

    return (
        <div className="wf-container" style={{ width: scaledW, height: scaledH }}>
            {nodes.map((node, idx) => {
                if (node.width <= 0 || node.height <= 0) return null;
                // Skip nodes that fall entirely outside the frame bounds
                if (node.x + node.width <= 0 || node.y + node.height <= 0) return null;
                if (node.x >= frameWidth) return null;
                const isPinned = pinnedNames.has(node.name);
                const left = Math.round(node.x * scale);
                const top = Math.round(node.y * scale);
                const w = Math.max(MIN_NODE_SIZE, Math.round(node.width * scale));
                const h = Math.max(MIN_NODE_SIZE, Math.round(node.height * scale));
                const showLabel = w > 28 && h > 10;

                // Deeper nodes get higher z-index so they're clickable on top of parents
                const zBase = isPinned ? 10 : 0;
                const depthClass = node.depth === 0 ? 'wf-depth-0' : node.depth === 1 ? 'wf-depth-1' : 'wf-depth-2';

                return (
                    <div
                        key={`${node.name}-${idx}`}
                        className={`wf-node ${depthClass} ${isPinned ? 'wf-pinned' : ''} ${node.hasChildren ? 'wf-has-children' : ''}`}
                        style={{ left, top, width: w, height: h, zIndex: zBase + node.depth }}
                        onClick={(e) => { e.stopPropagation(); onToggle(node.name); }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (node.hasChildren && onDrillDown) onDrillDown(node.name);
                        }}
                        title={`${node.name} (${node.type} · ${Math.round(node.width)}×${Math.round(node.height)})${node.hasChildren ? ' — double-click to zoom in' : ''}`}
                    >
                        {showLabel && (
                            <span className="wf-label">
                                {node.name}
                                {node.hasChildren && ' ▶'}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default WireframePreview;
