import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, FolderOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.tsx';
import { useUILibrary, getPreviewSrc } from '../../hooks/useUILibrary.ts';
import { CreateProjectModal } from '../shared/CreateProjectModal.tsx';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal.tsx';
import { LoadingState } from '../shared/LoadingState.tsx';
import FigmaIcon from '../FigmaIcon.jsx';
import { formatDate } from '../../utils/formatters';
import type { SendMessageFn, UIComponent, Project } from '../../types';
import '../../styles/UILibraryTab.css';
import '../../styles/ProjectsSection.css';

interface ProjectsSectionProps {
    sendMessage: SendMessageFn;
    onSaveSelected: () => void;
    onAttachComponent?: (component: UIComponent) => void;
    attachedComponentIds?: Set<string>;
}

export default function ProjectsSection({ sendMessage, onSaveSelected, onAttachComponent, attachedComponentIds }: ProjectsSectionProps) {
    const [isOpen, setIsOpen] = useState(true);
    const { state } = useAppContext();
    const hasSelection = (state.selectionInfo?.count ?? 0) > 0;
    const lib = useUILibrary('ProjectsSection');

    const renderProjectsView = () => (
        <div className="ps-projects-view">
            <div className="ps-subheader">
                <button className="uil-create-link" onClick={() => lib.setShowCreateProjectModal(true)}>
                    <Plus size={13} />
                    New Project
                </button>
                <div className="ps-subheader-right">
                    <button
                        className="ps-save-btn"
                        onClick={onSaveSelected}
                        // disabled={!hasSelection}
                        title={hasSelection ? 'Save selected frame to library' : 'Select a frame in Figma to save'}
                    >
                        Save Components
                    </button>
                </div>
            </div>

            {lib.loadingProjects ? (
                <LoadingState message="Loading..." className="uil-loading-state" />
            ) : lib.projects.length === 0 ? (
                <div className="ps-empty">
                    <FolderOpen size={28} color="#C7D2FE" />
                    <span>No projects yet</span>
                </div>
            ) : (
                <div className="ps-projects-list">
                    {lib.projects.map((project: Project) => (
                        <div
                            key={project.id}
                            className="ps-project-row"
                            onClick={() => lib.setSelectedProjectId(project.id)}
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

    const renderComponentsView = () => (
        <div className="ps-components-view">
            <div className="ps-comp-topbar">
                <button className="uil-back-btn" onClick={lib.handleBackToProjects}>
                    <ChevronLeft size={16} />
                </button>
                <span className="ps-comp-title">{lib.selectedProject?.name}</span>
                <button
                    className="ps-save-btn"
                    onClick={onSaveSelected}
                    // disabled={!hasSelection}
                    title={hasSelection ? 'Save selected frame to library' : 'Select a frame in Figma to save'}
                >
                    Save Component
                </button>
                <button
                    className="uil-delete-project-btn"
                    onClick={() => lib.selectedProject && lib.setDeleteConfirm({ type: 'project', id: lib.selectedProject.id, name: lib.selectedProject.name })}
                    title="Delete project"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {lib.loadingComponents ? (
                <LoadingState message="Loading..." className="uil-loading-state" />
            ) : lib.components.length === 0 ? (
                <div className="ps-empty">
                    <span>No components yet</span>
                </div>
            ) : (
                <div className="uil-components-grid" style={{ padding: '8px 4px' }}>
                    {lib.components.map((component: UIComponent) => (
                        <div
                            key={component.id}
                            className={`uil-component-card${attachedComponentIds?.has(component.id) ? ' is-attached' : ''}`}
                            onClick={() => onAttachComponent?.(component)}
                        >
                            <div className="uil-component-preview-wrap">
                                <img
                                    className="uil-component-preview"
                                    src={getPreviewSrc(component)}
                                    alt={`${component.name} preview`}
                                />
                                {onAttachComponent && (
                                    <div className="uil-attach-overlay">
                                        <span className="uil-attach-overlay-icon">{attachedComponentIds?.has(component.id) ? '✕' : '📎'}</span>
                                        <span className="uil-attach-overlay-label">{attachedComponentIds?.has(component.id) ? 'Detach' : 'Attach to chat'}</span>
                                    </div>
                                )}
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
                                <button
                                    className="uil-btn-import"
                                    onClick={(e) => { e.stopPropagation(); lib.handleImportComponent(component, sendMessage); }}
                                    title="Import to Figma"
                                >
                                    <FigmaIcon />
                                </button>
                                <button
                                    className="uil-btn-delete-icon"
                                    onClick={(e) => { e.stopPropagation(); lib.setDeleteConfirm({ type: 'component', id: component.id, name: component.name }); }}
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
            <button className="ps-toggle" onClick={() => setIsOpen(v => !v)}>
                <span className="ps-toggle-icon"></span>
                <span className="ps-toggle-label">Projects (UI Library)</span>
                <ChevronDown size={14} className={`ps-chevron ${isOpen ? 'ps-chevron-open' : ''}`} />
            </button>

            {isOpen && (
                <div className="ps-body">
                    {lib.selectedProjectId && lib.selectedProject
                        ? renderComponentsView()
                        : renderProjectsView()}
                </div>
            )}

            {lib.showCreateProjectModal && (
                <CreateProjectModal
                    newProjectName={lib.newProjectName}
                    isCreating={lib.isCreatingProject}
                    onNameChange={lib.setNewProjectName}
                    onCreate={lib.handleCreateProject}
                    onCancel={() => { lib.setShowCreateProjectModal(false); lib.setNewProjectName(''); }}
                    inputId="ps-project-name-input"
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
