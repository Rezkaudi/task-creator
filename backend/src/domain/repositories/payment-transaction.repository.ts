import { PaymentTransaction } from "../entities/payment-transaction.entity";

export interface IPaymentTransactionRepository {
    create(tx: Partial<PaymentTransaction>): Promise<PaymentTransaction>;
    findByStripeSessionId(sessionId: string): Promise<PaymentTransaction | null>;
    findByUserId(userId: string): Promise<PaymentTransaction[]>;
    updateStatus(id: string, status: string, paymentIntentId?: string): Promise<void>;
}
