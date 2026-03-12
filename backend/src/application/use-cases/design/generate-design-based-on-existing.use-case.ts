// src/application/use-cases/generate-design-based-on-existing.use-case.ts
// import fs from "fs";

import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../../domain/services/IAiDesignService";
import { JsonToToonService } from "../../../infrastructure/services/ai/json-to-toon.service";
import { IconExtractorService } from "../../../infrastructure/services/ai/icon-extractor.service";
import { IconPostProcessorService } from "../../../infrastructure/services/ai/icon-post-processor.service";
import { PinnedComponentExtractorService } from "../../../infrastructure/services/ai/pinned-component-extractor.service";
import { PinnedComponentPostProcessorService } from "../../../infrastructure/services/ai/pinned-component-post-processor.service";

export class GenerateDesignBasedOnExistingUseCase {
    constructor(
        private aiDesignService: IAiDesignService,
        private jsonToToonService: JsonToToonService,
        private iconExtractorService: IconExtractorService,
        private iconPostProcessorService: IconPostProcessorService,
        private pinnedComponentExtractorService: PinnedComponentExtractorService,
        private pinnedComponentPostProcessorService: PinnedComponentPostProcessorService
    ) { }

    async execute(
        message: string,
        history: ConversationMessage[],
        referenceDesign: any,
        modelId: string,
        pinnedComponentNames?: string[]
    ): Promise<DesignGenerationResult> {

        // Build icon map server-side — full nodes kept in memory, NOT sent to AI
        const iconMap = this.iconExtractorService.buildIconMap(referenceDesign);
        const iconNames = this.iconExtractorService.extractIconNames(iconMap);

        // Build pinned component map server-side — full nodes kept in memory, NOT sent to AI
        const pinnedMap = (pinnedComponentNames && pinnedComponentNames.length > 0)
            ? this.pinnedComponentExtractorService.extract(referenceDesign, pinnedComponentNames)
            : new Map<string, any>();

        const pinnedInstructions = this.pinnedComponentExtractorService.buildPlaceholderInstructions(pinnedMap);

        if (pinnedMap.size > 0) {
            console.log(`📌 Pinned components: ${Array.from(pinnedMap.keys()).join(', ')}`);
        }

        // Build rich reference context: design tokens + backgrounds + component samples + icon names
        const referenceContext = this.jsonToToonService.buildReferenceContext(
            referenceDesign,
            iconNames.length > 0 ? iconNames : undefined
        );

        // fs.writeFileSync('referenceContext.txt', referenceContext);

        console.log(`📊 Reference context: ${JSON.stringify(referenceDesign).length} → ${referenceContext.length} chars`);

        const validHistory = Array.isArray(history) ? history : [];

        const result = await this.aiDesignService.generateDesignBasedOnExisting(
            message,
            validHistory,
            referenceContext,
            modelId,
            pinnedInstructions || undefined,
        );

        // fs.writeFileSync('resultllm.json', JSON.stringify(result, null, 2));

        // Post-process: replace any named icon placeholders with the original nodes
        if (iconMap.size > 0 && result.design) {
            result.design = this.iconPostProcessorService.restore(result.design, iconMap);
        }

        // Post-process: replace __KEEP__*__ placeholders with the original pinned nodes
        if (pinnedMap.size > 0 && result.design) {
            result.design = this.pinnedComponentPostProcessorService.restore(result.design, pinnedMap);
        }

        // fs.writeFileSync('result.json', JSON.stringify(result, null, 2));


        return result;
    }
}
