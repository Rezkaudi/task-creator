import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { escapeHtml } from '../../utils.js';
import { reportErrorAsync } from '../../errorReporter.js';
import '../../styles/PrototypePanel.css';
import { defaultModel } from '../../../../shared/constants/plugin-config.js';

export default function PrototypePanel({ onBack, sendMessage }) {
    const { state, dispatch, showStatus, hideStatus } = useAppContext();
    const { currentModelId, availableModels } = state;

    const [prototypeFrames, setPrototypeFrames] = useState([]);
    const [selectedFrameIds, setSelectedFrameIds] = useState(new Set());
    const [generatedConnections, setGeneratedConnections] = useState([]);
    const [isGeneratingConnections, setIsGeneratingConnections] = useState(false);
    const [showConnectionsPreview, setShowConnectionsPreview] = useState(false);
    const [reasoning, setReasoning] = useState(null);
    const [cost, setCost] = useState(null);
    const [isApplying, setIsApplying] = useState(false);

    const loadFramesForPrototype = useCallback(() => {
        sendMessage('get-frames-for-prototype');
    }, [sendMessage]);

    // Load frames on mount
    useEffect(() => {
        loadFramesForPrototype();
    }, [loadFramesForPrototype]);

    const toggleFrame = useCallback((frameId) => {
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

    const selectAll = useCallback(() => {
        setSelectedFrameIds(new Set(prototypeFrames.map(f => f.id)));
    }, [prototypeFrames]);

    const deselectAll = useCallback(() => {
        setSelectedFrameIds(new Set());
    }, []);

    const generateConnections = useCallback(() => {
        if (selectedFrameIds.size < 2) {
            showStatus('⚠️ Please select at least 2 frames', 'warning');
            return;
        }

        setIsGeneratingConnections(true);
        setShowConnectionsPreview(false);

        const selectedFrames = prototypeFrames.filter(f => selectedFrameIds.has(f.id));
        sendMessage('generate-prototype-connections', {
            frames: selectedFrames,
            modelId: currentModelId
        });
    }, [selectedFrameIds, prototypeFrames, currentModelId, sendMessage, showStatus]);

    const applyConnections = useCallback(() => {
        if (generatedConnections.length === 0) {
            showStatus('⚠️ No connections to apply', 'warning');
            return;
        }

        setIsApplying(true);
        sendMessage('apply-prototype-connections', {
            connections: generatedConnections
        });
    }, [generatedConnections, sendMessage, showStatus]);

    const removeConnection = useCallback((index) => {
        setGeneratedConnections(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    // Handler methods for parent to call
    PrototypePanel.handleFramesLoaded = (msg) => {
        setPrototypeFrames(msg.frames || []);
    };

    PrototypePanel.handleFramesError = (msg) => {
        setPrototypeFrames([]);
        reportErrorAsync(new Error(msg.error), {
            componentName: 'PrototypeMode',
            actionType: 'frames-load-error'
        });
    };

    PrototypePanel.handleConnectionsGenerated = (msg) => {
        setIsGeneratingConnections(false);
        setGeneratedConnections(msg.connections || []);
        setShowConnectionsPreview(true);
        setReasoning(msg.reasoning || null);
        setCost(msg.cost || null);
        if (msg.points) {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: msg.points.remaining || 0 });
            if (msg.points.subscription) {
                dispatch({ type: 'SET_SUBSCRIPTION', subscription: msg.points.subscription });
            }
            if (typeof msg.points.hasPurchased === 'boolean') {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: msg.points.hasPurchased });
            }
        }
        showStatus(`✅ Generated ${(msg.connections || []).length} connections`, 'success');
        setTimeout(hideStatus, 3000);
    };

    PrototypePanel.handleConnectionsError = (msg) => {
        setIsGeneratingConnections(false);
        showStatus(`❌ ${msg.error}`, 'error');
        reportErrorAsync(new Error(msg.error), {
            componentName: 'PrototypeMode',
            actionType: 'prototype-connections-error'
        });
    };

    PrototypePanel.handlePrototypeApplied = (msg) => {
        setIsApplying(false);
        showStatus(`✅ Applied ${msg.appliedCount} prototype connections!`, 'success');
        setTimeout(() => {
            onBack();
            hideStatus();
        }, 2000);
    };

    PrototypePanel.handlePrototypeApplyError = (msg) => {
        setIsApplying(false);
        showStatus(`❌ ${msg.error}`, 'error');
        reportErrorAsync(new Error(msg.error), {
            componentName: 'PrototypeMode',
            actionType: 'prototype-apply-error'
        });
    };

    const count = selectedFrameIds.size;
    const selectedModel = availableModels.find(m => m.id === currentModelId);

    return (
        <div id="prototype-panel" style={{ display: 'block' }}>
            <div id="prototype-header">
                <button className="back-btn" onClick={onBack}>← Back to Mode Selection</button>
                <div className="prototype-mode-info">
                    <span className="prototype-mode-label">🔗 Prototype Mode</span>
                    <span className="selected-layer-name">{count} frame{count !== 1 ? 's' : ''} selected</span>
                </div>
            </div>

            {/* Frame Selection */}
            <div id="frame-selection-panel">
                <div className="frame-selection-header">
                    <h3>📋 Select Frames</h3>
                    <button className="btn-secondary btn-small" onClick={loadFramesForPrototype}>🔄 Refresh</button>
                </div>

                <div className="frames-list">
                    {prototypeFrames.length === 0 ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <span>Loading frames...</span>
                        </div>
                    ) : (
                        prototypeFrames.map(frame => (
                            <div
                                key={frame.id}
                                className={`frame-item ${selectedFrameIds.has(frame.id) ? 'selected' : ''}`}
                                onClick={() => toggleFrame(frame.id)}
                            >
                                <label className="frame-checkbox" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFrameIds.has(frame.id)}
                                        onChange={() => toggleFrame(frame.id)}
                                    />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="frame-info">
                                    <div className="frame-name">{escapeHtml(frame.name)}</div>
                                    <div className="frame-details">
                                        <span className="frame-size">{Math.round(frame.width)}×{Math.round(frame.height)}</span>
                                        <span className="frame-elements">{frame.interactiveElements.length} interactive elements</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="frame-selection-actions">
                    <button className="btn-secondary btn-small" onClick={selectAll}>Select All</button>
                    <button className="btn-secondary btn-small" onClick={deselectAll}>Deselect All</button>
                </div>
            </div>

            {/* Generate Section */}
            <div className="prototype-generate-section">
                <div
                    className="model-floating-btn"
                    onClick={() => dispatch({ type: 'OPEN_MODEL_PANEL' })}
                >
                    <div className="model-btn-icon">🤖</div>
                    <span className="model-btn-text">{selectedModel?.name || defaultModel.name}</span>
                </div>
                <button
                    className="btn-primary"
                    onClick={generateConnections}
                    disabled={count < 2 || isGeneratingConnections}
                    title={count < 2 ? 'Select at least 2 frames' : ''}
                >
                    {isGeneratingConnections
                        ? <><span className="loading"></span> Generating...</>
                        : '🤖 Generate Connections with AI'
                    }
                </button>
            </div>

            {/* Connections Preview */}
            {showConnectionsPreview && (
                <div id="connections-preview" style={{ display: 'block' }}>
                    <div className="connections-header">
                        <h3>🔗 Generated Connections</h3>
                        <span className="connections-count">
                            {generatedConnections.length} connection{generatedConnections.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {reasoning && (
                        <div className="connections-reasoning">
                            <strong>AI Reasoning:</strong> {escapeHtml(reasoning)}
                        </div>
                    )}

                    <div className="connections-list">
                        {generatedConnections.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔗</div>
                                <div className="empty-state-text">No connections generated</div>
                            </div>
                        ) : (
                            generatedConnections.map((conn, index) => (
                                <div key={index} className="connection-item">
                                    <div className="connection-flow">
                                        <span className="connection-source">{escapeHtml(conn.sourceNodeName)}</span>
                                        <span className="connection-arrow">→</span>
                                        <span className="connection-target">{escapeHtml(conn.targetFrameName)}</span>
                                    </div>
                                    <div className="connection-details">
                                        <span className="connection-trigger">{conn.trigger.replace('_', ' ')}</span>
                                        <span className="connection-animation">{conn.animation.type.replace('_', ' ')}</span>
                                    </div>
                                    {conn.reasoning && (
                                        <div className="connection-reasoning">{escapeHtml(conn.reasoning)}</div>
                                    )}
                                    <button
                                        className="connection-remove"
                                        title="Remove this connection"
                                        onClick={(e) => { e.stopPropagation(); removeConnection(index); }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {cost && (
                        <div className="cost-breakdown" style={{ display: 'block' }}>
                            <div className="cost-header">💰 Cost</div>
                            <div className="cost-row">
                                <span className="cost-label">Total:</span>
                                <span className="cost-value">{cost.totalCost}</span>
                            </div>
                        </div>
                    )}

                    <div className="connections-actions">
                        <button
                            className="btn-success"
                            onClick={applyConnections}
                            disabled={generatedConnections.length === 0 || isApplying}
                        >
                            {isApplying ? <><span className="loading"></span> Applying...</> : '✅ Apply Prototype'}
                        </button>
                        <button className="btn-secondary" onClick={generateConnections}>
                            🔄 Regenerate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
