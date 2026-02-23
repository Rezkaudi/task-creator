import '../../styles/DesignPreview.css';
import FigmaIcon from '../FigmaIcon';

export default function DesignPreview({ designData, previewHtml, isEditMode, isBasedOnExistingMode, onImport, onSave }) {
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
