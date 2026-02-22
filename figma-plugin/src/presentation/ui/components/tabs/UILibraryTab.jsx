import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useApiClient } from '../../hooks/useApiClient.js';
import { reportErrorAsync } from '../../errorReporter.js';
import { formatDate } from '../../utils.js';
import { Plus, ChevronRight, ChevronLeft, Trash2, FolderOpen, Download, AlertTriangle, Import } from 'lucide-react';
import '../../styles/UILibraryTab.css';
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

export default function UILibraryTab({ sendMessage }) {
    const { showStatus } = useAppContext();
    const { apiGet, apiPost, apiDelete } = useApiClient();

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
        () => projects.find((project) => project.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

    const loadProjects = async () => {
        try {
            setLoadingProjects(true);
            const data = await apiGet('/api/ui-library/projects');

            if (!data.success) {
                throw new Error(data.message || 'Failed to load projects');
            }

            const nextProjects = data.projects || [];
            setProjects(nextProjects);

            if (nextProjects.length === 0) {
                setSelectedProjectId(null);
                setComponents([]);
            }
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'UILibraryTab',
                actionType: 'loadProjects',
            });
        } finally {
            setLoadingProjects(false);
        }
    };

    const loadComponents = async (projectId) => {
        if (!projectId) {
            setComponents([]);
            return;
        }

        try {
            setLoadingComponents(true);
            const data = await apiGet(`/api/ui-library/projects/${projectId}/components`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to load components');
            }

            setComponents(data.components || []);
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'UILibraryTab',
                actionType: 'loadComponents',
            });
            setComponents([]);
        } finally {
            setLoadingComponents(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) {
            setComponents([]);
            return;
        }

        loadComponents(selectedProjectId);
    }, [selectedProjectId]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            showStatus('⚠️ Please enter a project name', 'warning');
            return;
        }

        try {
            setIsCreatingProject(true);
            const data = await apiPost('/api/ui-library/projects', {
                name: newProjectName.trim(),
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to create project');
            }

            showStatus('✅ Project created', 'success');
            setShowCreateProjectModal(false);
            setNewProjectName('');
            await loadProjects();

            if (data.project?.id) {
                setSelectedProjectId(data.project.id);
            }
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'UILibraryTab',
                actionType: 'createProject',
            });
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
                if (!data.success) {
                    throw new Error(data.message || 'Failed to delete project');
                }
                showStatus('✅ Project deleted', 'success');
                setSelectedProjectId(null);
                setComponents([]);
                await loadProjects();
            } else {
                const data = await apiDelete(`/api/ui-library/components/${deleteConfirm.id}`);
                if (!data.success) {
                    throw new Error(data.message || 'Failed to delete component');
                }
                showStatus('✅ Component deleted', 'success');
                await loadComponents(selectedProjectId);
            }
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'UILibraryTab',
                actionType: deleteConfirm.type === 'project' ? 'deleteProject' : 'deleteComponent',
            });
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const handleImportComponent = (component) => {
        if (!component?.designJson) {
            showStatus('⚠️ Missing design JSON for this component', 'warning');
            return;
        }

        showStatus('📥 Importing component to Figma...', 'info');
        sendMessage('import-ui-library-component', { designJson: component.designJson });
    };

    const handleBackToProjects = () => {
        setSelectedProjectId(null);
        setComponents([]);
    };

    /* ───────── Projects List View ───────── */
    const renderProjectsView = () => (
        <div className="uil-projects-view">
            <div className="uil-projects-header">
                <h3 className="uil-title">Projects</h3>
                <button className="uil-create-link" onClick={() => setShowCreateProjectModal(true)}>
                    <Plus size={14} />
                    Create New Project
                </button>
            </div>

            {loadingProjects ? (
                <div className="uil-loading-state">
                    <span className="loading"></span>
                    <span>Loading projects...</span>
                </div>
            ) : projects.length === 0 ? (
                <div className="uil-empty-state">
                    <div className="uil-empty-icon">
                        <FolderOpen size={48} color="#C7D2FE" />
                    </div>
                    <p>No projects yet. Create your first project to get started.</p>
                </div>
            ) : (
                <div className="uil-projects-list">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="uil-project-card"
                            onClick={() => setSelectedProjectId(project.id)}
                        >
                            <div className="uil-project-icon">
                                <FolderOpen size={24} color="#93C5FD" />
                            </div>
                            <div className="uil-project-info">
                                <div className="uil-project-name">{project.name}</div>
                                <div className="uil-project-meta">
                                    {project.componentCount != null && (
                                        <span>{project.componentCount}parts</span>
                                    )}
                                    {project.updatedAt && (
                                        <span>Last updated: {formatDate(project.updatedAt)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="uil-project-chevron">
                                <ChevronRight size={20} color="#C7D2FE" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    /* ───────── Components Grid View ───────── */
    const renderComponentsView = () => (
        <div className="uil-components-view">
            <div className="uil-components-topbar">
                <button className="uil-back-btn" onClick={handleBackToProjects}>
                    <ChevronLeft size={20} />
                </button>
                <div className="uil-components-title-group">
                    <h3 className="uil-components-title">{selectedProject?.name}</h3>
                    <div className="uil-components-subtitle">
                        {components.length}parts
                        {selectedProject?.updatedAt && (
                            <span> • Last updated: {formatDate(selectedProject.updatedAt)}</span>
                        )}
                    </div>
                </div>
                <button
                    className="uil-delete-project-btn"
                    onClick={() => setDeleteConfirm({ type: 'project', id: selectedProject.id, name: selectedProject.name })}
                    title="Delete project"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {loadingComponents ? (
                <div className="uil-loading-state">
                    <span className="loading"></span>
                    <span>Loading components...</span>
                </div>
            ) : components.length === 0 ? (
                <div className="uil-empty-state">
                    <p>No components in this project yet.</p>
                </div>
            ) : (
                <div className="uil-components-grid">
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
                            </div>
                            <div className="uil-component-actions">
                                <button
                                    className="uil-btn-import"
                                    onClick={() => handleImportComponent(component)}
                                >
                                    {/* <Import size={16} /> */}
                                    <FigmaIcon />
                                </button>
                                <button
                                    className="uil-btn-delete-icon"
                                    onClick={() => setDeleteConfirm({ type: 'component', id: component.id, name: component.name })}
                                    title="Delete component"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div id="ui-library-tab" className="tab-content active">
            {selectedProjectId && selectedProject ? renderComponentsView() : renderProjectsView()}

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <div className="uil-modal-overlay" onClick={() => { setShowCreateProjectModal(false); setNewProjectName(''); }}>
                    <div className="uil-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Create Project</h4>
                        <label htmlFor="project-name-input">Project Name</label>
                        <input
                            id="project-name-input"
                            type="text"
                            value={newProjectName}
                            onChange={(event) => setNewProjectName(event.target.value)}
                            onKeyDown={(event) => { if (event.key === 'Enter') handleCreateProject(); }}
                            placeholder="Enter project name"
                            autoFocus
                        />
                        <div className="uil-modal-actions">
                            <button className="uil-btn-primary" onClick={handleCreateProject} disabled={isCreatingProject}>
                                {isCreatingProject ? <><span className="loading"></span> Creating...</> : 'Create'}
                            </button>
                            <button
                                className="uil-btn-secondary"
                                onClick={() => {
                                    setShowCreateProjectModal(false);
                                    setNewProjectName('');
                                }}
                            >
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
                            <Trash2 size={28} color="#EF4444" />
                        </div>
                        <h4>Delete {deleteConfirm.type === 'project' ? 'Project' : 'Component'}</h4>
                        <p className="uil-delete-modal-text">
                            {deleteConfirm.type === 'project'
                                ? <>Are you sure you want to delete <strong>{deleteConfirm.name}</strong> and all its components? This action cannot be undone.</>
                                : <>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</>
                            }
                        </p>
                        <div className="uil-modal-actions">
                            <button
                                className="uil-btn-danger"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <><span className="loading"></span> Deleting...</> : 'Delete'}
                            </button>
                            <button
                                className="uil-btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}