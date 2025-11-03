//src/infrastructure/web/routes/task.routes.ts
import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';

const taskRoutes = (taskController: TaskController): Router => {
    const router = Router();

    router.post("/extract", (req, res, next) => taskController.extractTasksAndCreateOnTrello(req, res, next));

    return router;
};

export default taskRoutes;
