// src/infrastructure/web/routes/design.routes.ts

import { Router } from 'express';
import { DesignController } from '../controllers/design.controller';

const designRoutes = (designController: DesignController): Router => {
    const router = Router();

    // Generate design from simple text prompt
    router.post('/generate-from-text', (req, res) => 
        designController.generateFromText(req, res)
    );

    // Generate design from conversation with history
    router.post('/generate-from-conversation', (req, res) => 
        designController.generateFromConversation(req, res)
    );

    // NEW ROUTE: Edit existing design with AI
    router.post('/edit-with-ai', (req, res) => 
        designController.editWithAI(req, res)
    );

    return router;
};

export default designRoutes;