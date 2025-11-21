// src/infrastructure/web/routes/design.routes.ts

import { Router } from 'express';
import { DesignController } from '../controllers/design.controller';

const router = Router();
const designController = new DesignController();

router.post('/generate-from-text', designController.generateFromText);

export default router;
