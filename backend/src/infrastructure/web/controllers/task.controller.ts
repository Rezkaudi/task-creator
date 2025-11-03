//src/infrastructure/web/controllers/task.controller.ts
import { NextFunction, Request, Response } from "express"
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";
import { TaskExtractionResponse } from "../../../application/dto/task.dto";

export class TaskController {

    constructor(
        private readonly extractTasksUseCase: ExtractTasksUseCase,
        private readonly addTasksToTrelloUseCase: AddTasksToTrelloUseCase,
    ) { }

    async extractTasksAndCreateOnTrello(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { text, selectedListId } = req.body;

            console.log('📝 Processing text for task extraction...');

            console.log("Step 1 :", text)

            // Extract tasks using GPT
            const extractedTasks = await this.extractTasksUseCase.execute(text);

            console.log("Step 2 :", extractedTasks)

            if (extractedTasks.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No tasks could be extracted from the provided text',
                    tasks: [],
                });
            }

            console.log(`✅ Extracted ${extractedTasks.length} tasks`);


            // Create cards in Trello
            const createdCards = await this.addTasksToTrelloUseCase.execute(extractedTasks, selectedListId);

            console.log(`🎯 Created ${createdCards.length} cards in Trello`);

            const response: TaskExtractionResponse = {
                success: true,
                tasks: extractedTasks,
                message: `Successfully created ${createdCards.length} tasks in Trello`,
            };

            res.json(response);
        } catch (error) {
            console.error('Error in task extraction route:', error);
            next(error);
        }
    }
}