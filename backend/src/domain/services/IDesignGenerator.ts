import { Task } from "../entities/task.entity";
import { FigmaDesign } from "../entities/figma-design.entity";

export interface IDesignGenerator {
    generateDesignFromTasks(tasks: Task[], projectContext?: string): Promise<FigmaDesign[]>;
}