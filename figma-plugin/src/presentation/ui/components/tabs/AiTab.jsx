import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { reportErrorAsync } from '../../errorReporter.js';
import ChatInterface from './ChatInterface.jsx';
import PrototypePanel from './PrototypePanel.jsx';
import '../../styles/ModeBar.css';

const MODE_LABELS = {
    edit: { icon: '✏️', label: 'Edit', tip: 'Modify an existing frame with AI', badge: '✏️ Edit Mode' },
    'based-on-existing': { icon: '🎨', label: 'By Reference', tip: 'Create new design using existing style', badge: '🎨 By Reference Mode' },
    prototype: { icon: '🔗', label: 'Prototype', tip: 'Auto-generate prototype connections', badge: '🔗 Prototype Mode' },
};

export default function AiTab({ sendMessage }) {
    const { dispatch, showStatus, hideStatus } = useAppContext();

    // Current mode: 'create' is default, others selectable via mode bar
    const [currentMode, setCurrentMode] = useState('create');
    // View: 'chat' for create/edit/based-on-existing, 'prototype' for prototype
    const [view, setView] = useState('chat');
    const [isBasedOnExistingMode, setIsBasedOnExistingMode] = useState(false);

    // Edit mode state
    const [selectedLayerForEdit, setSelectedLayerForEdit] = useState(null);
    const [selectedLayerJson, setSelectedLayerJson] = useState(null);

    // Based on existing mode state
    const [referenceLayerName, setReferenceLayerName] = useState('');
    const [referenceDesignJson, setReferenceDesignJson] = useState(null);

    // Frame picker state (reuse logic from PrototypePanel)
    const [framePickerOpen, setFramePickerOpen] = useState(false);
    const [availableFrames, setAvailableFrames] = useState([]);
    const [selectedFrameIds, setSelectedFrameIds] = useState(new Set());
    const [framesLoading, setFramesLoading] = useState(false);
    const [framesLoaded, setFramesLoaded] = useState(false);

    // System messages for mode switching
    const [systemMessages, setSystemMessages] = useState([]);

    const chatRef = useRef(null);

    // Load frames on first frame picker open
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

    const toggleFrameSelection = useCallback((frameId) => {
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

    const removeFrame = useCallback((frameId) => {
        setSelectedFrameIds(prev => {
            const next = new Set(prev);
            next.delete(frameId);
            return next;
        });
    }, []);

    // Get selected frame objects
    const selectedFrames = availableFrames.filter(f => selectedFrameIds.has(f.id));

    // Mode switching handler
    const handleModeSwitch = useCallback((mode) => {
        if (mode === currentMode) return;

        switch (mode) {
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

    // Back to create mode from prototype
    const handleBackFromPrototype = useCallback(() => {
        setCurrentMode('create');
        setIsBasedOnExistingMode(false);
        setView('chat');
    }, []);

    // Plugin message handlers for this tab
    AiTab.messageHandlers = {
        'layer-selected-for-edit': (msg) => {
            setCurrentMode('edit');
            setSelectedLayerForEdit(msg.layerName);
            setSelectedLayerJson(msg.layerJson);
            setIsBasedOnExistingMode(false);
            setView('chat');
            setSystemMessages(prev => [...prev, { badge: MODE_LABELS.edit.badge }]);
            hideStatus();
        },

        'no-layer-selected': () => {
            showStatus('⚠️ Please select a layer to edit', 'warning');
            setTimeout(hideStatus, 3000);
        },

        'layer-selected-for-reference': (msg) => {
            setReferenceDesignJson(msg.layerJson);
            setReferenceLayerName(msg.layerName);
            setIsBasedOnExistingMode(true);
            setCurrentMode('based-on-existing');
            setView('chat');
            setSystemMessages(prev => [...prev, { badge: MODE_LABELS['based-on-existing'].badge }]);
            setTimeout(hideStatus, 2000);
        },

        'ai-chat-response': (msg) => ChatInterface.handleResponse?.(msg),
        'ai-edit-response': (msg) => ChatInterface.handleResponse?.(msg),
        'ai-based-on-existing-response': (msg) => ChatInterface.handleResponse?.(msg),
        'ai-chat-error': (msg) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error), { componentName: 'AIChat', actionType: msg.type });
        },
        'ai-edit-error': (msg) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error), { componentName: 'AIChat', actionType: msg.type });
        },
        'ai-based-on-existing-error': (msg) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error), { componentName: 'BasedOnExisting', actionType: 'ai-based-on-existing-error' });
        },

        'design-updated': (msg) => {
            setSelectedLayerJson(msg.layerJson);
            showStatus('✅ Design updated! You can continue editing.', 'success');
            setTimeout(hideStatus, 2000);
        },

        // Frame loading handlers (reused from PrototypePanel logic)
        'frames-loaded': (msg) => {
            setAvailableFrames(msg.frames || []);
            setFramesLoading(false);
            setFramesLoaded(true);
            // Also forward to PrototypePanel if in prototype view
            PrototypePanel.handleFramesLoaded?.(msg);
        },
        'frames-load-error': (msg) => {
            setFramesLoading(false);
            setFramesLoaded(true);
            PrototypePanel.handleFramesError?.(msg);
        },
        'prototype-connections-generated': (msg) => ChatInterface.handlePrototypeResponse?.(msg),
        'prototype-connections-error': (msg) => {
            ChatInterface.handleError?.(msg);
            const errorText = `${msg.error || ''}`.toLowerCase();
            if (msg.statusCode === 402 || errorText.includes('insufficient') || errorText.includes('purchase points')) {
                dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
            }
        },
        'prototype-applied': (msg) => {
            // Just show status for now, maybe add chat message later
            showStatus(`✅ Applied ${msg.appliedCount} prototype connections!`, 'success');
            setTimeout(hideStatus, 3000);
        },
        'prototype-apply-error': (msg) => {
            showStatus(`❌ ${msg.error}`, 'error');
            reportErrorAsync(new Error(msg.error), { componentName: 'Prototype', actionType: 'apply-error' });
        },
    };

    return (
        <div id="ai-tab" className="tab-content active" style={{ position: 'relative' }}>
            {/* Mode Bar */}
            <div className="mode-bar">
                {Object.entries(MODE_LABELS).map(([mode, { icon, label, tip }]) => (
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
                    // New props for frame picker + chips
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
                            <span className="fp-title-icon">📐</span> Select Frames
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
                            availableFrames.map((frame, idx) => (
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
