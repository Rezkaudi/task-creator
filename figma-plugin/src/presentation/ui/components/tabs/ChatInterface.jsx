import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { escapeHtml } from '../../utils.js';
import DesignPreview from './DesignPreview.jsx';
import CostBreakdown from './CostBreakdown.jsx';
import '../../styles/ChatInterface.css';
import { defaultModel, defaultDesignSystem } from '../../../../shared/constants/plugin-config.js';

export default function ChatInterface({
    currentMode,
    isBasedOnExistingMode,
    selectedLayerForEdit,
    selectedLayerJson,
    referenceLayerName,
    referenceDesignJson,
    onBack,
    sendMessage,
}) {
    const { state, dispatch } = useAppContext();
    const { currentModelId, availableModels, currentDesignSystemId, availableDesignSystems, hasPurchased } = state;

    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComposing, setIsComposing] = useState(false);

    const chatMessagesRef = useRef(null);
    const inputRef = useRef(null);

    // Build welcome message
    useEffect(() => {
        const model = availableModels.find(m => m.id === currentModelId);
        const system = availableDesignSystems.find(s => s.id === currentDesignSystemId);
        const modelName = model?.name || defaultModel.name;
        const systemName = system?.name || defaultDesignSystem.name;

        let welcomeMessage;
        if (isBasedOnExistingMode) {
            welcomeMessage = `I'll create a new design based on <strong>"${referenceLayerName}"</strong> style using ${modelName}. What would you like to create? 🎨`;
        } else if (currentMode === 'edit') {
            welcomeMessage = `I'll help you edit <strong>"${selectedLayerForEdit}"</strong> using ${modelName} and ${systemName}. What changes would you like to make?`;
        } else {
            welcomeMessage = `Hi! I'll create your design using ${modelName} and ${systemName}. Describe what you want. 🎨`;
        }

        setMessages([{ role: 'assistant', content: welcomeMessage, isHtml: true }]);
        setConversationHistory([]);

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentMode, isBasedOnExistingMode]);

    const scrollToBottom = useCallback(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            timestamp: new Date()
        }]);
    }, []);

    const removeLoadingMessages = useCallback(() => {
        setMessages(prev => prev.filter(m => !m.isLoading));
    }, []);

    const sendChatMessage = useCallback(() => {
        const message = inputValue.trim();
        if (!message || isGenerating) return;

        addMessage('user', message);
        setInputValue('');
        setIsGenerating(true);

        const newHistory = [...conversationHistory, { role: 'user', content: message }];
        setConversationHistory(newHistory);

        if (isBasedOnExistingMode) {
            addMessage('assistant', `Creating new design based on "${referenceLayerName}" style...`, { isLoading: true });
            sendMessage('ai-generate-based-on-existing', {
                message,
                history: newHistory,
                referenceJson: referenceDesignJson,
                model: currentModelId
            });
        } else if (currentMode === 'edit') {
            addMessage('assistant', 'Editing in progress, please wait', { isLoading: true });
            sendMessage('ai-edit-design', {
                message,
                history: newHistory,
                layerJson: selectedLayerJson,
                model: currentModelId,
                designSystemId: currentDesignSystemId
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
    }, [inputValue, isGenerating, conversationHistory, currentMode, isBasedOnExistingMode, currentModelId, currentDesignSystemId, selectedLayerJson, referenceDesignJson, referenceLayerName, sendMessage, addMessage]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && e.shiftKey) return;
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            sendChatMessage();
        }
    }, [sendChatMessage, isComposing]);

    // Handle responses - exposed via ref or callback
    const handleResponse = useCallback((msg) => {
        setIsGenerating(false);
        removeLoadingMessages();

        const isEdit = msg.type === 'ai-edit-response';
        const isBased = msg.type === 'ai-based-on-existing-response';

        if (msg.points) {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: msg.points.remaining || 0 });
            if (msg.points.subscription) {
                dispatch({ type: 'SET_SUBSCRIPTION', subscription: msg.points.subscription });
            }
            if (typeof msg.points.hasPurchased === 'boolean') {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: msg.points.hasPurchased });
            } else if (!msg.points.wasFree && !hasPurchased) {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: true });
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
    }, [selectedLayerForEdit, selectedLayerJson, referenceLayerName, removeLoadingMessages, addMessage, dispatch, hasPurchased]);

    const handleError = useCallback((msg) => {
        setIsGenerating(false);
        removeLoadingMessages();
        addMessage('assistant', `Error: ${msg.error}`);

        const errorText = `${msg.error || ''}`.toLowerCase();
        if (msg.statusCode === 402 || errorText.includes('insufficient') || errorText.includes('purchase points')) {
            dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
        }
    }, [removeLoadingMessages, addMessage, dispatch]);

    // Expose handlers via ref (parent will call these)
    React.useImperativeHandle(React.useRef(), () => ({
        handleResponse,
        handleError
    }));

    // Store handlers on component so parent can access
    ChatInterface.handleResponse = handleResponse;
    ChatInterface.handleError = handleError;

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

    const placeholder = isBasedOnExistingMode
        ? `e.g., Create a login page based on "${referenceLayerName}" style...`
        : currentMode === 'edit'
            ? 'e.g. Change the background color to blue, make the text larger...'
            : 'e.g. Create a login page with email and password fields...';

    const selectedModel = availableModels.find(m => m.id === currentModelId);
    const selectedSystem = availableDesignSystems.find(s => s.id === currentDesignSystemId);

    return (
        <div id="ai-chat-container" className="show-chat" style={{ display: 'flex' }}>
            {/* Edit Mode Header */}
            {currentMode === 'edit' && (
                <div id="edit-mode-header" className="show-header" style={{ display: 'block' }}>
                    <button className="back-btn" onClick={onBack}>← Back to Mode Selection</button>
                    <div className="edit-mode-info">
                        <span className="edit-mode-label">✏️ Editing Mode</span>
                        <span className="selected-layer-name">"{selectedLayerForEdit}"</span>
                    </div>
                </div>
            )}

            {/* Based on Existing Mode Header */}
            {isBasedOnExistingMode && (
                <div id="based-on-existing-mode-header" style={{ display: 'block' }}>
                    <button className="back-btn" onClick={onBack}>← Back to Mode Selection</button>
                    <div className="edit-mode-info">
                        <span className="edit-mode-label">🎨 Based on Existing Mode</span>
                        <span className="selected-layer-name">"{referenceLayerName}"</span>
                    </div>
                </div>
            )}

            {/* Create Mode - back button */}
            {currentMode === 'create' && (
                <div style={{ marginBottom: '12px' }}>
                    <button className="back-btn" onClick={onBack}>← Back to Mode Selection</button>
                </div>
            )}

            {/* Chat Messages */}
            <div id="chat-messages" className="show-messages" ref={chatMessagesRef} style={{ display: 'flex' }}>
                {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                        <div className="message-content">
                            {msg.isLoading ? (
                                <div className="loading-indicator">
                                    <div className="spinner"></div>
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
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Input */}
            <div id="chat-input-container" className="show-input" style={{ display: 'flex' }}>
                <textarea
                    id="chat-input"
                    className="show-input"
                    ref={inputRef}
                    rows="8"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder={placeholder}
                    disabled={isGenerating}
                    style={{ display: 'block' }}
                />
                <div className="chat-actions">
                    <button
                        id="chat-send-btn"
                        className="show-button"
                        onClick={sendChatMessage}
                        disabled={isGenerating || !inputValue.trim()}
                        style={{ display: 'block' }}
                    >
                        Send
                    </button>
                    <div
                        className="model-floating-btn"
                        onClick={() => dispatch({ type: 'OPEN_MODEL_PANEL' })}
                    >
                        <div className="model-btn-icon">🤖</div>
                        <span className="model-btn-text">{selectedModel?.name || defaultModel.name}</span>
                    </div>
                    <div
                        id="design-system-floating-btn"
                        className="model-floating-btn"
                        onClick={() => dispatch({ type: 'TOGGLE_DESIGN_SYSTEM_PANEL' })}
                    >
                        <div className="model-btn-icon">🎨</div>
                        <span className="design-system-btn-text">{selectedSystem?.name || defaultDesignSystem.name}</span>
                    </div>
                </div>
            </div>
            <div className="chat-hint">Press Enter to send • Shift + Enter for new line</div>
        </div>
    );
}
