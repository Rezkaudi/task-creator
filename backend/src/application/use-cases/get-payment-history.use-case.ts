import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";

export class GetPaymentHistoryUseCase {
    constructor(
        private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    ) { }

    async execute(userId: string) {
        return this.paymentTransactionRepository.findByUserId(userId);
    }
}
