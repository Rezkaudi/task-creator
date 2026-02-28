import { ENV_CONFIG } from './env.config';

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxTokens: number;
  apiKey: string;
  baseURL: string;
  // Pricing in USD per million tokens
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  isFree: boolean;
}

export const DEFAULT_MODEL_ID = 'devstral-latest'; // default model

export const AI_MODELS: AIModelConfig[] = [
  // free
  {
    id: 'devstral-latest',
    name: 'Devstral Latest',
    description: 'Latest Mistral coding model',
    icon: 'DL',
    maxTokens: 262144,
    apiKey: ENV_CONFIG.MISTRAL_API_KEY,
    baseURL: "https://api.mistral.ai/v1",
    inputPricePerMillion: 0.40,
    outputPricePerMillion: 2.00,
    isFree: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Best price-performance - Adaptive thinking',
    icon: 'Gem',
    maxTokens: 1000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 0.30,
    outputPricePerMillion: 2.50,
    isFree: true
  },
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6',
    description: 'Most intelligent - Best for agents & coding',
    icon: 'Cl',
    maxTokens: 131072,
    apiKey: ENV_CONFIG.POE_API_KEY,
    baseURL: "https://api.poe.com/v1",
    inputPricePerMillion: 5.00,
    outputPricePerMillion: 25.00,
    isFree: false,
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.POE_API_KEY,
    baseURL: "https://api.poe.com/v1",
    inputPricePerMillion: 1.75,
    outputPricePerMillion: 14.00,
    isFree: false,
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro Preview',
    description: 'Latest flagship - Advanced reasoning & multimodal',
    icon: 'Gem',
    maxTokens: 2000000,
    apiKey: ENV_CONFIG.POE_API_KEY,
    baseURL: "https://api.poe.com/v1",
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    isFree: false,
  },
  {
    id: 'grok-4.1-fast-reasoning',
    name: 'Grok 4.1 Fast Reasoning',
    description: 'Fast reasoning - Best for fast responses',
    icon: 'Gk',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.POE_API_KEY,
    baseURL: "https://api.poe.com/v1",
    inputPricePerMillion: 0.20,
    outputPricePerMillion: 0.50,
    isFree: false,
  }
];
export function getModels() {
  return AI_MODELS.map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    icon: model.icon,
    isFree: model.isFree,
  }));
}

export function getModelById(id: string): AIModelConfig {
  const model = AI_MODELS.find(model => model.id === id);
  if (!model) {
    throw new Error(`Model with ID '${id}' not found or not available.`);
  }
  return model;
}
