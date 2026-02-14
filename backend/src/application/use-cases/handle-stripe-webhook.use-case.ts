import Stripe from "stripe";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";
import { StripeService } from "../../infrastructure/services/stripe.service";
import { getPointsPackage } from "../../infrastructure/config/points-packages.config";

export class HandleStripeWebhookUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly paymentTransactionRepository: IPaymentTransactionRepository,
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
}
