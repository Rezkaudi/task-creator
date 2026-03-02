// File: /backend/src/infrastructure/database/entities/client-error.entity.ts

import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    Index,
} from "typeorm";

@Entity("client_errors")
@Index(["figmaUserId"])
@Index(["createdAt"])
export class ClientErrorEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    figmaUserId?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    userName?: string;

    @Column({ type: "text" })
    errorMessage!: string;

    @Column({ type: "jsonb", nullable: true })
    errorDetails?: Record<string, any>;

    @Column({ type: "varchar", length: 255, nullable: true })
    actionType?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}