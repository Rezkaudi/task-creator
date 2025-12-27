// src/infrastructure/web/routes/design-systems.routes.ts

import { Router } from 'express';
import { DesignSystemsController } from '../controllers/design-systems.controller';

export default function designSystemsRoutes(controller: DesignSystemsController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.getAllDesignSystems(req, res));

  return router;
}