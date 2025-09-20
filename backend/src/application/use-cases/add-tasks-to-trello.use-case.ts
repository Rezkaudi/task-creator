import { Task } from "../../domain/entities/task.entity";
import { TrelloTask } from "../../domain/entities/trello-task.entity";
import { ITaskManagment } from "../../domain/services/ITaskManagment";


export class AddTasksToTrelloUseCase {

    constructor(
        private readonly taskManagment: ITaskManagment,
    ) { }

    execute = async (extractedTasks: Task[], selectedListId: string): Promise<TrelloTask[]> => {
        const createdCards = await this.taskManagment.createTasks(extractedTasks, selectedListId);
        return createdCards;
    }
}
