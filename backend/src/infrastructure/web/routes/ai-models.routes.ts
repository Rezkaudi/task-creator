// src/infrastructure/web/routes/ai-models.routes.ts

import { Router } from 'express';
import { AIModelsController } from '../controllers/ai-models.controller';

export default function aiModelsRoutes(controller: AIModelsController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/ai-models:
   *   get:
   *     summary: Get all available AI models
   *     tags: [AI Models]
   *     responses:
   *       200:
   *         description: List of available AI models
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 count:
   *                   type: number
   *                 models:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       displayName:
   *                         type: string
   *                       description:
   *                         type: string
   *                       icon:
   *                         type: string
   *                       available:
   *                         type: boolean
   *       500:
   *         description: Server error
   */
  router.get('/', (req, res) => controller.getAvailableModels(req, res));

  /**
   * @swagger
   * /api/ai-models/{id}:
   *   get:
   *     summary: Get a specific AI model by ID
   *     tags: [AI Models]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Model ID (e.g., gpt-4, claude, gimini)
   *     responses:
   *       200:
   *         description: Model details
   *       404:
   *         description: Model not found
   *       500:
   *         description: Server error
   */
  router.get('/:id', (req, res) => controller.getModelById(req, res));

  return router;
}