// File: /backend/src/infrastructure/database/entities/design-version.entity.ts

import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("design_versions")
export class DesignVersionEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: "int" })
    version!: number;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "jsonb" })
    designJson!: any;

    @ManyToOne(() => UserEntity, (user) => user.designVersions, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn({ name: "userId" })
    user!: UserEntity;

    @Column({ name: "userId" })
    userId!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}