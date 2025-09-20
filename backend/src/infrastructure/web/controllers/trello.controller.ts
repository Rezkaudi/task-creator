import { NextFunction, Request, Response } from "express"
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";

export class TrelloController {
    constructor(
        private readonly getBoardListsUseCase: GetBoardListsUseCase,

    ) { }

    async getListsBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

            const boardLists = await this.getBoardListsUseCase.execute();

            res.json({
                success: true,
                data: boardLists,
            });

        } catch (error) {
            console.error('Error in task extraction route:', error);
            next(error);
        }
    }
}




