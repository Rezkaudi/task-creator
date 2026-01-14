// File: /backend/src/domain/entities/design-version.entity.ts

export interface DesignVersion {
    id: string;
    version: number;
    description: string;
    designJson: any;
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}