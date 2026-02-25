import React from 'react';

// ── Domain Models ────────────────────────────────────────────────────

export interface User {
    userName?: string;
    email: string;
    profilePicture?: string;
}

export interface Subscription {
    planId: 'basic' | 'premium';
    dailyPointsLimit: number;
    dailyPointsUsed: number;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string;
}

export interface Project {
    id: string;
    name: string;
    componentCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface UIComponent {
    id: string;
    name: string;
    description?: string;
    designJson: unknown;
    previewImage?: string;
    createdAt?: string;
}

export interface Frame {
    id: string;
    name: string;
    width: number;
    height: number;
    interactiveElements?: unknown[];
    designJson?: unknown;
}

export interface SelectionInfo {
    count: number;
    names?: string[];
    nodes?: Array<{ id: string; name: string; width?: number; height?: number }>;
}

export interface PointsPackage {
    id: string;
    name: string;
    points: number;
    priceUsd: number;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    dailyPointsLimit: number;
    priceUsd: number;
}

// ── API Response Types ───────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface ProjectsResponse {
    success: boolean;
    projects: Project[];
    message?: string;
}

export interface ComponentsResponse {
    success: boolean;
    components: UIComponent[];
    message?: string;
}

// ── Plugin Message Types ─────────────────────────────────────────────

export type PluginMessageType =
    | 'import-success' | 'import-error'
    | 'selection-changed'
    | 'export-success' | 'export-error'
    | 'layer-selected-for-edit' | 'no-layer-selected'
    | 'layer-selected-for-reference'
    | 'ai-chat-response' | 'ai-edit-response' | 'ai-based-on-existing-response'
    | 'ai-chat-error' | 'ai-edit-error' | 'ai-based-on-existing-error'
    | 'design-updated'
    | 'frames-loaded' | 'frames-load-error'
    | 'prototype-connections-generated' | 'prototype-connections-error'
    | 'prototype-applied' | 'prototype-apply-error'
    | 'points-updated';

export interface PluginMessage {
    type: PluginMessageType | string;
    [key: string]: unknown;
}

// ── App State ────────────────────────────────────────────────────────

export interface AiModel {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    isFree?: boolean;
}

export interface DesignSystem {
    id: string;
    name: string;
    icon?: string;
    description?: string;
}

export interface CostInfo {
    inputCost: string;
    inputTokens: number;
    outputCost: string;
    outputTokens: number;
    totalCost: string;
    duration?: number;
}

export interface PrototypeConnection {
    sourceNodeName: string;
    targetFrameName: string;
    trigger: string;
    animation: { type: string };
    reasoning?: string;
}

export interface AppState {
    currentModelId: string;
    availableModels: AiModel[];
    pointsBalance: number;
    hasPurchased: boolean;
    subscription: Subscription | null;
    currentDesignSystemId: string;
    availableDesignSystems: DesignSystem[];
    modelPanelOpen: boolean;
    designSystemPanelOpen: boolean;
    saveModalOpen: boolean;
    saveModalFromChat: boolean;
    buyPointsModalOpen: boolean;
    currentExportData: unknown;
    selectionInfo: SelectionInfo | null;
    lastSavedProjectId: string | null;
}

export type AppAction =
    | { type: 'SET_MODEL'; modelId: string }
    | { type: 'SET_AVAILABLE_MODELS'; models: AiModel[] }
    | { type: 'SET_POINTS_BALANCE'; balance: number }
    | { type: 'DEDUCT_POINTS'; points: number }
    | { type: 'SET_HAS_PURCHASED'; hasPurchased: boolean }
    | { type: 'SET_SUBSCRIPTION'; subscription: Subscription | null }
    | { type: 'SET_DESIGN_SYSTEM'; systemId: string }
    | { type: 'SET_AVAILABLE_DESIGN_SYSTEMS'; systems: DesignSystem[] }
    | { type: 'TOGGLE_MODEL_PANEL' }
    | { type: 'CLOSE_MODEL_PANEL' }
    | { type: 'OPEN_MODEL_PANEL' }
    | { type: 'TOGGLE_DESIGN_SYSTEM_PANEL' }
    | { type: 'CLOSE_DESIGN_SYSTEM_PANEL' }
    | { type: 'OPEN_SAVE_MODAL'; fromChat?: boolean }
    | { type: 'CLOSE_SAVE_MODAL' }
    | { type: 'OPEN_BUY_POINTS_MODAL' }
    | { type: 'CLOSE_BUY_POINTS_MODAL' }
    | { type: 'SET_EXPORT_DATA'; data: unknown }
    | { type: 'SET_SELECTION_INFO'; selection: SelectionInfo | null }
    | { type: 'COMPONENT_SAVED'; projectId: string }
    | { type: 'CLEAR_COMPONENT_SAVED' };

// ── Auth State ───────────────────────────────────────────────────────

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    token: string | null;
    pointsBalance: number;
    hasPurchased: boolean;
    subscription: Subscription | null;
    error: string | null;
}

// ── Shared Utility Types ─────────────────────────────────────────────

export type SendMessageFn = (type: string, data?: Record<string, unknown>) => void;

export type DeleteTarget = {
    type: 'project' | 'component';
    id: string;
    name: string;
} | null;

export interface UseDropdownReturn {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    ref: React.RefObject<HTMLElement | null>;
    toggle: () => void;
    close: () => void;
}

export interface UseUILibraryReturn {
    projects: Project[];
    selectedProjectId: string | null;
    selectedProject: Project | null;
    components: UIComponent[];
    loadingProjects: boolean;
    loadingComponents: boolean;
    showCreateProjectModal: boolean;
    newProjectName: string;
    isCreatingProject: boolean;
    deleteConfirm: DeleteTarget;
    isDeleting: boolean;
    setSelectedProjectId: (id: string | null) => void;
    setShowCreateProjectModal: (show: boolean) => void;
    setNewProjectName: (name: string) => void;
    setDeleteConfirm: (target: DeleteTarget) => void;
    loadProjects: () => Promise<void>;
    handleCreateProject: () => Promise<void>;
    handleConfirmDelete: () => Promise<void>;
    handleImportComponent: (component: UIComponent, sendMessage: SendMessageFn) => void;
    handleBackToProjects: () => void;
}
