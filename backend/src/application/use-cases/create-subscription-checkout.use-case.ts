import { IUserRepository } from "../../domain/repositories/user.repository";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { StripeService } from "../../infrastructure/services/stripe.service";
import { getSubscriptionPlan } from "../../infrastructure/config/subscription-plans.config";

export class CreateSubscriptionCheckoutUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly stripeService: StripeService,
    ) {}

    async execute(userId: string, planId: string): Promise<{ sessionId: string; checkoutUrl: string }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const plan = getSubscriptionPlan(planId);
        if (!plan) {
            throw new Error("Invalid subscription plan");
        }

        if (!plan.stripePriceId) {
            throw new Error(`Stripe price ID is not configured for plan: ${plan.id}`);
        }

        const existingSubscription = await this.subscriptionRepository.findActiveByUserId(userId);
        if (existingSubscription) {
            throw new Error("You already have an active subscription. Cancel it first before subscribing to a new plan.");
        }

        const { sessionId, url, customerId } = await this.stripeService.createSubscriptionCheckout({
            userId,
            planId: plan.id,
            planName: plan.name,
            stripePriceId: plan.stripePriceId,
            stripeCustomerId: user.stripeCustomerId,
            customerEmail: user.email,
            customerName: user.userName,
        });

        if (!user.stripeCustomerId) {
            await this.userRepository.setStripeCustomerId(userId, customerId);
        }

        return {
            sessionId,
            checkoutUrl: url,
        };
    }
}
