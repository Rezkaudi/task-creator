//src/domain/entities/trello-task.entity.ts
export interface TrelloTask {
    id: string;
    name: string;
    description?: string;
    dueDate?: string;
    idList: string;
    idLabels?: string[];
}