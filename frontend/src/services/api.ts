import axios from 'axios';
import { TaskExtractionRequest, TaskExtractionResponse } from '../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const extractAndCreateTasks = async (
    text: string,
    selectedListId: string
): Promise<TaskExtractionResponse> => {
    try {
        const request: TaskExtractionRequest = { text, selectedListId };
        const response = await apiClient.post<TaskExtractionResponse>('/tasks/extract', request);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return {
                success: false,
                tasks: [],
                message: error.response.data.message || 'Failed to process tasks',
            };
        }
        throw error;
    }
};