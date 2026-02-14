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
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [isLoadingPackages, setIsLoadingPackages] = useState(false);
    const [buyingPackageId, setBuyingPackageId] = useState(null);
    const [subscribingPlanId, setSubscribingPlanId] = useState(null);
    const [cancelingSubscription, setCancelingSubscription] = useState(false);
    const [activeTab, setActiveTab] = useState('subscription');
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
        setSubscribingPlanId(null);
        setError('');
    }, [dispatch, stopPolling]);

    const loadData = useCallback(async () => {
        setIsLoadingPackages(true);
        setError('');
        try {
            const [packagesRes, plansRes, statusRes] = await Promise.all([
                apiGet('/api/payments/packages'),
                apiGet('/api/subscriptions/plans'),
                apiGet('/api/subscriptions/status'),
            ]);

            if (packagesRes.success) setPackages(packagesRes.packages || []);
            if (plansRes.success) setPlans(plansRes.plans || []);
            if (statusRes.success) {
                setSubscription(statusRes.hasSubscription ? statusRes.subscription : null);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load packages';
            setError(message);
            reportErrorAsync(err instanceof Error ? err : new Error(message), {
                componentName: 'BuyPointsModal',
                actionType: 'load-data',
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

                    showStatus(`Points updated: ${result.pointsBalance || 0} pts`, 'success');
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

    const startSubscriptionPolling = useCallback(() => {
        stopPolling();

        pollIntervalRef.current = setInterval(async () => {
            try {
                const result = await apiGet('/api/subscriptions/status');
                if (result.success && result.hasSubscription) {
                    stopPolling();
                    setSubscribingPlanId(null);
                    setSubscription(result.subscription);

                    dispatch({ type: 'SET_HAS_PURCHASED', hasPurchased: true });
                    dispatch({ type: 'CLOSE_BUY_POINTS_MODAL' });

                    showStatus('Subscription activated!', 'success');
                    setTimeout(hideStatus, 2500);
                }
            } catch (_error) {
                // Keep polling
            }
        }, 2000);

        pollTimeoutRef.current = setTimeout(() => {
            stopPolling();
            setSubscribingPlanId(null);
            setError('Subscription confirmation is taking longer than expected. Please reopen this modal to check.');
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

    const handleSubscribe = useCallback(async (planId) => {
        setError('');
        setSubscribingPlanId(planId);

        try {
            const data = await apiPost('/api/subscriptions/create-checkout', { planId });
            if (!data.success) {
                throw new Error(data.message || 'Failed to create subscription checkout');
            }

            if (!data.checkoutUrl) {
                throw new Error('Checkout session response is incomplete');
            }

            window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
            startSubscriptionPolling();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start subscription checkout';
            setSubscribingPlanId(null);
            setError(message);
            reportErrorAsync(err instanceof Error ? err : new Error(message), {
                componentName: 'BuyPointsModal',
                actionType: 'create-subscription-checkout',
                errorDetails: { planId },
            });
        }
    }, [apiPost, startSubscriptionPolling]);

    const handleCancelSubscription = useCallback(async () => {
        setError('');
        setCancelingSubscription(true);

        try {
            const data = await apiPost('/api/subscriptions/cancel', {});
            if (!data.success) {
                throw new Error(data.message || 'Failed to cancel subscription');
            }

            setSubscription((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
            showStatus('Subscription will cancel at end of billing period', 'success');
            setTimeout(hideStatus, 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
            setError(message);
        } finally {
            setCancelingSubscription(false);
        }
    }, [apiPost, showStatus, hideStatus]);

    useEffect(() => {
        if (buyPointsModalOpen) {
            loadData();
        } else {
            stopPolling();
        }
    }, [buyPointsModalOpen, loadData, stopPolling]);

    useEffect(() => () => stopPolling(), [stopPolling]);

    if (!buyPointsModalOpen) return null;

    const isBusy = Boolean(buyingPackageId || subscribingPlanId);

    return (
        <>
            <div className="buy-points-backdrop" onClick={closeModal} />
            <div className="buy-points-modal">
                <div className="buy-points-header">
                    <h3>Get Credits</h3>
                    <button className="buy-points-close" onClick={closeModal}><XCircleIcon /></button>
                </div>

                <p className="buy-points-subtitle">Unlock all AI models with a subscription or one-time purchase.</p>

                <div className="buy-points-tabs">
                    <button
                        className={`buy-points-tab ${activeTab === 'subscription' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subscription')}
                    >
                        Monthly Plans
                    </button>
                    <button
                        className={`buy-points-tab ${activeTab === 'onetime' ? 'active' : ''}`}
                        onClick={() => setActiveTab('onetime')}
                    >
                        One-Time Points
                    </button>
                </div>

                {isLoadingPackages ? (
                    <div className="buy-points-loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                ) : activeTab === 'subscription' ? (
                    <>
                        {subscription && (
                            <div className="subscription-active-banner">
                                <div className="subscription-active-info">
                                    <span className="subscription-active-badge">Active</span>
                                    <span className="subscription-active-plan">
                                        {subscription.planId === 'premium' ? 'Premium' : 'Basic'} Plan
                                    </span>
                                </div>
                                <div className="subscription-active-usage">
                                    <span>{subscription.dailyUsageCount} / {subscription.dailyLimit} used today</span>
                                    <div className="subscription-usage-bar">
                                        <div
                                            className="subscription-usage-fill"
                                            style={{ width: `${Math.min(100, (subscription.dailyUsageCount / subscription.dailyLimit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                {subscription.cancelAtPeriodEnd ? (
                                    <div className="subscription-cancel-note">
                                        Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                    </div>
                                ) : (
                                    <button
                                        className="subscription-cancel-btn"
                                        onClick={handleCancelSubscription}
                                        disabled={cancelingSubscription}
                                    >
                                        {cancelingSubscription ? 'Canceling...' : 'Cancel Plan'}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="buy-points-grid">
                            {plans.map((plan) => (
                                <div key={plan.id} className={`points-card subscription-card ${plan.id === 'premium' ? 'premium' : ''}`}>
                                    {plan.id === 'premium' && <div className="points-best-value premium-badge">Most Popular</div>}
                                    <div className="points-card-title">{plan.name}</div>
                                    <div className="points-card-points">{plan.dailyLimit} / day</div>
                                    <div className="points-card-price">${plan.priceUsd}<span className="price-period">/mo</span></div>
                                    <div className="subscription-card-detail">
                                        {plan.dailyLimit} AI generations per day
                                    </div>
                                    {subscription && !subscription.cancelAtPeriodEnd ? (
                                        <button className="points-buy-btn" disabled>
                                            {subscription.planId === plan.id ? 'Current Plan' : 'Already Subscribed'}
                                        </button>
                                    ) : (
                                        <button
                                            className="points-buy-btn"
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={isBusy}
                                        >
                                            {subscribingPlanId === plan.id ? 'Opening Checkout...' : 'Subscribe'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
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
                                    disabled={isBusy}
                                >
                                    {buyingPackageId === pkg.id ? 'Opening Checkout...' : 'Buy'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {error && <div className="buy-points-error">{error}</div>}
            </div>
        </>
    );
}
