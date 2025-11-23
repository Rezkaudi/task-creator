import { Request, Response } from 'express';

import { GenerateDesignFromClaudeUseCase } from '../../../application/use-cases/generate-design-from-claude.use-case';

export class DesignController {
    constructor(
        private readonly generateDesignUseCase: GenerateDesignFromClaudeUseCase,
    ) { }

    async generateFromText(req: Request, res: Response): Promise<void> {
        const { prompt } = req.body;

        try {
            const designData = await this.generateDesignUseCase.execute(prompt);

            res.status(200).json(designData);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({ success: false, message });
        }
    }
}
