import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext.tsx';
import { AuthProvider, useAuth } from '../context/AuthContext.tsx';
import { usePluginMessage } from '../hooks/usePluginMessage.ts';
import { useApiClient } from '../hooks/useApiClient.ts';
import { useDropdown } from '../hooks/useDropdown.ts';
import { reportErrorAsync, setHeaders as setErrorHeaders } from '../utils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AiTab from './tabs/AiTab.tsx';
import PasteJsonTab from './tabs/PasteJsonTab.tsx';
import ExportTab from './tabs/ExportTab.tsx';
import SaveModal from './SaveModal.tsx';
import ResizeHandle from './ResizeHandle.tsx';
import LoginScreen from './LoginScreen.tsx';
import BuyPointsModal from './BuyPointsModal.tsx';
import FigmaIcon from './FigmaIcon.tsx';
import { ProfileDropdown } from './modals/ProfileDropdown.tsx';
import { PluginMessage } from '../types/index.ts';

function AppContent(): React.JSX.Element {
    const { state, dispatch, showStatus } = useAppContext();
    const { apiGet } = useApiClient();
    const {
        isAuthenticated,
        isLoading: authLoading,
        user,
        token: authToken,
        pointsBalance: authPointsBalance,
        hasPurchased: authHasPurchased,
        subscription: authSubscription,
        updatePointsBalance
    } = useAuth();

    const [activeTab, setActiveTab] = useState('ai');
    const [isManualImporting, setIsManualImporting] = useState(false);
    const profileDropdown = useDropdown();
    const jsonInputRef = useRef<string | null>(null);
    const pendingSaveRef = useRef(false);

    const sendMessage = usePluginMessage({
        'import-success': (_msg: PluginMessage) => {
            setIsManualImporting(false);
        },
        'import-error': (msg: PluginMessage) => {
            setIsManualImporting(false);
            showStatus(`❌ Import failed: ${msg.error as string}`, 'error');
            reportErrorAsync(new Error(msg.error as string), { componentName: 'ImportHandler', actionType: 'import-error' });
        },
        'selection-changed': (msg: PluginMessage) => {
            dispatch({ type: 'SET_SELECTION_INFO', selection: msg.selection as never });
            AiTab.messageHandlers?.['selection-changed']?.(msg);
        },
        'export-success': (msg: PluginMessage) => {
            dispatch({ type: 'SET_EXPORT_DATA', data: msg.data });
            if (pendingSaveRef.current) {
                pendingSaveRef.current = false;
                dispatch({ type: 'OPEN_SAVE_MODAL' });
            }
        },
        'export-error': (msg: PluginMessage) => {
            showStatus(`❌ Export failed: ${msg.error as string}`, 'error');
            reportErrorAsync(new Error(msg.error as string), { componentName: 'ExportHandler', actionType: 'export-error' });
        },

        'layer-selected-for-edit': (msg: PluginMessage) => AiTab.messageHandlers?.['layer-selected-for-edit']?.(msg),
        'no-layer-selected': (msg: PluginMessage) => AiTab.messageHandlers?.['no-layer-selected']?.(msg),
        'layer-selected-for-reference': (msg: PluginMessage) => AiTab.messageHandlers?.['layer-selected-for-reference']?.(msg),
        'ai-chat-response': (msg: PluginMessage) => AiTab.messageHandlers?.['ai-chat-response']?.(msg),
        'ai-edit-response': (msg: PluginMessage) => AiTab.messageHandlers?.['ai-edit-response']?.(msg),
        'ai-based-on-existing-response': (msg: PluginMessage) => AiTab.messageHandlers?.['ai-based-on-existing-response']?.(msg),
        'ai-chat-error': (msg: PluginMessage) => AiTab.messageHandlers?.['ai-chat-error']?.(msg),
        'ai-edit-error': (msg: PluginMessage) => AiTab.messageHandlers?.['ai-edit-error']?.(msg),
        'ai-based-on-existing-error': (msg: PluginMessage) => AiTab.messageHandlers?.['ai-based-on-existing-error']?.(msg),
        'design-updated': (msg: PluginMessage) => AiTab.messageHandlers?.['design-updated']?.(msg),

        'frames-loaded': (msg: PluginMessage) => AiTab.messageHandlers?.['frames-loaded']?.(msg),
        'frames-load-error': (msg: PluginMessage) => AiTab.messageHandlers?.['frames-load-error']?.(msg),
        'prototype-connections-generated': (msg: PluginMessage) => AiTab.messageHandlers?.['prototype-connections-generated']?.(msg),
        'prototype-connections-error': (msg: PluginMessage) => AiTab.messageHandlers?.['prototype-connections-error']?.(msg),
        'prototype-applied': (msg: PluginMessage) => AiTab.messageHandlers?.['prototype-applied']?.(msg),
        'prototype-apply-error': (msg: PluginMessage) => AiTab.messageHandlers?.['prototype-apply-error']?.(msg),
        'points-updated': (msg: PluginMessage) => {
            dispatch({ type: 'SET_POINTS_BALANCE', balance: (msg.balance as number) || 0 });
            dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: Boolean(msg.hasPurchased) });
            updatePointsBalance((msg.balance as number) || 0, Boolean(msg.hasPurchased));
        },
    });

    useEffect(() => {
        if (!isAuthenticated) return;

        const initHeaders = async () => {
            try {
                const headers = await new Promise<Record<string, string>>((resolve, reject) => {
                    parent.postMessage({ pluginMessage: { type: 'GET_HEADERS' } }, '*');
                    const handler = (event: MessageEvent) => {
                        if (event.data.pluginMessage?.type === 'HEADERS_RESPONSE') {
                            window.removeEventListener('message', handler);
                            const hdrs: Record<string, string> = event.data.pluginMessage.headers;
                            if (authToken) hdrs['Authorization'] = `Bearer ${authToken}`;
                            resolve(hdrs);
                        }
                    };
                    window.addEventListener('message', handler);
                    setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('Timeout')); }, 5000);
                });
                setErrorHeaders(headers);
            } catch (e) {
                console.warn('Failed to initialize error reporter headers:', e);
            }
        };
        initHeaders();

        const preload = async () => {
            try {
                const [modelsData, systemsData] = await Promise.all([
                    apiGet('/api/ai-models'),
                    apiGet('/api/design-systems')
                ]);
                if (modelsData.success) dispatch({ type: 'SET_AVAILABLE_MODELS', models: modelsData.models });
                if (systemsData.success) dispatch({ type: 'SET_AVAILABLE_DESIGN_SYSTEMS', systems: systemsData.systems });
            } catch (e) {
                console.warn('Failed to preload:', e);
            }
        };
        preload();

        setTimeout(() => { sendMessage('get-selection-info'); }, 100);
    }, [isAuthenticated, authToken]);

    useEffect(() => {
        if (!isAuthenticated) return;
        dispatch({ type: 'SET_POINTS_BALANCE', balance: authPointsBalance || 0 });
        dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: Boolean(authHasPurchased) });
        dispatch({ type: 'SET_SUBSCRIPTION', subscription: authSubscription });
    }, [isAuthenticated, authPointsBalance, authHasPurchased, authSubscription, dispatch]);

    const handleSaveSelected = useCallback(() => {
        if (!state.selectionInfo || state.selectionInfo.count === 0) {
            showStatus('Select a layer in Figma to save', 'warning');
            return;
        }
        pendingSaveRef.current = true;
        sendMessage('export-selected');
    }, [state.selectionInfo, sendMessage, showStatus]);

    const handleManualImport = useCallback(() => {
        const val = jsonInputRef.current?.trim();
        if (!val) {
            showStatus('⚠️ Please paste your design JSON.', 'warning');
            return;
        }
        try {
            const designData = JSON.parse(val);
            setIsManualImporting(true);
            sendMessage('import-design', { designData });
        } catch (e) {
            showStatus(`❌ Invalid JSON: ${(e as Error).message}`, 'error');
        }
    }, [sendMessage, showStatus]);

    if (authLoading) {
        return (
            <div className="container">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                <LoginScreen />
                <ResizeHandle />
            </>
        );
    }

    return (
        <div className="container">
            {user && (
                <div className="user-info-bar">
                    <div
                        className="profile-dropdown-wrapper"
                        ref={profileDropdown.ref as React.RefObject<HTMLDivElement>}
                    >
                        <button
                            className={`profile-avatar-btn ${profileDropdown.isOpen ? 'open' : ''}`}
                            onClick={profileDropdown.toggle}
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

                        {profileDropdown.isOpen && (
                            <ProfileDropdown
                                user={user}
                                subscription={authSubscription}
                                pointsBalance={state.pointsBalance}
                                selectionInfo={state.selectionInfo}
                                activeTab={activeTab}
                                onBuyPoints={() => dispatch({ type: 'OPEN_BUY_POINTS_MODAL' })}
                                onImportExport={() => setActiveTab(activeTab === 'import-export' ? 'ai' : 'import-export')}
                                onSaveSelected={handleSaveSelected}
                                onClose={profileDropdown.close}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="content-container">
                <ToastContainer position="top-right" autoClose={5000} />

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
                            <button
                                className={`btn-primary import-to-figma-btn${isManualImporting ? ' is-importing' : ''}`}
                                onClick={handleManualImport}
                                disabled={isManualImporting}
                            >
                                {isManualImporting
                                    ? <><span className="btn-spinner" />Importing...</>
                                    : <><FigmaIcon />Add to Figma</>}
                            </button>
                        </div>
                    </div>
                )}
                <SaveModal />
                <BuyPointsModal />
                <ResizeHandle />
            </div>
        </div>
    );
}

export default function App(): React.JSX.Element {
    return (
        <AuthProvider>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </AuthProvider>
    );
}
