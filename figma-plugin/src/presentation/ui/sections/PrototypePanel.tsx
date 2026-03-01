import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { escapeHtml } from '../utils/formatters';
import { reportErrorAsync } from '../utils';
import { Frame, PrototypeConnection, PluginMessage, SendMessageFn, Subscription } from '../types/index.ts';
import '../styles/PrototypePanel.css';
import { defaultModel } from '../../../shared/constants/plugin-config.js';

interface CostDisplay {
    totalCost: string;
}

interface PrototypePanelProps {
    onBack: () => void;
    sendMessage: SendMessageFn;
}

function PrototypePanel({ onBack, sendMessage }: PrototypePanelProps): React.JSX.Element {
    const { state, dispatch, showStatus, hideStatus } = useAppContext();
    const { currentModelId, availableModels } = state;
    const { updateSubscription, updatePointsBalance } = useAuth();

    const [prototypeFrames, setPrototypeFrames] = useState<Frame[]>([]);
    const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(new Set());
    const [generatedConnections, setGeneratedConnections] = useState<PrototypeConnection[]>([]);
    const [isGeneratingConnections, setIsGeneratingConnections] = useState(false);
    const [showConnectionsPreview, setShowConnectionsPreview] = useState(false);
    const [reasoning, setReasoning] = useState<string | null>(null);
    const [cost, setCost] = useState<CostDisplay | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const updateSubscriptionRef = useRef(updateSubscription);
    const updatePointsBalanceRef = useRef(updatePointsBalance);

    useEffect(() => {
        updateSubscriptionRef.current = updateSubscription;
        updatePointsBalanceRef.current = updatePointsBalance;
    }, [updateSubscription, updatePointsBalance]);

    const loadFramesForPrototype = useCallback(() => {
        sendMessage('get-frames-for-prototype');
    }, [sendMessage]);

    useEffect(() => {
        loadFramesForPrototype();
    }, [loadFramesForPrototype]);

    const toggleFrame = useCallback((frameId: string) => {
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
            frames: selectedFrames as unknown as Record<string, unknown>[],
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
            connections: generatedConnections as unknown as Record<string, unknown>[]
        });
    }, [generatedConnections, sendMessage, showStatus]);

    const removeConnection = useCallback((index: number) => {
        setGeneratedConnections(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    PrototypePanel.handleFramesLoaded = (msg: PluginMessage) => {
        setPrototypeFrames((msg.frames as Frame[]) || []);
    };

    PrototypePanel.handleFramesError = (msg: PluginMessage) => {
        setPrototypeFrames([]);
        reportErrorAsync(new Error(msg.error as string), {
            componentName: 'PrototypeMode',
            actionType: 'frames-load-error'
        });
    };

    PrototypePanel.handleConnectionsGenerated = (msg: PluginMessage) => {
        setIsGeneratingConnections(false);
        setGeneratedConnections((msg.connections as PrototypeConnection[]) || []);
        setShowConnectionsPreview(true);
        setReasoning((msg.reasoning as string) || null);
        setCost((msg.cost as CostDisplay) || null);
        const points = msg.points as { remaining?: number; subscription?: Subscription; hasPurchased?: boolean } | undefined;
        if (points) {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: points.remaining || 0 });
            if (points.subscription) {
                dispatch({ type: 'SET_SUBSCRIPTION', subscription: points.subscription });
                updateSubscriptionRef.current(points.subscription);
            }
            if (typeof points.hasPurchased === 'boolean') {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: points.hasPurchased });
                updatePointsBalanceRef.current(points.remaining || 0, points.hasPurchased);
            }
        }
        setTimeout(hideStatus, 3000);
    };

    PrototypePanel.handleConnectionsError = (msg: PluginMessage) => {
        setIsGeneratingConnections(false);
        showStatus(`❌ ${msg.error as string}`, 'error');
        reportErrorAsync(new Error(msg.error as string), {
            componentName: 'PrototypeMode',
            actionType: 'prototype-connections-error'
        });
    };

    PrototypePanel.handlePrototypeApplied = (msg: PluginMessage) => {
        setIsApplying(false);
        showStatus(`✅ Applied ${msg.appliedCount as number} prototype connections!`, 'success');
        setTimeout(() => {
            onBack();
            hideStatus();
        }, 2000);
    };

    PrototypePanel.handlePrototypeApplyError = (msg: PluginMessage) => {
        setIsApplying(false);
        showStatus(`❌ ${msg.error as string}`, 'error');
        reportErrorAsync(new Error(msg.error as string), {
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
                                        <span className="frame-elements">{(frame.interactiveElements ?? []).length} interactive elements</span>
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
                    <div className="model-btn-icon"></div>
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
                        : 'Generate Connections with AI'
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

namespace PrototypePanel {
    export let handleFramesLoaded: ((msg: PluginMessage) => void) | undefined;
    export let handleFramesError: ((msg: PluginMessage) => void) | undefined;
    export let handleConnectionsGenerated: ((msg: PluginMessage) => void) | undefined;
    export let handleConnectionsError: ((msg: PluginMessage) => void) | undefined;
    export let handlePrototypeApplied: ((msg: PluginMessage) => void) | undefined;
    export let handlePrototypeApplyError: ((msg: PluginMessage) => void) | undefined;
}

export default PrototypePanel;
