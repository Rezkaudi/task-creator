export interface Task {
    title?: string;
    description?: string;
    dueDate?: string;
    labels?: string[];
    priority?: 'low' | 'medium' | 'high';
}

export interface TaskExtractionRequest {
    text?: string;
    selectedListId?: string
}

export interface TaskExtractionResponse {
    tasks: Task[];
    success: boolean;
    message?: string;
}

export interface TrelloCard {
    id: string;
    name: string;
    desc?: string;
    due?: string;
    idList: string;
    idLabels?: string[];
}