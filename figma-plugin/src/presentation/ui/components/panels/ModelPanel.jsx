import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useApiClient } from '../../hooks/useApiClient.js';
import { escapeHtml } from '../../utils.js';
import { reportErrorAsync } from '../../errorReporter.js';

export default function ModelPanel() {
    const { state, dispatch } = useAppContext();
    const { modelPanelOpen, currentModel, availableModels } = state;
    const { apiGet } = useApiClient();

    const [statusMsg, setStatusMsg] = useState('');
    const [statusType, setStatusType] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        if (modelPanelOpen && !modelsLoaded) {
            fetchModels();
        }
    }, [modelPanelOpen]);

    const fetchModels = async () => {
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
    };

    const handleSelect = (modelId) => {
        dispatch({ type: 'SET_MODEL', modelId });
        dispatch({ type: 'CLOSE_MODEL_PANEL' });
    };

    const handleClose = () => {
        dispatch({ type: 'CLOSE_MODEL_PANEL' });
    };

    if (!modelPanelOpen) return null;

    const selectedModel = availableModels.find(m => m.id === currentModel);

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

                <div id="model-list" className="model-list">
                    {(!availableModels || availableModels.length === 0) ? (
                        <div className="model-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading AI models...</span>
                        </div>
                    ) : (
                        availableModels.map(model => (
                            <div
                                key={model.id}
                                className={`model-item ${currentModel === model.id ? 'active' : ''}`}
                                data-model={model.id}
                                onClick={() => handleSelect(model.id)}
                            >
                                <div className="model-item-icon">{model.icon}</div>
                                <div className="model-item-info">
                                    <div className="model-item-name">{escapeHtml(model.name)}</div>
                                    <div className="model-item-desc">{escapeHtml(model.description)}</div>
                                </div>
                                <div className="model-item-check">
                                    {currentModel === model.id ? '✓' : ''}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="model-panel-footer">
                    <span id="selected-model-info">
                        Currently using: <span id="current-model-name">
                            {selectedModel?.name || 'Devstral-2512'}
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
