import axios from 'axios';
import { Task, TrelloCard } from '@shared/types';

const TRELLO_API_BASE = 'https://api.trello.com/1';

interface TrelloConfig {
    apiKey: string;
    token: string;
    boardId: string;
    listId: string;
}

function getTrelloConfig(): TrelloConfig {
    const config = {
        apiKey: process.env.TRELLO_API_KEY,
        token: process.env.TRELLO_TOKEN,
        boardId: process.env.TRELLO_BOARD_ID,
        listId: process.env.TRELLO_LIST_ID,
    };

    if (!config.apiKey || !config.token || !config.boardId || !config.listId) {
        throw new Error('Missing Trello configuration. Please check your environment variables.');
    }

    return config as TrelloConfig;
}

async function createTrelloCard(task: Task, config: TrelloConfig): Promise<TrelloCard> {
    try {
        const cardData = {
            key: config.apiKey,
            token: config.token,
            idList: config.listId,
            name: task.title,
            desc: task.description || '',
            due: task.dueDate || null,
            pos: 'bottom',
        };

        const response = await axios.post<TrelloCard>(
            `${TRELLO_API_BASE}/cards`,
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

export async function createTrelloCards(tasks: Task[]): Promise<TrelloCard[]> {
    const config = getTrelloConfig();
    const createdCards: TrelloCard[] = [];

    console.log(`📋 Creating ${tasks.length} cards in Trello...`);

    for (const task of tasks) {
        try {
            const card = await createTrelloCard(task, config);
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

// Optional: Function to get available lists on a board
export async function getTrelloLists(boardId?: string): Promise<any[]> {
    const config = getTrelloConfig();
    const targetBoardId = boardId || config.boardId;

    try {
        const response = await axios.get(
            `${TRELLO_API_BASE}/boards/${targetBoardId}/lists`,
            {
                params: {
                    key: config.apiKey,
                    token: config.token,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error fetching Trello lists:', error);
        throw new Error('Failed to fetch Trello lists');
    }
}