import { useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { useApiClient } from '../hooks/useApiClient.js';
import { reportErrorAsync } from '../errorReporter.js';

export default function SaveModal() {
    const { state, dispatch, showStatus } = useAppContext();
    const { saveModalOpen, currentExportData } = state;
    const { apiPost } = useApiClient();
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!saveModalOpen) return null;

    const handleSave = async () => {
        if (!description.trim()) {
            showStatus('⚠️ Please enter a description', 'warning');
            return;
        }
        try {
            setIsSaving(true);
            showStatus('💾 Saving to database...', 'info');

            const data = await apiPost('/api/design-versions', {
                description: description.trim(),
                designJson: currentExportData
            });

            if (!data.success) {
                throw new Error(data.message || 'Failed to save version');
            }

            showStatus(`✅ Saved as version ${data.version.version}!`, 'success');
            dispatch({ type: 'CLOSE_SAVE_MODAL' });
            setDescription('');
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'VersionManagement',
                actionType: 'saveVersionToDb'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        dispatch({ type: 'CLOSE_SAVE_MODAL' });
        setDescription('');
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
                zIndex: 1000
            }}
        >
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '400px'
            }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#374151' }}>
                    💾 Save Design Version
                </h3>
                <label
                    htmlFor="save-description"
                    style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}
                >
                    Description
                </label>
                <textarea
                    id="save-description"
                    style={{
                        width: '100%',
                        height: '80px',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '16px'
                    }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description for this version (e.g., 'Initial homepage design', 'Updated with new color scheme')"
                    autoFocus
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <><span className="loading"></span> Saving...</> : 'Save'}
                    </button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
