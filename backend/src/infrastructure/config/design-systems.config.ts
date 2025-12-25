// src/infrastructure/config/design-systems.config.ts

export interface DesignSystemConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  available: boolean;
  provider?: string;
  promptTemplate?: string;
}

export const DESIGN_SYSTEMS: DesignSystemConfig[] = [
  {
    id: 'material-3',
    name: 'Material Design 3',
    displayName: 'Material Design 3',
    description: 'Google\'s latest design system',
    icon: 'M3',
    available: true,
    provider: 'Google',
    promptTemplate: 'Follow Material Design 3 guidelines: Use elevation with shadows, rounded corners (4px, 8px, 12px), Material color palette, proper spacing (8px grid system), and typography scale. Components should have states: enabled, disabled, hover, focused, pressed.'
  },
  {
    id: 'shadcn-ui',
    name: 'shadcn/ui',
    displayName: 'shadcn/ui',
    description: 'Re-usable components built with Radix UI',
    icon: 'S',
    available: true,
    provider: 'shadcn',
    promptTemplate: 'Use shadcn/ui component patterns: Clean, minimal design with Radix UI primitives. Focus on accessibility, keyboard navigation, and proper ARIA labels. Use CSS variables for theming. Components should be composable and reusable.'
  },
  {
    id: 'ant-design',
    name: 'Ant Design',
    displayName: 'Ant Design',
    description: 'Enterprise-class UI design language',
    icon: 'A',
    available: true,
    provider: 'Ant Group',
    promptTemplate: 'Follow Ant Design principles: Use Ant Design color system (@primary-color, @success-color, etc.), 12-column grid layout, consistent z-index levels, and Ant Design component patterns. Include proper Chinese/English typography considerations.'
  },
  {
    id: 'none',
    name: 'None',
    displayName: 'No Design System',
    description: 'Use default styling',
    icon: '⚡',
    available: true,
    provider: 'Custom'
  }
];

export function getAvailableDesignSystems(): DesignSystemConfig[] {
  return DESIGN_SYSTEMS.filter(system => system.available);
}

export function getDesignSystemById(id: string): DesignSystemConfig | undefined {
  return DESIGN_SYSTEMS.find(system => system.id === id && system.available);
}