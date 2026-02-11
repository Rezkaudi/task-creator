// src/infrastructure/config/design-systems.config.ts

import { antDesignPrompt, material3Prompt, shadcnUiPrompt } from "./prompt.config";

export interface DesignSystemConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  promptTemplate: string;
}

export const DEFAULT_DESIGN_SYSTEM_ID = 'default-design-system'; // default design system

export const DESIGN_SYSTEMS: DesignSystemConfig[] = [
  {
    id: 'default-design-system',
    name: 'Default Design System',
    description: 'Use default styling',
    icon: '⚡',
    promptTemplate: ''
  },
  {
    id: 'material-3',
    name: 'Material Design 3',
    description: 'Google\'s latest design system',
    icon: 'M3',
    promptTemplate: material3Prompt
  },
  {
    id: 'shadcn-ui',
    name: 'shadcn/ui',
    description: 'Re-usable components built with Radix UI',
    icon: 'S',
    promptTemplate: shadcnUiPrompt
  },
  {
    id: 'ant-design',
    name: 'Ant Design',
    description: 'Enterprise-class UI design language',
    icon: 'A',
    promptTemplate: antDesignPrompt
  }

];

export function getDesignSystems() {
  return DESIGN_SYSTEMS.map(designSystem => ({
    id: designSystem.id,
    name: designSystem.name,
    description: designSystem.description,
    icon: designSystem.icon
  }));
}

export function getDesignSystemById(id: string): DesignSystemConfig {
  const system = DESIGN_SYSTEMS.find(system => system.id === id.toString());
  if (!system) {
    throw new Error(`Design System with ID '${id}' not found or not available.`);
  }
  return system;
}