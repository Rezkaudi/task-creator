import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "../../infrastructure/config/subscription-plans.config";

export class GetAvailableSubscriptionPlansUseCase {
    execute(): Omit<SubscriptionPlan, "stripePriceId">[] {
        return SUBSCRIPTION_PLANS.map(({ stripePriceId, ...plan }) => plan);
    }
}
