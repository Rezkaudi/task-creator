import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext.jsx';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { usePluginMessage } from '../hooks/usePluginMessage.js';
import { useApiClient } from '../hooks/useApiClient.js';
import { reportErrorAsync, setHeaders as setErrorHeaders, setupGlobalHandlers } from '../errorReporter.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import BuyPointsModal from './BuyPointsModal.jsx';
import FigmaIcon from './FigmaIcon.jsx';

function AppContent() {
    const { state, dispatch, showStatus, hideStatus } = useAppContext();
    const { apiGet } = useApiClient();
    const {
        isAuthenticated,
        isLoading: authLoading,
        user,
        token: authToken,
        pointsBalance: authPointsBalance,
        hasPurchased: authHasPurchased,
        subscription: authSubscription,
        logout,
        updatePointsBalance
    } = useAuth();

    const [activeTab, setActiveTab] = useState('ai');
    const [creditsDropdownOpen, setCreditsDropdownOpen] = useState(false);
    const creditsDropdownRef = useRef(null);
    const jsonInputRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!creditsDropdownOpen) return;
        const handleClick = (e) => {
            if (creditsDropdownRef.current && !creditsDropdownRef.current.contains(e.target)) {
                setCreditsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [creditsDropdownOpen]);

    const totalCredits = useMemo(() => {
        let total = Number(state.pointsBalance || 0);
        if (authSubscription) {
            total += Math.max(0, (authSubscription.dailyPointsLimit || 0) - (authSubscription.dailyPointsUsed || 0));
        }
        return total;
    }, [state.pointsBalance, authSubscription]);

    // Plugin message handlers
    const sendMessage = usePluginMessage({
        // Import status handlers
        'import-success': (msg) => {
            showStatus('✅ Design imported successfully!', 'success');
        },
        'import-error': (msg) => {
            showStatus(`❌ Import failed: ${msg.error}`, 'error');
            reportErrorAsync(new Error(msg.error), {
                componentName: 'ImportHandler',
                actionType: 'import-error'
            });
        },

        // Selection changed
        'selection-changed': (msg) => {
            dispatch({ type: 'SET_SELECTION_INFO', selection: msg.selection });
            AiTab.messageHandlers?.['selection-changed']?.(msg);
        },

        // Export handlers
        'export-success': (msg) => {
            showStatus(`✅ Exported ${msg.nodeCount} nodes!`, 'success');
            dispatch({ type: 'SET_EXPORT_DATA', data: msg.data });
        },
        'export-error': (msg) => {
            showStatus(`❌ Export failed: ${msg.error}`, 'error');
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
        'points-updated': (msg) => {
            // Update AppContext
            dispatch({ type: 'SET_POINTS_BALANCE', balance: msg.balance || 0 });
            dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: Boolean(msg.hasPurchased) });
            // Update AuthContext to immediately reflect changes in UI
            updatePointsBalance(msg.balance || 0, Boolean(msg.hasPurchased));
        },
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

    useEffect(() => {
        if (!isAuthenticated) return;
        dispatch({ type: 'SET_POINTS_BALANCE', balance: authPointsBalance || 0 });
        dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: Boolean(authHasPurchased) });
        dispatch({ type: 'SET_SUBSCRIPTION', subscription: authSubscription });
    }, [isAuthenticated, authPointsBalance, authHasPurchased, authSubscription, dispatch]);

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
                    <div className="user-name">
                        <span>{user.userName || user.email}</span>
                    </div>

                    <div className="credits-dropdown-wrapper" ref={creditsDropdownRef}>
                        <button
                            className={`credits-trigger ${creditsDropdownOpen ? 'open' : ''}`}
                            onClick={() => setCreditsDropdownOpen(prev => !prev)}
                        >
                            <span className="credits-trigger-value">{totalCredits.toLocaleString()} pts</span>
                            <svg className="credits-trigger-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {creditsDropdownOpen && (
                            <div className="credits-dropdown">
                                {authSubscription && (
                                    <div className="credits-dd-section">
                                        <div className="credits-dd-section-header">
                                            <span className="credits-dd-label">Subscription</span>
                                            <span className="credits-dd-plan-badge">
                                                {authSubscription.planId === 'premium' ? 'Premium' : 'Basic'}
                                            </span>
                                        </div>
                                        <div className="credits-dd-value green">
                                            {Number((authSubscription.dailyPointsLimit || 0) - (authSubscription.dailyPointsUsed || 0)).toLocaleString()} pts
                                        </div>
                                        <div className="credits-dd-sub">remaining today</div>
                                        <div className="credits-dd-bar">
                                            <div
                                                className="credits-dd-bar-fill"
                                                style={{ width: `${Math.min(100, (authSubscription.dailyPointsUsed / authSubscription.dailyPointsLimit) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="credits-dd-usage">
                                            {authSubscription.dailyPointsUsed} / {authSubscription.dailyPointsLimit} used
                                        </div>
                                    </div>
                                )}

                                {authSubscription && state.pointsBalance > 0 && (
                                    <div className="credits-dd-divider" />
                                )}

                                {state.pointsBalance > 0 && (
                                    <div className="credits-dd-section">
                                        <div className="credits-dd-section-header">
                                            <span className="credits-dd-label">One-time Balance</span>
                                        </div>
                                        <div className="credits-dd-value blue">
                                            {Number(state.pointsBalance).toLocaleString()} pts
                                        </div>
                                        <div className="credits-dd-sub">purchased points</div>
                                    </div>
                                )}

                                {!authSubscription && state.pointsBalance === 0 && (
                                    <div className="credits-dd-section">
                                        <div className="credits-dd-empty">No credits yet</div>
                                    </div>
                                )}

                                <div className="credits-dd-actions">
                                    <button
                                        className="credits-dd-buy-btn"
                                        onClick={() => {
                                            setCreditsDropdownOpen(false);
                                            dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
                                        }}
                                    >
                                        Buy Credits
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* <button className="logout-btn" onClick={logout}>Sign out</button> */}
                    <button className="import-export-btn" title='Import / Export' onClick={() => {
                        setActiveTab('import-export');
                    }}>📋</button>
                </div>
            )}

            <div className='content-container'>
                <ToastContainer position="top-right" autoClose={5000} />
                <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

                {/* Tab Content */}
                {activeTab === 'ai' && (
                    <AiTab sendMessage={sendMessage} />
                )}

                {activeTab === 'import-export' && (
                    <div className="import-export-wrapper">
                        <ExportTab sendMessage={sendMessage} />
                        <div className="section-divider">
                            <span>Paste JSON</span>
                        </div>
                        <PasteJsonTab onImport={handleManualImport} valueRef={jsonInputRef} />
                        <div className="button-group import-btn-group">
                            <button className="btn-primary import-to-figma-btn" onClick={handleManualImport}>
                                <FigmaIcon />
                                Add to Figma
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'ui-library' && (
                    <UILibraryTab sendMessage={sendMessage} />
                )}

                {/* Global Panels */}
                <ModelPanel />
                <DesignSystemPanel />
                <SaveModal />
                <BuyPointsModal />
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
