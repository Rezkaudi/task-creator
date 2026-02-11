import React from 'react';

export default function ModeSelectionScreen({ onSelectMode }) {
    return (
        <div id="mode-selection-screen" style={{ display: 'flex' }}>
            <div className="mode-selection-header">
                <h2>Choose Your Action</h2>
                <p className="mode-subtitle">Create new, edit existing, design based on reference, or create prototype</p>
            </div>
            <div className="mode-options">
                <div className="mode-card" id="create-mode-btn" onClick={() => onSelectMode('create')}>
                    <div className="mode-icon">✨</div>
                    <h3>Create New</h3>
                    <p>Start from scratch with AI assistance</p>
                </div>
                <div className="mode-card" id="edit-mode-btn" onClick={() => onSelectMode('edit')}>
                    <div className="mode-icon">✏️</div>
                    <h3>Edit Existing</h3>
                    <p>Modify a selected layer with AI</p>
                </div>
                <div className="mode-card" id="based-on-existing-mode-btn" onClick={() => onSelectMode('based-on-existing')}>
                    <div className="mode-icon">🎨</div>
                    <h3>Based on Existing</h3>
                    <p>Create new design using existing style</p>
                </div>
                <div className="mode-card" id="prototype-mode-btn" onClick={() => onSelectMode('prototype')}>
                    <div className="mode-icon">🔗</div>
                    <h3>Create Prototype</h3>
                    <p>Auto-generate prototype connections</p>
                </div>
            </div>
        </div>
    );
}
