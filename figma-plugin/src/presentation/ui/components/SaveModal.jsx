import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { useApiClient } from '../hooks/useApiClient.js';
import { reportErrorAsync } from '../errorReporter.js';
import '../styles/SaveModal.css';

function getComponentNameFromExportData(exportData) {
    if (Array.isArray(exportData) && exportData.length > 0) {
        return exportData[0]?.name || 'Untitled Component';
    }

    if (exportData && typeof exportData === 'object' && exportData.name) {
        return exportData.name;
    }

    return 'Untitled Component';
}

function requestPreviewImage({ maxWidth = 320, timeoutMs = 8000 } = {}) {
    return new Promise((resolve, reject) => {
        const requestId = `preview_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let timeoutId = null;

        function cleanup() {
            window.removeEventListener('message', onMessage);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }

        function onMessage(event) {
            const message = event.data?.pluginMessage;
            if (!message || message.requestId !== requestId) return;

            if (message.type === 'preview-image-generated') {
                cleanup();
                resolve(message.previewImage || null);
                return;
            }

            if (message.type === 'preview-image-error') {
                cleanup();
                reject(new Error(message.error || 'Failed to generate preview image'));
            }
        }

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Preview image generation timed out'));
        }, timeoutMs);

        window.addEventListener('message', onMessage);
        parent.postMessage({
            pluginMessage: {
                type: 'generate-preview-image',
                requestId,
                maxWidth,
            },
        }, '*');
    });
}

function requestPreviewFromDesignData({ designData, maxWidth = 320, timeoutMs = 15000 } = {}) {
    return new Promise((resolve, reject) => {
        const requestId = `preview_data_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let timeoutId = null;

        function cleanup() {
            window.removeEventListener('message', onMessage);
            if (timeoutId) clearTimeout(timeoutId);
        }

        function onMessage(event) {
            const message = event.data?.pluginMessage;
            if (!message || message.requestId !== requestId) return;

            if (message.type === 'preview-image-generated') {
                cleanup();
                resolve(message.previewImage || null);
                return;
            }

            if (message.type === 'preview-image-error') {
                cleanup();
                reject(new Error(message.error || 'Failed to generate preview image'));
            }
        }

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Preview image generation timed out'));
        }, timeoutMs);

        window.addEventListener('message', onMessage);
        parent.postMessage({
            pluginMessage: {
                type: 'generate-preview-from-design-data',
                requestId,
                designData,
                maxWidth,
            },
        }, '*');
    });
}

export default function SaveModal() {
    const { state, dispatch, showStatus } = useAppContext();
    const { saveModalOpen, saveModalFromChat, currentExportData } = state;
    const { apiGet, apiPost } = useApiClient();

    const [description, setDescription] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [projects, setProjects] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const componentName = useMemo(() => getComponentNameFromExportData(currentExportData), [currentExportData]);

    useEffect(() => {
        if (!saveModalOpen) return;
        setDescription(componentName);

        const loadProjects = async () => {
            try {
                setIsLoadingProjects(true);
                const data = await apiGet('/api/ui-library/projects');

                if (!data.success) {
                    throw new Error(data.message || 'Failed to load projects');
                }

                const fetchedProjects = data.projects || [];
                setProjects(fetchedProjects);
                setSelectedProjectId(fetchedProjects[0]?.id || '');
            } catch (error) {
                showStatus(`❌ ${error.message}`, 'error');
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
            showStatus('💾 Saving component to UI Library...', 'info');

            let previewImage = null;
            try {
                if (saveModalFromChat) {
                    previewImage = await requestPreviewFromDesignData({ designData: currentExportData, maxWidth: 320 });
                } else {
                    previewImage = await requestPreviewImage({ maxWidth: 320 });
                }
            } catch (previewError) {
                showStatus('⚠️ Could not generate preview image. Saving without preview.', 'warning');
                reportErrorAsync(previewError, {
                    componentName: 'SaveToUILibraryModal',
                    actionType: 'generatePreviewImage',
                });
            }

            const data = await apiPost('/api/ui-library/components', {
                projectId: selectedProjectId,
                name: description.trim(),
                description: description.trim(),
                designJson: currentExportData,
                previewImage,
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to save component');
            }

            showStatus(`✅ Saved ${componentName} to UI Library`, 'success');
            dispatch({ type: 'CLOSE_SAVE_MODAL' });
            setDescription('');
            setSelectedProjectId('');
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
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
                    🧩 Save Component to UI Library
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
