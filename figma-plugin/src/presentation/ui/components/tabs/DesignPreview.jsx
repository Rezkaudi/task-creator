import React, { useState, useCallback } from 'react';
import { escapeHtml, getElementIcon } from '../../utils.js';

export default function DesignPreview({ designData, previewHtml, isEditMode, isBasedOnExistingMode, layerInfo, selectedLayerForEdit, onImport }) {
    const [currentZoom, setCurrentZoom] = useState(1);

    const updateZoom = useCallback((newZoom) => {
        setCurrentZoom(Math.max(0.1, Math.min(2, newZoom)));
    }, []);

    if (!designData && !previewHtml) return null;

    // Determine mode text
    let modeText, buttonText, modeBadge;
    if (isBasedOnExistingMode) {
        modeText = '🎨 Generated Design (Based on Existing)';
        buttonText = 'Import to Figma';
        modeBadge = <span className="create-badge">NEW</span>;
    } else if (isEditMode) {
        modeText = '✏️ Edited Design Preview';
        buttonText = 'Update in Figma';
        modeBadge = <span className="edit-badge">EDIT</span>;
    } else {
        modeText = '✨ New Design Preview';
        buttonText = 'Import to Figma';
        modeBadge = <span className="create-badge">NEW</span>;
    }

    const visualContent = previewHtml || generateDefaultPreview(designData, isEditMode, selectedLayerForEdit);

    return (
        <div className="design-preview">
            <div className="design-preview-header">
                <span className="design-preview-title">
                    {modeText} {modeBadge}
                </span>
                <div className="preview-actions">
                    <div className="zoom-controls">
                        <button className="zoom-btn zoom-out" onClick={() => updateZoom(currentZoom - 0.1)}>-</button>
                        <span className="zoom-level">{Math.round(currentZoom * 100)}%</span>
                        <button className="zoom-btn zoom-in" onClick={() => updateZoom(currentZoom + 0.1)}>+</button>
                        <button className="zoom-btn zoom-reset" onClick={() => updateZoom(1)}>Reset</button>
                    </div>
                    <button
                        className="import-to-figma-btn"
                        disabled={!designData}
                        onClick={onImport}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>

            {isEditMode && layerInfo && (
                <div className="edit-layer-info">
                    <span className="editing-label">Editing:</span>
                    <span className="layer-name">{escapeHtml(layerInfo.name)}</span>
                    <span className="layer-type">({escapeHtml(layerInfo.type)})</span>
                </div>
            )}

            <div className={`design-preview-visual ${isEditMode ? 'edit-mode' : 'create-mode'}`}>
                <div
                    className="design-preview-content"
                    style={{
                        transform: `scale(${currentZoom})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s'
                    }}
                    dangerouslySetInnerHTML={{ __html: visualContent }}
                />
            </div>
        </div>
    );
}

function generateDefaultPreview(designData, isEditMode, selectedLayerForEdit) {
    if (!designData) {
        return '<div style="padding: 40px; color: #999; text-align: center;">Preview unavailable</div>';
    }

    try {
        if (isEditMode) {
            return generateEditModePreview(designData, selectedLayerForEdit);
        } else {
            return generateCreateModePreview(designData);
        }
    } catch (error) {
        console.error('Error generating preview:', error);
        return '<div style="padding: 20px; background: #fef2f2; color: #dc2626; border-radius: 8px;">Error generating preview</div>';
    }
}

function generateCreateModePreview(designData) {
    let html = '<div class="create-preview-container">';
    const name = designData.name || 'New Design';
    const type = designData.type || 'FRAME';
    const childrenCount = designData.children ? designData.children.length : 0;

    html += `
        <div class="design-summary">
            <div class="design-name">${escapeHtml(name)}</div>
            <div class="design-type">${escapeHtml(type)}</div>
            <div class="design-stats">${childrenCount} elements</div>
        </div>
    `;

    if (designData.children && designData.children.length > 0) {
        html += '<div class="design-elements">';
        designData.children.slice(0, 5).forEach((child, index) => {
            const childName = child.name || `Element ${index + 1}`;
            const childType = child.type || 'NODE';
            const icon = getElementIcon(childType);
            html += `
                <div class="design-element">
                    <span class="element-icon">${icon}</span>
                    <span class="element-name">${escapeHtml(childName)}</span>
                    <span class="element-type">${escapeHtml(childType)}</span>
                </div>
            `;
        });
        if (designData.children.length > 5) {
            html += `<div class="more-elements">+ ${designData.children.length - 5} more elements</div>`;
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function generateEditModePreview(designData, selectedLayerForEdit) {
    let html = '<div class="edit-preview-container">';
    html += `
        <div class="edit-notice">
            <div class="notice-icon">✏️</div>
            <div class="notice-text">
                <strong>Editing Mode Active</strong>
                <small>Preview shows the updated design</small>
            </div>
        </div>
    `;

    if (designData.children && designData.children.length > 0) {
        html += '<div class="edited-design">';
        designData.children.forEach((child, index) => {
            const isSelected = selectedLayerForEdit &&
                (child.name === selectedLayerForEdit || child.id === selectedLayerForEdit);
            html += `
                <div class="edited-element ${isSelected ? 'selected-element' : ''}">
                    <span class="element-status">${isSelected ? '🎯' : '🔹'}</span>
                    <span class="element-name">${escapeHtml(child.name || `Element ${index + 1}`)}</span>
                    <span class="element-type">${escapeHtml(child.type || 'NODE')}</span>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '</div>';
    return html;
}
