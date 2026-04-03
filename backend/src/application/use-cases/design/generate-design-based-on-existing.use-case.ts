// src/application/use-cases/generate-design-based-on-existing.use-case.ts
// import fs from "fs";

import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../../domain/services/IAiDesignService";
import { JsonToToonService } from "../../../infrastructure/services/ai/json-to-toon.service";
import { IconExtractorService } from "../../../infrastructure/services/ai/icon-extractor.service";
import { IconPostProcessorService } from "../../../infrastructure/services/ai/icon-post-processor.service";
import { PinnedComponentExtractorService } from "../../../infrastructure/services/ai/pinned-component-extractor.service";
import { PinnedComponentPostProcessorService } from "../../../infrastructure/services/ai/pinned-component-post-processor.service";
import { WireframeBuilderService } from "../../../infrastructure/services/ai/wireframe-builder.service";

export class GenerateDesignBasedOnExistingUseCase {
    constructor(
        private aiDesignService: IAiDesignService,
        private jsonToToonService: JsonToToonService,
        private iconExtractorService: IconExtractorService,
        private iconPostProcessorService: IconPostProcessorService,
        private pinnedComponentExtractorService: PinnedComponentExtractorService,
        private pinnedComponentPostProcessorService: PinnedComponentPostProcessorService,
        private wireframeBuilderService: WireframeBuilderService,
    ) { }

    async execute(
        message: string,
        history: ConversationMessage[],
        referenceDesign: any,
        modelId: string,
        pinnedComponentNames?: string[],
        imageDataUrl?: string,
    ): Promise<DesignGenerationResult> {

        // Build icon map server-side — full nodes kept in memory, NOT sent to AI
        const iconMap = this.iconExtractorService.buildIconMap(referenceDesign);
        const iconNames = this.iconExtractorService.extractIconNames(iconMap);

        // Build pinned component map server-side — full nodes kept in memory, NOT sent to AI
        const pinnedMap = (pinnedComponentNames && pinnedComponentNames.length > 0)
            ? this.pinnedComponentExtractorService.extract(referenceDesign, pinnedComponentNames)
            : new Map<string, any>();

        // Build wireframe JSON with __KEEP__ markers for pinned nodes.
        // This gives the LLM the full 2D spatial layout so it can generate
        // content for the correct areas regardless of sidebar/nested layouts.
        const wireframe = (pinnedComponentNames && pinnedComponentNames.length > 0)
            ? this.wireframeBuilderService.build(referenceDesign, pinnedComponentNames)
            : undefined;

        if (pinnedMap.size > 0) {
            console.log(`📌 Pinned components: ${Array.from(pinnedMap.keys()).join(', ')}`);
        }

        // Build rich reference context: design tokens + backgrounds + component samples + icon names + wireframe
        const referenceContext = this.jsonToToonService.buildReferenceContext(
            referenceDesign,
            iconNames.length > 0 ? iconNames : undefined,
            wireframe ?? undefined,
        );

        // fs.writeFileSync('referenceContext.txt', referenceContext);

        console.log(`📊 Reference context: ${JSON.stringify(referenceDesign).length} → ${referenceContext.length} chars`);

        const validHistory = Array.isArray(history) ? history : [];

        const result = await this.aiDesignService.generateDesignBasedOnExisting(
            message,
            validHistory,
            referenceContext,
            modelId,
            undefined,
            imageDataUrl,
        );

        // fs.writeFileSync('resultllm.json', JSON.stringify(result, null, 2));

        // Post-process: replace any named icon placeholders with the original nodes
        if (iconMap.size > 0 && result.design) {
            result.design = this.iconPostProcessorService.restore(result.design, iconMap);
        }

        // Post-process: recursively inject pinned components at their original positions.
        // Handles both flat (header/sidebar) and nested (logo inside sidebar) cases.
        if (pinnedMap.size > 0 && result.design) {
            result.design = this.pinnedComponentPostProcessorService.recursiveInject(result.design, pinnedMap);
        }

        // fs.writeFileSync('result.json', JSON.stringify(result, null, 2));


        return result;
    }
}
