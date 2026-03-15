import React, { useState, useMemo, useCallback } from 'react';
import WireframePreview from './WireframePreview.tsx';

type PickerView = 'wireframe' | 'list';

interface ChildNode {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hasChildren: boolean;
    _nodeId?: string;
    /** Reference to the raw JSON node so we can drill into it */
    rawNode: Record<string, unknown>;
}

interface BreadcrumbEntry {
    name: string;
    nodeId: string;
}

interface PinnedComponentPickerProps {
    referenceDesignJson: unknown;
    pinnedNames: Set<string>;
    onToggle: (name: string) => void;
    onRequestChildren?: (nodeId: string) => void;
    childrenLoading?: boolean;
}

function getRootNode(designJson: unknown): Record<string, unknown> | null {
    if (!designJson || typeof designJson !== 'object') return null;
    if (Array.isArray(designJson)) {
        return designJson.length > 0 ? (designJson[0] as Record<string, unknown>) : null;
    }
    return designJson as Record<string, unknown>;
}

/** Extracts only the direct children of a given node — O(children) not O(tree). */
function getDirectChildren(node: Record<string, unknown>): ChildNode[] {
    const children = node.children as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(children)) return [];

    const result: ChildNode[] = [];
    for (const child of children) {
        if (!child || !child.name) continue;
        const childChildren = child.children as unknown[] | undefined;
        // hasChildren is true if: the shallow flag says so, OR there are actual children loaded
        const hasChildrenFlag = child.hasChildren === true || (Array.isArray(childChildren) && childChildren.length > 0);
        result.push({
            name: child.name as string,
            type: child.type as string,
            x: (child.x as number) || 0,
            y: (child.y as number) || 0,
            width: (child.width as number) || 0,
            height: (child.height as number) || 0,
            hasChildren: hasChildrenFlag,
            _nodeId: child._nodeId as string | undefined,
            rawNode: child,
        });
    }
    return result;
}

/** Check if a node's children have been loaded (vs just having a hasChildren flag) */
function childrenLoaded(node: Record<string, unknown>): boolean {
    return Array.isArray(node.children) && (node.children as unknown[]).length > 0;
}

/** Find a node by _nodeId in the tree (shallow search through children only) */
function findNodeById(root: Record<string, unknown>, nodeId: string): Record<string, unknown> | null {
    if ((root as any)._nodeId === nodeId) return root;
    const children = root.children as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(children)) return null;
    for (const child of children) {
        const found = findNodeById(child, nodeId);
        if (found) return found;
    }
    return null;
}

function PinnedComponentPicker({ referenceDesignJson, pinnedNames, onToggle, onRequestChildren, childrenLoading }: PinnedComponentPickerProps): React.JSX.Element {
    const [view, setView] = useState<PickerView>('wireframe');
    // Navigation stack: empty = root level
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([]);

    const rootNode = useMemo(() => getRootNode(referenceDesignJson), [referenceDesignJson]);

    const currentNode = useMemo(() => {
        if (breadcrumb.length === 0 || !rootNode) return rootNode;
        const lastEntry = breadcrumb[breadcrumb.length - 1];
        return findNodeById(rootNode, lastEntry.nodeId) ?? rootNode;
    }, [breadcrumb, rootNode, referenceDesignJson]);

    const children = useMemo(() => {
        if (!currentNode) return [];
        return getDirectChildren(currentNode);
    }, [currentNode]);

    const frameWidth = (currentNode?.width as number) || 0;
    const frameHeight = (currentNode?.height as number) || 0;

    const handleDrillDown = useCallback((child: ChildNode) => {
        if (!child.hasChildren || !child._nodeId) return;

        // If children haven't been loaded yet, request them on demand
        if (!childrenLoaded(child.rawNode) && onRequestChildren) {
            onRequestChildren(child._nodeId);
        }

        setBreadcrumb(prev => [...prev, { name: child.name, nodeId: child._nodeId! }]);
    }, [onRequestChildren]);

    const handleGoBack = useCallback(() => {
        setBreadcrumb(prev => prev.slice(0, -1));
    }, []);

    const handleBreadcrumbNav = useCallback((index: number) => {
        // index -1 = root
        setBreadcrumb(prev => prev.slice(0, index + 1));
    }, []);

    // Reset breadcrumb only when the root node identity changes (new frame selected),
    // not when children are lazily populated into the existing tree.
    const prevRootRef = React.useRef(rootNode);
    if (prevRootRef.current !== null && rootNode !== null && prevRootRef.current !== rootNode) {
        // Check if it's a truly different root (different _nodeId) vs same root with updated children
        const prevId = (prevRootRef.current as any)?._nodeId;
        const newId = (rootNode as any)?._nodeId;
        if (prevId !== newId) {
            setBreadcrumb([]);
        }
    }
    prevRootRef.current = rootNode;

    // Show loading if we drilled into a node whose children haven't arrived yet
    const isWaitingForChildren = breadcrumb.length > 0 && childrenLoading && children.length === 0;

    if (isWaitingForChildren) {
        return (
            <div className="fp-loading">
                <div className="loading-spinner" />
                <span>Loading children...</span>
            </div>
        );
    }

    if (!rootNode || children.length === 0) {
        return <div className="fp-empty">No components found{breadcrumb.length > 0 ? ' in this layer' : ' in reference'}</div>;
    }

    const hasWireframe = frameWidth > 0 && frameHeight > 0;

    // Convert ChildNode to the shape WireframePreview expects (depth 0 since we show one level)
    const wireframeNodes = children.map(c => ({
        name: c.name,
        type: c.type,
        x: c.x,
        y: c.y,
        width: c.width,
        height: c.height,
        depth: 0,
        hasChildren: c.hasChildren,
    }));

    return (
        <>
            {hasWireframe && (
                <div className="pp-view-toggle">
                    <button
                        className={`pp-view-btn ${view === 'wireframe' ? 'active' : ''}`}
                        onClick={() => setView('wireframe')}
                    >
                        Wireframe
                    </button>
                    <button
                        className={`pp-view-btn ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                    >
                        List
                    </button>
                </div>
            )}

            {/* Breadcrumb navigation */}
            {breadcrumb.length > 0 && (
                <div className="pp-breadcrumb">
                    <button className="pp-back-btn" onClick={handleGoBack}>←</button>
                    <div className="pp-breadcrumb-trail">
                        <span className="pp-crumb pp-crumb-link" onClick={() => handleBreadcrumbNav(-1)}>Root</span>
                        {breadcrumb.map((entry, i) => (
                            <React.Fragment key={i}>
                                <span className="pp-crumb-sep">›</span>
                                {i < breadcrumb.length - 1 ? (
                                    <span className="pp-crumb pp-crumb-link" onClick={() => handleBreadcrumbNav(i)}>{entry.name}</span>
                                ) : (
                                    <span className="pp-crumb pp-crumb-current">{entry.name}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {view === 'wireframe' && hasWireframe && (
                <WireframePreview
                    nodes={wireframeNodes}
                    frameWidth={frameWidth}
                    frameHeight={frameHeight}
                    pinnedNames={pinnedNames}
                    onToggle={onToggle}
                    onDrillDown={(name) => {
                        const child = children.find(c => c.name === name);
                        if (child) handleDrillDown(child);
                    }}
                />
            )}

            {(view === 'list' || !hasWireframe) && children.map((child, idx) => {
                const isPinned = pinnedNames.has(child.name);
                return (
                    <div
                        key={`${child.name}-${idx}`}
                        className={`fp-item ${isPinned ? 'selected' : ''}`}
                        title={`${child.type} · ${Math.round(child.width)}×${Math.round(child.height)}`}
                    >
                        <div
                            className="fp-info"
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => onToggle(child.name)}
                        >
                            <div className="fp-name">{child.name}</div>
                            <div className="fp-meta">
                                {child.type}
                                {(child.width || child.height) ? ` · ${Math.round(child.width)}×${Math.round(child.height)}` : ''}
                            </div>
                        </div>
                        <div className="fp-item-actions">
                            <div className="fp-check" onClick={() => onToggle(child.name)}>✓</div>
                            {child.hasChildren && (
                                <button
                                    className="pp-drill-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDrillDown(child); }}
                                    title="View inner components"
                                >
                                    ▶
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

export default PinnedComponentPicker;
