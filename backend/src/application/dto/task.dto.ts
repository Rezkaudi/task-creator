import { Task } from "../../domain/entities/task.entity";

export interface TaskExtractionRequest {
    text?: string;
    selectedListId?: string

}

export interface TaskExtractionResponse {
    tasks: Task[];
    success: boolean;
    message?: string;
}