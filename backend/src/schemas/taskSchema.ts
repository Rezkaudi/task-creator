import { z } from 'zod';

export const taskExtractionSchema = z.object({
    text: z.string().min(1, 'Text input is required').max(100000, 'Text is too long (max 100000 characters)'),
    selectedListId: z.string().min(1, 'A Trello list must be selected'),
});

export const taskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    labels: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const tasksArraySchema = z.array(taskSchema);