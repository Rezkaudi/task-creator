import { IClaudeGenerator } from '../../domain/services/IClaudeGenerator';

export class GenerateDesignFromClaudeUseCase {
    constructor(private claudeGenerator: IClaudeGenerator) { }

    async execute(prompt: string): Promise<any> {
        if (!prompt) {
            throw new Error('Prompt is required to generate a design.');
        }
        return this.claudeGenerator.generateDesign(prompt);
    }
}
