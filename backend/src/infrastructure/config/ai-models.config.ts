import { ENV_CONFIG } from './env.config';

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxTokens: number;
  apiKey: string;
  baseURL: string;
}

export const DEFAULT_MODEL_ID = 'gpt-4'; // default model

export const AI_MODELS: AIModelConfig[] = [
  // paid
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",

  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 16384,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",

  },
  {
    id: 'o3',
    name: 'O3',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 16384,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude',
    description: 'Detailed & contextual',
    icon: 'Cl',
    maxTokens: 64000,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1"
  },

  // free
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini-2.5-Flash',
    description: 'Creative & visual',
    icon: 'Gem',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models"
  },
  {
    id: 'deepseek-ai/DeepSeek-V3.2:novita',
    name: 'DeepSeek-V3.2:novita',
    description: 'Fast & efficient',
    icon: 'DS',
    maxTokens: 64000,
    apiKey: ENV_CONFIG.HAMGINGFACE_API_KEY,
    baseURL: "https://router.huggingface.co/v1"
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen2.5-7B-Instruct',
    description: 'Fast & efficient',
    icon: 'QW',
    maxTokens: 64000,
    apiKey: ENV_CONFIG.HAMGINGFACE_API_KEY,
    baseURL: "https://router.huggingface.co/v1"
  },

];

export function getModels() {
  return AI_MODELS.map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    icon: model.icon
  }));
}

export function getModelById(id: string | undefined): AIModelConfig {
  if (!id) {
    id = DEFAULT_MODEL_ID;
  }

  const model = AI_MODELS.find(model => model.id === id);
  if (!model) {
    throw new Error(`Model with ID '${id}' not found or not available.`);
  }
  return model;
}