import { API_BASE_URL } from '../../utils/formatters';
import type { User, Subscription, SelectionInfo } from '../../types';
import { Contact, DollarSign, Download, GlobeLock, Info, MessageCircle } from 'lucide-react';

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

            {/* Credits section */}
            <div className="profile-dd-section-label">Credits</div>
            {subscription && (
                <div className="profile-dd-points-row">
                    <div className="profile-dd-points-info">
                        <span className="profile-dd-points-badge">
                            {subscription.planId === 'premium' ? 'Premium' : 'Basic'}
                        </span>
                        <span className="profile-dd-points-val green">
                            {Number((subscription.dailyPointsLimit || 0) - (subscription.dailyPointsUsed || 0)).toLocaleString()} credits
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

            {(pointsBalance > 0 || pointsBalance < 0) && (
                <div className="profile-dd-points-row">
                    <span className="profile-dd-points-val blue">{Number(pointsBalance).toLocaleString()} credits</span>
                    <span className="profile-dd-points-sub">one-time balance</span>
                </div>
            )}
            {!subscription && pointsBalance === 0 && (
                <div className="profile-dd-empty">No Credits yet</div>
            )}

            <div className="profile-dd-divider" />

            {/* Actions */}
            <button className="profile-dd-item accent" onClick={() => { onClose(); onBuyPoints(); }}>
                <DollarSign size={16} />
                Buy Credits / Plan
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); onImportExport(); }}>
                <Download size={16} />
                Import / Export
            </button>

            <div className="profile-dd-divider" />

            <button className="profile-dd-item" onClick={() => { onClose(); window.open('https://www.figma.com/community/plugin/1607375783904843279', '_blank', 'noopener,noreferrer'); }}>
                <MessageCircle size={16} />
                Leave a Comment
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); window.open('https://rio-app.design/#about', '_blank', 'noopener,noreferrer'); }}>
                <Info size={16} />
                About Us
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); window.open('https://rio-app.design/privacy-policy', '_blank', 'noopener,noreferrer'); }}>
                <GlobeLock size={16} />
                Privacy Policy
            </button>

            <button className="profile-dd-item" onClick={() => { onClose(); window.open('https://rio-app.design/#contact', '_blank', 'noopener,noreferrer'); }}>
                <Contact size={16} />
                Contact Us
            </button>
        </div>
    );
}
