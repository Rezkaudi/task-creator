import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { defaultModel, defaultDesignSystem } from '../../../shared/constants/plugin-config.js';

const AppContext = createContext(null);

const initialState = {
    // Status
    status: { message: '', type: '' },

    // Models
    currentModelId: defaultModel.id,
    availableModels: [],
    pointsBalance: 0,
    hasPurchased: false,

    // Design Systems
    currentDesignSystemId: defaultDesignSystem.id,
    availableDesignSystems: [],

    // Panels
    modelPanelOpen: false,
    designSystemPanelOpen: false,

    // Save Modal
    saveModalOpen: false,

    // Payments
    buyPointsModalOpen: false,

    // Export
    currentExportData: null,
    selectionInfo: null,
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SHOW_STATUS':
            return { ...state, status: { message: action.message, type: action.statusType } };
        case 'HIDE_STATUS':
            return { ...state, status: { message: '', type: '' } };

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
            return { ...state, saveModalOpen: true };
        case 'CLOSE_SAVE_MODAL':
            return { ...state, saveModalOpen: false };

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

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const showStatus = useCallback((message, type) => {
        dispatch({ type: 'SHOW_STATUS', message, statusType: type });
    }, []);

    const hideStatus = useCallback(() => {
        dispatch({ type: 'HIDE_STATUS' });
    }, []);

    const value = { state, dispatch, showStatus, hideStatus };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
