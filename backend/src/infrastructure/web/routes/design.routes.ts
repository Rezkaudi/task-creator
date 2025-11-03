import { Router } from 'express';
import { DesignController } from '../controllers/DesignController';

const designRoutes = (designController: DesignController): Router => {
    const router = Router();
    router.post('/generate', (req, res, next) => designController.generateDesign(req, res, next));
    return router;
};

export default designRoutes;