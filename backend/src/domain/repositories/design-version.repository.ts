// File: /backend/src/domain/repositories/design-version.repository.ts

import { DesignVersion } from "../entities/design-version.entity";

export interface IDesignVersionRepository {
    create(designVersion: Partial<DesignVersion>): Promise<DesignVersion>;
    findAll(userId?: string): Promise<DesignVersion[]>;
    findById(id: string, userId?: string): Promise<DesignVersion | null>;
    findLatest(userId?: string): Promise<DesignVersion | null>;
    getNextVersion(userId?: string): Promise<number>;
    delete(id: string, userId?: string): Promise<void>;
}