// src/infrastructure/config/ai-models.config.ts

export interface AIModelConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  available: boolean;
  provider?: string;
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    displayName: 'GPT-4',
    description: 'Best overall quality',
    icon: 'GPT',
    available: true,
    provider: 'OpenAI'
  },
  {
    id: 'gimini',
    name: 'Gemini',
    displayName: 'Gemini',
    description: 'Creative & visual',
    icon: 'Gem',
    available: true,
    provider: 'Google'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    displayName: 'DeepSeek',
    description: 'Fast & efficient',
    icon: 'DS',
    available: true,
    provider: 'DeepSeek'
  },
  {
    id: 'claude',
    name: 'Claude',
    displayName: 'Claude',
    description: 'Detailed & contextual',
    icon: 'Cl',
    available: true,
    provider: 'Anthropic'
  }
];

/**
 * Get all available AI models
 */
export function getAvailableModels(): AIModelConfig[] {
  return AI_MODELS.filter(model => model.available);
}

/**
 * Get a specific model by ID
 */
export function getModelById(id: string): AIModelConfig | undefined {
  return AI_MODELS.find(model => model.id === id && model.available);
}

/**
 * Check if a model is available
 */
export function isModelAvailable(id: string): boolean {
  return AI_MODELS.some(model => model.id === id && model.available);
}