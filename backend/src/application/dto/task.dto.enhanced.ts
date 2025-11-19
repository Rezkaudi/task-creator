import { Task } from "../../domain/entities/task.entity";
import { FigmaDesign } from "../../domain/entities/figma-design.entity";

export interface TaskExtractionRequest {
    text?: string;
    selectedListId?: string;
    generateDesign?: boolean;
}

export interface TaskExtractionResponse {
    tasks: Task[];
    success: boolean;
    message?: string;
    designData?: FigmaDesign[] | null;
}