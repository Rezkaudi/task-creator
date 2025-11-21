// src/infrastructure/web/controllers/design.controller.ts - الكود النهائي

import { Request, Response } from 'express';
import { GenerateDesignFromClaudeUseCase } from '../../../application/use-cases/generate-design-from-claude.use-case';
import { ClaudeService } from '../../services/claude.service';


export class DesignController {
    async generateFromText(req: Request, res: Response): Promise<void> {
        const { prompt } = req.body;
        const claudeService = new ClaudeService();
        const generateDesignUseCase = new GenerateDesignFromClaudeUseCase(claudeService);

        try {
            const designData = await generateDesignUseCase.execute(prompt);
            
           
            res.status(200).json(designData);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({ success: false, message });
        }
    }
}
