// File: /backend/src/infrastructure/database/entities/user.entity.ts

import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { DesignVersionEntity } from "./design-version.entity";

@Entity("users")
export class UserEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    figmaUserId!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    userName?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    email?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => DesignVersionEntity, (version) => version.user)
    designVersions!: DesignVersionEntity[];
}