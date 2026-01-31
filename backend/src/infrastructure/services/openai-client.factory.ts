// src/infrastructure/services/openai-client.factory.ts

import OpenAI from 'openai';
import { AIModelConfig } from '../config/ai-models.config';
import { IOpenAIClientFactory } from '../../domain/services/IOpenAIClientFactory';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export class OpenAIClientFactory implements IOpenAIClientFactory {
    private clientCache: Map<string, OpenAI> = new Map();

    createClient(aiModel: AIModelConfig, timeoutMs: number = DEFAULT_TIMEOUT_MS): OpenAI {
        const cacheKey = `${aiModel.id}-${timeoutMs}`;
        
        // Reuse existing client if available
        const cached = this.clientCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const client = new OpenAI({
            baseURL: aiModel.baseURL,
            apiKey: aiModel.apiKey,
            timeout: timeoutMs,
            maxRetries: 2,
        });

        this.clientCache.set(cacheKey, client);
        return client;
    }
}
