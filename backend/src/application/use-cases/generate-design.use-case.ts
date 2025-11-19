import { Task } from "../../domain/entities/task.entity";
import { FigmaDesign } from "../../domain/entities/figma-design.entity";
import { IDesignGenerator } from "../../domain/services/IDesignGenerator";

export class GenerateDesignUseCase {
    constructor(
        private readonly designGenerator: IDesignGenerator,
    ) { }

    execute = async (tasks: Task[], projectContext?: string): Promise<FigmaDesign[]> => {
        const design = await this.designGenerator.generateDesignFromTasks(tasks, projectContext);
        return design;
    }
}