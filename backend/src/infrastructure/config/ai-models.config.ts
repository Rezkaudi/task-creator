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
  // Gemini
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    description: 'Latest flagship - Advanced reasoning & multimodal',
    icon: 'Gem',
    maxTokens: 2000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    isFree: false
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    description: 'Most capable - Complex reasoning & coding',
    icon: 'Gem',
    maxTokens: 2000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
    isFree: false
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    description: 'Fast & capable - Balanced performance',
    icon: 'Gem',
    maxTokens: 1000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 0.50,
    outputPricePerMillion: 3.00,
    isFree: false
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'State-of-the-art thinking model',
    icon: 'Gem',
    maxTokens: 2000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 10.00,
    isFree: false
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
    isFree: false
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'Most cost-effective - High volume tasks',
    icon: 'Gem',
    maxTokens: 1000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 0.10,
    outputPricePerMillion: 0.40,
    isFree: false
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Workhorse model - Speed & efficiency',
    icon: 'Gem',
    maxTokens: 1000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 0.10,
    outputPricePerMillion: 0.40,
    isFree: false
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Cheapest option - Lightweight tasks',
    icon: 'Gem',
    maxTokens: 1000000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 0.08,
    outputPricePerMillion: 0.30,
    isFree: false
  },
  // GPT
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 1.75,
    outputPricePerMillion: 14.00,
    isFree: false
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 10.00,
    isFree: false
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5-Mini',
    description: 'Fast and efficient for general tasks',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 2.00,
    isFree: false
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5-Nano',
    description: 'Fastest and cheapest option',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 0.05,
    outputPricePerMillion: 0.40,
    isFree: false
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1-Mini',
    description: 'Fast and efficient for general tasks',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 0.40,
    outputPricePerMillion: 1.60,
    isFree: false
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 16384,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 8.00,
    isFree: false
  },
  {
    id: 'o3',
    name: 'O3',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 16384,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 8.00,
    isFree: false
  },
  /////claude - Latest
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Most intelligent - Best for agents & coding',
    icon: 'Cl',
    maxTokens: 131072,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 5.00,
    outputPricePerMillion: 25.00,
    isFree: false
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    description: 'Best speed & intelligence balance',
    icon: 'Cl',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    isFree: false
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Fastest - Near-frontier intelligence',
    icon: 'Cl',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00,
    isFree: false
  },
  // Legacy
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    description: 'Premium reasoning & coding - Legacy',
    icon: 'Cl',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 5.00,
    outputPricePerMillion: 25.00,
    isFree: false
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Balanced intelligence & cost - Legacy',
    icon: 'Cl',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    isFree: false
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance & cost - Legacy',
    icon: 'Cl',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    isFree: false
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    description: 'Advanced reasoning - Legacy flagship',
    icon: 'Cl',
    maxTokens: 32768,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    isFree: false
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Premium reasoning - Legacy',
    icon: 'Cl',
    maxTokens: 32768,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    isFree: false
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    description: 'Fast & affordable - Legacy',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00,
    isFree: false
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
