import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";
import { IUserRepository } from "../../domain/repositories/user.repository";

export class PollPaymentStatusUseCase {
    constructor(
        private readonly paymentTransactionRepository: IPaymentTransactionRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string, sessionId: string): Promise<{
        status: string;
        pointsBalance: number;
        hasPurchased: boolean;
        completedAt?: Date;
    }> {
        const transaction = await this.paymentTransactionRepository.findByStripeSessionId(sessionId);
        if (!transaction) {
            throw new Error("Payment session not found");
        }

        if (transaction.userId !== userId) {
            throw new Error("Unauthorized to access this payment session");
        }

        if (transaction.status !== "completed") {
            return {
                status: transaction.status,
                pointsBalance: 0,
                hasPurchased: false,
                completedAt: transaction.completedAt,
            };
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        return {
            status: transaction.status,
            pointsBalance: user.pointsBalance,
            hasPurchased: user.hasPurchased,
            completedAt: transaction.completedAt,
        };
    }
}
