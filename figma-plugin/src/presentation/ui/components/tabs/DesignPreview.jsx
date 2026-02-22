import '../../styles/DesignPreview.css';
import FigmaIcon from '../FigmaIcon';

export default function DesignPreview({ designData, previewHtml, isEditMode, isBasedOnExistingMode, onImport }) {
    if (!designData && !previewHtml) return null;

    const buttonText = 'Add to Figma';

    return (
        <div className="design-preview">
            <button
                className="import-to-figma-btn"
                disabled={!designData}
                onClick={onImport}
            >
                <FigmaIcon />
                {buttonText}
            </button>
        </div>
    );
}
