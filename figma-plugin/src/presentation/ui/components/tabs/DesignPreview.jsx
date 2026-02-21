import React, { useState, useCallback, useRef, useEffect } from 'react';
import { escapeHtml } from '../../utils.js';
import { figmaJsonToHtml } from '../../figmaJsonToHtml.js';
import '../../styles/DesignPreview.css';

export default function DesignPreview({ designData, previewHtml, isEditMode, isBasedOnExistingMode, layerInfo, selectedLayerForEdit, onImport }) {
    const [currentZoom, setCurrentZoom] = useState(1);
    const [containerWidth, setContainerWidth] = useState(300);
    const viewportRef = useRef(null);

    const updateZoom = useCallback((newZoom) => {
        setCurrentZoom(Math.max(0.25, Math.min(4, newZoom)));
    }, []);

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        setContainerWidth(el.offsetWidth || 300);
        const ro = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width || 300);
        });
        ro.observe(el);
        return () => ro.disconnect();
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

    // Get natural design dimensions from the root node
    const rootNode = designData
        ? (Array.isArray(designData) ? designData[0] : designData)
        : null;
    const designWidth = rootNode?.width || 300;
    const designHeight = rootNode?.height || 200;

    // fitScale makes the design fill the container width exactly at zoom=1
    const fitScale = containerWidth > 0 ? containerWidth / designWidth : 1;
    const effectiveScale = fitScale * currentZoom;
    const scaledHeight = Math.round(designHeight * effectiveScale);
    const viewportHeight = Math.min(Math.max(scaledHeight, 160), 420);

    const visualContent = previewHtml || generateDefaultPreview(designData, isEditMode, selectedLayerForEdit);

    return (
        <div className="design-preview">
            <div className="design-preview-header">
                <span className="design-preview-title">
                    {modeText} {modeBadge}
                </span>
                <div className="preview-actions">
                    <div className="zoom-controls">
                        <button className="zoom-btn" onClick={() => updateZoom(currentZoom - 0.25)}>−</button>
                        <span className="zoom-level">{Math.round(currentZoom * 100)}%</span>
                        <button className="zoom-btn" onClick={() => updateZoom(currentZoom + 0.25)}>+</button>
                        <button className="zoom-btn" onClick={() => updateZoom(1)}>Fit</button>
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

            <div
                ref={viewportRef}
                className={`design-preview-visual ${isEditMode ? 'edit-mode' : 'create-mode'}`}
                style={{ height: viewportHeight }}
            >
                <div
                    className="design-preview-content"
                    style={{
                        transform: `scale(${effectiveScale})`,
                        transformOrigin: 'top left',
                        width: designWidth,
                        transition: 'transform 0.2s',
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
    return figmaJsonToHtml(designData);
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
