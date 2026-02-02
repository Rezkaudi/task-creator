// File: /backend/src/infrastructure/web/routes/client-error.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { ClientErrorController } from '../controllers/client-error.controller';
import { reportClientErrorValidation } from '../validation';
import { validateRequest } from '../middleware/validation.middleware';

const clientErrorRoutes = (clientErrorController: ClientErrorController): Router => {
    const router = Router();

    // POST /api/errors - Report a client error
    router.post("/",
        reportClientErrorValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) =>
            clientErrorController.reportError(req, res, next)
    );

    return router;
};

export default clientErrorRoutes;