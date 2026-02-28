import React from 'react';
import { Plus, ChevronRight, ChevronLeft, Trash2, FolderOpen } from 'lucide-react';
import { useUILibrary, getPreviewSrc } from '../../hooks/useUILibrary.ts';
import { CreateProjectModal } from '../shared/CreateProjectModal.tsx';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal.tsx';
import { LoadingState } from '../shared/LoadingState.tsx';
import FigmaIcon from '../FigmaIcon.jsx';
import { formatDate } from '../../utils/formatters';
import '../../styles/UILibraryTab.css';
import type { SendMessageFn, UIComponent, Project } from '../../types';

interface UILibraryTabProps {
    sendMessage: SendMessageFn;
}

export default function UILibraryTab({ sendMessage }: UILibraryTabProps) {
    const lib = useUILibrary('UILibraryTab');

    const renderProjectsView = () => (
        <div className="uil-projects-view">
            <div className="uil-projects-header">
                <h3 className="uil-title">Projects</h3>
                <button className="uil-create-link" onClick={() => lib.setShowCreateProjectModal(true)}>
                    <Plus size={14} />
                    Create New Project
                </button>
            </div>

            {lib.loadingProjects ? (
                <LoadingState message="Loading projects..." />
            ) : lib.projects.length === 0 ? (
                <div className="uil-empty-state">
                    <div className="uil-empty-icon">
                        <FolderOpen size={48} color="#C7D2FE" />
                    </div>
                    <p>No projects yet. Create your first project to get started.</p>
                </div>
            ) : (
                <div className="uil-projects-list">
                    {lib.projects.map((project: Project) => (
                        <div
                            key={project.id}
                            className="uil-project-card"
                            onClick={() => lib.setSelectedProjectId(project.id)}
                        >
                            <div className="uil-project-icon">
                                <FolderOpen size={24} color="#93C5FD" />
                            </div>
                            <div className="uil-project-info">
                                <div className="uil-project-name">{project.name}</div>
                                <div className="uil-project-meta">
                                    {project.componentCount != null && (
                                        <span>{project.componentCount} parts</span>
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

    const renderComponentsView = () => (
        <div className="uil-components-view">
            <div className="uil-components-topbar">
                <button className="uil-back-btn" onClick={lib.handleBackToProjects}>
                    <ChevronLeft size={20} />
                </button>
                <div className="uil-components-title-group">
                    <h3 className="uil-components-title">{lib.selectedProject?.name}</h3>
                    <div className="uil-components-subtitle">
                        {lib.components.length} parts
                        {lib.selectedProject?.updatedAt && (
                            <span> • Last updated: {formatDate(lib.selectedProject.updatedAt)}</span>
                        )}
                    </div>
                </div>
                <button
                    className="uil-delete-project-btn"
                    onClick={() => lib.selectedProject && lib.setDeleteConfirm({ type: 'project', id: lib.selectedProject.id, name: lib.selectedProject.name })}
                    title="Delete project"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {lib.loadingComponents ? (
                <LoadingState message="Loading components..." />
            ) : lib.components.length === 0 ? (
                <div className="uil-empty-state">
                    <p>No components in this project yet.</p>
                </div>
            ) : (
                <div className="uil-components-grid">
                    {lib.components.map((component: UIComponent) => (
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
                                    onClick={() => lib.handleImportComponent(component, sendMessage)}
                                    disabled={lib.importingComponentId === component.id}
                                    title="Import to Figma"
                                >
                                    {lib.importingComponentId === component.id
                                        ? <span className="btn-spinner" />
                                        : <FigmaIcon />}
                                </button>
                                <button
                                    className="uil-btn-delete-icon"
                                    onClick={() => lib.setDeleteConfirm({ type: 'component', id: component.id, name: component.name })}
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
            {lib.selectedProjectId && lib.selectedProject
                ? renderComponentsView()
                : renderProjectsView()}

            {lib.showCreateProjectModal && (
                <CreateProjectModal
                    newProjectName={lib.newProjectName}
                    isCreating={lib.isCreatingProject}
                    onNameChange={lib.setNewProjectName}
                    onCreate={lib.handleCreateProject}
                    onCancel={() => { lib.setShowCreateProjectModal(false); lib.setNewProjectName(''); }}
                />
            )}

            <DeleteConfirmModal
                target={lib.deleteConfirm}
                isDeleting={lib.isDeleting}
                onConfirm={lib.handleConfirmDelete}
                onCancel={() => lib.setDeleteConfirm(null)}
            />
        </div>
    );
}
