import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useApiClient } from './useApiClient.ts';
import { reportErrorAsync } from '../utils/errorReporter.js';
import { API_PATHS, FALLBACK_PREVIEW_SVG } from '../utils/constants';
import type { Project, UIComponent, DeleteTarget, UseUILibraryReturn, SendMessageFn } from '../types';

export function getPreviewSrc(component: UIComponent): string {
    if (component.previewImage) return component.previewImage;
    return `data:image/svg+xml,${encodeURIComponent(FALLBACK_PREVIEW_SVG)}`;
}

export function useUILibrary(callerName: string): UseUILibraryReturn {
    const { state, dispatch, showStatus } = useAppContext();
    const { apiGet, apiPost, apiDelete } = useApiClient();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [components, setComponents] = useState<UIComponent[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingComponents, setLoadingComponents] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteTarget>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [importingComponentId, setImportingComponentId] = useState<string | null>(null);

    const selectedProject = useMemo(
        () => projects.find(p => p.id === selectedProjectId) ?? null,
        [projects, selectedProjectId]
    );

    const loadProjects = useCallback(async () => {
        try {
            setLoadingProjects(true);
            const data = await apiGet(API_PATHS.PROJECTS);
            if (!data.success) throw new Error(data.message || 'Failed to load projects');
            const next: Project[] = data.projects || [];
            setProjects(next);
            if (next.length === 0) {
                setSelectedProjectId(null);
                setComponents([]);
            }
        } catch (error) {
            showStatus(`❌ ${(error as Error).message}`, 'error');
            reportErrorAsync(error as Error, { componentName: callerName, actionType: 'loadProjects' });
        } finally {
            setLoadingProjects(false);
        }
    }, [apiGet, showStatus, callerName]);

    const loadComponents = useCallback(async (projectId: string | null) => {
        if (!projectId) { setComponents([]); return; }
        try {
            setLoadingComponents(true);
            const data = await apiGet(`${API_PATHS.PROJECTS}/${projectId}/components`);
            if (!data.success) throw new Error(data.message || 'Failed to load components');
            setComponents(data.components || []);
        } catch (error) {
            showStatus(`❌ ${(error as Error).message}`, 'error');
            reportErrorAsync(error as Error, { componentName: callerName, actionType: 'loadComponents' });
            setComponents([]);
        } finally {
            setLoadingComponents(false);
        }
    }, [apiGet, showStatus, callerName]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        if (!selectedProjectId) { setComponents([]); return; }
        loadComponents(selectedProjectId);
    }, [selectedProjectId, loadComponents]);

    useEffect(() => {
        if (!state.lastSavedProjectId) return;
        if (state.lastSavedProjectId === selectedProjectId) {
            loadComponents(selectedProjectId);
        }
        dispatch({ type: 'CLEAR_COMPONENT_SAVED' });
    }, [state.lastSavedProjectId]);

    const handleCreateProject = useCallback(async () => {
        if (!newProjectName.trim()) {
            showStatus('⚠️ Please enter a project name', 'warning');
            return;
        }
        try {
            setIsCreatingProject(true);
            const data = await apiPost(API_PATHS.PROJECTS, { name: newProjectName.trim() });
            if (!data.success) throw new Error(data.message || 'Failed to create project');
            setShowCreateProjectModal(false);
            setNewProjectName('');
            await loadProjects();
            if (data.project?.id) setSelectedProjectId(data.project.id);
        } catch (error) {
            showStatus(`❌ ${(error as Error).message}`, 'error');
            reportErrorAsync(error as Error, { componentName: callerName, actionType: 'createProject' });
        } finally {
            setIsCreatingProject(false);
        }
    }, [newProjectName, apiPost, loadProjects, showStatus, callerName]);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteConfirm) return;
        try {
            setIsDeleting(true);
            if (deleteConfirm.type === 'project') {
                const data = await apiDelete(`${API_PATHS.PROJECTS}/${deleteConfirm.id}`);
                if (!data.success) throw new Error(data.message || 'Failed to delete project');
                setSelectedProjectId(null);
                setComponents([]);
                await loadProjects();
            } else {
                const data = await apiDelete(`${API_PATHS.COMPONENTS}/${deleteConfirm.id}`);
                if (!data.success) throw new Error(data.message || 'Failed to delete component');
                await loadComponents(selectedProjectId);
            }
        } catch (error) {
            showStatus(`❌ ${(error as Error).message}`, 'error');
            reportErrorAsync(error as Error, {
                componentName: callerName,
                actionType: deleteConfirm.type === 'project' ? 'deleteProject' : 'deleteComponent',
            });
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    }, [deleteConfirm, apiDelete, loadProjects, loadComponents, selectedProjectId, showStatus, callerName]);

    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const msg = event.data?.pluginMessage;
            if (!msg) return;
            if (msg.type === 'import-success' || msg.type === 'import-error') {
                setImportingComponentId(null);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const handleImportComponent = useCallback((component: UIComponent, sendMessage: SendMessageFn) => {
        if (!component?.designJson) {
            showStatus('⚠️ Missing design JSON for this component', 'warning');
            return;
        }
        setImportingComponentId(component.id);
        sendMessage('import-ui-library-component', { designJson: component.designJson as Record<string, unknown> });
    }, [showStatus]);

    const handleBackToProjects = useCallback(() => {
        setSelectedProjectId(null);
        setComponents([]);
    }, []);

    return {
        projects,
        selectedProjectId,
        selectedProject,
        components,
        loadingProjects,
        loadingComponents,
        showCreateProjectModal,
        newProjectName,
        isCreatingProject,
        deleteConfirm,
        isDeleting,
        importingComponentId,
        setSelectedProjectId,
        setShowCreateProjectModal,
        setNewProjectName,
        setDeleteConfirm,
        loadProjects,
        handleCreateProject,
        handleConfirmDelete,
        handleImportComponent,
        handleBackToProjects,
    };
}
