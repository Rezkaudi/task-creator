// src/infrastructure/web/controllers/design-systems.controller.ts

import { Request, Response } from 'express';
import { 
  getAvailableDesignSystems, 
  getDesignSystemById 
} from '../../config/design-systems.config';

export class DesignSystemsController {
  async getAvailableDesignSystems(_req: Request, res: Response): Promise<void> {
    try {
      const systems = getAvailableDesignSystems();
      
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

  async getDesignSystemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const system = getDesignSystemById(id);

      if (!system) {
        res.status(404).json({
          success: false,
          message: `Design System '${id}' not found or not available`
        });
        return;
      }

      res.status(200).json({
        success: true,
        system
      });
    } catch (error) {
      console.error('❌ Error fetching design system:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch design system',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}