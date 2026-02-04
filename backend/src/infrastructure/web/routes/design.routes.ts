// src/infrastructure/web/routes/design.routes.ts

import { Router, Request, Response } from 'express';
import { DesignController } from '../controllers/design.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { generateFromConversationValidation, editWithAIValidation, generateBasedOnExistingValidation, generatePrototypeValidation } from '../validation';


const designRoutes = (designController: DesignController): Router => {
    const router = Router();

    // Generate design from conversation with history
    router.post('/generate-from-conversation',
        generateFromConversationValidation,
        validateRequest,
        (req: Request, res: Response) => designController.generateFromConversation(req, res)
    );

    // Edit existing design with AI
    router.post('/edit-with-ai',
        editWithAIValidation,
        validateRequest,
        (req: Request, res: Response) => designController.editWithAI(req, res)
    );
    router.post('/generate-based-on-existing',
        generateBasedOnExistingValidation,
        validateRequest,
        (req: Request, res: Response) => designController.generateBasedOnExisting(req, res)
    );

    router.post('/generate-prototype',
        generatePrototypeValidation,
        validateRequest,
        (req: Request, res: Response) => designController.generatePrototype(req, res)
    );

    return router;
};

export default designRoutes;