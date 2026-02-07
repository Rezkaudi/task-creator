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
}

export const DEFAULT_MODEL_ID = 'mistralai/devstral-2512:free'; // default model

export const AI_MODELS: AIModelConfig[] = [
  // free
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini-2.5-Flash',
    description: 'Creative & visual',
    icon: 'Gem',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'mistralai/devstral-2512:free',
    name: 'Devstral-2512',
    description: 'Fast & efficient',
    icon: 'DS',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  // paid
    {
    id: 'devstral-latest',
    name: 'Devstral Latest',
    description: 'Latest Mistral coding model',
    icon: 'DL',
    maxTokens: 262144,
    apiKey: ENV_CONFIG.MISTRAL_API_KEY,
    baseURL: "https://api.mistral.ai/v1",
    inputPricePerMillion: 0.40,
    outputPricePerMillion: 2.00
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Best overall quality',
    icon: 'GPT',
    maxTokens: 128000,
    apiKey: ENV_CONFIG.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    inputPricePerMillion: 1.75,
    outputPricePerMillion: 14.00
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
    outputPricePerMillion: 10.00
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
    outputPricePerMillion: 2.00
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
    outputPricePerMillion: 0.40
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
    outputPricePerMillion: 1.60
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
    outputPricePerMillion: 8.00
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
    outputPricePerMillion: 8.00
  },
  /////claude
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    description: 'Most capable - Premium reasoning & coding',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 5.00,
    outputPricePerMillion: 25.00
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Fastest & cheapest - High throughput',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Balanced intelligence & cost',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    description: 'Advanced reasoning - Legacy flagship',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Premium reasoning - Legacy',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance & cost',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude Sonnet 3.7',
    description: 'Extended thinking - Legacy balanced',
    icon: 'Cl',
    maxTokens: 8192,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00
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
    outputPricePerMillion: 4.00
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude Haiku 3',
    description: 'Cheapest option - Legacy',
    icon: 'Cl',
    maxTokens: 4096,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25
  }
];
export function getModels() {
  return AI_MODELS.map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    icon: model.icon
  }));
}

export function getModelById(id: string): AIModelConfig {
  const model = AI_MODELS.find(model => model.id === id);
  if (!model) {
    throw new Error(`Model with ID '${id}' not found or not available.`);
  }
  return model;
}