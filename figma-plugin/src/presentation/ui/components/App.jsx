import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext.jsx';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { usePluginMessage } from '../hooks/usePluginMessage.js';
import { useApiClient } from '../hooks/useApiClient.js';
import { reportErrorAsync, setHeaders as setErrorHeaders, setupGlobalHandlers } from '../errorReporter.js';
import StatusBar from './StatusBar.jsx';
import TabBar from './TabBar.jsx';
import AiTab from './tabs/AiTab.jsx';
import PasteJsonTab from './tabs/PasteJsonTab.jsx';
import ExportTab from './tabs/ExportTab.jsx';
import UILibraryTab from './tabs/UILibraryTab.jsx';
import ModelPanel from './panels/ModelPanel.jsx';
import DesignSystemPanel from './panels/DesignSystemPanel.jsx';
import SaveModal from './SaveModal.jsx';
import ResizeHandle from './ResizeHandle.jsx';
import LoginScreen from './LoginScreen.jsx';

function AppContent() {
    const { state, dispatch, showStatus, hideStatus } = useAppContext();
    const { apiGet } = useApiClient();
    const { isAuthenticated, isLoading: authLoading, user, token: authToken, logout } = useAuth();

    const [activeTab, setActiveTab] = useState('ai');
    const jsonInputRef = useRef(null);

    // Plugin message handlers
    const sendMessage = usePluginMessage({
        // Import status handlers
        'import-success': (msg) => {
            showStatus('✅ Design imported successfully!', 'success');
            setTimeout(hideStatus, 3000);
        },
        'import-error': (msg) => {
            showStatus(`❌ Import failed: ${msg.error}`, 'error');
            setTimeout(hideStatus, 3000);
            reportErrorAsync(new Error(msg.error), {
                componentName: 'ImportHandler',
                actionType: 'import-error'
            });
        },

        // Selection changed
        'selection-changed': (msg) => {
            dispatch({ type: 'SET_SELECTION_INFO', selection: msg.selection });
        },

        // Export handlers
        'export-success': (msg) => {
            showStatus(`✅ Exported ${msg.nodeCount} nodes!`, 'success');
            dispatch({ type: 'SET_EXPORT_DATA', data: msg.data });
        },
        'export-error': (msg) => {
            showStatus(`❌ Export failed: ${msg.error}`, 'error');
            setTimeout(hideStatus, 3000);
            reportErrorAsync(new Error(msg.error), {
                componentName: 'ExportHandler',
                actionType: 'export-error'
            });
        },

        // AI tab handlers - delegate to AiTab
        'layer-selected-for-edit': (msg) => AiTab.messageHandlers?.['layer-selected-for-edit']?.(msg),
        'no-layer-selected': (msg) => AiTab.messageHandlers?.['no-layer-selected']?.(msg),
        'layer-selected-for-reference': (msg) => AiTab.messageHandlers?.['layer-selected-for-reference']?.(msg),
        'ai-chat-response': (msg) => AiTab.messageHandlers?.['ai-chat-response']?.(msg),
        'ai-edit-response': (msg) => AiTab.messageHandlers?.['ai-edit-response']?.(msg),
        'ai-based-on-existing-response': (msg) => AiTab.messageHandlers?.['ai-based-on-existing-response']?.(msg),
        'ai-chat-error': (msg) => AiTab.messageHandlers?.['ai-chat-error']?.(msg),
        'ai-edit-error': (msg) => AiTab.messageHandlers?.['ai-edit-error']?.(msg),
        'ai-based-on-existing-error': (msg) => AiTab.messageHandlers?.['ai-based-on-existing-error']?.(msg),
        'design-updated': (msg) => AiTab.messageHandlers?.['design-updated']?.(msg),

        // Prototype handlers
        'frames-loaded': (msg) => AiTab.messageHandlers?.['frames-loaded']?.(msg),
        'frames-load-error': (msg) => AiTab.messageHandlers?.['frames-load-error']?.(msg),
        'prototype-connections-generated': (msg) => AiTab.messageHandlers?.['prototype-connections-generated']?.(msg),
        'prototype-connections-error': (msg) => AiTab.messageHandlers?.['prototype-connections-error']?.(msg),
        'prototype-applied': (msg) => AiTab.messageHandlers?.['prototype-applied']?.(msg),
        'prototype-apply-error': (msg) => AiTab.messageHandlers?.['prototype-apply-error']?.(msg),
    });

    // Initialize on mount (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        // Initialize error reporter headers
        const initHeaders = async () => {
            try {
                const apiClient = {
                    getHeaders: () => {
                        return new Promise((resolve, reject) => {
                            parent.postMessage({ pluginMessage: { type: 'GET_HEADERS' } }, '*');
                            const handler = (event) => {
                                if (event.data.pluginMessage?.type === 'HEADERS_RESPONSE') {
                                    window.removeEventListener('message', handler);
                                    const headers = event.data.pluginMessage.headers;
                                    // Inject auth token into headers
                                    if (authToken) {
                                        headers['Authorization'] = `Bearer ${authToken}`;
                                    }
                                    resolve(headers);
                                }
                            };
                            window.addEventListener('message', handler);
                            setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('Timeout')); }, 5000);
                        });
                    }
                };
                const headers = await apiClient.getHeaders();
                setErrorHeaders(headers);
            } catch (e) {
                console.warn('Failed to initialize error reporter headers:', e);
            }
        };
        initHeaders();

        // Preload models and design systems
        const preload = async () => {
            try {
                const [modelsData, systemsData] = await Promise.all([
                    apiGet('/api/ai-models'),
                    apiGet('/api/design-systems')
                ]);
                if (modelsData.success) {
                    dispatch({ type: 'SET_AVAILABLE_MODELS', models: modelsData.models });
                }
                if (systemsData.success) {
                    dispatch({ type: 'SET_AVAILABLE_DESIGN_SYSTEMS', systems: systemsData.systems });
                }
            } catch (e) {
                console.warn('Failed to preload:', e);
            }
        };
        preload();

        // Get selection info
        setTimeout(() => {
            sendMessage('get-selection-info');
        }, 100);
    }, [isAuthenticated, authToken]);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        hideStatus();
    }, [hideStatus]);

    const handleManualImport = useCallback(() => {
        const val = jsonInputRef.current?.trim();
        if (!val) {
            showStatus('⚠️ Please paste your design JSON.', 'warning');
            return;
        }
        try {
            const designData = JSON.parse(val);
            showStatus('📋 Importing to Figma...', 'info');
            sendMessage('import-design', { designData });
        } catch (e) {
            showStatus(`❌ Invalid JSON: ${e.message}`, 'error');
        }
    }, [sendMessage, showStatus]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return (
            <>
                <LoginScreen />
                <ResizeHandle />
            </>
        )

    }

    return (
        <div className="container">
            {/* User info bar */}
            {user && (
                <div className="user-info-bar">
                    {user.profilePicture ? (
                        <img className="user-avatar" src={user.profilePicture} alt="" />
                    ) : (
                        <div className="user-avatar-placeholder">
                            {(user.userName || user.email || '?')[0].toUpperCase()}
                        </div>
                    )}
                    <span className="user-name">{user.userName || user.email}</span>
                    <button className="logout-btn" onClick={logout}>Sign out</button>
                </div>
            )}

            <div className='content-container'>
                <StatusBar />
                <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

                {/* Tab Content */}
                {activeTab === 'ai' && (
                    <AiTab sendMessage={sendMessage} />
                )}

                {activeTab === 'manual' && (
                    <PasteJsonTab onImport={handleManualImport} valueRef={jsonInputRef} />
                )}

                {activeTab === 'export' && (
                    <ExportTab sendMessage={sendMessage} />
                )}

                {activeTab === 'ui-library' && (
                    <UILibraryTab sendMessage={sendMessage} />
                )}

                {/* Button group for manual tab */}
                {activeTab === 'manual' && (
                    <div className="button-group" id="main-button-group" style={{ display: 'flex' }}>
                        <button className="btn-primary" onClick={handleManualImport}>📋 Import JSON</button>
                        <button className="btn-secondary" onClick={() => sendMessage('cancel')}>Cancel</button>
                    </div>
                )}

                {/* Global Panels */}
                <ModelPanel />
                <DesignSystemPanel />
                <SaveModal />
                <ResizeHandle />
            </div>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </AuthProvider>
    );
}
