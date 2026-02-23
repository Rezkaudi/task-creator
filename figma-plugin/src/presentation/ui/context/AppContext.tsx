import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { toast } from 'react-toastify';
import { defaultModel, defaultDesignSystem } from '../../../shared/constants/plugin-config.js';
import type { AppState, AppAction } from '../types';

interface AppContextValue {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    showStatus: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    hideStatus: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
    currentModelId: defaultModel.id,
    availableModels: [],
    pointsBalance: 0,
    hasPurchased: false,
    subscription: null,

    currentDesignSystemId: defaultDesignSystem.id,
    availableDesignSystems: [],

    modelPanelOpen: false,
    designSystemPanelOpen: false,

    saveModalOpen: false,
    saveModalFromChat: false,

    buyPointsModalOpen: false,

    currentExportData: null,
    selectionInfo: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_MODEL':
            return { ...state, currentModelId: action.modelId };
        case 'SET_AVAILABLE_MODELS':
            return { ...state, availableModels: action.models };
        case 'SET_POINTS_BALANCE':
            return { ...state, pointsBalance: Math.max(0, Number(action.balance || 0)) };
        case 'DEDUCT_POINTS':
            return { ...state, pointsBalance: Math.max(0, state.pointsBalance - Number(action.points || 0)) };
        case 'SET_HAS_PURCHASED':
            return { ...state, hasPurchased: Boolean(action.hasPurchased) };
        case 'SET_SUBSCRIPTION':
            return { ...state, subscription: action.subscription };

        case 'SET_DESIGN_SYSTEM':
            return { ...state, currentDesignSystemId: action.systemId };
        case 'SET_AVAILABLE_DESIGN_SYSTEMS':
            return { ...state, availableDesignSystems: action.systems };

        case 'TOGGLE_MODEL_PANEL':
            return { ...state, modelPanelOpen: !state.modelPanelOpen };
        case 'CLOSE_MODEL_PANEL':
            return { ...state, modelPanelOpen: false };
        case 'OPEN_MODEL_PANEL':
            return { ...state, modelPanelOpen: true };

        case 'TOGGLE_DESIGN_SYSTEM_PANEL':
            return { ...state, designSystemPanelOpen: !state.designSystemPanelOpen };
        case 'CLOSE_DESIGN_SYSTEM_PANEL':
            return { ...state, designSystemPanelOpen: false };

        case 'OPEN_SAVE_MODAL':
            return { ...state, saveModalOpen: true, saveModalFromChat: action.fromChat ?? false };
        case 'CLOSE_SAVE_MODAL':
            return { ...state, saveModalOpen: false, saveModalFromChat: false };

        case 'OPEN_BUY_POINTS_MODAL':
            return { ...state, buyPointsModalOpen: true };
        case 'CLOSE_BUY_POINTS_MODAL':
            return { ...state, buyPointsModalOpen: false };

        case 'SET_EXPORT_DATA':
            return { ...state, currentExportData: action.data };
        case 'SET_SELECTION_INFO':
            return { ...state, selectionInfo: action.selection };

        default:
            return state;
    }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const showStatus = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        const fn = toast[type] ?? toast;
        fn(message, { autoClose: 5000 });
    }, []);

    const hideStatus = useCallback(() => {
        toast.dismiss();
    }, []);

    const value: AppContextValue = { state, dispatch, showStatus, hideStatus };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext(): AppContextValue {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
