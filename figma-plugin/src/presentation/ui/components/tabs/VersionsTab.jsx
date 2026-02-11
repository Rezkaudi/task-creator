import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { useApiClient } from '../../hooks/useApiClient.js';
import { reportErrorAsync } from '../../errorReporter.js';
import { formatDate, escapeHtml } from '../../utils.js';
import '../../styles/VersionsTab.css';

export default function VersionsTab({ sendMessage }) {
    const { showStatus, hideStatus } = useAppContext();
    const { apiGet, apiDelete } = useApiClient();

    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadVersions = async () => {
        try {
            showStatus('📡 Loading versions...', 'info');
            setIsLoading(true);

            const data = await apiGet('/api/design-versions');

            if (!data.success) {
                throw new Error(data.message || 'Failed to load versions');
            }

            setVersions(data.versions);
            hideStatus();
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            setTimeout(hideStatus, 2000);
            setVersions([]);
            reportErrorAsync(error, {
                componentName: 'VersionManagement',
                actionType: 'loadVersions'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Load versions on mount
    React.useEffect(() => {
        loadVersions();
    }, []);

    const handleImport = async () => {
        if (!selectedVersionId) return;
        try {
            showStatus('📥 Loading version...', 'info');
            const data = await apiGet(`/api/design-versions/${selectedVersionId}`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to load version');
            }

            showStatus('✅ Importing to Figma...', 'info');
            sendMessage('import-version', { designJson: data.version.designJson });
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'VersionManagement',
                actionType: 'importVersionFromDb'
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedVersionId) return;
        if (!confirm('Are you sure you want to delete this version? This cannot be undone.')) return;

        try {
            showStatus('🗑️ Deleting version...', 'info');
            const data = await apiDelete(`/api/design-versions/${selectedVersionId}`);

            if (!data.success) {
                throw new Error(data.message || 'Failed to delete version');
            }

            showStatus('✅ Version deleted!', 'success');
            setSelectedVersionId(null);
            loadVersions();
        } catch (error) {
            showStatus(`❌ ${error.message}`, 'error');
            reportErrorAsync(error, {
                componentName: 'VersionManagement',
                actionType: 'deleteVersion'
            });
        }
    };

    return (
        <div id="versions-tab" className="tab-content active">
            <div className="versions-container">
                <div className="versions-header">
                    <h3>📚 Saved Design Versions</h3>
                    <button
                        className="btn-secondary refresh-btn"
                        onClick={loadVersions}
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="loading"></span> : '🔄 Refresh'}
                    </button>
                </div>

                <div className="versions-list">
                    {(!versions || versions.length === 0) ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-text">
                                No versions saved yet.<br />Export a design and save it to the database.
                            </div>
                        </div>
                    ) : (
                        versions.map(v => (
                            <div
                                key={v.id}
                                className={`version-item ${selectedVersionId === v.id ? 'selected' : ''}`}
                                onClick={() => setSelectedVersionId(v.id)}
                            >
                                <div className="version-header">
                                    <span className="version-number">v{v.version}</span>
                                    <span className="version-date">{formatDate(v.createdAt)}</span>
                                </div>
                                <div className="version-description">{escapeHtml(v.description)}</div>
                            </div>
                        ))
                    )}
                </div>

                {selectedVersionId && (
                    <div className="version-actions" style={{ display: 'flex' }}>
                        <button className="btn-primary" onClick={handleImport}>📥 Import to Figma</button>
                        <button className="btn-danger" onClick={handleDelete}>🗑️ Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
}
