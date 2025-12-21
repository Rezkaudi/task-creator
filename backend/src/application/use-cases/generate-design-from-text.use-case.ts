import { IAiDesignService } from "../../domain/services/IAiDesignService";

export class GenerateDesignFromTextUseCase {
    constructor(private aiDesignService: IAiDesignService) { }

    async execute(prompt: string): Promise<any> {
        if (!prompt) {
            throw new Error('Prompt is required to generate a design.');
        }
        return this.aiDesignService.generateDesign(prompt);
    }
}
