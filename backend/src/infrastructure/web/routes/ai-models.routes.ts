// src/infrastructure/web/routes/ai-models.routes.ts

import { Router } from 'express';
import { AIModelsController } from '../controllers/ai-models.controller';

export default function aiModelsRoutes(controller: AIModelsController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.getAllModels(req, res));

  return router;
}