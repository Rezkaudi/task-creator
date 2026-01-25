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

export const DEFAULT_MODEL_ID = 'gpt-4.1'; // default model

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
    id: 'claude-sonnet-4-20250514',
    name: 'Claude-sonnet-4',
    description: 'Detailed & contextual-Average cost',
    icon: 'Cl',
    maxTokens: 12800,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Most powerful Claude - Best for complex tasks-The most expensive',
    icon: 'C4',
    maxTokens: 200000,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00
  },
  
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude Sonnet 3.5',
    description: 'Previous generation - Very capable-Average cost',
    icon: 'C3',
    maxTokens: 200000,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude Opus 3',
    description: 'Previous flagship - Still very powerful-Slightly less expensive',
    icon: 'C3',
    maxTokens: 200000,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    description: 'Fast & affordable - Latest Haiku-Cheapest',
    icon: 'C3',
    maxTokens: 200000,
    apiKey: ENV_CONFIG.CLAUDE_API_KEY,
    baseURL: "https://api.anthropic.com/v1",
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00
  },


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
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM-4.5-Air',
    description: 'Fast & efficient',
    icon: 'GL',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
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

export function getModelById(id: string): AIModelConfig {
  const model = AI_MODELS.find(model => model.id === id);
  if (!model) {
    throw new Error(`Model with ID '${id}' not found or not available.`);
  }
  return model;
}