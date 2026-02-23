import React from 'react';

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export function LoadingState({ message = 'Loading...', className = 'uil-loading-state' }: LoadingStateProps) {
    return (
        <div className={className}>
            <span className="loading" />
            <span>{message}</span>
        </div>
    );
}
