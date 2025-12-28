import { Router, Request, Response, NextFunction } from 'express';
import { TaskController } from '../controllers/task.controller';
import { extractTasksValidation } from '../validation';
import { validateRequest } from '../middleware/validation.middleware';

const taskRoutes = (taskController: TaskController): Router => {
    const router = Router();

    router.post("/extract",
        extractTasksValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => taskController.extractTasksAndCreateOnTrello(req, res, next)
    );

    router.get("/latest-design", (req, res, next) => taskController.getLatestDesign(req, res, next));

    return router;
};

export default taskRoutes;
