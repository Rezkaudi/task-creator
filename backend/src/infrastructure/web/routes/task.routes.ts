import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.enhanced';

const taskRoutes = (taskController: TaskController): Router => {
    const router = Router();

    router.post("/extract", (req, res, next) => taskController.extractTasksAndCreateOnTrello(req, res, next));
    router.get("/latest-design", (req, res, next) => taskController.getLatestDesign(req, res, next));

    return router;
};

export default taskRoutes;
