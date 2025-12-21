import { Task } from "../entities/task.entity";

export interface IExtractTasks {
    generateDesignFromTasks(tasks: Task[], projectContext?: string): Promise<any>;
    extractTasksFromText(text: string): Promise<Task[]>;
}