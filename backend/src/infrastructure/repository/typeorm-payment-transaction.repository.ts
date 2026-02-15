import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { PaymentTransactionEntity } from "../database/entities/payment-transaction.entity";
import { IPaymentTransactionRepository } from "../../domain/repositories/payment-transaction.repository";
import { PaymentTransaction } from "../../domain/entities/payment-transaction.entity";

export class TypeORMPaymentTransactionRepository implements IPaymentTransactionRepository {
    private readonly repository: Repository<PaymentTransactionEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(PaymentTransactionEntity);
    }

    async create(tx: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
        const entity = this.repository.create({
            id: tx.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            userId: tx.userId!,
            stripeSessionId: tx.stripeSessionId!,
            stripePaymentIntentId: tx.stripePaymentIntentId,
            packageName: tx.packageName!,
            pointsPurchased: tx.pointsPurchased!,
            amountPaid: tx.amountPaid!,
            currency: tx.currency || "usd",
            status: (tx.status as "pending" | "completed" | "failed") || "pending",
            completedAt: tx.completedAt,
        });

        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async findByStripeSessionId(sessionId: string): Promise<PaymentTransaction | null> {
        const entity = await this.repository.findOne({
            where: { stripeSessionId: sessionId },
        });
        return entity ? this.toDomain(entity) : null;
    }

    async findByUserId(userId: string): Promise<PaymentTransaction[]> {
        const entities = await this.repository.find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
        return entities.map((entity) => this.toDomain(entity));
    }

    async updateStatus(id: string, status: string, paymentIntentId?: string): Promise<void> {
        const payload: Partial<PaymentTransactionEntity> = {
            status: status as "pending" | "completed" | "failed",
        };

        if (paymentIntentId) {
            payload.stripePaymentIntentId = paymentIntentId;
        }

        if (status === "completed") {
            payload.completedAt = new Date();
        }

        await this.repository.update(id, payload);
    }

    private toDomain(entity: PaymentTransactionEntity): PaymentTransaction {
        return {
            id: entity.id,
            userId: entity.userId,
            stripeSessionId: entity.stripeSessionId,
            stripePaymentIntentId: entity.stripePaymentIntentId,
            packageName: entity.packageName,
            pointsPurchased: entity.pointsPurchased,
            amountPaid: entity.amountPaid,
            currency: entity.currency,
            status: entity.status,
            createdAt: entity.createdAt,
            completedAt: entity.completedAt,
        };
    }
}
