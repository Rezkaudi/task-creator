import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("payment_transactions")
export class PaymentTransactionEntity {
    @PrimaryColumn()
    id!: string;

    @ManyToOne(() => UserEntity, (user) => user.paymentTransactions, {
        nullable: false,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    })
    @JoinColumn({ name: "userId" })
    user!: UserEntity;

    @Column({ name: "userId", type: "varchar" })
    userId!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    stripeSessionId!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    stripePaymentIntentId?: string;

    @Column({ type: "varchar", length: 100 })
    packageName!: string;

    @Column({ type: "int" })
    pointsPurchased!: number;

    @Column({ type: "int" })
    amountPaid!: number;

    @Column({ type: "varchar", length: 10, default: "usd" })
    currency!: string;

    @Column({ type: "varchar", length: 50, default: "pending" })
    status!: "pending" | "completed" | "failed";

    @CreateDateColumn({ name: "createdAt" })
    createdAt!: Date;

    @Column({ name: "completedAt", type: "timestamp", nullable: true })
    completedAt?: Date;
}
