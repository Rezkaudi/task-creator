// src/application/use-cases/generate-design-based-on-existing.use-case.ts

import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../../domain/services/IAiDesignService";
import { JsonToToonService } from "../../../infrastructure/services/ai/json-to-toon.service";
import { IconExtractorService } from "../../../infrastructure/services/ai/icon-extractor.service";
import { IconPostProcessorService } from "../../../infrastructure/services/ai/icon-post-processor.service";

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

        const toonFormat = this.jsonToToonService.convertToSample(referenceDesign);
        console.log(`📊 Design system size: ${JSON.stringify(referenceDesign).length} → ${toonFormat.length} chars`);

        // Build icon map server-side — full nodes kept in memory, NOT sent to AI
        const iconMap = IconExtractorService.buildIconMap(referenceDesign);
        const iconNames = IconExtractorService.extractIconNames(iconMap);
        if (iconNames.length > 0) {
            console.log(`🎨 Found ${iconNames.length} icon(s) in reference: ${iconNames.join(', ')}`);
        }

        const validHistory = Array.isArray(history) ? history : [];

        // AI only receives icon names as a hint — no geometry, no IDs
        const result = await this.aiDesignService.generateDesignBasedOnExisting(
            message,
            validHistory,
            toonFormat,
            modelId,
            iconNames.length > 0 ? iconNames : undefined
        );

        // Post-process: replace any named icon placeholders with the original nodes
        if (iconMap.size > 0 && result.design) {
            result.design = IconPostProcessorService.restore(result.design, iconMap);
        }

        return result;
    }
}
