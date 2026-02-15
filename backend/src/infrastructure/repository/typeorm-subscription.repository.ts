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
            dailyPointsLimit: sub.dailyPointsLimit!,
            dailyPointsUsed: 0,
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

    async incrementDailyPointsUsed(id: string, points: number): Promise<{ dailyPointsUsed: number; wasReset: boolean }> {
        const today = new Date().toISOString().split("T")[0];

        // Atomic: if new day, reset to 'points'; otherwise increment by 'points'
        const result = await this.repository.query(
            `UPDATE "subscriptions"
             SET "dailyPointsUsed" = CASE
                 WHEN "lastUsageResetDate" != $1 THEN $2
                 ELSE "dailyPointsUsed" + $2
             END,
             "lastUsageResetDate" = $1,
             "updatedAt" = NOW()
             WHERE "id" = $3
             RETURNING "dailyPointsUsed", "lastUsageResetDate"`,
            [today, points, id],
        );

        console.log('[incrementDailyPointsUsed] Raw DB result:', result);

        if (!result || result.length === 0 || !result[0] || result[0].length === 0) {
            throw new Error("Subscription not found");
        }

        // TypeORM query returns: [[rows...], affectedCount]
        // We need result[0][0] to get the first row
        const row = result[0][0];
        console.log('[incrementDailyPointsUsed] Row (fixed):', row);
        console.log('[incrementDailyPointsUsed] dailyPointsUsed value:', row.dailyPointsUsed);

        return {
            dailyPointsUsed: row.dailyPointsUsed,
            wasReset: row.lastUsageResetDate === today && row.dailyPointsUsed === points,
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
            dailyPointsLimit: entity.dailyPointsLimit,
            dailyPointsUsed: entity.dailyPointsUsed,
            lastUsageResetDate: entity.lastUsageResetDate,
            cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
