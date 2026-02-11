import React from 'react';
import '../styles/TabBar.css';

const TABS = [
    { id: 'ai', label: '🤖 AI Generate' },
    { id: 'manual', label: '📋 Paste JSON' },
    { id: 'export', label: '📤 Export' },
    { id: 'ui-library', label: '🧩 UI Library' },
];

export default function TabBar({ activeTab, onTabChange }) {
    return (
        <div className="tabs">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    data-tab={tab.id}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
