import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { StripeService } from "../../infrastructure/services/stripe.service";

export class CancelSubscriptionUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly stripeService: StripeService,
    ) {}

    async execute(userId: string): Promise<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: Date }> {
        const subscription = await this.subscriptionRepository.findActiveByUserId(userId);
        if (!subscription) {
            throw new Error("No active subscription found");
        }

        await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

        await this.subscriptionRepository.update(subscription.id, {
            cancelAtPeriodEnd: true,
        });

        return {
            cancelAtPeriodEnd: true,
            currentPeriodEnd: subscription.currentPeriodEnd,
        };
    }
}
