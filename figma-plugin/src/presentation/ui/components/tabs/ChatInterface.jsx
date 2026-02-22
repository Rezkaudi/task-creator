import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { escapeHtml } from '../../utils.js';
import DesignPreview from './DesignPreview.jsx';
import CostBreakdown from './CostBreakdown.jsx';
import '../../styles/ChatInterface.css';
import { defaultModel, defaultDesignSystem } from '../../../../shared/constants/plugin-config.js';
import { playNotificationSound } from '../../utils/notificationSound.js';

export default function ChatInterface({
    currentMode,
    isBasedOnExistingMode,
    selectedLayerForEdit,
    selectedLayerJson,
    referenceLayerName,
    referenceDesignJson,
    onBack,
    sendMessage,
    // New props from AiTab
    selectedFrames = [],
    onRemoveFrame,
    onToggleFramePicker,
    framePickerOpen = false,
    systemMessages = [],
}) {
    const { state, dispatch } = useAppContext();
    const { currentModelId, availableModels, currentDesignSystemId, availableDesignSystems, hasPurchased } = state;
    const { updateSubscription, updatePointsBalance } = useAuth();

    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComposing, setIsComposing] = useState(false);

    const chatMessagesRef = useRef(null);
    const inputRef = useRef(null);

    // Store AuthContext update functions in refs so static handlers can access them
    const updateSubscriptionRef = useRef(updateSubscription);
    const updatePointsBalanceRef = useRef(updatePointsBalance);

    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [dsDropdownOpen, setDsDropdownOpen] = useState(false);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            if (modelDropdownOpen) setModelDropdownOpen(false);
            if (dsDropdownOpen) setDsDropdownOpen(false);
        };

        if (modelDropdownOpen || dsDropdownOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => document.removeEventListener('click', handleClickOutside);
    }, [modelDropdownOpen, dsDropdownOpen]);

    useEffect(() => {
        updateSubscriptionRef.current = updateSubscription;
        updatePointsBalanceRef.current = updatePointsBalance;
    }, [updateSubscription, updatePointsBalance]);

    // Build welcome message
    useEffect(() => {
        const model = availableModels.find(m => m.id === currentModelId);
        const system = availableDesignSystems.find(s => s.id === currentDesignSystemId);
        const modelName = model?.name || defaultModel.name;
        const systemName = system?.name || defaultDesignSystem.name;

        let welcomeMessage;
        if (isBasedOnExistingMode) {
            welcomeMessage = `By Reference: Attach a reference frame with 📎, then describe what new design you want to create based on its style. 🎨`;
        } else if (currentMode === 'edit') {
            welcomeMessage = `Edit Mode: Attach a frame with 📎 to start editing using ${modelName}. What would you like to change?`;
        } else if (currentMode === 'prototype') {
            welcomeMessage = `Prototype Mode: Attach 2 or more frames with 📎 to generate connections between them. Then click Send. 🔗`;
        } else {
            welcomeMessage = `Attach a frame with 📎, then describe what you'd like to create. I'll generate your design using <strong>${modelName}</strong> + <strong>${systemName}</strong>. ✨`;
        }

        setMessages([{ role: 'assistant', content: welcomeMessage, isHtml: true }]);
        setConversationHistory([]);

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentMode, isBasedOnExistingMode, currentModelId, currentDesignSystemId, availableModels, availableDesignSystems]);

    const scrollToBottom = useCallback(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Add system messages from parent whenever they change
    const lastSystemMsgCount = useRef(0);
    useEffect(() => {
        if (systemMessages.length > lastSystemMsgCount.current) {
            const newMsgs = systemMessages.slice(lastSystemMsgCount.current);
            newMsgs.forEach(sm => {
                setMessages(prev => [...prev, { role: 'system', badge: sm.badge }]);
            });
            lastSystemMsgCount.current = systemMessages.length;
        }
    }, [systemMessages]);

    const addMessage = useCallback((role, content, opts = {}) => {
        setMessages(prev => [...prev, {
            role,
            content,
            isLoading: opts.isLoading || false,
            isHtml: opts.isHtml || false,
            designData: opts.designData || null,
            previewHtml: opts.previewHtml || null,
            cost: opts.cost || null,
            isEditMode: opts.isEditMode || false,
            layerInfo: opts.layerInfo || null,
            isPrototypeResponse: opts.isPrototypeResponse || false,
            connections: opts.connections || null,
            timestamp: new Date()
        }]);
    }, []);

    const removeLoadingMessages = useCallback(() => {
        setMessages(prev => prev.filter(m => !m.isLoading));
    }, []);

    const sendChatMessage = useCallback(() => {
        const message = inputValue.trim();
        if ((!message) || isGenerating) return;

        // Validation for Edit Mode: Must have exactly one frame attached
        if (currentMode === 'edit') {
            if (selectedFrames.length === 0) {
                addMessage('assistant', '⚠️ Please attach a frame to edit using the 📎 button or select an existing frame in the canvas.');
                return;
            }
            if (selectedFrames.length > 1) {
                addMessage('assistant', '⚠️ Please attach only one frame for editing.');
                return;
            }
        }

        // Validation for By Reference Mode: Must have exactly one frame attached
        if (isBasedOnExistingMode) {
            if (selectedFrames.length === 0) {
                addMessage('assistant', '⚠️ Please attach a reference frame using the 📎 button or select an existing reference frame in the canvas.');
                return;
            }
            if (selectedFrames.length > 1) {
                addMessage('assistant', '⚠️ Please attach only one reference frame.');
                return;
            }
        }

        addMessage('user', message);
        setInputValue('');
        console.log("clear");
        setIsGenerating(true);

        const newHistory = [...conversationHistory, { role: 'user', content: message }];
        setConversationHistory(newHistory);

        if (isBasedOnExistingMode) {
            const referenceFrame = selectedFrames[0];
            addMessage('assistant', `Creating new design based on "${referenceFrame.name}" style...`, { isLoading: true });
            sendMessage('ai-generate-based-on-existing', {
                message,
                history: newHistory,
                referenceId: referenceFrame.id, // Send ID instead of JSON
                model: currentModelId
            });
        } else if (currentMode === 'edit') {
            const attachedFrame = selectedFrames[0];
            addMessage('assistant', `Editing "${attachedFrame.name}"...`, { isLoading: true });
            sendMessage('ai-edit-design', {
                message,
                history: newHistory,
                layerId: attachedFrame.id, // Send ID instead of JSON
                model: currentModelId,
                designSystemId: currentDesignSystemId
            });
        } else if (currentMode === 'prototype') {
            // Validation for Prototype Mode
            if (selectedFrames.length < 2) {
                addMessage('assistant', '⚠️ Please attach at least 2 frames for prototyping.');
                setIsGenerating(false); // Stop loading state
                return;
            }

            addMessage('assistant', `Generating connections for ${selectedFrames.length} frames...`, { isLoading: true });

            const frameIds = selectedFrames.map(f => f.id);
            sendMessage('generate-prototype-connections', {
                frameIds,
                modelId: currentModelId
            });
        } else {
            addMessage('assistant', 'Creating in progress, please wait for me', { isLoading: true });
            sendMessage('ai-chat-message', {
                message,
                history: newHistory,
                model: currentModelId,
                designSystemId: currentDesignSystemId
            });
        }
    }, [inputValue, isGenerating, conversationHistory, currentMode, isBasedOnExistingMode, currentModelId, currentDesignSystemId, selectedLayerJson, referenceDesignJson, referenceLayerName, sendMessage, addMessage, selectedFrames]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && e.shiftKey) return;
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            sendChatMessage();
        }
    }, [sendChatMessage, isComposing]);

    // Handle responses
    const handleResponse = useCallback((msg) => {
        setIsGenerating(false);
        removeLoadingMessages();
        playNotificationSound();

        const isEdit = msg.type === 'ai-edit-response';
        const isBased = msg.type === 'ai-based-on-existing-response';

        if (msg.points) {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: msg.points.remaining || 0 });
            if (msg.points.subscription) {
                dispatch({ type: 'SET_SUBSCRIPTION', subscription: msg.points.subscription });
                updateSubscriptionRef.current(msg.points.subscription);
            }
            if (typeof msg.points.hasPurchased === 'boolean') {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: msg.points.hasPurchased });
                updatePointsBalanceRef.current(msg.points.remaining || 0, msg.points.hasPurchased);
            } else if (!msg.points.wasFree && !hasPurchased) {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: true });
                updatePointsBalanceRef.current(msg.points.remaining || 0, true);
            }
        }

        addMessage('assistant', msg.message, {
            designData: msg.designData,
            previewHtml: msg.previewHtml,
            cost: msg.cost,
            isEditMode: isEdit,
            layerInfo: isEdit ? {
                name: selectedLayerForEdit,
                type: selectedLayerJson?.type || 'LAYER',
                id: selectedLayerJson?.id || ''
            } : isBased ? {
                name: referenceLayerName,
                type: 'REFERENCE'
            } : null,
        });

        setConversationHistory(prev => [...prev, { role: 'assistant', content: msg.message }]);

        // Auto-import the design to Figma immediately
        if (msg.designData) {
            handleImportDesignRef.current(msg.designData, isEdit);
        }
    }, [selectedLayerForEdit, selectedLayerJson, referenceLayerName, removeLoadingMessages, addMessage, dispatch, hasPurchased]);

    const handleError = useCallback((msg) => {
        setIsGenerating(false);
        removeLoadingMessages();
        playNotificationSound();
        addMessage('assistant', `Error: ${msg.error}`);

        const errorText = `${msg.error || ''}`.toLowerCase();
        if (msg.statusCode === 402 || errorText.includes('insufficient') || errorText.includes('purchase points')) {
            dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
        }
    }, [removeLoadingMessages, addMessage, dispatch]);

    const handlePrototypeResponse = useCallback((msg) => {
        setIsGenerating(false);
        removeLoadingMessages();
        playNotificationSound();

        if (msg.points) {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: msg.points.remaining || 0 });
            if (msg.points.subscription) {
                dispatch({ type: 'SET_SUBSCRIPTION', subscription: msg.points.subscription });
                updateSubscriptionRef.current(msg.points.subscription);
            }
            if (typeof msg.points.hasPurchased === 'boolean') {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: msg.points.hasPurchased });
                updatePointsBalanceRef.current(msg.points.remaining || 0, msg.points.hasPurchased);
            }
        }

        const connectionsCount = (msg.connections || []).length;
        const messageContent = `
            <strong>✅ Generated ${connectionsCount} connections!</strong><br/>
            ${msg.reasoning ? `<em>${msg.reasoning}</em><br/>` : ''}
            <br/>
            Click <strong>Apply</strong> to add them to your Figma file.
        `;

        addMessage('assistant', messageContent, {
            isHtml: true,
            cost: msg.cost,
            isPrototypeResponse: true,
            connections: msg.connections,
            timestamp: new Date()
        });
    }, [dispatch, removeLoadingMessages, addMessage]);

    // Store handlers on component so parent can access
    ChatInterface.handleResponse = handleResponse;
    ChatInterface.handleError = handleError;
    ChatInterface.handlePrototypeResponse = handlePrototypeResponse;

    const handleImportDesign = useCallback((designData, isEditMode) => {
        let messageType;
        if (isBasedOnExistingMode) {
            messageType = 'import-based-on-existing-design';
        } else if (isEditMode) {
            messageType = 'import-edited-design';
        } else {
            messageType = 'import-design-from-chat';
        }

        sendMessage(messageType, {
            designData,
            isEditMode,
            ...(isEditMode && { layerId: selectedLayerForEdit })
        });
    }, [isBasedOnExistingMode, selectedLayerForEdit, sendMessage]);

    // Ref so handleResponse can call handleImportDesign without circular deps
    const handleImportDesignRef = useRef(handleImportDesign);
    useEffect(() => {
        handleImportDesignRef.current = handleImportDesign;
    }, [handleImportDesign]);

    const placeholder = isBasedOnExistingMode
        ? `e.g., Create a login page based on "${referenceLayerName}" style...`
        : currentMode === 'edit'
            ? 'e.g. Change the background color to blue...'
            : currentMode === 'prototype'
                ? 'Click Send to generate connections...'
                : 'Describe what to create...';

    const selectedModel = availableModels.find(m => m.id === currentModelId);
    const selectedSystem = availableDesignSystems.find(s => s.id === currentDesignSystemId);
    const visibleModels = hasPurchased ? availableModels : availableModels.filter((model) => model.isFree);

    // Auto-resize textarea
    const autoResize = useCallback((el) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 56) + 'px';
    }, []);

    return (
        <div id="ai-chat-container" className="show-chat" style={{ display: 'flex' }}>
            {/* Chat Messages */}
            <div id="chat-messages" className="show-messages" ref={chatMessagesRef} style={{ display: 'flex' }}>
                {messages.map((msg, i) => {
                    // System message (mode switch)
                    if (msg.role === 'system') {
                        return (
                            <div key={i} className="system-msg">
                                <span className="sys-badge">{msg.badge}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className={`message ${msg.role}`}>
                            {msg.role === 'assistant' && (
                                <div className="msg-avatar ai-avatar">R</div>
                            )}
                            <div className="message-content">
                                {msg.isLoading ? (
                                    <div className="loading-indicator">
                                        <div className="spinner" />
                                        <span>{msg.content}</span>
                                    </div>
                                ) : msg.isHtml ? (
                                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                ) : (
                                    <div className="message-text"
                                        dangerouslySetInnerHTML={{
                                            __html: escapeHtml(msg.content).replace(/\n/g, '<br>')
                                        }}
                                    />
                                )}
                                {msg.cost && <CostBreakdown cost={msg.cost} />}
                                {(msg.designData || msg.previewHtml) && (
                                    <DesignPreview
                                        designData={msg.designData}
                                        previewHtml={msg.previewHtml}
                                        isEditMode={msg.isEditMode}
                                        isBasedOnExistingMode={isBasedOnExistingMode}
                                        layerInfo={msg.layerInfo}
                                        selectedLayerForEdit={selectedLayerForEdit}
                                        onImport={() => handleImportDesign(msg.designData, msg.isEditMode)}
                                    />
                                )}
                                {msg.isPrototypeResponse && msg.connections && (
                                    <div className="prototype-result">
                                        <div className="connections-list-preview" style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                                            {msg.connections.slice(0, 3).map((conn, idx) => (
                                                <div key={idx} className="conn-preview-item">
                                                    🔗 {conn.sourceNodeName} → {conn.targetFrameName}
                                                </div>
                                            ))}
                                            {msg.connections.length > 3 && (
                                                <div className="more-conns">+{msg.connections.length - 3} more...</div>
                                            )}
                                        </div>
                                        <button
                                            className="btn-primary"
                                            style={{ marginTop: '12px', width: '100%' }}
                                            onClick={() => sendMessage('apply-prototype-connections', { connections: msg.connections })}
                                        >
                                            ✅ Apply Connections
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                {/* Frame Chips */}
                {selectedFrames.length > 0 && (
                    <div className="frame-chips">
                        {selectedFrames.map(frame => (
                            <span key={frame.id} className="f-chip">
                                <span className="chip-icon">📐</span>
                                {frame.name.length > 20 ? frame.name.slice(0, 20) + '…' : frame.name}
                                <button className="chip-x" onClick={() => onRemoveFrame?.(frame.id)}>✕</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Input Row */}
                {currentMode === 'prototype' ? (
                    <div className="input-row prototype-action" style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`attach-btn ${framePickerOpen ? 'active' : ''}`}
                            onClick={onToggleFramePicker}
                            title="Attach frames"
                        >
                            📎
                        </button>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => {
                                setInputValue('Generate connections between the attached frames');
                                sendChatMessage();
                            }}
                            disabled={isGenerating || selectedFrames.length < 2}
                        >
                            {isGenerating ? <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : '⚡'}
                            {isGenerating ? 'Generating...' : 'Generate Connections'}
                        </button>
                    </div>
                ) : (
                    <div className="input-row">
                        <button
                            className={`attach-btn ${framePickerOpen ? 'active' : ''}`}
                            onClick={onToggleFramePicker}
                            title="Attach frames"
                        >
                            📎
                        </button>
                        <textarea
                            className="input-field"
                            ref={inputRef}
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                autoResize(e.target);
                            }}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            disabled={isGenerating}
                            rows="1"
                        />
                        <button
                            className="send-btn-icon"
                            onClick={sendChatMessage}
                            disabled={isGenerating || !inputValue.trim()}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2 11 13" />
                                <path d="M22 2 15 22 11 13 2 9z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Selectors Row */}
                {/* Selectors Row */}
                <div className="selectors-row">
                    <button
                        className="selector-pill model"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDsDropdownOpen(false);
                            setModelDropdownOpen(!modelDropdownOpen);
                        }}
                    >
                        <span>🤖</span> {selectedModel?.name || defaultModel.name} <span className="sel-arrow">▾</span>

                        {/* Model Dropdown */}
                        {modelDropdownOpen && (
                            <div className="sel-dropdown show" onClick={(e) => e.stopPropagation()}>
                                {visibleModels.map(model => (
                                    <div
                                        key={model.id}
                                        className={`sd-item ${currentModelId === model.id ? 'sel' : ''}`}
                                        onClick={() => {
                                            dispatch({ type: 'SET_MODEL', modelId: model.id });
                                            setModelDropdownOpen(false);
                                        }}
                                    >
                                        <span className="sd-icon">🤖</span>
                                        <div style={{ flex: 1 }}>{model.name}</div>
                                        <span className="sd-check">✓</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </button>

                    <button
                        className="selector-pill ds"
                        onClick={(e) => {
                            e.stopPropagation();
                            setModelDropdownOpen(false);
                            setDsDropdownOpen(!dsDropdownOpen);
                        }}
                    >
                        <span>🎨</span> {selectedSystem?.name || defaultDesignSystem.name} <span className="sel-arrow">▾</span>

                        {/* Design System Dropdown */}
                        {dsDropdownOpen && (
                            <div className="sel-dropdown show" onClick={(e) => e.stopPropagation()}>
                                {availableDesignSystems.map(ds => (
                                    <div
                                        key={ds.id}
                                        className={`sd-item ${currentDesignSystemId === ds.id ? 'sel-ds' : ''}`}
                                        onClick={() => {
                                            dispatch({ type: 'SET_DESIGN_SYSTEM', systemId: ds.id });
                                            setDsDropdownOpen(false);
                                        }}
                                    >
                                        <span className="sd-icon">🎨</span>
                                        <div style={{ flex: 1 }}>{ds.name}</div>
                                        <span className="sd-check">✓</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </button>

                    <span className="selectors-spacer" />
                    <span className="chat-hint-inline">↵ Send</span>
                </div>
            </div>
        </div>
    );
}
