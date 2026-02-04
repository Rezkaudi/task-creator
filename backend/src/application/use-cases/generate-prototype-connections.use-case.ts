// File: /backend/src/application/use-cases/generate-prototype-connections.use-case.ts

import { FrameInfo, PrototypeConnection } from "../../domain/entities/prototype-connection.entity";
import { IPrototypeService } from "../../domain/services/IPrototypeService";

export class GeneratePrototypeConnectionsUseCase {
    constructor(
        private readonly prototypeService: IPrototypeService
    ) { }

    async execute(
        frames: FrameInfo[],
        modelId?: string
    ): Promise<{
        connections: PrototypeConnection[];
        message: string;
        reasoning?: string;
        cost?: any;
    }> {

        const result = await this.prototypeService.generateConnections(
            frames,
            modelId
        );

        return result;
    }
}
