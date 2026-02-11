import React, { useState, useCallback } from 'react';
import { analyzeJsonStructure } from '../../utils.js';
import { debounce } from '../../utils.js';
import '../../styles/PasteJsonTab.css';

export default function PasteJsonTab({ onImport, valueRef }) {
    const [jsonValue, setJsonValue] = useState('');
    const [statsText, setStatsText] = useState('');
    const [validityClass, setValidityClass] = useState('');

    const validate = useCallback(
        debounce((value) => {
            if (!value.trim()) {
                setStatsText('');
                setValidityClass('');
                return;
            }
            try {
                const parsed = JSON.parse(value);
                const stats = analyzeJsonStructure(parsed);
                setValidityClass('valid');
                setStatsText(stats);
            } catch (e) {
                setValidityClass('error');
                setStatsText(`❌ Invalid JSON: ${e.message}`);
            }
        }, 300),
        []
    );

    const handleChange = (e) => {
        const val = e.target.value;
        setJsonValue(val);
        if (valueRef) valueRef.current = val;
        validate(val);
    };

    return (
        <div id="manual-tab" className="tab-content active">
            <div className="input-group">
                <label htmlFor="json-input">Design JSON</label>
                <textarea
                    id="json-input"
                    className={validityClass}
                    value={jsonValue}
                    onChange={handleChange}
                    placeholder={`Paste your Figma design JSON here...\n\nExample format:\n{\n  "name": "My Frame",\n  "type": "FRAME",\n  "x": 0,\n  "y": 0,\n  "width": 400,\n  "height": 300,\n  "fills": [{"type": "SOLID", "color": {"r": 1, "g": 1, "b": 1}}]\n}`}
                />
                {statsText && (
                    <div className={`json-stats ${validityClass === 'error' ? 'error' : ''}`}>
                        {statsText}
                    </div>
                )}
            </div>
        </div>
    );
}
