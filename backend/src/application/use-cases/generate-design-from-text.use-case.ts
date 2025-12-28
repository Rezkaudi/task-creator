import { IAiDesignService } from "../../domain/services/IAiDesignService";

export class GenerateDesignFromTextUseCase {
    constructor(private aiDesignService: IAiDesignService) { }

    async execute(prompt: string, modelId: string, designSystemId: string): Promise<any> {
        return this.aiDesignService.generateDesign(prompt, modelId, designSystemId);
    }
}