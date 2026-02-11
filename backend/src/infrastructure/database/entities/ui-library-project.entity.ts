import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { UILibraryComponentEntity } from './ui-library-component.entity';

@Entity('ui_library_projects')
export class UILibraryProjectEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @ManyToOne(() => UserEntity, (user) => user.uiLibraryProjects, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column({ name: 'userId' })
    userId!: string;

    @OneToMany(() => UILibraryComponentEntity, (component) => component.project)
    components!: UILibraryComponentEntity[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
