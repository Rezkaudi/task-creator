import React from 'react';

interface NestedNode {
    name: string;
    type: string;
    width?: number;
    height?: number;
    depth: number;
}

interface PinnedComponentPickerProps {
    referenceDesignJson: unknown;
    pinnedNames: Set<string>;
    onToggle: (name: string) => void;
}

function getAllNestedComponents(designJson: unknown): NestedNode[] {
    if (!designJson || typeof designJson !== 'object') return [];
    const node = designJson as Record<string, unknown>;

    // Handle array (multiple root nodes)
    if (Array.isArray(node)) {
        const arr = node as unknown[];
        if (arr.length > 0) {
            const first = arr[0] as Record<string, unknown>;
            if (Array.isArray(first?.children)) {
                return (first.children as NestedNode[]).filter(c => c && c.name).map(c => ({ ...c, depth: 0 }));
            }
        }
        return [];
    }

    // Single root node — return its children
    if (Array.isArray(node.children)) {
        return (node.children as NestedNode[]).filter(c => c && c.name).map(c => ({ ...c, depth: 0 }));
    }

    return [];
}

function PinnedComponentPicker({ referenceDesignJson, pinnedNames, onToggle }: PinnedComponentPickerProps): React.JSX.Element {
    const nodes = getAllNestedComponents(referenceDesignJson);

    if (nodes.length === 0) {
        return <div className="fp-empty">No components found in reference</div>;
    }

    return (
        <>
            {nodes.map(node => {
                const isPinned = pinnedNames.has(node.name);
                return (
                    <div
                        key={node.name}
                        className={`fp-item ${isPinned ? 'selected' : ''}`}
                        onClick={() => onToggle(node.name)}
                        title={`${node.type} · ${Math.round(node.width ?? 0)}×${Math.round(node.height ?? 0)}`}
                        style={{ paddingLeft: `${10 + node.depth * 10}px` }}
                    >
                        <div className="fp-info" style={{ flex: 1 }}>
                            <div className="fp-name">{node.name}</div>
                            <div className="fp-meta">
                                {node.type}
                                {(node.width || node.height) ? ` · ${Math.round(node.width ?? 0)}×${Math.round(node.height ?? 0)}` : ''}
                            </div>
                        </div>
                        <div className="fp-check">✓</div>
                    </div>
                );
            })}
        </>
    );
}

export default PinnedComponentPicker;
