import React from 'react';
import { Modal } from '../shared/Modal';

interface CreateProjectModalProps {
    newProjectName: string;
    isCreating: boolean;
    onNameChange: (name: string) => void;
    onCreate: () => void;
    onCancel: () => void;
    inputId?: string;
}

export function CreateProjectModal({
    newProjectName,
    isCreating,
    onNameChange,
    onCreate,
    onCancel,
    inputId = 'project-name-input',
}: CreateProjectModalProps) {
    return (
        <Modal onClose={onCancel}>
            <h4>Create Project</h4>
            <label htmlFor={inputId}>Project Name</label>
            <input
                id={inputId}
                type="text"
                value={newProjectName}
                onChange={e => onNameChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onCreate(); }}
                placeholder="Enter project name"
                autoFocus
            />
            <div className="uil-modal-actions">
                <button className="uil-btn-primary" onClick={onCreate} disabled={isCreating}>
                    {isCreating ? <><span className="loading" /> Creating...</> : 'Create'}
                </button>
                <button className="uil-btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </Modal>
    );
}
