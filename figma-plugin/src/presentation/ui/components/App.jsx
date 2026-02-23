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
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);
    const jsonInputRef = useRef(null);
    const pendingSaveRef = useRef(false);

    // Close credits dropdown on outside click
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

    // Close profile dropdown on outside click
    useEffect(() => {
        if (!profileDropdownOpen) return;
        const handleClick = (e) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [profileDropdownOpen]);

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
            // showStatus('✅ Design imported successfully!', 'success');
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
            // showStatus(`✅ Exported ${msg.nodeCount} nodes!`, 'success');
            dispatch({ type: 'SET_EXPORT_DATA', data: msg.data });
            if (pendingSaveRef.current) {
                pendingSaveRef.current = false;
                dispatch({ type: 'OPEN_SAVE_MODAL' });
            }
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

    const handleSaveSelected = useCallback(() => {
        if (!state.selectionInfo || state.selectionInfo.count === 0) {
            showStatus('⚠️ Select a layer in Figma to save', 'warning');
            return;
        }
        pendingSaveRef.current = true;
        sendMessage('export-selected');
    }, [state.selectionInfo, sendMessage, showStatus]);

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
            // showStatus('📋 Importing to Figma...', 'info');
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
                    {/* Profile avatar — click to open profile dropdown */}
                    <div className="profile-dropdown-wrapper" ref={profileDropdownRef}>
                        <button
                            className={`profile-avatar-btn ${profileDropdownOpen ? 'open' : ''}`}
                            onClick={() => setProfileDropdownOpen(prev => !prev)}
                            title="Profile"
                        >
                            {user.profilePicture ? (
                                <img className="user-avatar" src={user.profilePicture} alt="" />
                            ) : (
                                <div className="user-avatar-placeholder">
                                    {(user.userName || user.email || '?')[0].toUpperCase()}
                                </div>
                            )}
                            <svg className="profile-avatar-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {profileDropdownOpen && (
                            <div className="profile-dropdown">
                                {/* User header */}
                                <div className="profile-dd-header">
                                    {user.profilePicture ? (
                                        <img className="profile-dd-avatar" src={user.profilePicture} alt="" />
                                    ) : (
                                        <div className="profile-dd-avatar-placeholder">
                                            {(user.userName || user.email || '?')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="profile-dd-user-info">
                                        <div className="profile-dd-name">{user.userName || 'User'}</div>
                                        <div className="profile-dd-email">{user.email}</div>
                                    </div>
                                </div>

                                <div className="profile-dd-divider" />

                                {/* Points section */}
                                <div className="profile-dd-section-label">Points</div>
                                {authSubscription && (
                                    <div className="profile-dd-points-row">
                                        <div className="profile-dd-points-info">
                                            <span className="profile-dd-points-badge">
                                                {authSubscription.planId === 'premium' ? 'Premium' : 'Basic'}
                                            </span>
                                            <span className="profile-dd-points-val green">
                                                {Number((authSubscription.dailyPointsLimit || 0) - (authSubscription.dailyPointsUsed || 0)).toLocaleString()} pts
                                            </span>
                                            <span className="profile-dd-points-sub">remaining today</span>
                                        </div>
                                        <div className="profile-dd-bar">
                                            <div
                                                className="profile-dd-bar-fill"
                                                style={{ width: `${Math.min(100, (authSubscription.dailyPointsUsed / authSubscription.dailyPointsLimit) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {state.pointsBalance > 0 && (
                                    <div className="profile-dd-points-row">
                                        <span className="profile-dd-points-val blue">{Number(state.pointsBalance).toLocaleString()} pts</span>
                                        <span className="profile-dd-points-sub">one-time balance</span>
                                    </div>
                                )}
                                {!authSubscription && state.pointsBalance === 0 && (
                                    <div className="profile-dd-empty">No credits yet</div>
                                )}

                                <div className="profile-dd-divider" />

                                {/* Actions */}
                                <button
                                    className="profile-dd-item accent"
                                    onClick={() => {
                                        setProfileDropdownOpen(false);
                                        dispatch({ type: 'OPEN_BUY_POINTS_MODAL' });
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M10.5 4.5H5.25a1.75 1.75 0 000 3.5h3.5a1.75 1.75 0 010 3.5H3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Buy Points / Plan
                                </button>

                                <button
                                    className="profile-dd-item"
                                    onClick={() => {
                                        setProfileDropdownOpen(false);
                                        setActiveTab(activeTab === 'import-export' ? 'ai' : 'import-export');
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 5.5L7 3 4.5 5.5M7 3v7M2.5 11h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Import / Export
                                </button>

                                <button
                                    className="profile-dd-item"
                                    onClick={() => {
                                        setProfileDropdownOpen(false);
                                        handleSaveSelected();
                                    }}
                                    disabled={!state.selectionInfo || state.selectionInfo.count === 0}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 11.5h9M7 2v7.5M4 6.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Save Selected to Library
                                </button>

                                <div className="profile-dd-divider" />

                                <button className="profile-dd-item" onClick={() => { setProfileDropdownOpen(false); window.open('https://example.com/about', '_blank', 'noopener,noreferrer'); }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" /><path d="M7 4.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                    About Us
                                </button>

                                <button className="profile-dd-item" onClick={() => { setProfileDropdownOpen(false); window.open('https://example.com/privacy', '_blank', 'noopener,noreferrer'); }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM7 5v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                    Privacy Policy
                                </button>

                                <button className="profile-dd-item" onClick={() => { setProfileDropdownOpen(false); window.open('https://example.com/contact', '_blank', 'noopener,noreferrer'); }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4.5h9M2.5 9.5h9M1.5 7h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                    Contact Us
                                </button>

                                <div className="profile-dd-divider" />

                                <button
                                    className="profile-dd-item danger"
                                    onClick={() => {
                                        setProfileDropdownOpen(false);
                                        logout();
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 4.5l3 2.5-3 2.5M12 7H5.5M5.5 2.5h-3v9h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* <div className="user-name">
                        <span>{user.userName || user.email}</span>
                    </div> */}

                    {/* <div className="credits-dropdown-wrapper" ref={creditsDropdownRef}>
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
                    </div> */}

                    {/* <button className="logout-btn" onClick={logout}>Sign out</button> */}
                    {/* <button
                        className="import-export-btn"
                        title={state.selectionInfo?.count > 0 ? `Save selected to Library` : 'Select a layer to save'}
                        onClick={handleSaveSelected}
                        disabled={!state.selectionInfo || state.selectionInfo.count === 0}
                    >💾</button>
                    <button className="import-export-btn" title='Import / Export' onClick={() => {
                        setActiveTab(activeTab === 'import-export' ? 'ai' : 'import-export');
                    }}>📋</button> */}
                </div>
            )}

            <div className='content-container'>
                <ToastContainer position="top-right" autoClose={5000} />
                {/* <TabBar activeTab={activeTab} onTabChange={handleTabChange} /> */}

                {/* Tab Content */}
                {activeTab === 'ai' && (
                    <AiTab sendMessage={sendMessage} onSaveSelected={handleSaveSelected} />
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
