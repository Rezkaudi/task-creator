import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { reportErrorAsync } from '../../errorReporter.ts';
import ChatInterface from './ChatInterface.tsx';
import PrototypePanel from './PrototypePanel.tsx';
import ProjectsSection from './ProjectsSection.tsx';
import { Frame, PluginMessage, SendMessageFn } from '../../types/index.ts';
import '../../styles/ModeBar.css';
import '../../styles/UILibraryTab.css';

type Mode = 'create' | 'edit' | 'based-on-existing' | 'prototype';

interface ModeLabel {
    icon: string;
    label: string;
    tip: string;
    badge: string;
}

const MODE_LABELS: Record<Mode, ModeLabel> = {
    create: { icon: '✨', label: 'Create', tip: 'Generate a new design from scratch', badge: '✨ Create Mode' },
    edit: { icon: '✏️', label: 'Modify', tip: 'Modify an existing frame with AI', badge: '✏️ Edit Mode' },
    'based-on-existing': { icon: '🎨', label: 'By Reference', tip: 'Create new design using existing style', badge: '🎨 By Reference Mode' },
    prototype: { icon: '🔗', label: 'Prototype', tip: 'Auto-generate prototype connections', badge: '🔗 Prototype Mode' },
};

interface AiTabProps {
    sendMessage: SendMessageFn;
    onSaveSelected: () => void;
}

interface SystemMessage {
    badge: string;
}

function AiTab({ sendMessage, onSaveSelected }: AiTabProps): React.JSX.Element {
    const { dispatch, showStatus, hideStatus } = useAppContext();

    const [currentMode, setCurrentMode] = useState<Mode>('create');
    const [view, setView] = useState<'chat' | 'prototype'>('chat');
    const [isBasedOnExistingMode, setIsBasedOnExistingMode] = useState(false);

    const [selectedLayerForEdit, setSelectedLayerForEdit] = useState<string | null>(null);
    const [selectedLayerJson, setSelectedLayerJson] = useState<Record<string, unknown> | null>(null);

    const [referenceLayerName, setReferenceLayerName] = useState('');
    const [referenceDesignJson, setReferenceDesignJson] = useState<unknown>(null);

    const [framePickerOpen, setFramePickerOpen] = useState(false);
    const [availableFrames, setAvailableFrames] = useState<Frame[]>([]);
    const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(new Set());
    const [framesLoading, setFramesLoading] = useState(false);
    const [framesLoaded, setFramesLoaded] = useState(false);

    const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);

    const chatRef = useRef(null);

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
        setSelectedFrameIds(prev => {
            const next = new Set(prev);
            if (next.has(frameId)) {
                next.delete(frameId);
            } else {
                next.add(frameId);
            }
            return next;
        });
    }, []);

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

    const selectedFrames = availableFrames.filter(f => selectedFrameIds.has(f.id));

    const handleModeSwitch = useCallback((mode: Mode) => {
        if (mode === currentMode) return;

        switch (mode) {
            case 'create':
                setCurrentMode('create');
                setView('chat');
                setIsBasedOnExistingMode(false);
                setSelectedLayerForEdit(null);
                setSelectedLayerJson(null);
                setReferenceDesignJson(null);
                setReferenceLayerName('');
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS.create.badge }]);
                break;
            case 'edit':
                setCurrentMode('edit');
                setView('chat');
                setIsBasedOnExistingMode(false);
                setSelectedLayerForEdit(null);
                setSelectedLayerJson(null);
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS.edit.badge }]);
                break;
            case 'based-on-existing':
                setIsBasedOnExistingMode(true);
                setCurrentMode('based-on-existing');
                setView('chat');
                setReferenceDesignJson(null);
                setReferenceLayerName('');
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS['based-on-existing'].badge }]);
                break;
            case 'prototype':
                setCurrentMode('prototype');
                setIsBasedOnExistingMode(false);
                setView('chat');
                setSystemMessages(prev => [...prev, { badge: MODE_LABELS.prototype.badge }]);
                break;
            default:
                break;
        }
    }, [currentMode, sendMessage, showStatus]);

    const handleBackFromPrototype = useCallback(() => {
        setCurrentMode('create');
        setIsBasedOnExistingMode(false);
        setView('chat');
    }, []);

    AiTab.messageHandlers = {
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

                setSelectedFrameIds(new Set(nodes.map(n => n.id)));
            } else {
                setSelectedFrameIds(new Set());
            }
        },

        'layer-selected-for-edit': (msg: PluginMessage) => {
            setCurrentMode('edit');
            setSelectedLayerForEdit(msg.layerName as string);
            setSelectedLayerJson(msg.layerJson as Record<string, unknown>);
            setIsBasedOnExistingMode(false);
            setView('chat');
            setSystemMessages(prev => [...prev, { badge: MODE_LABELS.edit.badge }]);
            hideStatus();
        },

        'no-layer-selected': () => {
            showStatus('⚠️ Please select a layer to edit', 'warning');
            setTimeout(hideStatus, 3000);
        },

        'layer-selected-for-reference': (msg: PluginMessage) => {
            setReferenceDesignJson(msg.layerJson);
            setReferenceLayerName(msg.layerName as string);
            setIsBasedOnExistingMode(true);
            setCurrentMode('based-on-existing');
            setView('chat');
            setSystemMessages(prev => [...prev, { badge: MODE_LABELS['based-on-existing'].badge }]);
            setTimeout(hideStatus, 2000);
        },

        'ai-chat-response': (msg: PluginMessage) => ChatInterface.handleResponse?.(msg),
        'ai-edit-response': (msg: PluginMessage) => ChatInterface.handleResponse?.(msg),
        'ai-based-on-existing-response': (msg: PluginMessage) => ChatInterface.handleResponse?.(msg),
        'ai-chat-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error as string), { componentName: 'AIChat', actionType: msg.type });
        },
        'ai-edit-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error as string), { componentName: 'AIChat', actionType: msg.type });
        },
        'ai-based-on-existing-error': (msg: PluginMessage) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error as string), { componentName: 'BasedOnExisting', actionType: 'ai-based-on-existing-error' });
        },

        'design-updated': (msg: PluginMessage) => {
            setSelectedLayerJson(msg.layerJson as Record<string, unknown>);
            setTimeout(hideStatus, 2000);
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
            if (msg.statusCode === 402 || errorText.includes('insufficient') || errorText.includes('purchase points')) {
                dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
            }
        },
        'prototype-applied': () => {
            setTimeout(hideStatus, 3000);
        },
        'prototype-apply-error': (msg: PluginMessage) => {
            showStatus(`❌ ${msg.error as string}`, 'error');
            reportErrorAsync(new Error(msg.error as string), { componentName: 'Prototype', actionType: 'apply-error' });
        },
    };

    return (
        <div id="ai-tab" className="tab-content active" style={{ position: 'relative' }}>
            {/* Projects (UI Library) — collapsible panel */}
            <ProjectsSection sendMessage={sendMessage} onSaveSelected={onSaveSelected} />

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
                    referenceLayerName={referenceLayerName}
                    referenceDesignJson={referenceDesignJson}
                    onBack={null}
                    sendMessage={sendMessage}
                    selectedFrames={selectedFrames}
                    onRemoveFrame={removeFrame}
                    onToggleFramePicker={toggleFramePicker}
                    framePickerOpen={framePickerOpen}
                    systemMessages={systemMessages}
                />
            )}

            {/* Prototype View */}
            {view === 'prototype' && (
                <PrototypePanel
                    onBack={handleBackFromPrototype}
                    sendMessage={sendMessage}
                />
            )}

            {/* Frame Picker Overlay */}
            <div className={`frame-picker-overlay ${framePickerOpen ? 'show' : ''}`}>
                <div className="fp-backdrop" onClick={toggleFramePicker} />
                <div className="fp-panel">
                    <div className="fp-header">
                        <div className="fp-title">
                            <span className="fp-title-icon">📐</span> Select Frames {availableFrames?.length ? `- ${availableFrames.length} available` : ""}
                        </div>
                        <div className="fp-actions">
                            <button className="fp-action-btn" onClick={selectAllFrames}>All</button>
                            <button className="fp-action-btn" onClick={deselectAllFrames}>None</button>
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

namespace AiTab {
    export let messageHandlers: Record<string, (msg: PluginMessage) => void> | undefined;
}

export default AiTab;
