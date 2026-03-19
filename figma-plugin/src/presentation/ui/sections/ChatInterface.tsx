import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { escapeHtml } from '../utils/formatters';
import DesignPreview from '../components/shared/DesignPreview.tsx';
import CostBreakdown from '../components/shared/CostBreakdown.tsx';
import '../styles/ChatInterface.css';
import RioProfile from '../assets/rio-profile.png';
import { defaultModel, defaultDesignSystem } from '../../../shared/constants/plugin-config.js';
import { playNotificationSound } from '../utils/audio.ts';
import {
    Frame,
    CostInfo,
    PrototypeConnection,
    PluginMessage,
    SendMessageFn,
    Subscription,
} from '../types/index.ts';

interface LayerInfo {
    name: string | null;
    type: string;
    id?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content?: string;
    badge?: string;
    isLoading?: boolean;
    isHtml?: boolean;
    designData?: unknown;
    cost?: CostInfo | null;
    isEditMode?: boolean;
    layerInfo?: LayerInfo | null;
    isPrototypeResponse?: boolean;
    connections?: PrototypeConnection[] | null;
    timestamp?: Date;
}

interface SystemMessage {
    badge: string;
}

interface ChatInterfaceProps {
    currentMode: string;
    isBasedOnExistingMode: boolean;
    selectedLayerForEdit: string | null;
    selectedLayerJson: Record<string, unknown> | null;
    onBack: (() => void) | null;
    sendMessage: SendMessageFn;
    selectedFrames?: Frame[];
    onRemoveFrame?: (id: string) => void;
    onClearFrames?: () => void;
    onToggleFramePicker?: () => void;
    framePickerOpen?: boolean;
    systemMessages?: SystemMessage[];
    pinnedComponentNames?: Set<string>;
    isNodeJsonLoading?: boolean;
    onRequestGenerate?: (message: string) => void;
}

function ChatInterface({
    currentMode,
    isBasedOnExistingMode,
    selectedLayerForEdit,
    selectedLayerJson,
    sendMessage,
    selectedFrames = [],
    onRemoveFrame,
    onClearFrames,
    onToggleFramePicker,
    framePickerOpen = false,
    systemMessages = [],
    pinnedComponentNames,
    isNodeJsonLoading = false,
    onRequestGenerate,
}: ChatInterfaceProps): React.JSX.Element {
    const { state, dispatch } = useAppContext();
    const { currentModelId, availableModels, currentDesignSystemId, availableDesignSystems, hasPurchased } = state;
    const { updateSubscription, updatePointsBalance } = useAuth();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    // const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [importingMsgIndex, setImportingMsgIndex] = useState<number | null>(null);

    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const requestStartTime = useRef<number | null>(null);
    const messagesRef = useRef<ChatMessage[]>(messages);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    const updateSubscriptionRef = useRef(updateSubscription);
    const updatePointsBalanceRef = useRef(updatePointsBalance);

    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [dsDropdownOpen, setDsDropdownOpen] = useState(false);
    const [attachNotif, setAttachNotif] = useState<string | null>(null);
    const prevFrameCountRef = useRef(0);
    const attachNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (selectedFrames.length > prevFrameCountRef.current) {
            const added = selectedFrames[selectedFrames.length - 1];
            if (attachNotifTimerRef.current) clearTimeout(attachNotifTimerRef.current);
            setAttachNotif(added.name.length > 24 ? added.name.slice(0, 24) + '…' : added.name);
            attachNotifTimerRef.current = setTimeout(() => setAttachNotif(null), 5000);
        }
        prevFrameCountRef.current = selectedFrames.length;
    }, [selectedFrames]);

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

    useEffect(() => {
        const model = availableModels.find(m => m.id === currentModelId);
        const system = availableDesignSystems.find(s => s.id === currentDesignSystemId);
        const modelName = model?.name || defaultModel.name;
        const systemName = system?.name || defaultDesignSystem.name;

        let welcomeMessage: string;
        if (currentMode === 'edit') {
            welcomeMessage = `Edit Mode: Attach a frame with 📎 to start editing using ${modelName}. What would you like to change?`;
        } else if (currentMode === 'prototype') {
            welcomeMessage = `Prototype Mode: Attach 2 or more frames with 📎 to generate connections between them. Then click Send. 🔗`;
        } else {
            welcomeMessage = `What would you like to create with <strong>${modelName}</strong> + <strong>${systemName}</strong>? Attach a frame with 📎 to use it as a style reference.`;
        }

        setMessages([{ role: 'assistant', content: welcomeMessage, isHtml: true }]);
        // setConversationHistory([]);

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentMode, currentModelId, currentDesignSystemId, availableModels, availableDesignSystems]);

    useEffect(() => {
        if (currentMode !== 'create') return;
        const model = availableModels.find(m => m.id === currentModelId);
        const system = availableDesignSystems.find(s => s.id === currentDesignSystemId);
        const modelName = model?.name || defaultModel.name;
        const systemName = system?.name || defaultDesignSystem.name;

        const refLabel = selectedFrames.length > 1
            ? `<strong>${selectedFrames.length} references</strong>`
            : `<strong>"${selectedFrames[0]?.name}"</strong>`;
        const welcomeMessage = selectedFrames.length > 0
            ? `Designing based on ${refLabel} as your style reference. Describe what you'd like to create with <strong>${modelName}</strong> + <strong>${systemName}</strong>.`
            : `What would you like to create with <strong>${modelName}</strong> + <strong>${systemName}</strong>? Attach a frame with 📎 to use it as a style reference.`;

        setMessages(prev => {
            if (prev.length === 0) return prev;
            return [{ role: 'assistant', content: welcomeMessage, isHtml: true }, ...prev.slice(1)];
        });
    }, [selectedFrames, currentMode, currentModelId, currentDesignSystemId, availableModels, availableDesignSystems]);

    const scrollToBottom = useCallback(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const addMessage = useCallback((role: ChatMessage['role'], content: string, opts: Partial<ChatMessage> = {}) => {
        setMessages(prev => [...prev, {
            role,
            content,
            isLoading: opts.isLoading || false,
            isHtml: opts.isHtml || false,
            designData: opts.designData || null,
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

        if (currentMode === 'edit' || isBasedOnExistingMode) {
            if (selectedFrames.length === 0 && currentMode === 'edit') {
                addMessage('assistant', '⚠️ Please attach a frame to edit using the 📎 button or select an existing frame in the canvas.');
                return;
            }
            if (currentMode === 'edit' && selectedFrames.length > 1) {
                addMessage('assistant', '⚠️ Please attach only one frame for editing.');
                return;
            }
        }

        // Clear previous exchange, keep only the welcome assistant message
        setMessages(prev => prev.slice(0, 1));
        setInputValue('');
        setIsGenerating(true);
        requestStartTime.current = Date.now();

        // const newHistory = [...conversationHistory, { role: 'user', content: message }];
        // setConversationHistory(newHistory);

        addMessage('user', message);

        if (isBasedOnExistingMode) {
            const referenceFrame = selectedFrames[0];
            const pinned = pinnedComponentNames && pinnedComponentNames.size > 0 ? Array.from(pinnedComponentNames) : [];
            const pinnedNote = pinned.length > 0 ? ` (keeping ${pinned.join(', ')})` : '';
            const refNames = selectedFrames.length > 1
                ? `${selectedFrames.length} references`
                : `"${referenceFrame.name}"`;
            addMessage('assistant', `Creating new design based on ${refNames} style${pinnedNote}...`, { isLoading: true });
            sendMessage('ai-generate-based-on-existing', {
                message,
                history: [],
                references: selectedFrames.map(f => ({
                    id: f.id,
                    name: f.name,
                    ...(f.designJson ? { designJson: f.designJson as Record<string, unknown> } : {}),
                })),
                model: currentModelId,
                pinnedComponentNames: pinned,
            });
        } else if (currentMode === 'edit') {
            const attachedFrame = selectedFrames[0];
            addMessage('assistant', `Editing "${attachedFrame.name}"...`, { isLoading: true });
            sendMessage('ai-edit-design', {
                message,
                history: [],
                layerId: attachedFrame.id,
                ...(attachedFrame.designJson ? { layerJson: attachedFrame.designJson as Record<string, unknown> } : {}),
                model: currentModelId,
                designSystemId: currentDesignSystemId
            });
        } else if (currentMode === 'prototype') {
            if (selectedFrames.length < 2) {
                addMessage('assistant', '⚠️ Please attach at least 2 frames for prototyping.');
                setIsGenerating(false);
                return;
            }

            addMessage('assistant', `Generating connections for ${selectedFrames.length} frames...`, { isLoading: true });

            const frameIds = selectedFrames.map(f => f.id);
            sendMessage('generate-prototype-connections', {
                frameIds,
                modelId: currentModelId
            });
        } else {
            addMessage('assistant', 'Creating in progress ...', { isLoading: true });
            sendMessage('ai-chat-message', {
                message,
                history: [],
                model: currentModelId,
                designSystemId: currentDesignSystemId
            });
        }
    }, [inputValue, isGenerating, currentMode, isBasedOnExistingMode, currentModelId, currentDesignSystemId, selectedLayerJson, sendMessage, addMessage, selectedFrames]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.shiftKey) return;
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            if (isBasedOnExistingMode) {
                const msg = inputValue.trim();
                if (msg) onRequestGenerate?.(msg);
            } else {
                sendChatMessage();
            }
        }
    }, [sendChatMessage, isComposing, isBasedOnExistingMode, inputValue, onRequestGenerate]);

    const handleResponse = useCallback((msg: PluginMessage) => {
        const duration = requestStartTime.current != null ? (Date.now() - requestStartTime.current) / 1000 : undefined;
        requestStartTime.current = null;

        setIsGenerating(false);
        removeLoadingMessages();
        playNotificationSound();

        const isEdit = msg.type === 'ai-edit-response';
        const isBased = msg.type === 'ai-based-on-existing-response';

        const points = msg.points as { remaining?: number; subscription?: Subscription; hasPurchased?: boolean; wasFree?: boolean; deducted?: number } | undefined;
        if (points) {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: points.remaining || 0 });
            if (points.subscription) {
                dispatch({ type: 'SET_SUBSCRIPTION', subscription: points.subscription });
                updateSubscriptionRef.current(points.subscription);
            }
            if (typeof points.hasPurchased === 'boolean') {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: points.hasPurchased });
                updatePointsBalanceRef.current(points.remaining || 0, points.hasPurchased);
            } else if (!points.wasFree && !hasPurchased) {
                dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: true });
                updatePointsBalanceRef.current(points.remaining || 0, true);
            }
        }

        const rawCost = msg.cost as CostInfo | null;
        const cost: CostInfo | null = rawCost ? { ...rawCost, duration } : null;

        addMessage('assistant', '', {
            designData: msg.designData,
            cost,
            isEditMode: isEdit,
            layerInfo: isEdit ? {
                name: selectedLayerForEdit,
                type: (selectedLayerJson?.type as string) || 'LAYER',
                id: (selectedLayerJson?.id as string) || ''
            } : isBased ? {
                name: selectedFrames[0]?.name ?? null,
                type: 'REFERENCE'
            } : null,
        });

        // setConversationHistory(prev => [...prev, { role: 'assistant', content: msg.message as string }]);

        if (msg.designData) {
            const newMsgIndex = messagesRef.current.filter(m => !m.isLoading).length;
            setImportingMsgIndex(newMsgIndex);
            handleImportDesignRef.current(msg.designData, isEdit);
        }
    }, [selectedLayerForEdit, selectedLayerJson, selectedFrames, removeLoadingMessages, addMessage, dispatch, hasPurchased]);

    const handleError = useCallback((msg: PluginMessage) => {
        setIsGenerating(false);
        removeLoadingMessages();
        playNotificationSound();
        addMessage('assistant', `Error: ${msg.error as string}`);

        const errorText = `${msg.error || ''}`.toLowerCase();
        if (msg.statusCode === 402 || errorText.includes('insufficient') || errorText.includes('purchase credits')) {
            dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
        }
    }, [removeLoadingMessages, addMessage, dispatch]);

    const handlePrototypeResponse = useCallback((msg: PluginMessage) => {
        const duration = requestStartTime.current != null ? (Date.now() - requestStartTime.current) / 1000 : undefined;
        requestStartTime.current = null;

        setIsGenerating(false);
        removeLoadingMessages();
        playNotificationSound();

        const points = msg.points as { remaining?: number; subscription?: Subscription; hasPurchased?: boolean; wasFree?: boolean; deducted?: number } | undefined;
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

        const connectionsCount = ((msg.connections as PrototypeConnection[]) || []).length;
        const messageContent = `
            <strong>✅ Generated ${connectionsCount} connections!</strong><br/>
            ${msg.reasoning ? `<em>${msg.reasoning as string}</em><br/>` : ''}
            <br/>
            Click <strong>Apply</strong> to add them to your Figma file.
        `;

        const rawCost = msg.cost as CostInfo | null;
        const cost: CostInfo | null = rawCost ? { ...rawCost, duration } : null;

        addMessage('assistant', messageContent, {
            isHtml: true,
            cost,
            isPrototypeResponse: true,
            connections: msg.connections as PrototypeConnection[],
            timestamp: new Date()
        });
    }, [dispatch, removeLoadingMessages, addMessage]);

    ChatInterface.handleResponse = handleResponse;
    ChatInterface.handleError = handleError;
    ChatInterface.handlePrototypeResponse = handlePrototypeResponse;
    ChatInterface.triggerGeneration = sendChatMessage;

    const handleSaveDesign = useCallback((designData: unknown) => {
        dispatch({ type: 'SET_EXPORT_DATA', data: designData });
        dispatch({ type: 'OPEN_SAVE_MODAL', fromChat: true });
    }, [dispatch]);

    const handleImportDesign = useCallback((designData: unknown, isEditMode: boolean) => {
        const messageType = isEditMode ? 'import-edited-design' : 'import-design-from-chat';
        sendMessage(messageType, {
            designData,
            isEditMode,
            ...(isEditMode && { layerId: selectedLayerForEdit })
        });
    }, [selectedLayerForEdit, sendMessage]);

    const handleImportDesignRef = useRef(handleImportDesign);
    useEffect(() => {
        handleImportDesignRef.current = handleImportDesign;
    }, [handleImportDesign]);

    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const msg = event.data?.pluginMessage;
            if (!msg) return;
            if (msg.type === 'import-success' || msg.type === 'import-error') {
                setImportingMsgIndex(null);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const placeholder = isBasedOnExistingMode
        ? selectedFrames.length > 1
            ? `Create a design based on ${selectedFrames.length} references...`
            : `Create a design based on "${selectedFrames[0]?.name ?? 'reference'}"`
        : currentMode === 'edit'
            ? 'Change the background color to blue...'
            : currentMode === 'prototype'
                ? 'Click Send to generate connections...'
                : 'Describe what to create...';

    const selectedModel = availableModels.find(m => m.id === currentModelId);
    const selectedSystem = availableDesignSystems.find(s => s.id === currentDesignSystemId);
    const canUseModel = (model: { isFree?: boolean }) => model.isFree || hasPurchased;

    const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 56) + 'px';
    }, []);

    return (
        <div id="ai-chat-container" className="show-chat" style={{ display: 'flex' }}>
            {/* Chat Messages */}
            <div id="chat-messages" className="show-messages" ref={chatMessagesRef} style={{ display: 'flex' }}>
                {messages.map((msg, i) => {
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
                                <div className="msg-avatar ai-avatar">
                                    <img src={RioProfile} alt="Rio" />
                                </div>
                            )}
                            <div className="message-content">
                                {msg.isLoading ? (
                                    <div className="loading-indicator">
                                        <div className="spinner" />
                                        <span>{msg.content}</span>
                                    </div>
                                ) : msg.isHtml ? (
                                    <div dangerouslySetInnerHTML={{ __html: msg.content ?? '' }} />
                                ) : (
                                    <div className="message-text"
                                        dangerouslySetInnerHTML={{
                                            __html: escapeHtml(msg.content ?? '').replace(/\n/g, '<br>')
                                        }}
                                    />
                                )}
                                {msg.cost && <CostBreakdown cost={msg.cost} />}
                                {!!msg.designData && (
                                    <DesignPreview
                                        designData={msg.designData}
                                        isEditMode={msg.isEditMode}
                                        isBasedOnExistingMode={isBasedOnExistingMode}
                                        layerInfo={msg.layerInfo}
                                        selectedLayerForEdit={selectedLayerForEdit}
                                        isImporting={importingMsgIndex === i}
                                        onImport={() => { setImportingMsgIndex(i); handleImportDesign(msg.designData, msg.isEditMode ?? false); }}
                                        onSave={() => handleSaveDesign(msg.designData)}
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
                                            onClick={() => sendMessage('apply-prototype-connections', { connections: msg.connections as unknown as Record<string, unknown>[] })}
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

            {/* Attach Notification */}
            {attachNotif && (
                <div className="attach-notif">
                    <span>"{attachNotif}" attached</span>
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-area">
                {/* Frame Chips */}
                {selectedFrames.length > 0 && (
                    <div className="frame-chips-wrap">
                        <div className="frame-chips">
                            {selectedFrames.map((frame, i) => (
                                <span key={frame.id} className={`f-chip ${i === 0 ? 'f-chip--main' : 'f-chip--support'}`}>
                                    <span className="chip-badge">{i === 0 ? 'Main' : 'Support'}</span>
                                    <span className="chip-name">{frame.name}</span>
                                    <button className="chip-x" onClick={() => onRemoveFrame?.(frame.id)}>✕</button>
                                </span>
                            ))}
                        </div>
                        <button className="frame-chips-clear" onClick={onClearFrames} type="button">
                            Clear
                        </button>
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
                            {isGenerating ? <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : ''}
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
                            rows={3}
                        />
                        <button
                            className="send-btn-icon"
                            onClick={isBasedOnExistingMode ? () => onRequestGenerate?.(inputValue.trim()) : sendChatMessage}
                            disabled={isGenerating || !inputValue.trim()}
                        >
                            Generate
                        </button>
                    </div>
                )}

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
                        <span></span> {selectedModel?.name || defaultModel.name} <span className="sel-arrow">▾</span>

                        {modelDropdownOpen && (
                            <div className="sel-dropdown show" onClick={(e) => e.stopPropagation()}>
                                {availableModels.map(model => {
                                    const unlocked = canUseModel(model);
                                    return (
                                        <div
                                            key={model.id}
                                            className={`sd-item ${currentModelId === model.id ? 'sel' : ''} ${!unlocked ? 'sd-item-locked' : ''}`}
                                            onClick={() => {
                                                if (!unlocked) {
                                                    dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
                                                    setModelDropdownOpen(false);
                                                    return;
                                                }
                                                dispatch({ type: 'SET_MODEL', modelId: model.id });
                                                setModelDropdownOpen(false);
                                            }}
                                        >
                                            <span className="sd-icon">{unlocked ? '' : '🔒'}</span>
                                            <div style={{ flex: 1 }}>{model.name}</div>
                                            <span className="sd-check">✓</span>
                                        </div>
                                    );
                                })}
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
                        <span></span> {selectedSystem?.name || defaultDesignSystem.name} <span className="sel-arrow">▾</span>

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
                                        <span className="sd-icon"></span>
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

namespace ChatInterface {
    export let handleResponse: ((msg: PluginMessage) => void) | undefined;
    export let handleError: ((msg: PluginMessage) => void) | undefined;
    export let handlePrototypeResponse: ((msg: PluginMessage) => void) | undefined;
    export let triggerGeneration: (() => void) | undefined;
}

export default ChatInterface;
