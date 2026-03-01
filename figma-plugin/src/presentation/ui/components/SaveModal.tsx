import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useApiClient } from '../hooks/useApiClient.ts';
import { reportErrorAsync, getComponentNameFromExportData, requestPreviewImage, API_PATHS } from '../utils';
import { Project } from '../types/index.ts';
import '../styles/SaveModal.css';

export default function SaveModal(): React.JSX.Element | null {
    const { state, dispatch, showStatus } = useAppContext();
    const { saveModalOpen, saveModalFromChat, currentExportData } = state;
    const { apiGet, apiPost } = useApiClient();

    const [description, setDescription] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const componentName = useMemo(() => getComponentNameFromExportData(currentExportData), [currentExportData]);

    useEffect(() => {
        if (!saveModalOpen) return;
        setDescription(componentName);

        const loadProjects = async () => {
            try {
                setIsLoadingProjects(true);
                const data = await apiGet(API_PATHS.PROJECTS);

                if (!data.success) {
                    throw new Error(data.message || 'Failed to load projects');
                }

                const fetchedProjects: Project[] = data.projects || [];
                setProjects(fetchedProjects);
                setSelectedProjectId(fetchedProjects[0]?.id || '');
            } catch (error) {
                showStatus(`❌ ${(error as Error).message}`, 'error');
                reportErrorAsync(error, {
                    componentName: 'SaveToUILibraryModal',
                    actionType: 'loadProjects',
                });
            } finally {
                setIsLoadingProjects(false);
            }
        };

        loadProjects();
    }, [saveModalOpen]);

    if (!saveModalOpen) return null;

    const handleSave = async () => {
        if (!selectedProjectId) {
            showStatus('⚠️ Please select a project', 'warning');
            return;
        }

        if (!description.trim()) {
            showStatus('⚠️ Please enter a component description', 'warning');
            return;
        }

        try {
            setIsSaving(true);

            let previewImageUrl: string | null = null;
            try {
                const base64Image = await requestPreviewImage({
                    maxWidth: 320,
                    designData: saveModalFromChat ? currentExportData : undefined,
                });

                if (base64Image) {
                    const uploadData = await apiPost(API_PATHS.UPLOAD_IMAGE, { image: base64Image });
                    if (uploadData.success) {
                        previewImageUrl = uploadData.url;
                    }
                }
            } catch (previewError) {
                showStatus('⚠️ Could not generate preview image. Saving without preview.', 'warning');
                reportErrorAsync(previewError, {
                    componentName: 'SaveToUILibraryModal',
                    actionType: 'generatePreviewImage',
                });
            }

            const data = await apiPost(API_PATHS.COMPONENTS, {
                projectId: selectedProjectId,
                name: description.trim(),
                description: description.trim(),
                designJson: currentExportData,
                previewImage: previewImageUrl,
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to save component');
            }

            dispatch({ type: 'COMPONENT_SAVED', projectId: selectedProjectId });
            dispatch({ type: 'CLOSE_SAVE_MODAL' });
            setDescription('');
            setSelectedProjectId('');
        } catch (error) {
            showStatus(`❌ ${(error as Error).message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'SaveToUILibraryModal',
                actionType: 'saveComponent',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        dispatch({ type: 'CLOSE_SAVE_MODAL' });
        setDescription('');
        setSelectedProjectId('');
    };

    return (
        <div
            id="save-modal"
            style={{
                display: 'block',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '420px',
                }}
            >
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#374151' }}>
                    Save Component to UI Library
                </h3>

                <div style={{ marginBottom: '12px', fontSize: '13px', color: '#4b5563' }}>
                    Component: <strong>{componentName}</strong>
                </div>

                <label
                    htmlFor="save-project"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}
                >
                    Project
                </label>

                <select
                    id="save-project"
                    className="modal-select"
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    disabled={isLoadingProjects || isSaving || projects.length === 0}
                >
                    {isLoadingProjects && <option value="">Loading projects...</option>}
                    {!isLoadingProjects && projects.length === 0 && <option value="">No projects available</option>}
                    {!isLoadingProjects && projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                </select>

                <label
                    htmlFor="save-description"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}
                >
                    Component Description
                </label>

                <textarea
                    id="save-description"
                    style={{
                        width: '100%',
                        height: '96px',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '16px',
                    }}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe this component"
                    autoFocus
                    disabled={isSaving}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleSave} disabled={isSaving || projects.length === 0}>
                        {isSaving ? <><span className="loading"></span> Saving...</> : 'Save'}
                    </button>
                    <button className="btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
