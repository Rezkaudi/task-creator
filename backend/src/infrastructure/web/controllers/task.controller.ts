import { NextFunction, Request, Response } from "express"

import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";
import { GenerateDesignUseCase } from "../../../application/use-cases/generate-design.use-case";

import { TaskExtractionResponse } from "../../../application/dto/task.dto.enhanced";
import { FigmaDesign } from "../../../domain/entities/figma-design.entity";

// SIMPLE IN-MEMORY STORAGE 
let latestDesignData: any = null;

export class TaskController {

    constructor(
        private readonly extractTasksUseCase: ExtractTasksUseCase,
        private readonly addTasksToTrelloUseCase: AddTasksToTrelloUseCase,
        private readonly generateDesignUseCase: GenerateDesignUseCase,
    ) { }

    async extractTasksAndCreateOnTrello(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { text, selectedListId, generateDesign = true } = req.body;

            console.log('📝 Processing text for task extraction...');

            // Step 1: Extract tasks using GPT
            const extractedTasks = await this.extractTasksUseCase.execute(text);

            if (extractedTasks.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No tasks could be extracted from the provided text',
                    tasks: [],
                });
                return;
            }

            console.log(`✅ Extracted ${extractedTasks.length} tasks`);

            // Step 2: Create cards in Trello
            const createdCards = await this.addTasksToTrelloUseCase.execute(extractedTasks, selectedListId);

            console.log(`🎯 Created ${createdCards.length} cards in Trello`);

            // Step 3: Automatically generate Figma design if requested
            let designData: FigmaDesign[] = [];
            if (generateDesign) {
                try {
                    console.log('🎨 Automatically generating Figma design...');
                    designData = await this.generateDesignUseCase.execute(extractedTasks, 'Task Management Dashboard');
                    console.log('✅ Figma design generated successfully');

                    // 🔥 STORE THE DESIGN HERE
                    latestDesignData = designData;
                    console.log('💾 Design stored successfully - Figma plugin can now fetch it');

                } catch (designError) {
                    console.error('⚠️ Design generation failed, but tasks were created:', designError);
                }
            }

            const response: TaskExtractionResponse = {
                success: true,
                tasks: extractedTasks,
                message: `Successfully created ${createdCards.length} tasks in Trello${designData ? ' and generated Figma design' : ''}`,
                designData,
            };

            res.json(response);
        } catch (error) {
            console.error('Error in task extraction route:', error);
            next(error);
        }
    }

    async getLatestDesign(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!latestDesignData) {
                res.status(404).json({
                    success: false,
                    message: 'No design available. Please generate tasks first.',
                    data: null,
                });
                return;
            }

            res.json({
                success: true,
                data: latestDesignData,
                message: 'Latest design retrieved',
            });
        } catch (error) {
            console.error('Error retrieving latest design:', error);
            next(error);
        }
    }
}