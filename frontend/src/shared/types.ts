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

export interface AppResponse {
    data: TrelloList[];
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

export interface TrelloList {
    id: string;
    name: string;
    closed?: boolean;
    color?: string | null;
    idBoard?: string;
    pos?: number;
    subscribed?: boolean;
    softLimit?: number | null;
    type?: string | null;
    datasource?: {
        filter: boolean;
    };
}