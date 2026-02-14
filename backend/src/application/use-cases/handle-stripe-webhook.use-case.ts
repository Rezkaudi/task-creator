import Stripe from "stripe";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { StripeService } from "../../infrastructure/services/stripe.service";
import { getPointsPackage } from "../../infrastructure/config/points-packages.config";
import { getSubscriptionPlan } from "../../infrastructure/config/subscription-plans.config";

export class HandleStripeWebhookUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly paymentTransactionRepository: IPaymentTransactionRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly stripeService: StripeService,
    ) { }

    async execute(payload: Buffer, signature: string): Promise<void> {
        const event = await this.stripeService.handleWebhookEvent(payload, signature);

        switch (event.type) {
            case "checkout.session.completed":
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case "checkout.session.expired":
                await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
                break;
            case "invoice.paid":
                await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;
            case "customer.subscription.updated":
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case "customer.subscription.deleted":
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            default:
                break;
        }
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
        let transaction = await this.paymentTransactionRepository.findByStripeSessionId(session.id);

        if (!transaction) {
            const metadata = session.metadata || {};
            const userId = metadata.userId;
            const packageId = metadata.packageId;
            const packageConfig = packageId ? getPointsPackage(packageId) : undefined;

            if (!userId || !packageConfig) {
                throw new Error(`Unknown checkout session and missing metadata: ${session.id}`);
            }

            transaction = await this.paymentTransactionRepository.create({
                userId,
                stripeSessionId: session.id,
                packageName: packageId,
                pointsPurchased: packageConfig.points,
                amountPaid: packageConfig.priceCents,
                currency: (session.currency || "usd").toLowerCase(),
                status: "pending",
            });
        }

        if (transaction.status === "completed") {
            return;
        }

        const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined;

        await this.userRepository.addPoints(transaction.userId, transaction.pointsPurchased);
        await this.userRepository.markHasPurchased(transaction.userId);

        if (typeof session.customer === "string") {
            await this.userRepository.setStripeCustomerId(transaction.userId, session.customer);
        }

        await this.paymentTransactionRepository.updateStatus(
            transaction.id,
            "completed",
            paymentIntentId,
        );
    }

    private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
        const transaction = await this.paymentTransactionRepository.findByStripeSessionId(session.id);
        if (!transaction) {
            return;
        }
        if (transaction.status !== "completed") {
            await this.paymentTransactionRepository.updateStatus(transaction.id, "failed");
        }
    }

    private getSubscriptionPeriod(stripeSub: Stripe.Subscription): { start: Date; end: Date } {
        // In Stripe API v2024-12-18+, period dates are on subscription items
        const firstItem = stripeSub.items?.data?.[0];
        if (firstItem) {
            return {
                start: new Date(firstItem.current_period_start * 1000),
                end: new Date(firstItem.current_period_end * 1000),
            };
        }
        // Fallback to now + 30 days
        const now = new Date();
        return {
            start: now,
            end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        };
    }

    private getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
        // In Stripe API v2024-12-18+, subscription is under parent.subscription_details
        const parent = invoice.parent;
        if (parent?.subscription_details?.subscription) {
            const sub = parent.subscription_details.subscription;
            return typeof sub === "string" ? sub : sub.id;
        }
        return undefined;
    }

    private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
        const stripeSubscriptionId = this.getSubscriptionIdFromInvoice(invoice);

        if (!stripeSubscriptionId) {
            return;
        }

        const existingSub = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);

        if (existingSub) {
            // Renewal — update period dates
            const stripeSub = await this.stripeService.retrieveSubscription(stripeSubscriptionId);
            const period = this.getSubscriptionPeriod(stripeSub);
            await this.subscriptionRepository.update(existingSub.id, {
                status: "active",
                currentPeriodStart: period.start,
                currentPeriodEnd: period.end,
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            });
            return;
        }

        // New subscription — create record
        const stripeSub = await this.stripeService.retrieveSubscription(stripeSubscriptionId);
        const metadata = stripeSub.metadata || {};
        const userId = metadata.userId;
        const planId = metadata.planId;

        if (!userId || !planId) {
            console.error(`Missing metadata on subscription ${stripeSubscriptionId}`);
            return;
        }

        const plan = getSubscriptionPlan(planId);
        if (!plan) {
            console.error(`Unknown plan ${planId} on subscription ${stripeSubscriptionId}`);
            return;
        }

        const customerId = typeof stripeSub.customer === "string"
            ? stripeSub.customer
            : stripeSub.customer.id;

        const period = this.getSubscriptionPeriod(stripeSub);

        await this.subscriptionRepository.create({
            userId,
            planId,
            status: "active",
            stripeSubscriptionId,
            stripeCustomerId: customerId,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            dailyPointsLimit: plan.dailyPointsLimit,
            cancelAtPeriodEnd: false,
        });

        await this.userRepository.setStripeCustomerId(userId, customerId);
        await this.userRepository.markHasPurchased(userId);
    }

    private async handleSubscriptionUpdated(stripeSub: Stripe.Subscription): Promise<void> {
        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSub.id);
        if (!subscription) {
            return;
        }

        let status = subscription.status;
        if (stripeSub.status === "active") {
            status = "active";
        } else if (stripeSub.status === "past_due") {
            status = "past_due";
        } else if (stripeSub.status === "canceled") {
            status = "canceled";
        }

        const period = this.getSubscriptionPeriod(stripeSub);

        await this.subscriptionRepository.update(subscription.id, {
            status,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        });
    }

    private async handleSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSub.id);
        if (!subscription) {
            return;
        }

        await this.subscriptionRepository.updateStatus(subscription.id, "expired");
    }
}
