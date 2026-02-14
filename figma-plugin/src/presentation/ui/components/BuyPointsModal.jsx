import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { useApiClient } from '../hooks/useApiClient.js';
import { reportErrorAsync } from '../errorReporter.js';
import { XCircleIcon } from 'lucide-react';
import '../styles/BuyPointsModal.css';

export default function BuyPointsModal() {
    const { state, dispatch, showStatus, hideStatus } = useAppContext();
    const { buyPointsModalOpen } = state;
    const { apiGet, apiPost } = useApiClient();

    const [packages, setPackages] = useState([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(false);
    const [buyingPackageId, setBuyingPackageId] = useState(null);
    const [error, setError] = useState('');

    const pollIntervalRef = useRef(null);
    const pollTimeoutRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    }, []);

    const closeModal = useCallback(() => {
        stopPolling();
        dispatch({ type: 'CLOSE_BUY_POINTS_MODAL' });
        setBuyingPackageId(null);
        setError('');
    }, [dispatch, stopPolling]);

    const loadPackages = useCallback(async () => {
        setIsLoadingPackages(true);
        setError('');
        try {
            const data = await apiGet('/api/payments/packages');
            if (!data.success) {
                throw new Error(data.message || 'Failed to load points packages');
            }
            setPackages(data.packages || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load points packages';
            setError(message);
            reportErrorAsync(err instanceof Error ? err : new Error(message), {
                componentName: 'BuyPointsModal',
                actionType: 'load-packages',
            });
        } finally {
            setIsLoadingPackages(false);
        }
    }, [apiGet]);

    const startPolling = useCallback((sessionId) => {
        stopPolling();

        pollIntervalRef.current = setInterval(async () => {
            try {
                const result = await apiGet(`/api/payments/poll/${encodeURIComponent(sessionId)}`);
                if (!result.success) {
                    return;
                }

                if (result.status === 'completed') {
                    stopPolling();
                    setBuyingPackageId(null);

                    dispatch({ type: 'SET_POINTS_BALANCE', balance: result.pointsBalance || 0 });
                    dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: Boolean(result.hasPurchased) });
                    dispatch({ type: 'CLOSE_BUY_POINTS_MODAL' });

                    showStatus(`✅ Points updated: ${result.pointsBalance || 0} pts`, 'success');
                    setTimeout(hideStatus, 2500);
                }
            } catch (_error) {
                // Keep polling until timeout
            }
        }, 2000);

        pollTimeoutRef.current = setTimeout(() => {
            stopPolling();
            setBuyingPackageId(null);
            setError('Payment confirmation is taking longer than expected. You can retry polling by reopening this modal.');
        }, 5 * 60 * 1000);
    }, [apiGet, dispatch, hideStatus, showStatus, stopPolling]);

    const handleBuy = useCallback(async (packageId) => {
        setError('');
        setBuyingPackageId(packageId);

        try {
            const data = await apiPost('/api/payments/create-checkout', { packageId });
            if (!data.success) {
                throw new Error(data.message || 'Failed to create checkout session');
            }

            if (!data.checkoutUrl || !data.sessionId) {
                throw new Error('Checkout session response is incomplete');
            }

            window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
            startPolling(data.sessionId);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start checkout';
            setBuyingPackageId(null);
            setError(message);
            reportErrorAsync(err instanceof Error ? err : new Error(message), {
                componentName: 'BuyPointsModal',
                actionType: 'create-checkout',
                errorDetails: { packageId },
            });
        }
    }, [apiPost, startPolling]);

    useEffect(() => {
        if (buyPointsModalOpen) {
            loadPackages();
        } else {
            stopPolling();
        }
    }, [buyPointsModalOpen, loadPackages, stopPolling]);

    useEffect(() => () => stopPolling(), [stopPolling]);

    if (!buyPointsModalOpen) return null;

    return (
        <>
            <div className="buy-points-backdrop" onClick={closeModal} />
            <div className="buy-points-modal">
                <div className="buy-points-header">
                    <h3>Buy Credit Points</h3>
                    <button className="buy-points-close" onClick={closeModal}><XCircleIcon /></button>
                </div>

                <p className="buy-points-subtitle">Unlock all AI models and top up your points balance.</p>

                {isLoadingPackages ? (
                    <div className="buy-points-loading">
                        <div className="loading-spinner"></div>
                        <span>Loading packages...</span>
                    </div>
                ) : (
                    <div className="buy-points-grid">
                        {packages.map((pkg) => (
                            <div key={pkg.id} className={`points-card ${pkg.id === 'pro' ? 'pro' : ''}`}>
                                {pkg.id === 'pro' && <div className="points-best-value">Best Value</div>}
                                <div className="points-card-title">{pkg.name}</div>
                                <div className="points-card-points">{Number(pkg.points || 0).toLocaleString()} pts</div>
                                <div className="points-card-price">${Number(pkg.priceUsd || 0).toFixed(2)}</div>
                                <button
                                    className="points-buy-btn"
                                    onClick={() => handleBuy(pkg.id)}
                                    disabled={Boolean(buyingPackageId)}
                                >
                                    {buyingPackageId === pkg.id ? 'Opening Checkout...' : 'Buy'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {error && <div className="buy-points-error">❌ {error}</div>}
            </div>
        </>
    );
}
