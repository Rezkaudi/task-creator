// File: /backend/src/domain/services/IPrototypeService.ts

import { FrameInfo, PrototypeConnection } from "../entities/prototype-connection.entity";

export interface IPrototypeService {
    generateConnections(
        frames: FrameInfo[],
        modelId?: string
    ): Promise<{
        connections: PrototypeConnection[];
        message: string;
        reasoning?: string;
        cost?: any;
    }>;
}
