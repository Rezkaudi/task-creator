//src/domain/entities/task.entity.ts
export interface Task {
    title: string;
    description: string;
    dueDate?: string;
    labels?: string[];
    priority?: 'low' | 'medium' | 'high';
}