// src/infrastructure/web/controllers/ai-models.controller.ts

import { Request, Response } from 'express';
import { getAvailableModels, getModelById } from '../../config/ai-models.config';

export class AIModelsController {
  /**
   * Get all available AI models
   * GET /api/ai-models
   */
  async getAvailableModels(_req: Request, res: Response): Promise<void> {
    try {
      const models = getAvailableModels();
      
      console.log(`📋 Fetched ${models.length} available AI models`);
      
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

  /**
   * Get a specific model by ID
   * GET /api/ai-models/:id
   */
  async getModelById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const model = getModelById(id);

      if (!model) {
        res.status(404).json({
          success: false,
          message: `Model '${id}' not found or not available`
        });
        return;
      }

      res.status(200).json({
        success: true,
        model
      });
    } catch (error) {
      console.error('❌ Error fetching model:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch model',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}