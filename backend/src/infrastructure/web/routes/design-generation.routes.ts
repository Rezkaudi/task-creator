import { Router, Request, Response } from 'express';
import { DesignGenerationController } from '../controllers/design-generation.controller';

const designGenerationRoutes = (controller: DesignGenerationController): Router => {
    const router = Router();

    router.get('/', (req: Request, res: Response) => controller.getUserGenerations(req, res));
    router.get('/:id', (req: Request, res: Response) => controller.getGenerationById(req, res));
    router.delete('/:id', (req: Request, res: Response) => controller.deleteGeneration(req, res));

    return router;
};

export default designGenerationRoutes;
