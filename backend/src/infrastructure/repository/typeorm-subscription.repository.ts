import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { SubscriptionEntity } from "../database/entities/subscription.entity";
import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { Subscription } from "../../domain/entities/subscription.entity";
import { v4 as uuidv4 } from "uuid";

export class TypeORMSubscriptionRepository implements ISubscriptionRepository {
    private repository: Repository<SubscriptionEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(SubscriptionEntity);
    }

    async create(sub: Partial<Subscription>): Promise<Subscription> {
        const entity = this.repository.create({
            id: sub.id || uuidv4(),
            userId: sub.userId!,
            planId: sub.planId!,
            status: sub.status || "active",
            stripeSubscriptionId: sub.stripeSubscriptionId!,
            stripeCustomerId: sub.stripeCustomerId!,
            currentPeriodStart: sub.currentPeriodStart!,
            currentPeriodEnd: sub.currentPeriodEnd!,
            dailyLimit: sub.dailyLimit!,
            dailyUsageCount: 0,
            lastUsageResetDate: new Date().toISOString().split("T")[0],
            cancelAtPeriodEnd: false,
        });

        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async findById(id: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toDomain(entity) : null;
    }

    async findActiveByUserId(userId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: { userId, status: "active" },
            order: { createdAt: "DESC" },
        });
        return entity ? this.toDomain(entity) : null;
    }

    async findByStripeSubscriptionId(stripeSubId: string): Promise<Subscription | null> {
        const entity = await this.repository.findOne({
            where: { stripeSubscriptionId: stripeSubId },
        });
        return entity ? this.toDomain(entity) : null;
    }

    async updateStatus(id: string, status: Subscription["status"]): Promise<void> {
        await this.repository.update(id, { status });
    }

    async incrementDailyUsage(id: string): Promise<{ dailyUsageCount: number; wasReset: boolean }> {
        const today = new Date().toISOString().split("T")[0];

        // Atomic: if new day, reset to 1; otherwise increment
        const result = await this.repository.query(
            `UPDATE "subscriptions"
             SET "dailyUsageCount" = CASE
                 WHEN "lastUsageResetDate" != $1 THEN 1
                 ELSE "dailyUsageCount" + 1
             END,
             "lastUsageResetDate" = $1,
             "updatedAt" = NOW()
             WHERE "id" = $2
             RETURNING "dailyUsageCount", "lastUsageResetDate"`,
            [today, id],
        );

        if (!result || result.length === 0) {
            throw new Error("Subscription not found");
        }

        const row = result[0];
        return {
            dailyUsageCount: row.dailyUsageCount,
            wasReset: row.lastUsageResetDate === today && row.dailyUsageCount === 1,
        };
    }

    async update(id: string, data: Partial<Subscription>): Promise<void> {
        await this.repository.update(id, data as any);
    }

    private toDomain(entity: SubscriptionEntity): Subscription {
        return {
            id: entity.id,
            userId: entity.userId,
            planId: entity.planId,
            status: entity.status,
            stripeSubscriptionId: entity.stripeSubscriptionId,
            stripeCustomerId: entity.stripeCustomerId,
            currentPeriodStart: entity.currentPeriodStart,
            currentPeriodEnd: entity.currentPeriodEnd,
            dailyLimit: entity.dailyLimit,
            dailyUsageCount: entity.dailyUsageCount,
            lastUsageResetDate: entity.lastUsageResetDate,
            cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
