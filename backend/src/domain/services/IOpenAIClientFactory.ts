// src/domain/services/IOpenAIClientFactory.ts

import OpenAI from 'openai';
import { AIModelConfig } from '../../infrastructure/config/ai-models.config';

export interface IOpenAIClientFactory {
    createClient(aiModel: AIModelConfig, timeoutMs?: number): OpenAI;
}
