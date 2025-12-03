// src/infrastructure/http/routes/design.routes.ts

import { Router } from 'express';
import { DesignController } from '../controllers/design.controller';

const designRoutes = (designController: DesignController): Router => {
    const router = Router();

    router.post('/generate-from-text', (req, res) => 
        designController.generateFromText(req, res)
    );

    router.post('/generate-from-conversation', (req, res) => 
        designController.generateFromConversation(req, res)
    );

    return router;
};

export default designRoutes;