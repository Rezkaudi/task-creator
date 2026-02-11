import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { UILibraryProjectEntity } from './ui-library-project.entity';

@Entity('ui_library_components')
export class UILibraryComponentEntity {
    @PrimaryColumn()
    id!: string;

    @ManyToOne(() => UILibraryProjectEntity, (project) => project.components, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'projectId' })
    project!: UILibraryProjectEntity;

    @Column({ name: 'projectId' })
    projectId!: string;

    @ManyToOne(() => UserEntity, (user) => user.uiLibraryComponents, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column({ name: 'userId' })
    userId!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'jsonb' })
    designJson!: any;

    @Column({ type: 'text', nullable: true })
    previewImage?: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
