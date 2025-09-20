import { create } from 'zustand';
import { Task, TrelloList } from '../shared/types';
import { extractAndCreateTasks, getBoardListsFromTrello } from '../services/api';

interface TaskStore {
    isLoading: boolean;
    error: string | null;
    lastCreatedTasks: Task[];
    boardLists: TrelloList[];
    submitTasks: (text: string, selectedListId: string) => Promise<boolean>;
    getBoardLists: () => Promise<void>;
    clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
    isLoading: false,
    error: null,
    lastCreatedTasks: [],
    boardLists: [],

    submitTasks: async (text: string, selectedListId: string) => {
        set({ isLoading: true, error: null });

        try {
            const response = await extractAndCreateTasks(text, selectedListId);

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

    getBoardLists: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await getBoardListsFromTrello();

            if (response.success) {
                set({
                    boardLists: response.data,
                    isLoading: false
                });
            } else {
                set({
                    error: response.message || 'Failed to create tasks',
                    isLoading: false
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                isLoading: false
            });
        }
    },

    clearError: () => set({ error: null }),
}));