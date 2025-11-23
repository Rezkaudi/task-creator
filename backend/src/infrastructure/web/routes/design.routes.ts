import { Router } from 'express';
import { DesignController } from '../controllers/design.controller';

const designRoutes = (designController: DesignController): Router => {
    const router = Router();

    router.post('/generate-from-text', (req, res) => designController.generateFromText(req, res));

    return router;
};

export default designRoutes;