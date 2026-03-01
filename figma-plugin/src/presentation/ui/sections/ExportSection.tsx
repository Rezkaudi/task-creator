import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { analyzeJsonStructure } from '../utils/formatters';
import { SendMessageFn } from '../types/index.ts';
import '../styles/ExportTab.css';

interface ExportTabProps {
    sendMessage: SendMessageFn;
}

export default function ExportTab({ sendMessage }: ExportTabProps): React.JSX.Element {
    const { state, dispatch, showStatus } = useAppContext();
    const { currentExportData, selectionInfo } = state;

    const [exportOutput, setExportOutput] = useState('');
    const [exportStats, setExportStats] = useState('');
    const [isExportingSelected, setIsExportingSelected] = useState(false);
    const [isExportingAll, setIsExportingAll] = useState(false);

    const handleExportSelected = useCallback(() => {
        setIsExportingSelected(true);
        sendMessage('export-selected');
    }, [sendMessage, showStatus]);

    const handleExportAll = useCallback(() => {
        setIsExportingAll(true);
        sendMessage('export-all');
    }, [sendMessage, showStatus]);

    const handleCopy = useCallback(async () => {
        if (!currentExportData) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(currentExportData, null, 2));
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = JSON.stringify(currentExportData, null, 2);
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }, [currentExportData, showStatus]);

    const handleClear = useCallback(() => {
        setExportOutput('');
        setExportStats('');
    }, [showStatus]);

    const handleSaveToDb = useCallback(() => {
        if (!currentExportData) {
            showStatus('⚠️ No design data to save. Export first.', 'warning');
            return;
        }
        dispatch({ type: 'OPEN_SAVE_MODAL' });
    }, [currentExportData, showStatus, dispatch]);

    useEffect(() => {
        if (currentExportData) {
            setExportOutput(JSON.stringify(currentExportData, null, 2));
            setExportStats(analyzeJsonStructure(currentExportData));
            setIsExportingSelected(false);
            setIsExportingAll(false);
        }
    }, [currentExportData]);

    const selectionDisplay = selectionInfo
        ? (() => {
            const names = selectionInfo.names?.slice(0, 3).join(', ') ?? '';
            const more = selectionInfo.count > 3 ? ` and ${selectionInfo.count - 3} more` : '';
            return `<strong>${selectionInfo.count} layer${selectionInfo.count !== 1 ? 's' : ''} selected:</strong> ${names}${more}`;
        })()
        : '<strong>No selection.</strong> Select layers to export specific elements, or export the entire page.';

    return (
        <div id="export-tab" className="tab-content active">
            <div className="section-divider">
                <span>Export JSON</span>
            </div>
            <div className="selection-info" dangerouslySetInnerHTML={{ __html: selectionDisplay }} />

            <div className="export-options">
                <button
                    className="btn-primary"
                    onClick={handleExportSelected}
                    disabled={!selectionInfo || selectionInfo.count === 0 || isExportingSelected}
                >
                    {isExportingSelected ? <><span className="loading"></span> Exporting...</> : '📦 Export Selected'}
                </button>
                <button
                    className="btn-success"
                    onClick={handleExportAll}
                    disabled={isExportingAll}
                >
                    {isExportingAll ? <><span className="loading"></span> Exporting...</> : '📄 Export All (Page)'}
                </button>
            </div>

            <div className="export-output">
                <textarea
                    id="export-output"
                    readOnly
                    value={exportOutput}
                    placeholder="Click 'Export' to generate JSON..."
                />
                {exportStats && <div className="export-stats">{exportStats}</div>}
                <div className="copy-btn-wrapper">
                    <button className="btn-secondary" onClick={handleCopy} disabled={!currentExportData}>📋 Copy</button>
                    <button className="btn-secondary" onClick={handleClear} disabled={!currentExportData}>🗑️ Clear</button>
                    <button className="btn-primary" onClick={handleSaveToDb} disabled={!currentExportData}>💾 Save to DB</button>
                </div>
            </div>
        </div>
    );
}
