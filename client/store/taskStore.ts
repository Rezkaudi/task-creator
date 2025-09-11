import { create } from 'zustand';
import { Task, TaskExtractionResponse } from '@shared/types';
import { extractAndCreateTasks } from '../services/api';

interface TaskStore {
    isLoading: boolean;
    error: string | null;
    lastCreatedTasks: Task[];
    submitTasks: (text: string) => Promise<boolean>;
    clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
    isLoading: false,
    error: null,
    lastCreatedTasks: [],

    submitTasks: async (text: string) => {
        set({ isLoading: true, error: null });

        try {
            const response = await extractAndCreateTasks(text);

            if (response.success) {
                set({
                    lastCreatedTasks: response.tasks,
                    isLoading: false
                });
                return true;
            } else {
                set({
                    error: response.message || 'Failed to create tasks',
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                isLoading: false
            });
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));