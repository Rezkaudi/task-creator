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
@Index(["errorCode"])
export class ClientErrorEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    figmaUserId?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    userName?: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    errorCode?: string;

    @Column({ type: "text" })
    errorMessage!: string;

    @Column({ type: "text", nullable: true })
    errorStack?: string;

    @Column({ type: "jsonb", nullable: true })
    errorDetails?: Record<string, any>;

    @Column({ type: "varchar", length: 50, nullable: true })
    pluginVersion?: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    figmaVersion?: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    platform?: string;

    @Column({ type: "text", nullable: true })
    browserInfo?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    componentName?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    actionType?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}