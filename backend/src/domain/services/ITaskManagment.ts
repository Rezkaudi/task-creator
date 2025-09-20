import { Task } from "../entities/task.entity";
import { TrelloTask } from "../entities/trello-task.entity";

export interface ITaskManagment {
    createTask(tasks: Task, selectedListId: string): Promise<TrelloTask>;
    createTasks(tasks: Task[], selectedListId: string): Promise<TrelloTask[]>;
    getListsBoards(boardId?: string): Promise<any[]>;
}