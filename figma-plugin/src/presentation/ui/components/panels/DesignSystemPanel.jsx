import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useApiClient } from '../../hooks/useApiClient.js';
import { escapeHtml } from '../../utils.js';
import { reportErrorAsync } from '../../errorReporter.js';
import '../../styles/ModelPanel.css';
import { defaultDesignSystem } from '../../../../shared/constants/plugin-config.js';

export default function DesignSystemPanel() {
    const { state, dispatch } = useAppContext();
    const { designSystemPanelOpen, currentDesignSystemId, availableDesignSystems } = state;
    const { apiGet } = useApiClient();

    const [statusMsg, setStatusMsg] = useState('');
    const [statusType, setStatusType] = useState('');
    const [systemsLoaded, setSystemsLoaded] = useState(false);

    async function fetchSystems() {
        try {
            setStatusMsg('🔄 Loading design systems...');
            setStatusType('info');

            const data = await apiGet('/api/design-systems');

            if (!data.success) {
                throw new Error(data.message || 'Failed to load design systems');
            }

            dispatch({ type: 'SET_AVAILABLE_DESIGN_SYSTEMS', systems: data.systems });
            setSystemsLoaded(true);
            setStatusMsg(`✅ Loaded ${data.count} design systems`);
            setStatusType('success');
            setTimeout(() => { setStatusMsg(''); }, 2000);
        } catch (error) {
            console.error('Failed to fetch design systems:', error);
            setStatusMsg('⚠️ Using default system');
            setStatusType('warning');
            reportErrorAsync(error, {
                componentName: 'DesignSystemSelection',
                actionType: 'fetchDesignSystems'
            });
        }
    }

    useEffect(() => {
        if (designSystemPanelOpen && !systemsLoaded) {
            fetchSystems();
        }
    }, [designSystemPanelOpen]);

    const handleSelect = (systemId) => {
        dispatch({ type: 'SET_DESIGN_SYSTEM', systemId });
        dispatch({ type: 'CLOSE_DESIGN_SYSTEM_PANEL' });
        try {
            localStorage.setItem('figma-design-system', systemId);
        } catch (e) {
            console.log('LocalStorage save error:', e);
        }
    };

    const handleClose = () => {
        dispatch({ type: 'CLOSE_DESIGN_SYSTEM_PANEL' });
    };

    if (!designSystemPanelOpen) return null;

    const selectedSystem = availableDesignSystems.find(s => s.id === currentDesignSystemId);

    return (
        <>
            <div
                id="design-system-panel-backdrop"
                className="model-panel-backdrop"
                style={{ display: 'block' }}
                onClick={handleClose}
            />
            <div id="design-system-panel" className="model-panel" style={{ display: 'block' }}>
                <div className="model-panel-header">
                    <h3>🎨 Select Design System</h3>
                    <button className="close-model-panel" onClick={handleClose}>×</button>
                </div>

                <div id="design-system-list" className="model-list">
                    {(!availableDesignSystems || availableDesignSystems.length === 0) ? (
                        <div className="model-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading design systems...</span>
                        </div>
                    ) : (
                        availableDesignSystems.map(system => (
                            <div
                                key={system.id}
                                className={`model-item ${currentDesignSystemId === system.id ? 'active' : ''}`}
                                data-system={system.id}
                                onClick={() => handleSelect(system.id)}
                            >
                                <div className="model-item-icon">{system.icon}</div>
                                <div className="model-item-info">
                                    <div className="model-item-name">{escapeHtml(system.name)}</div>
                                    <div className="model-item-desc">{escapeHtml(system.description)}</div>
                                </div>
                                <div className="model-item-check">
                                    {currentDesignSystemId === system.id ? '✓' : ''}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="model-panel-footer">
                    <span id="selected-design-system-info">
                        Currently using: <span id="current-design-system-name">
                            {selectedSystem?.name || defaultDesignSystem.name}
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
