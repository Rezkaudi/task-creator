import { Task } from "../entities/task.entity";

export interface IExtractTasks {
    extractTasksFromText(text: string): Promise<Task[]>;
}