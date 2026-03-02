import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('design_generations')
@Index(['userId'])
@Index(['userId', 'operationType'])
@Index(['createdAt'])
export class DesignGenerationEntity {
    @PrimaryColumn()
    id!: string;

    @ManyToOne(() => UserEntity, (user) => user.designGenerations, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column({ name: 'userId', type: 'varchar' })
    userId!: string;

    @Column({ type: 'text' })
    prompt!: string;

    @Column({ type: 'varchar', length: 50 })
    operationType!: 'create' | 'create_by_reference' | 'edit' | 'prototype';

    @Column({ type: 'varchar', length: 255 })
    modelId!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    designSystemId?: string | null;

    @Column({ type: 'jsonb', nullable: true })
    conversationHistory?: any[] | null;

    @Column({ type: 'jsonb', nullable: true })
    currentDesign?: any | null;

    @Column({ type: 'jsonb', nullable: true })
    referenceDesign?: any | null;

    @Column({ type: 'jsonb', nullable: true })
    resultDesign?: any | null;

    @Column({ type: 'jsonb', nullable: true })
    resultConnections?: any[] | null;

    @Column({ type: 'text', nullable: true })
    aiMessage?: string | null;

    @Column({ type: 'varchar', length: 20 })
    status!: 'success' | 'failed';

    @Column({ type: 'text', nullable: true })
    errorMessage?: string | null;

    @Column({ type: 'int', nullable: true })
    inputTokens?: number | null;

    @Column({ type: 'int', nullable: true })
    outputTokens?: number | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    totalCost?: string | null;

    @Column({ type: 'int', nullable: true })
    pointsDeducted?: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
