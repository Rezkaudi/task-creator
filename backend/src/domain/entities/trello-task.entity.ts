export interface TrelloTask {
    id: string;
    name: string;
    description?: string;
    dueDate?: string;
    idList: string;
    idLabels?: string[];
}