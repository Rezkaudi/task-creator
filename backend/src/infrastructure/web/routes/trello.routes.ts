import { Router } from 'express';
import { TrelloController } from '../controllers/trello.controller';

const trelloRoutes = (trelloController: TrelloController): Router => {
    const router = Router();

    router.get("/board-lists", (req, res, next) => trelloController.getListsBoard(req, res, next));

    return router;
};

export default trelloRoutes;
