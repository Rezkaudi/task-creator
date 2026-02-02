// File: /backend/src/domain/repositories/client-error.repository.ts

import { ClientError } from "../entities/client-error.entity";

export interface IClientErrorRepository {
    create(error: Partial<ClientError>): Promise<ClientError>;
    findAll(limit?: number, offset?: number): Promise<ClientError[]>;
    findByfigmaUserId(figmaUserId: string, limit?: number): Promise<ClientError[]>;
    findById(id: string): Promise<ClientError | null>;
    countByfigmaUserId(figmaUserId: string): Promise<number>;
    countAll(): Promise<number>;
}