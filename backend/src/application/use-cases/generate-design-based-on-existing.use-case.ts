// src/application/use-cases/generate-design-based-on-existing.use-case.ts

import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../domain/services/IAiDesignService";
import { JsonToToonService } from "../../infrastructure/services/json-to-toon.service";

export class GenerateDesignBasedOnExistingUseCase {
    constructor(
        private aiDesignService: IAiDesignService,
        private jsonToToonService: JsonToToonService
    ) { }

    async execute(
        message: string,
        history: ConversationMessage[],
        referenceDesign: any,
        modelId: string
    ): Promise<DesignGenerationResult> {
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required to generate a design.');
        }

        if (!referenceDesign) {
            throw new Error('Reference design is required to extract design system.');
        }

        const toonFormat = this.jsonToToonService.convertToToon(referenceDesign);
        
        console.log(`📊 Reduced size: ${JSON.stringify(referenceDesign).length} → ${toonFormat.length} chars`);

        const validHistory = Array.isArray(history) ? history : [];

        return this.aiDesignService.generateDesignBasedOnExisting(
            message,
            validHistory,
            toonFormat, 
            modelId
        );
    }
}