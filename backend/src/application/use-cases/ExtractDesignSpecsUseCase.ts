import { DesignExtractorService } from '../../infrastructure/services/DesignExtractorService';

export class ExtractDesignSpecsUseCase {
    constructor(private readonly designExtractor: DesignExtractorService) {}

    execute = async (text: string): Promise<string> => {
        return await this.designExtractor.extractDesignSpecsAndGeneratePrompt(text);
    }
}