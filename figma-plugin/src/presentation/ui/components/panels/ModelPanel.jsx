import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useApiClient } from '../../hooks/useApiClient.js';
import { escapeHtml } from '../../utils.js';
import { reportErrorAsync } from '../../errorReporter.js';
import '../../styles/ModelPanel.css';
import { defaultModel } from '../../../../shared/constants/plugin-config.js';

export default function ModelPanel() {
    const { state, dispatch } = useAppContext();
    const { modelPanelOpen, currentModelId, availableModels, hasPurchased } = state;
    const { apiGet } = useApiClient();

    const [statusMsg, setStatusMsg] = useState('');
    const [statusType, setStatusType] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    async function fetchModels() {
        try {
            setStatusMsg('🔄 Loading AI models...');
            setStatusType('info');

            const data = await apiGet('/api/ai-models');

            if (!data.success) {
                throw new Error(data.message || 'Failed to load AI models');
            }

            dispatch({ type: 'SET_AVAILABLE_MODELS', models: data.models });
            setModelsLoaded(true);
            setStatusMsg(`✅ Loaded ${data.count} models`);
            setStatusType('success');
            setTimeout(() => { setStatusMsg(''); }, 2000);
        } catch (error) {
            console.error('Failed to fetch AI models:', error);
            setStatusMsg('⚠️ Using default models');
            setStatusType('warning');
            reportErrorAsync(error, {
                componentName: 'ModelSelection',
                actionType: 'fetchAIModels'
            });
        }
    }

    useEffect(() => {
        if (modelPanelOpen && !modelsLoaded) {
            fetchModels();
        }
    }, [modelPanelOpen]);

    useEffect(() => {
        // If user hasn't purchased, ensure they're using a free model
        if (!hasPurchased && availableModels.length > 0) {
            const currentModel = availableModels.find(m => m.id === currentModelId);
            const isCurrentModelFree = currentModel && currentModel.isFree;

            if (!isCurrentModelFree) {
                // Switch to the first available free model
                const firstFreeModel = availableModels.find(m => m.isFree);
                if (firstFreeModel) {
                    dispatch({ type: 'SET_MODEL', modelId: firstFreeModel.id });
                }
            }
        }
    }, [hasPurchased, currentModelId, availableModels, dispatch]);


    const handleSelect = (modelId) => {
        dispatch({ type: 'SET_MODEL', modelId });
        dispatch({ type: 'CLOSE_MODEL_PANEL' });
    };

    const handleClose = () => {
        dispatch({ type: 'CLOSE_MODEL_PANEL' });
    };

    if (!modelPanelOpen) return null;

    const visibleModels = hasPurchased
        ? availableModels
        : availableModels.filter((model) => model.isFree);

    const selectedModel = availableModels.find(m => m.id === currentModelId) || visibleModels[0];

    return (
        <>
            <div
                id="model-panel-backdrop"
                className="model-panel-backdrop"
                style={{ display: 'block' }}
                onClick={handleClose}
            />
            <div id="model-panel" className="model-panel" style={{ display: 'block' }}>
                <div className="model-panel-header">
                    <h3>Select AI Model</h3>
                    <button className="close-model-panel" onClick={handleClose}>×</button>
                </div>

                {!hasPurchased && (
                    <div className="model-locked-banner">
                        <span>🔒 Purchase points to unlock all AI models</span>
                        <button
                            className="model-unlock-btn"
                            onClick={() => dispatch({ type: 'OPEN_BUY_POINTS_MODAL' })}
                        >
                            Buy Points
                        </button>
                    </div>
                )}

                <div id="model-list" className="model-list">
                    {(!visibleModels || visibleModels.length === 0) ? (
                        <div className="model-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading AI models...</span>
                        </div>
                    ) : (
                        visibleModels.map(model => (
                            <div
                                key={model.id}
                                className={`model-item ${currentModelId === model.id ? 'active' : ''}`}
                                data-model={model.id}
                                onClick={() => handleSelect(model.id)}
                            >
                                <div className="model-item-icon">{model.icon}</div>
                                <div className="model-item-info">
                                    <div className="model-item-name">
                                        {escapeHtml(model.name)}
                                        {model.isFree && <span className="model-free-pill">Free</span>}
                                    </div>
                                    <div className="model-item-desc">{escapeHtml(model.description)}</div>
                                </div>
                                <div className="model-item-check">
                                    {currentModelId === model.id ? '✓' : ''}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="model-panel-footer">
                    <span id="selected-model-info">
                        Currently using: <span id="current-model-name">
                            {selectedModel?.name || defaultModel.name}
                        </span>
                    </span>
                    {statusMsg && (
                        <div className={`model-status ${statusType}`} style={{ display: 'block' }}>
                            {statusMsg}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
