import { Task } from "../../domain/entities/task.entity";
import { FigmaDesign } from "../../domain/entities/figma-design.entity";
import { IExtractTasks } from "../../domain/services/IExtractTasks";

export class GenerateDesignUseCase {
    constructor(
        private readonly gptExtractTasksService: IExtractTasks,
    ) { }

    execute = async (tasks: Task[], projectContext?: string): Promise<FigmaDesign[]> => {
        const design = await this.gptExtractTasksService.generateDesignFromTasks(tasks, projectContext);
        return design;
    }
}