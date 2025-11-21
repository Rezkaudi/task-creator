// src/domain/services/IClaudeGenerator.ts

export interface IClaudeGenerator {
    generateDesign(prompt: string): Promise<any>;
}
