import Stripe from "stripe";
import { ENV_CONFIG } from "../config/env.config";

interface CreateCheckoutSessionInput {
    userId: string;
    packageId: string;
    packageName: string;
    pointsPurchased: number;
    stripePriceId: string;
    stripeCustomerId?: string;
    customerEmail?: string;
    customerName?: string;
}

interface CreateSubscriptionCheckoutInput {
    userId: string;
    planId: string;
    planName: string;
    stripePriceId: string;
    stripeCustomerId?: string;
    customerEmail?: string;
    customerName?: string;
}

export class StripeService {
    private readonly stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(ENV_CONFIG.STRIPE_SECRET_KEY || "sk_test_placeholder", {
            apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
        });
    }

    private ensureStripeConfigured(): void {
        if (!ENV_CONFIG.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }
    }

    async ensureCustomerId(
        userId: string,
        stripeCustomerId?: string,
        email?: string,
        name?: string,
    ): Promise<string> {
        this.ensureStripeConfigured();

        if (stripeCustomerId) {
            return stripeCustomerId;
        }

        const customer = await this.stripe.customers.create({
            email,
            name,
            metadata: {
                userId,
            },
        });

        return customer.id;
    }

    async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<{ sessionId: string; url: string; customerId: string }> {
        this.ensureStripeConfigured();

        const customerId = await this.ensureCustomerId(
            input.userId,
            input.stripeCustomerId,
            input.customerEmail,
            input.customerName,
        );

        const session = await this.stripe.checkout.sessions.create({
            mode: "payment",
            customer: customerId,
            line_items: [
                {
                    price: input.stripePriceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: input.userId,
                packageId: input.packageId,
                packageName: input.packageName,
                pointsPurchased: String(input.pointsPurchased),
            },
            success_url: ENV_CONFIG.STRIPE_SUCCESS_URL,
            cancel_url: ENV_CONFIG.STRIPE_CANCEL_URL,
        });

        if (!session.url) {
            throw new Error("Stripe checkout session did not return a URL");
        }

        return {
            sessionId: session.id,
            url: session.url,
            customerId,
        };
    }

    constructEvent(payload: Buffer, sig: string): Stripe.Event {
        if (!ENV_CONFIG.STRIPE_WEBHOOK_SECRET) {
            throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }
        return this.stripe.webhooks.constructEvent(payload, sig, ENV_CONFIG.STRIPE_WEBHOOK_SECRET);
    }

    async handleWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
        return this.constructEvent(payload, signature);
    }

    async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
        this.ensureStripeConfigured();
        return this.stripe.checkout.sessions.retrieve(sessionId);
    }

    async createSubscriptionCheckout(input: CreateSubscriptionCheckoutInput): Promise<{ sessionId: string; url: string; customerId: string }> {
        this.ensureStripeConfigured();

        const customerId = await this.ensureCustomerId(
            input.userId,
            input.stripeCustomerId,
            input.customerEmail,
            input.customerName,
        );

        const session = await this.stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [
                {
                    price: input.stripePriceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: input.userId,
                planId: input.planId,
                planName: input.planName,
            },
            subscription_data: {
                metadata: {
                    userId: input.userId,
                    planId: input.planId,
                },
            },
            success_url: ENV_CONFIG.STRIPE_SUCCESS_URL,
            cancel_url: ENV_CONFIG.STRIPE_CANCEL_URL,
        });

        if (!session.url) {
            throw new Error("Stripe checkout session did not return a URL");
        }

        return {
            sessionId: session.id,
            url: session.url,
            customerId,
        };
    }

    async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
        this.ensureStripeConfigured();
        await this.stripe.subscriptions.update(stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
    }

    async retrieveSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
        this.ensureStripeConfigured();
        return this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    }
}
