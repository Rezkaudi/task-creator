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

  // huggingface
  {
    id: 'deepseek-ai/DeepSeek-V3.2:novita',
    name: 'DeepSeek-V3.2:novita',
    description: 'Fast & efficient',
    icon: 'DS',
    maxTokens: 64000,
    apiKey: ENV_CONFIG.HAMGINGFACE_API_KEY,
    baseURL: "https://router.huggingface.co/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen2.5-7B-Instruct',
    description: 'Fast & efficient',
    icon: 'QW',
    maxTokens: 64000,
    apiKey: ENV_CONFIG.HAMGINGFACE_API_KEY,
    baseURL: "https://router.huggingface.co/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },

  // openrouter
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron-3-Nano-30B-A3B',
    description: 'Fast & efficient',
    icon: 'NM',
    maxTokens: 262144,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
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
    id: 'allenai/olmo-3-32b-think:free',
    name: 'Olmo-3-32b-Think',
    description: 'Fast & efficient',
    icon: 'OL',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron-Nano-12B-V2-VL',
    description: 'Fast & efficient',
    icon: 'NM',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    name: 'Tongyi-DeepResearch-30B-A3B',
    description: 'Fast & efficient',
    icon: 'TY',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS-120B',
    description: 'Fast & efficient',
    icon: 'GO',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT-OSS-20B',
    description: 'Fast & efficient',
    icon: 'GO',
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
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3-Coder',
    description: 'Fast & efficient',
    icon: 'QW',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'google/gemma-3n-e2b-it:free',
    name: 'Gemma-3N-E2B-IT',
    description: 'Fast & efficient',
    icon: 'GM',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'Deepseek-R1T2-Chimera',
    description: 'Fast & efficient',
    icon: 'DS',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'Deepseek-R1-0528',
    description: 'Fast & efficient',
    icon: 'DS',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'tngtech/deepseek-r1t-chimera:free',
    name: 'Deepseek-R1T-Chimera',
    description: 'Fast & efficient',
    icon: 'DS',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral-Small-3.1-24B-Instruct',
    description: 'Fast & efficient',
    icon: 'MS',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma-3-12B-IT',
    description: 'Fast & efficient',
    icon: 'GM',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama-3.3-70B-Instruct',
    description: 'Fast & efficient',
    icon: 'LL',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama-3.2-3B-Instruct',
    description: 'Fast & efficient',
    icon: 'LL',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'qwen/qwen-2.5-vl-7b-instruct:free',
    name: 'Qwen-2.5-VL-7B-Instruct',
    description: 'Fast & efficient',
    icon: 'QW',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct:free',
    name: 'Llama-3.1-405B-Instruct',
    description: 'Fast & efficient',
    icon: 'LL',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral-7B-Instruct',
    description: 'Fast & efficient',
    icon: 'MS',
    maxTokens: 65536,
    apiKey: ENV_CONFIG.OPEN_ROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00
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