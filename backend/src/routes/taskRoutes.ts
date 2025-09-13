import { Router, Request, Response, NextFunction } from 'express';
import { taskExtractionSchema } from '../schemas/taskSchema';
import { extractTasksFromText } from '../services/gptService';
import { createTrelloCards } from '../services/trelloService';
import { TaskExtractionRequest, TaskExtractionResponse } from '../shared/types';

const router = Router();

router.post('/extract', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const validationResult = taskExtractionSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
                errors: validationResult.error.flatten(),
            });
        }

        const { text, selectedListId }: TaskExtractionRequest = validationResult.data;

        console.log('📝 Processing text for task extraction...');

        console.log("Step 1 :", text)

        // Extract tasks using GPT
        const extractedTasks = await extractTasksFromText(text);

        console.log("Step 2 :", extractedTasks)

        if (extractedTasks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No tasks could be extracted from the provided text',
                tasks: [],
            });
        }

        console.log(`✅ Extracted ${extractedTasks.length} tasks`);

        // Create cards in Trello

        const createdCards = await createTrelloCards(extractedTasks, selectedListId);

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
});

export default router;