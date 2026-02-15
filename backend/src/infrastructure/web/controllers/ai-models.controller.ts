// src/infrastructure/web/controllers/ai-models.controller.ts

import { Request, Response } from 'express';
import { getModels } from '../../config/ai-models.config';

export class AIModelsController {

  // Get all AI models
  async getAllModels(_req: Request, res: Response): Promise<void> {
    try {
      const models = getModels();

      console.log(`📋 Fetched ${models.length} AI models`);

      res.status(200).json({
        success: true,
        count: models.length,
        models
      });

    } catch (error) {
      console.error('❌ Error fetching AI models:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch available AI models',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}