import React from 'react';

interface ModalProps {
    onClose?: () => void;
    preventCloseWhileBusy?: boolean;
    isBusy?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function Modal({ onClose, preventCloseWhileBusy, isBusy, className = '', children }: ModalProps) {
    const handleOverlayClick = () => {
        if (preventCloseWhileBusy && isBusy) return;
        onClose?.();
    };

    return (
        <div className="uil-modal-overlay" onClick={handleOverlayClick}>
            <div className={`uil-modal ${className}`} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
