import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useApiClient } from '../../hooks/useApiClient.js';
import { reportErrorAsync } from '../../errorReporter.js';
import { formatDate } from '../../utils.js';
import { Plus, ChevronRight, ChevronLeft, ChevronDown, Trash2, FolderOpen } from 'lucide-react';
import FigmaIcon from '../FigmaIcon.jsx';

function getPreviewSrc(component) {
    if (component.previewImage) return component.previewImage;

    const fallbackSvg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
            <rect width="320" height="180" fill="#f3f4f6" />
            <text x="160" y="90" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="#6b7280" font-family="Arial">No Preview</text>
        </svg>
    `);

    return `data:image/svg+xml,${fallbackSvg}`;
}

export default function ProjectsSection({ sendMessage }) {
    const { showStatus } = useAppContext();
    const { apiGet, apiPost, apiDelete } = useApiClient();

    const [isOpen, setIsOpen] = useState(true);

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [components, setComponents] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingComponents, setLoadingComponents] = useState(false);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedProject = useMemo(
        () => projects.find((p) => p.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

    const loadProjects = async () => {
        try {
            setLoadingProjects(true);
            const data = await apiGet('/api/ui-library/projects');
            if (!data.success) throw new Error(data.message || 'Failed to load projects');
            const next = data.projects || [];
            setProjects(next);
            if (next.length === 0) { setSelectedProjectId(null); setComponents([]); }
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, { componentName: 'ProjectsSection', actionType: 'loadProjects' });
        } finally {
            setLoadingProjects(false);
        }
    };

    const loadComponents = async (projectId) => {
        if (!projectId) { setComponents([]); return; }
        try {
            setLoadingComponents(true);
            const data = await apiGet(`/api/ui-library/projects/${projectId}/components`);
            if (!data.success) throw new Error(data.message || 'Failed to load components');
            setComponents(data.components || []);
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, { componentName: 'ProjectsSection', actionType: 'loadComponents' });
            setComponents([]);
        } finally {
            setLoadingComponents(false);
        }
    };

    // Load projects on mount (open by default)
    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) { setComponents([]); return; }
        loadComponents(selectedProjectId);
    }, [selectedProjectId]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) { showStatus('⚠️ Please enter a project name', 'warning'); return; }
        try {
            setIsCreatingProject(true);
            const data = await apiPost('/api/ui-library/projects', { name: newProjectName.trim() });
            if (!data.success) throw new Error(data.message || 'Failed to create project');
            showStatus('✅ Project created', 'success');
            setShowCreateProjectModal(false);
            setNewProjectName('');
            await loadProjects();
            if (data.project?.id) setSelectedProjectId(data.project.id);
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, { componentName: 'ProjectsSection', actionType: 'createProject' });
        } finally {
            setIsCreatingProject(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setIsDeleting(true);
            if (deleteConfirm.type === 'project') {
                const data = await apiDelete(`/api/ui-library/projects/${deleteConfirm.id}`);
                if (!data.success) throw new Error(data.message || 'Failed to delete project');
                showStatus('✅ Project deleted', 'success');
                setSelectedProjectId(null);
                setComponents([]);
                await loadProjects();
            } else {
                const data = await apiDelete(`/api/ui-library/components/${deleteConfirm.id}`);
                if (!data.success) throw new Error(data.message || 'Failed to delete component');
                showStatus('✅ Component deleted', 'success');
                await loadComponents(selectedProjectId);
            }
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, { componentName: 'ProjectsSection', actionType: deleteConfirm.type === 'project' ? 'deleteProject' : 'deleteComponent' });
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const handleImportComponent = (component) => {
        if (!component?.designJson) { showStatus('⚠️ Missing design JSON for this component', 'warning'); return; }
        showStatus('📥 Importing component to Figma...', 'info');
        sendMessage('import-ui-library-component', { designJson: component.designJson });
    };

    const handleBackToProjects = () => {
        setSelectedProjectId(null);
        setComponents([]);
    };

    /* ── Projects List ── */
    const renderProjectsView = () => (
        <div className="ps-projects-view">
            <div className="ps-subheader">
                <button className="uil-create-link" onClick={() => setShowCreateProjectModal(true)}>
                    <Plus size={13} />
                    New Project
                </button>
                <button className="ps-refresh-btn" onClick={loadProjects} title="Refresh">
                    🔄
                </button>
            </div>

            {loadingProjects ? (
                <div className="uil-loading-state" style={{ padding: '20px 0' }}>
                    <span className="loading" />
                    <span>Loading...</span>
                </div>
            ) : projects.length === 0 ? (
                <div className="ps-empty">
                    <FolderOpen size={28} color="#C7D2FE" />
                    <span>No projects yet</span>
                </div>
            ) : (
                <div className="ps-projects-list">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="ps-project-row"
                            onClick={() => setSelectedProjectId(project.id)}
                        >
                            <FolderOpen size={16} color="#93C5FD" />
                            <div className="ps-project-info">
                                <span className="ps-project-name">{project.name}</span>
                                {project.createdAt && (
                                    <span className="ps-project-date">{formatDate(project.createdAt)}</span>
                                )}
                            </div>
                            {project.componentCount != null && (
                                <span className="ps-project-count">{project.componentCount}</span>
                            )}
                            <ChevronRight size={14} color="#C7D2FE" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ── Components Grid ── */
    const renderComponentsView = () => (
        <div className="ps-components-view">
            <div className="ps-comp-topbar">
                <button className="uil-back-btn" onClick={handleBackToProjects}>
                    <ChevronLeft size={16} />
                </button>
                <span className="ps-comp-title">{selectedProject?.name}</span>
                <button
                    className="uil-delete-project-btn"
                    onClick={() => setDeleteConfirm({ type: 'project', id: selectedProject.id, name: selectedProject.name })}
                    title="Delete project"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {loadingComponents ? (
                <div className="uil-loading-state" style={{ padding: '20px 0' }}>
                    <span className="loading" />
                    <span>Loading...</span>
                </div>
            ) : components.length === 0 ? (
                <div className="ps-empty">
                    <span>No components yet</span>
                </div>
            ) : (
                <div className="uil-components-grid" style={{ padding: '8px 4px' }}>
                    {components.map((component) => (
                        <div key={component.id} className="uil-component-card">
                            <div className="uil-component-preview-wrap">
                                <img
                                    className="uil-component-preview"
                                    src={getPreviewSrc(component)}
                                    alt={`${component.name} preview`}
                                />
                            </div>
                            <div className="uil-component-info">
                                <div className="uil-component-name">{component.name}</div>
                                {component.description && (
                                    <div className="uil-component-desc">{component.description}</div>
                                )}
                                {component.createdAt && (
                                    <div className="uil-component-date">{formatDate(component.createdAt)}</div>
                                )}
                            </div>
                            <div className="uil-component-actions">
                                <button className="uil-btn-import" onClick={() => handleImportComponent(component)}>
                                    <FigmaIcon />
                                </button>
                                <button
                                    className="uil-btn-delete-icon"
                                    onClick={() => setDeleteConfirm({ type: 'component', id: component.id, name: component.name })}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={`ps-wrapper ${isOpen ? 'ps-open' : ''}`}>
            {/* Collapsible Header */}
            <button className="ps-toggle" onClick={() => setIsOpen((v) => !v)}>
                <span className="ps-toggle-icon">🗂️</span>
                <span className="ps-toggle-label">Projects (UI Library)</span>
                <ChevronDown size={14} className={`ps-chevron ${isOpen ? 'ps-chevron-open' : ''}`} />
            </button>

            {/* Collapsible Body */}
            {isOpen && (
                <div className="ps-body">
                    {selectedProjectId && selectedProject
                        ? renderComponentsView()
                        : renderProjectsView()}
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <div className="uil-modal-overlay" onClick={() => { setShowCreateProjectModal(false); setNewProjectName(''); }}>
                    <div className="uil-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Create Project</h4>
                        <label htmlFor="ps-project-name-input">Project Name</label>
                        <input
                            id="ps-project-name-input"
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
                            placeholder="Enter project name"
                            autoFocus
                        />
                        <div className="uil-modal-actions">
                            <button className="uil-btn-primary" onClick={handleCreateProject} disabled={isCreatingProject}>
                                {isCreatingProject ? <><span className="loading" /> Creating...</> : 'Create'}
                            </button>
                            <button className="uil-btn-secondary" onClick={() => { setShowCreateProjectModal(false); setNewProjectName(''); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="uil-modal-overlay" onClick={() => { if (!isDeleting) setDeleteConfirm(null); }}>
                    <div className="uil-modal uil-delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="uil-delete-modal-icon">
                            <Trash2 size={24} color="#EF4444" />
                        </div>
                        <h4>Delete {deleteConfirm.type === 'project' ? 'Project' : 'Component'}</h4>
                        <p className="uil-delete-modal-text">
                            {deleteConfirm.type === 'project'
                                ? <>Delete <strong>{deleteConfirm.name}</strong> and all its components? This cannot be undone.</>
                                : <>Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</>}
                        </p>
                        <div className="uil-modal-actions">
                            <button className="uil-btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting ? <><span className="loading" /> Deleting...</> : 'Delete'}
                            </button>
                            <button className="uil-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
