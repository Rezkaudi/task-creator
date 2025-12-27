// src/infrastructure/web/controllers/design-systems.controller.ts

import { Request, Response } from 'express';
import { getDesignSystems } from '../../config/design-systems.config';

export class DesignSystemsController {
  async getAllDesignSystems(_req: Request, res: Response): Promise<void> {
    try {
      const systems = getDesignSystems();

      console.log(`📋 Fetched ${systems.length} available design systems`);

      res.status(200).json({
        success: true,
        count: systems.length,
        systems
      });
    } catch (error) {
      console.error('❌ Error fetching design systems:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch available design systems',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}