import { Task } from "../../domain/entities/task.entity";
import { IExtractTasks } from "../../domain/services/IExtractTasks";


export class ExtractTasksUseCase {

    constructor(
        private readonly extractTasks: IExtractTasks,
    ) { }

    execute = async (text: string): Promise<Task[]> => {
        const tasks = await this.extractTasks.extractTasksFromText(text);
        return tasks;
    }
}
