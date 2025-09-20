import axios from 'axios';
import { ENV_CONFIG } from '../config/env.config';

import { Task } from "../../domain/entities/task.entity";
import { TrelloTask } from "../../domain/entities/trello-task.entity";
import { ITaskManagment } from "../../domain/services/ITaskManagment";

export class TrelloService implements ITaskManagment {

    async createTask(task: Task, selectedListId: string): Promise<TrelloTask> {
        try {
            const cardData = {
                key: ENV_CONFIG.TRELLO_API_KEY,
                token: ENV_CONFIG.TRELLO_TOKEN,
                idList: selectedListId,
                name: task.title,
                desc: task.description || '',
                pos: 'top',
            };

            const response = await axios.post<TrelloTask>(
                `${ENV_CONFIG.TRELLO_API_BASE_URL}/cards`,
                cardData
            );

            // Add labels if specified
            if (task.labels && task.labels.length > 0) {
                // Note: In a real implementation, you'd need to map label names to label IDs
                // This is a simplified version
                console.log(`📌 Card created with labels: ${task.labels.join(', ')}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error creating Trello card:', error);

            if (axios.isAxiosError(error)) {
                throw new Error(`Trello API error: ${error.response?.data?.message || error.message}`);
            }

            throw new Error('Failed to create Trello card');
        }
    }

    async createTasks(tasks: Task[], selectedListId: string): Promise<TrelloTask[]> {
        const createdCards: TrelloTask[] = [];

        console.log(`📋 Creating ${tasks.length} cards in Trello...`);

        for (const task of tasks) {
            try {
                const card = await this.createTask(task, selectedListId);
                createdCards.push(card);
                console.log(`✅ Created card: ${card.name}`);
            } catch (error) {
                console.error(`❌ Failed to create card for task: ${task.title}`, error);
                // Continue with other cards even if one fails
            }
        }

        if (createdCards.length === 0) {
            throw new Error('Failed to create any cards in Trello');
        }

        return createdCards;
    }

    async getListsBoards(): Promise<any[]> {

        try {
            const response = await axios.get(
                `${ENV_CONFIG.TRELLO_API_BASE_URL}/boards/${ENV_CONFIG.TRELLO_BOARD_ID}/lists`,
                {
                    params: {
                        key: ENV_CONFIG.TRELLO_API_KEY,
                        token: ENV_CONFIG.TRELLO_TOKEN,
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching Trello lists:', error);
            throw new Error('Failed to fetch Trello lists');
        }
    }


}

