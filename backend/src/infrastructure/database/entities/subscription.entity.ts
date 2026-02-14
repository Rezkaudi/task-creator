import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("subscriptions")
export class SubscriptionEntity {
    @PrimaryColumn()
    id!: string;

    @ManyToOne(() => UserEntity, (user) => user.subscriptions, {
        nullable: false,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    })
    @JoinColumn({ name: "userId" })
    user!: UserEntity;

    @Column({ name: "userId", type: "varchar" })
    userId!: string;

    @Column({ type: "varchar", length: 100 })
    planId!: string;

    @Column({ type: "varchar", length: 50, default: "active" })
    status!: "active" | "canceled" | "past_due" | "expired";

    @Column({ type: "varchar", length: 255, unique: true })
    stripeSubscriptionId!: string;

    @Column({ type: "varchar", length: 255 })
    stripeCustomerId!: string;

    @Column({ type: "timestamp" })
    currentPeriodStart!: Date;

    @Column({ type: "timestamp" })
    currentPeriodEnd!: Date;

    @Column({ type: "int" })
    dailyPointsLimit!: number;

    @Column({ type: "int", default: 0 })
    dailyPointsUsed!: number;

    @Column({ type: "varchar", length: 10, default: "1970-01-01" })
    lastUsageResetDate!: string;

    @Column({ type: "boolean", default: false })
    cancelAtPeriodEnd!: boolean;

    @CreateDateColumn({ name: "createdAt" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updatedAt" })
    updatedAt!: Date;
}
