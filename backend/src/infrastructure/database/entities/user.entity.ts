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
import { UILibraryProjectEntity } from "./ui-library-project.entity";
import { UILibraryComponentEntity } from "./ui-library-component.entity";

@Entity("users")
export class UserEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: "varchar", length: 255 })
    figmaUserId!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    userName?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    email?: string;

    @Column({ type: "varchar", length: 255, nullable: true, unique: true })
    googleId?: string;

    @Column({ type: "text", nullable: true })
    profilePicture?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => DesignVersionEntity, (version) => version.user)
    designVersions!: DesignVersionEntity[];

    @OneToMany(() => UILibraryProjectEntity, (project) => project.user)
    uiLibraryProjects!: UILibraryProjectEntity[];

    @OneToMany(() => UILibraryComponentEntity, (component) => component.user)
    uiLibraryComponents!: UILibraryComponentEntity[];
}
