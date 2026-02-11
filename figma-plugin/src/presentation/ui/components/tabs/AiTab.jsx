import React, { useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { usePluginMessage } from '../../hooks/usePluginMessage.js';
import { reportErrorAsync } from '../../errorReporter.js';
import ModeSelectionScreen from './ModeSelectionScreen.jsx';
import ChatInterface from './ChatInterface.jsx';
import PrototypePanel from './PrototypePanel.jsx';

export default function AiTab({ sendMessage }) {
    const { showStatus, hideStatus } = useAppContext();

    // AI tab internal state
    const [view, setView] = useState('mode-selection'); // 'mode-selection' | 'chat' | 'prototype'
    const [currentMode, setCurrentMode] = useState(null); // 'create' | 'edit' | 'based-on-existing' | 'prototype'
    const [isBasedOnExistingMode, setIsBasedOnExistingMode] = useState(false);

    // Edit mode state
    const [selectedLayerForEdit, setSelectedLayerForEdit] = useState(null);
    const [selectedLayerJson, setSelectedLayerJson] = useState(null);

    // Based on existing mode state
    const [referenceLayerName, setReferenceLayerName] = useState('');
    const [referenceDesignJson, setReferenceDesignJson] = useState(null);

    // Chat ref for calling response/error handlers
    const chatRef = useRef(null);

    const resetToModeSelection = useCallback(() => {
        setView('mode-selection');
        setCurrentMode(null);
        setSelectedLayerForEdit(null);
        setSelectedLayerJson(null);
        setIsBasedOnExistingMode(false);
        setReferenceDesignJson(null);
        setReferenceLayerName('');
    }, []);

    const handleModeSelect = useCallback((mode) => {
        switch (mode) {
            case 'create':
                setCurrentMode('create');
                setIsBasedOnExistingMode(false);
                setView('chat');
                break;
            case 'edit':
                showStatus('📍 Please select a layer to edit...', 'info');
                sendMessage('request-layer-selection-for-edit');
                break;
            case 'based-on-existing':
                sendMessage('request-layer-selection-for-reference');
                break;
            case 'prototype':
                setCurrentMode('prototype');
                setView('prototype');
                break;
        }
    }, [sendMessage, showStatus]);

    // Plugin message handlers for this tab
    AiTab.messageHandlers = {
        'layer-selected-for-edit': (msg) => {
            setCurrentMode('edit');
            setSelectedLayerForEdit(msg.layerName);
            setSelectedLayerJson(msg.layerJson);
            setIsBasedOnExistingMode(false);
            setView('chat');
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
            setTimeout(hideStatus, 2000);
        },

        'ai-chat-response': (msg) => {
            ChatInterface.handleResponse?.(msg);
        },
        'ai-edit-response': (msg) => {
            ChatInterface.handleResponse?.(msg);
        },
        'ai-based-on-existing-response': (msg) => {
            ChatInterface.handleResponse?.(msg);
        },
        'ai-chat-error': (msg) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error), {
                componentName: 'AIChat',
                actionType: msg.type
            });
        },
        'ai-edit-error': (msg) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error), {
                componentName: 'AIChat',
                actionType: msg.type
            });
        },
        'ai-based-on-existing-error': (msg) => {
            ChatInterface.handleError?.(msg);
            reportErrorAsync(new Error(msg.error), {
                componentName: 'BasedOnExisting',
                actionType: 'ai-based-on-existing-error'
            });
        },

        'design-updated': (msg) => {
            setSelectedLayerJson(msg.layerJson);
            showStatus('✅ Design updated! You can continue editing.', 'success');
            setTimeout(hideStatus, 2000);
        },

        // Prototype handlers
        'frames-loaded': (msg) => {
            PrototypePanel.handleFramesLoaded?.(msg);
        },
        'frames-load-error': (msg) => {
            PrototypePanel.handleFramesError?.(msg);
        },
        'prototype-connections-generated': (msg) => {
            PrototypePanel.handleConnectionsGenerated?.(msg);
        },
        'prototype-connections-error': (msg) => {
            PrototypePanel.handleConnectionsError?.(msg);
        },
        'prototype-applied': (msg) => {
            PrototypePanel.handlePrototypeApplied?.(msg);
        },
        'prototype-apply-error': (msg) => {
            PrototypePanel.handlePrototypeApplyError?.(msg);
        },
    };

    return (
        <div id="ai-tab" className="tab-content active">
            {view === 'mode-selection' && (
                <ModeSelectionScreen onSelectMode={handleModeSelect} />
            )}

            {view === 'chat' && (
                <ChatInterface
                    ref={chatRef}
                    currentMode={currentMode}
                    isBasedOnExistingMode={isBasedOnExistingMode}
                    selectedLayerForEdit={selectedLayerForEdit}
                    selectedLayerJson={selectedLayerJson}
                    referenceLayerName={referenceLayerName}
                    referenceDesignJson={referenceDesignJson}
                    onBack={resetToModeSelection}
                    sendMessage={sendMessage}
                />
            )}

            {view === 'prototype' && (
                <PrototypePanel
                    onBack={resetToModeSelection}
                    sendMessage={sendMessage}
                />
            )}
        </div>
    );
}
