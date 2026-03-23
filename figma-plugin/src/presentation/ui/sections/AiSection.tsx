import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useNotify } from '../hooks/useNotify.ts';
import { reportErrorAsync } from '../utils';
import ChatInterface from './ChatInterface.tsx';
import PrototypePanel from './PrototypePanel.tsx';
import ProjectsSection from './ProjectsSection.tsx';
import PinnedComponentPicker from '../components/shared/PinnedComponentPicker.tsx';
import { Frame, UIComponent, PluginMessage, SendMessageFn } from '../types/index.ts';
import '../styles/ModeBar.css';
import '../styles/UILibraryTab.css';

type Mode = 'create' | 'edit' | 'prototype';

interface ModeLabel {
    icon: string;
    label: string;
    tip: string;
    badge: string;
}

const MODE_LABELS: Record<Mode, ModeLabel> = {
    create: { icon: '', label: 'Create', tip: 'Generate a new design from scratch', badge: 'Create Mode' },
    edit: { icon: '', label: 'Modify', tip: 'Modify an existing frame with AI', badge: 'Edit Mode' },
    prototype: { icon: '', label: 'Prototype', tip: 'Auto-generate prototype connections', badge: 'Prototype Mode' },
};

interface AiTabProps {
    sendMessage: SendMessageFn;
    onSaveSelected: () => void;
    isSavingExport?: boolean;
}

interface SystemMessage {
    badge: string;
}

function AiSection({ sendMessage, onSaveSelected, isSavingExport }: AiTabProps): React.JSX.Element {
    const { state, dispatch } = useAppContext();
    const notify = useNotify();

    const [currentMode, setCurrentMode] = useState<Mode>('create');
    const [view, setView] = useState<'chat' | 'prototype'>('chat');

    const [selectedLayerForEdit, setSelectedLayerForEdit] = useState<string | null>(null);
    const [selectedLayerJson, setSelectedLayerJson] = useState<Record<string, unknown> | null>(null);

    const [framePickerOpen, setFramePickerOpen] = useState(false);
    const [availableFrames, setAvailableFrames] = useState<Frame[]>([]);
    const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(new Set());
    const [framesLoading, setFramesLoading] = useState(false);
    const [framesLoaded, setFramesLoaded] = useState(false);

    const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
    const [pinnedComponentNames, setPinnedComponentNames] = useState<Set<string>>(new Set());
    const [isNodeJsonLoading, setIsNodeJsonLoading] = useState(false);
    const [pinnedPickerOpen, setPinnedPickerOpen] = useState(false);
    const [pickerShallowJson, setPickerShallowJson] = useState<Record<string, unknown> | null>(null);
    const [childrenLoading, setChildrenLoading] = useState(false);

    const loadFrames = useCallback(() => {
        setFramesLoading(true);
        sendMessage('get-frames-for-prototype');
    }, [sendMessage]);

    const toggleFramePicker = useCallback(() => {
        setFramePickerOpen(prev => {
            const newVal = !prev;
            if (newVal && !framesLoaded) {
                loadFrames();
            }
            return newVal;
        });
    }, [framesLoaded, loadFrames]);

    const toggleFrameSelection = useCallback((frameId: string) => {
        if (currentMode === 'edit') {
            // Edit mode: only one frame at a time
            setSelectedFrameIds(prev => {
                if (prev.has(frameId) && prev.size === 1) return new Set();
                return new Set([frameId]);
            });
            return;
        }
        // Create mode (by-reference) and prototype: allow multiple
        setSelectedFrameIds(prev => {
            const next = new Set(prev);
            if (next.has(frameId)) {
                next.delete(frameId);
            } else {
                next.add(frameId);
            }
            return next;
        });
    }, [currentMode]);

    const selectAllFrames = useCallback(() => {
        setSelectedFrameIds(new Set(availableFrames.map(f => f.id)));
    }, [availableFrames]);

    const deselectAllFrames = useCallback(() => {
        setSelectedFrameIds(new Set());
    }, []);

    const removeFrame = useCallback((frameId: string) => {
        setSelectedFrameIds(prev => {
            const next = new Set(prev);
            next.delete(frameId);
            return next;
        });
    }, []);

    const clearSelectedFrames = useCallback(() => {
        setSelectedFrameIds(new Set());
        if (currentMode === 'edit') {
            setSelectedLayerForEdit(null);
            setSelectedLayerJson(null);
        }
    }, [currentMode]);

    const handleAttachComponent = useCallback((component: UIComponent) => {
        // Toggle: detach if already attached
        if (selectedFrameIds.has(component.id)) {
            setSelectedFrameIds(prev => { const next = new Set(prev); next.delete(component.id); return next; });
            setAvailableFrames(prev => prev.filter(f => f.id !== component.id));
            return;
        }
        const selectionCount = state.selectionInfo?.count ?? 0;
        if (selectionCount > 1) {
            notify('⚠️ Select only one layer before attaching a component', 'warning');
            return;
        }
        setAvailableFrames(prev => {
            if (prev.some(f => f.id === component.id)) return prev;
            return [...prev, { id: component.id, name: component.name, width: 0, height: 0, interactiveElements: [], designJson: component.designJson }];
        });
        setSelectedFrameIds(prev => new Set([...prev, component.id]));
    }, [state.selectionInfo, selectedFrameIds, notify]);

    const selectedFrames = [...selectedFrameIds]
        .map(id => availableFrames.find(f => f.id === id))
        .filter((f): f is Frame => f !== undefined);

    // Automatically use by-reference API when a frame is attached in create mode
    const isBasedOnExistingMode = currentMode === 'create' && selectedFrames.length > 0;

    // Reset pinned components when the reference frame changes
    const prevSelectedFrameIdsRef = React.useRef(selectedFrameIds);
    React.useEffect(() => {
        const prev = prevSelectedFrameIdsRef.current;
        if (prev !== selectedFrameIds) {
            // Compare contents, not identity — selection-changed creates new Set objects frequently
            const changed = prev.size !== selectedFrameIds.size || [...prev].some(id => !selectedFrameIds.has(id));
            if (changed) {
                setPinnedComponentNames(new Set());
                setPinnedPickerOpen(false);
                setPickerShallowJson(null);
                fetchingNodeIdRef.current = null;
            }
            prevSelectedFrameIdsRef.current = selectedFrameIds;
        }
    }, [selectedFrameIds]);

    const handleTogglePinComponent = useCallback((name: string) => {
        setPinnedComponentNames(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }, []);

    // Fetch shallow JSON on demand for the picker (first level only)
    const fetchingNodeIdRef = React.useRef<string | null>(null);

    const fetchShallowJsonIfNeeded = useCallback(() => {
        if (!isBasedOnExistingMode) return;
        const ref = selectedFrames[0];
        if (!ref) return;
        if (pickerShallowJson) return; // already loaded
        if (fetchingNodeIdRef.current === ref.id) return; // already requested
        fetchingNodeIdRef.current = ref.id;
        setIsNodeJsonLoading(true);
        sendMessage('request-node-shallow-json', { nodeId: ref.id, nodeName: ref.name });
    }, [isBasedOnExistingMode, selectedFrames, sendMessage, pickerShallowJson]);

    const handleRequestChildren = useCallback((nodeId: string) => {
        setChildrenLoading(true);
        sendMessage('request-node-children-shallow', { nodeId });
    }, [sendMessage]);

    const handleGenerateRequest = useCallback((_message: string) => {
        if (!_message) return;
        fetchShallowJsonIfNeeded();
        setPinnedPickerOpen(true);
    }, [fetchShallowJsonIfNeeded]);

    const handleStartGeneration = useCallback(() => {
        setPinnedPickerOpen(false);
        ChatInterface.triggerGeneration?.();
    }, []);

    const handleModeSwitch = useCallback((mode: Mode) => {
        if (mode === currentMode) return;

        switch (mode) {
            case 'create':
                setCurrentMode('create');
                setView('chat');
                setSelectedLayerForEdit(null);
                setSelectedLayerJson(null);
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS.create.badge }]);
                break;
            case 'edit':
                setCurrentMode('edit');
                setView('chat');
                setSelectedLayerForEdit(null);
                setSelectedLayerJson(null);
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS.edit.badge }]);
                break;
            case 'prototype':
                setCurrentMode('prototype');
                setView('chat');
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS.prototype.badge }]);
                break;
            default:
                break;
        }
    }, [currentMode]);

    const handleBackFromPrototype = useCallback(() => {
        setCurrentMode('create');
        setView('chat');
    }, []);

    AiSection.messageHandlers = {
        'selection-changed': (msg: PluginMessage) => {
            const nodes = (msg.selection as { nodes?: Array<{ id: string; name: string; width?: number; height?: number }> })?.nodes || [];
            if (nodes.length > 0) {
                const selectedNodes: Frame[] = nodes.map(node => ({
                    id: node.id,
                    name: node.name,
                    width: node.width || 0,
                    height: node.height || 0,
                    interactiveElements: [],
                }));

                setAvailableFrames(prev => {
                    const existingIds = new Set(prev.map(f => f.id));
                    const newFrames = selectedNodes.filter(n => !existingIds.has(n.id));
                    return newFrames.length > 0 ? [...prev, ...newFrames] : prev;
                });
            }

            setSelectedFrameIds(prev => {
                const libraryIds = new Set(availableFrames.filter(f => f.designJson != null).map(f => f.id));
                const preservedLibraryIds = [...prev].filter(id => libraryIds.has(id));

                if (currentMode === 'edit') {
                    return nodes.length > 0
                        ? new Set([...preservedLibraryIds, ...nodes.map(n => n.id)])
                        : new Set(preservedLibraryIds);
                }

                // In create/prototype flows, keep previously attached canvas references
                // so each new click adds another reference instead of replacing older ones.
                if (nodes.length === 0) {
                    return prev;
                }

                return new Set([...prev, ...nodes.map(n => n.id)]);
            });
        },

        'layer-selected-for-edit': (msg: PluginMessage) => {
            setCurrentMode('edit');
            setSelectedLayerForEdit(msg.layerName as string);
            setSelectedLayerJson(msg.layerJson as Record<string, unknown>);
            setView('chat');
            setSystemMessages(prev => [...prev, { badge: MODE_LABELS.edit.badge }]);
        },

        'no-layer-selected': () => {
            notify('⚠️ Please select a layer to edit', 'warning');
        },

        'layer-selected-for-reference': (msg: PluginMessage) => {
            const layerId = msg.layerId as string;
            const layerName = msg.layerName as string;
            const layerJson = msg.layerJson;
            setIsNodeJsonLoading(false);
            fetchingNodeIdRef.current = null;
            setAvailableFrames(prev => {
                if (prev.some(f => f.id === layerId)) {
                    return prev.map(f => f.id === layerId ? { ...f, designJson: layerJson } : f);
                }
                return [...prev, { id: layerId, name: layerName, width: 0, height: 0, interactiveElements: [], designJson: layerJson }];
            });
            setSelectedFrameIds(prev => new Set([...prev, layerId]));
            setCurrentMode('create');
            setView('chat');
            setSystemMessages(prev => [...prev, { badge: 'Reference Added' }]);
        },

        'node-shallow-json': (msg: PluginMessage) => {
            setIsNodeJsonLoading(false);
            fetchingNodeIdRef.current = null;
            setPickerShallowJson(msg.shallowJson as Record<string, unknown>);
        },

        'node-children-shallow': (msg: PluginMessage) => {
            setChildrenLoading(false);
            const parentNodeId = msg.parentNodeId as string;
            const children = msg.children as Array<Record<string, unknown>>;
            // Build a synthetic node for the picker to drill into
            setPickerShallowJson(prev => {
                if (!prev) return prev;
                // Find and update the child node in the shallow tree to include its children
                const updateChildren = (node: Record<string, unknown>): Record<string, unknown> => {
                    if ((node as any)._nodeId === parentNodeId) {
                        return { ...node, children };
                    }
                    if (Array.isArray(node.children)) {
                        return {
                            ...node,
                            children: (node.children as Array<Record<string, unknown>>).map(updateChildren),
                        };
                    }
                    return node;
                };
                return updateChildren(prev) as Record<string, unknown>;
            });
        },

        'ai-chat-response': (msg: PluginMessage) => ChatInterface.handleResponse?.(msg),
        'ai-edit-response': (msg: PluginMessage) => ChatInterface.handleResponse?.(msg),
        'ai-based-on-existing-response': (msg: PluginMessage) => ChatInterface.handleResponse?.(msg),
        'ai-chat-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error as string), { actionType: msg.type });
        },
        'ai-edit-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error as string), { actionType: msg.type });
        },
        'ai-based-on-existing-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error as string), { actionType: 'ai-based-on-existing-error' });
        },

        'design-updated': (msg: PluginMessage) => {
            setSelectedLayerJson(msg.layerJson as Record<string, unknown>);
        },

        'frames-loaded': (msg: PluginMessage) => {
            setAvailableFrames((msg.frames as Frame[]) || []);
            setFramesLoading(false);
            setFramesLoaded(true);
            PrototypePanel.handleFramesLoaded?.(msg);
        },
        'frames-load-error': (msg: PluginMessage) => {
            setFramesLoading(false);
            setFramesLoaded(true);
            PrototypePanel.handleFramesError?.(msg);
        },
        'prototype-connections-generated': (msg: PluginMessage) => ChatInterface.handlePrototypeResponse?.(msg),
        'prototype-connections-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            const errorText = `${msg.error || ''}`.toLowerCase();
            if (msg.statusCode === 402 || errorText.includes('insufficient') || errorText.includes('purchase credits')) {
                dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
            }
        },
        'prototype-applied': () => { },
        'prototype-apply-error': (msg: PluginMessage) => {
            notify(`❌ ${msg.error as string}`, 'error');
            reportErrorAsync(new Error(msg.error as string), { actionType: 'apply-error' });
        },
    };

    return (
        <div id="ai-tab" className="tab-content active" style={{ position: 'relative' }}>
            {/* Projects (UI Library) — collapsible panel */}
            <ProjectsSection sendMessage={sendMessage} onSaveSelected={onSaveSelected} isSavingExport={isSavingExport} onAttachComponent={handleAttachComponent} attachedComponentIds={selectedFrameIds} />

            {/* Mode Bar */}
            <div className="mode-bar">
                {(Object.entries(MODE_LABELS) as Array<[Mode, ModeLabel]>).map(([mode, { icon, label, tip }]) => (
                    <button
                        key={mode}
                        className={`mode-btn ${currentMode === mode ? 'active' : ''}`}
                        onClick={() => handleModeSwitch(mode)}
                    >
                        <span className="mode-icon">{icon}</span>
                        <span className="mode-label">{label}</span>
                        <span className="mode-tip">{tip}</span>
                    </button>
                ))}
            </div>

            {/* Chat View */}
            {view === 'chat' && (
                <ChatInterface
                    currentMode={currentMode}
                    isBasedOnExistingMode={isBasedOnExistingMode}
                    selectedLayerForEdit={selectedLayerForEdit}
                    selectedLayerJson={selectedLayerJson}
                    onBack={null}
                    sendMessage={sendMessage}
                    selectedFrames={selectedFrames}
                    onRemoveFrame={removeFrame}
                    onClearFrames={clearSelectedFrames}
                    onToggleFramePicker={toggleFramePicker}
                    framePickerOpen={framePickerOpen}
                    systemMessages={systemMessages}
                    pinnedComponentNames={pinnedComponentNames}
                    isNodeJsonLoading={isNodeJsonLoading}
                    onRequestGenerate={handleGenerateRequest}
                />
            )}

            {/* Prototype View */}
            {view === 'prototype' && (
                <PrototypePanel
                    onBack={handleBackFromPrototype}
                    sendMessage={sendMessage}
                />
            )}

            {/* Pinned Component Picker Overlay */}
            {isBasedOnExistingMode && (
                <div className={`frame-picker-overlay ${pinnedPickerOpen ? 'show' : ''}`}>
                    <div className="fp-backdrop" onClick={() => setPinnedPickerOpen(false)} />
                    <div className="fp-panel fp-panel--pinned">
                        <div className="fp-header">
                            <div className="fp-title">
                                Select the parts you want to keep the same
                                {pinnedComponentNames.size > 0 && (
                                    <span className="pinned-picker-badge">{pinnedComponentNames.size}</span>
                                )}
                            </div>
                            <div className="fp-actions">
                                <button className="fp-close" onClick={() => setPinnedPickerOpen(false)}>✕</button>
                            </div>
                        </div>
                        <div className="fp-list">
                            {isNodeJsonLoading || !pickerShallowJson ? (
                                <div className="fp-loading">
                                    <div className="loading-spinner" />
                                    <span>Loading components...</span>
                                </div>
                            ) : (
                                <PinnedComponentPicker
                                    referenceDesignJson={pickerShallowJson}
                                    pinnedNames={pinnedComponentNames}
                                    onToggle={handleTogglePinComponent}
                                    onRequestChildren={handleRequestChildren}
                                    childrenLoading={childrenLoading}
                                />
                            )}
                        </div>
                        <div className="fp-footer">
                            <button
                                className="btn-primary fp-start-btn"
                                onClick={handleStartGeneration}
                                disabled={isNodeJsonLoading}
                            >
                                Start Generation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Frame Picker Overlay */}
            <div className={`frame-picker-overlay ${framePickerOpen ? 'show' : ''}`}>
                <div className="fp-backdrop" onClick={toggleFramePicker} />
                <div className="fp-panel">
                    <div className="fp-header">
                        <div className="fp-title">
                            <span className="fp-title-icon"></span> Select Frames {availableFrames?.length ? `- ${availableFrames.length} available` : ""}
                        </div>
                        <div className="fp-actions">
                            {currentMode === 'prototype' && (
                                <>
                                    <button className="fp-action-btn" onClick={selectAllFrames}>All</button>
                                    <button className="fp-action-btn" onClick={deselectAllFrames}>None</button>
                                </>
                            )}
                            <button className="fp-action-btn" onClick={loadFrames}>🔄</button>
                            <button className="fp-close" onClick={toggleFramePicker}>✕</button>
                        </div>
                    </div>
                    <div className="fp-list">
                        {framesLoading ? (
                            <div className="fp-loading">
                                <div className="loading-spinner" />
                                <span>Loading frames...</span>
                            </div>
                        ) : availableFrames.length === 0 ? (
                            <div className="fp-empty">No frames found in this file</div>
                        ) : (
                            availableFrames.map((frame) => (
                                <div
                                    key={frame.id}
                                    className={`fp-item ${selectedFrameIds.has(frame.id) ? 'selected' : ''}`}
                                    onClick={() => toggleFrameSelection(frame.id)}
                                >
                                    <div className="fp-thumb">
                                        <div className="fp-mini">
                                            <div className="fm f1" />
                                            <div className="fm f2" />
                                            <div className="fm f3" />
                                            <div className="fm f4" />
                                            <div className="fm f5" />
                                        </div>
                                    </div>
                                    <div className="fp-info">
                                        <div className="fp-name">{frame.name}</div>
                                        <div className="fp-meta">
                                            {Math.round(frame.width)}×{Math.round(frame.height)} · {frame.interactiveElements?.length || 0} interactive
                                        </div>
                                    </div>
                                    <div className="fp-check">✓</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

namespace AiSection {
    export let messageHandlers: Record<string, (msg: PluginMessage) => void> | undefined;
}

export default AiSection;
