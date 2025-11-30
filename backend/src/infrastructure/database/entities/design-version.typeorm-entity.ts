import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("design_versions")
export class DesignVersionEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    version!: number;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "jsonb" })
    designJson!: any;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
