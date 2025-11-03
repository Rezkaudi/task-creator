import { NextFunction, Request, Response } from 'express';
import { ExtractDesignSpecsUseCase } from '../../../application/use-cases/ExtractDesignSpecsUseCase';
import { GenerateDesignUseCase } from '../../../application/use-cases/GenerateDesignUseCase';

export class DesignController {
    constructor(
        private readonly extractDesignSpecsUseCase: ExtractDesignSpecsUseCase,
        private readonly generateDesignUseCase: GenerateDesignUseCase
    ) {}

    // src/infrastructure/web/controllers/DesignController.ts
async generateDesign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ success: false, message: 'Text is required' });
      return;
    }

    const claudePrompt = await this.extractDesignSpecsUseCase.execute(text);
    const designJson = await this.generateDesignUseCase.execute(claudePrompt);

    const result = {
      success: true,
      design: designJson,
      id: Date.now().toString()
    };

    (process.env as any).lastDesign = JSON.stringify(result);

    res.json(result);

  } catch (error) {
    console.error('Design generation error:', error);
    next(error);
  }
}
}