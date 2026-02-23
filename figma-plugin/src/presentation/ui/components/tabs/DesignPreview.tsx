import React from 'react';
import '../../styles/DesignPreview.css';
import FigmaIcon from '../FigmaIcon.tsx';

interface DesignPreviewProps {
    designData: unknown;
    previewHtml?: string | null;
    isEditMode?: boolean;
    isBasedOnExistingMode?: boolean;
    layerInfo?: unknown;
    selectedLayerForEdit?: string | null;
    onImport: () => void;
    onSave: () => void;
}

export default function DesignPreview({ designData, previewHtml, onImport, onSave }: DesignPreviewProps): React.JSX.Element | null {
    if (!designData && !previewHtml) return null;

    return (
        <div className="design-preview">
            <div className="design-preview-actions">
                <button
                    className="import-to-figma-btn"
                    disabled={!designData}
                    onClick={onImport}
                >
                    <FigmaIcon />
                    Add to Figma
                </button>
                <button
                    className="save-design-btn"
                    disabled={!designData}
                    onClick={onSave}
                >
                    💾 Save
                </button>
            </div>
        </div>
    );
}
