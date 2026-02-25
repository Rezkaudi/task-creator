import React from 'react';
import '../styles/TabBar.css';

interface Tab {
    id: string;
    label: string;
}

interface TabBarProps {
    activeTab: string;
    onTabChange: (id: string) => void;
}

const TABS: Tab[] = [
    { id: 'ai', label: 'AI Generate' },
    // { id: 'import-export', label: 'Import / Export' },
    // { id: 'ui-library', label: 'UI Library' },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps): React.JSX.Element {
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
