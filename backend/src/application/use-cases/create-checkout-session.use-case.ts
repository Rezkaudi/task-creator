import { IUserRepository } from "../../domain/repositories/user.repository";
import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";
import { StripeService } from "../../infrastructure/services/stripe.service";
import { getPointsPackage } from "../../infrastructure/config/points-packages.config";

export class CreateCheckoutSessionUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly paymentTransactionRepository: IPaymentTransactionRepository,
        private readonly stripeService: StripeService,
    ) { }

    async execute(userId: string, packageId: string): Promise<{ sessionId: string; checkoutUrl: string }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const selectedPackage = getPointsPackage(packageId);
        if (!selectedPackage) {
            throw new Error("Invalid points package");
        }

        if (!selectedPackage.stripePriceId) {
            throw new Error(`Stripe price ID is not configured for package: ${selectedPackage.id}`);
        }

        const { sessionId, url, customerId } = await this.stripeService.createCheckoutSession({
            userId,
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            pointsPurchased: selectedPackage.points,
            stripePriceId: selectedPackage.stripePriceId,
            stripeCustomerId: user.stripeCustomerId,
            customerEmail: user.email,
            customerName: user.userName,
        });

        if (!user.stripeCustomerId) {
            await this.userRepository.setStripeCustomerId(userId, customerId);
        }

        await this.paymentTransactionRepository.create({
            userId,
            stripeSessionId: sessionId,
            packageName: selectedPackage.id,
            pointsPurchased: selectedPackage.points,
            amountPaid: selectedPackage.priceCents,
            currency: "usd",
            status: "pending",
        });

        return {
            sessionId,
            checkoutUrl: url,
        };
    }
}
