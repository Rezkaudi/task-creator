import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import '../styles/StatusBar.css';

export default function StatusBar() {
    const { state } = useAppContext();
    const { message, type } = state.status;

    if (!message || !type) return null;

    return (
        <div className={`status ${type}`}>
            {message}
        </div>
    );
}
