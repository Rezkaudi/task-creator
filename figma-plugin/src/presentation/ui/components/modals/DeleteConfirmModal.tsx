import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../shared/Modal';
import type { DeleteTarget } from '../../types';

interface DeleteConfirmModalProps {
    target: DeleteTarget;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteConfirmModal({ target, isDeleting, onConfirm, onCancel }: DeleteConfirmModalProps) {
    if (!target) return null;

    return (
        <Modal onClose={onCancel} preventCloseWhileBusy isBusy={isDeleting} className="uil-delete-modal">
            <div className="uil-delete-modal-icon">
                <Trash2 size={24} color="#EF4444" />
            </div>
            <h4>Delete {target.type === 'project' ? 'Project' : 'Component'}</h4>
            <p className="uil-delete-modal-text">
                {target.type === 'project'
                    ? <>Delete <strong>{target.name}</strong> and all its components? This cannot be undone.</>
                    : <>Delete <strong>{target.name}</strong>? This cannot be undone.</>
                }
            </p>
            <div className="uil-modal-actions">
                <button className="uil-btn-danger" onClick={onConfirm} disabled={isDeleting}>
                    {isDeleting ? <><span className="loading" /> Deleting...</> : 'Delete'}
                </button>
                <button className="uil-btn-secondary" onClick={onCancel} disabled={isDeleting}>
                    Cancel
                </button>
            </div>
        </Modal>
    );
}
