import type { User, Subscription, SelectionInfo } from '../../types';

interface ProfileDropdownProps {
    user: User;
    subscription: Subscription | null;
    pointsBalance: number;
    selectionInfo: SelectionInfo | null;
    activeTab: string;
    onBuyPoints: () => void;
    onImportExport: () => void;
    onSaveSelected: () => void;
    onClose: () => void;
}

export function ProfileDropdown({
    user,
    subscription,
    pointsBalance,
    selectionInfo,
    onBuyPoints,
    onImportExport,
    onSaveSelected,
    onClose,
}: ProfileDropdownProps) {
    return (
        <div className="profile-dropdown">
            {/* User header */}
            <div className="profile-dd-header">
                {user.profilePicture ? (
                    <img className="profile-dd-avatar" src={user.profilePicture} alt="" />
                ) : (
                    <div className="profile-dd-avatar-placeholder">
                        {(user.userName || user.email || '?')[0].toUpperCase()}
                    </div>
                )}
                <div className="profile-dd-user-info">
                    <div className="profile-dd-name">{user.userName || 'User'}</div>
                    <div className="profile-dd-email">{user.email}</div>
                </div>
            </div>

            <div className="profile-dd-divider" />

            {/* Points section */}
            <div className="profile-dd-section-label">Points</div>
            {subscription && (
                <div className="profile-dd-points-row">
                    <div className="profile-dd-points-info">
                        <span className="profile-dd-points-badge">
                            {subscription.planId === 'premium' ? 'Premium' : 'Basic'}
                        </span>
                        <span className="profile-dd-points-val green">
                            {Number((subscription.dailyPointsLimit || 0) - (subscription.dailyPointsUsed || 0)).toLocaleString()} pts
                        </span>
                        <span className="profile-dd-points-sub">remaining today</span>
                    </div>
                    <div className="profile-dd-bar">
                        <div
                            className="profile-dd-bar-fill"
                            style={{ width: `${Math.min(100, (subscription.dailyPointsUsed / subscription.dailyPointsLimit) * 100)}%` }}
                        />
                    </div>
                </div>
            )}
            {pointsBalance > 0 && (
                <div className="profile-dd-points-row">
                    <span className="profile-dd-points-val blue">{Number(pointsBalance).toLocaleString()} pts</span>
                    <span className="profile-dd-points-sub">one-time balance</span>
                </div>
            )}
            {!subscription && pointsBalance === 0 && (
                <div className="profile-dd-empty">No credits yet</div>
            )}

            <div className="profile-dd-divider" />

            {/* Actions */}
            <button className="profile-dd-item accent" onClick={() => { onClose(); onBuyPoints(); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1.5v11M10.5 4.5H5.25a1.75 1.75 0 000 3.5h3.5a1.75 1.75 0 010 3.5H3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Buy Points / Plan
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); onImportExport(); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 5.5L7 3 4.5 5.5M7 3v7M2.5 11h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Import / Export
            </button>

            <div className="profile-dd-divider" />

            <button className="profile-dd-item" onClick={() => { onClose(); window.open('https://rio-app.design/#about', '_blank', 'noopener,noreferrer'); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M7 4.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                About Us
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); window.open('https://rio-app.design/privacy-policy', '_blank', 'noopener,noreferrer'); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM7 5v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Privacy Policy
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); window.location.href = 'mailto:info@kuroworks.com'; }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 4.5h9M2.5 9.5h9M1.5 7h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Contact Us
            </button>
        </div>
    );
}
