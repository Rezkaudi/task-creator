import { ClaudeService } from '../../infrastructure/services/ClaudeService';

export class GenerateDesignUseCase {
    constructor(private readonly claudeService: ClaudeService) {}

    execute = async (prompt: string): Promise<any> => {
        return await this.claudeService.generateDesignFromPrompt(prompt);
    }
}