//src/domain/services/IExtractTasks.ts
import { Task } from "../entities/task.entity";

export interface IExtractTasks {
    extractTasksFromText(text: string): Promise<Task[]>;
}