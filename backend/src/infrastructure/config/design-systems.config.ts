// src/infrastructure/config/design-systems.config.ts

export interface DesignSystemConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  available: boolean;
  provider?: string;
  promptTemplate: string;
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
    promptTemplate: `
# Material Design 3 Guidelines

## Color System
- Use Material You dynamic color system with color roles:
  - Primary: Main brand color (elevation level 0-5)
  - Secondary: Supporting color for accents
  - Tertiary: For highlights and special elements
  - Error: For error states and warnings
  - Surface colors: surface, surface-variant, surface-container
- Colors MUST be in 0-1 range (NOT 0-255)
- Example primary color: { r: 0.4, g: 0.2, b: 0.8 }

## Elevation & Shadows
- Use elevation levels (0-5) with corresponding shadows:
  - Level 0: No shadow (flat surface)
  - Level 1: { type: "DROP_SHADOW", radius: 2, offset: { x: 0, y: 1 }, color: { r: 0, g: 0, b: 0, a: 0.1 } }
  - Level 2: { type: "DROP_SHADOW", radius: 4, offset: { x: 0, y: 2 }, color: { r: 0, g: 0, b: 0, a: 0.15 } }
  - Level 3: { type: "DROP_SHADOW", radius: 8, offset: { x: 0, y: 4 }, color: { r: 0, g: 0, b: 0, a: 0.2 } }

## Shape & Corner Radius
- Use Material 3 shape system:
  - Extra small: 4px (chips, small buttons)
  - Small: 8px (cards, text fields)
  - Medium: 12px (dialogs, bottom sheets)
  - Large: 16px (FABs, large cards)
  - Extra large: 28px (prominent surfaces)

## Spacing (8px Grid System)
- All spacing MUST be multiples of 8: 8, 16, 24, 32, 40, 48px
- Padding inside containers: minimum 16px
- Item spacing in lists: 8px or 16px

## Typography Scale
Use Roboto or Google Sans with these sizes:
- Display Large: 57px (headlines)
- Headline Large: 32px (section titles)
- Title Large: 22px (card titles)
- Body Large: 16px (main content)
- Label Large: 14px (buttons, tabs)
- Label Small: 11px (captions)

## Component States
Every interactive element MUST have these states:
- Enabled: Default appearance
- Hover: opacity: 0.08 overlay
- Focused: 2px outline with primary color
- Pressed: opacity: 0.12 overlay
- Disabled: opacity: 0.38

## Layout Patterns
- Use auto-layout (layoutMode: "VERTICAL" or "HORIZONTAL")
- Prefer flex layouts over absolute positioning
- Standard container width: 1200px max
- Use proper constraints for responsive behavior

## Specific Components
### Buttons
- Height: 40px (standard), 56px (FAB)
- Padding: horizontal 24px, vertical 10px
- Corner radius: 20px (fully rounded)
- Include ripple effect indication in effects

### Text Fields
- Height: 56px
- Corner radius: 4px (top corners only for filled style)
- Label: 12px above field
- Helper text: 12px below field

### Cards
- Corner radius: 12px
- Padding: 16px
- Elevation: Level 1 (default), Level 2 (hover)
- Min height: 80px

CRITICAL: All measurements, colors, and patterns MUST strictly follow Material Design 3 specifications.
`.trim()
  },
  
  {
    id: 'shadcn-ui',
    name: 'shadcn/ui',
    displayName: 'shadcn/ui',
    description: 'Re-usable components built with Radix UI',
    icon: 'S',
    available: true,
    provider: 'shadcn',
    promptTemplate: `
# shadcn/ui Design System Guidelines

## Core Philosophy
- Minimal, clean design with focus on accessibility
- Components are composable and reusable
- No heavy decorations, let content shine
- Dark mode friendly from the start

## Color System (CSS Variables Concept)
- Use neutral colors as base:
  - Background: { r: 1, g: 1, b: 1 } (light) or { r: 0.02, g: 0.02, b: 0.02 } (dark)
  - Foreground: { r: 0.02, g: 0.02, b: 0.02 } (light) or { r: 0.98, g: 0.98, b: 0.98 } (dark)
  - Primary: { r: 0.09, g: 0.09, b: 0.11 } (slate-900)
  - Accent: { r: 0.96, g: 0.96, b: 0.97 } (slate-100)
  - Border: { r: 0.89, g: 0.89, b: 0.91 } (slate-200)
- All colors in 0-1 range

## Shape & Borders
- Border radius: Subtle and consistent
  - Small: 4px (inputs, badges)
  - Medium: 6px (buttons, cards)
  - Large: 8px (dialogs, popovers)
- Border width: 1px (thin and delicate)
- Border color: Use muted neutral (opacity: 0.2)

## Spacing System
- Use 4px base unit: 4, 8, 12, 16, 20, 24, 32, 40px
- Component padding: typically 12-16px
- Section spacing: 24-32px
- Page margins: 16-24px

## Typography
Use system fonts (Inter, SF Pro, or similar):
- Heading 1: 36px, weight: 700
- Heading 2: 30px, weight: 600
- Heading 3: 24px, weight: 600
- Body: 14px, weight: 400
- Small: 12px, weight: 400
- Line height: 1.5 for body, 1.2 for headings

## Accessibility Requirements (CRITICAL)
- All interactive elements MUST have:
  - Minimum 44x44px touch target
  - Visible focus states (2px ring with primary color)
  - Proper contrast ratios (4.5:1 minimum for text)
- Include role hints in component names when relevant

## Component Patterns

### Buttons
- Height: 36px (small), 40px (default), 44px (large)
- Padding: horizontal 16px, vertical 8px
- Corner radius: 6px
- Variants:
  - Default: border: 1px, background: transparent, hover: background with opacity 0.05
  - Primary: solid background, no border
  - Ghost: no background, no border, hover: background opacity 0.1

### Input Fields
- Height: 36px
- Border: 1px solid border-color
- Corner radius: 4px
- Focus state: 2px ring with primary color, offset: 2px
- Padding: horizontal 12px

### Cards
- Border: 1px solid border-color
- Corner radius: 8px
- Padding: 16px or 24px
- Background: white or very subtle background
- NO drop shadows (use borders instead)

### Dialogs & Popovers
- Corner radius: 8px
- Border: 1px solid border-color
- Padding: 24px
- Use subtle shadow: { type: "DROP_SHADOW", radius: 20, offset: { x: 0, y: 10 }, color: { r: 0, g: 0, b: 0, a: 0.1 } }

## Layout Rules
- Use auto-layout (layoutMode: "VERTICAL" or "HORIZONTAL")
- Prefer clean, grid-based layouts
- Standard container: max-width 1280px
- Grid columns: 12-column system with 16px gaps

## Effects & Animations (Indicate in design)
- Transitions should feel snappy (200ms)
- Use ease-in-out timing
- Hover states: subtle opacity or background changes
- No heavy animations or effects

CRITICAL: Keep designs minimal, accessible, and composable. Avoid over-styling.
`.trim()
  },
  
  {
    id: 'ant-design',
    name: 'Ant Design',
    displayName: 'Ant Design',
    description: 'Enterprise-class UI design language',
    icon: 'A',
    available: true,
    provider: 'Ant Group',
    promptTemplate: `
# Ant Design System Guidelines

## Design Principles
- Enterprise-grade reliability and clarity
- Rich component library with consistent patterns
- Data-heavy interface friendly
- Professional and business-appropriate aesthetics

## Color System
Use Ant Design color palette:
- Primary (Daybreak Blue): { r: 0.09, g: 0.45, b: 1 } (#1890ff)
- Success: { r: 0.32, g: 0.78, b: 0.47 } (#52c41a)
- Warning: { r: 0.98, g: 0.65, b: 0.11 } (#faad14)
- Error: { r: 0.96, g: 0.24, b: 0.24 } (#f5222d)
- Info: { r: 0.09, g: 0.45, b: 1 } (same as primary)
- Neutral colors:
  - Text primary: { r: 0, g: 0, b: 0, a: 0.85 }
  - Text secondary: { r: 0, g: 0, b: 0, a: 0.65 }
  - Text disabled: { r: 0, g: 0, b: 0, a: 0.25 }
  - Border: { r: 0.85, g: 0.85, b: 0.85 } (#d9d9d9)
  - Background: { r: 0.98, g: 0.98, b: 0.98 } (#fafafa)

## Grid System
- 24-column grid (NOT 12)
- Gutter: 16px default (can be 8px, 16px, 24px)
- Container max-width: 1200px
- Breakpoints:
  - xs: <576px
  - sm: ≥576px
  - md: ≥768px
  - lg: ≥992px
  - xl: ≥1200px
  - xxl: ≥1600px

## Spacing System
- Base unit: 8px
- Common spacing values: 8, 16, 24, 32, 40, 48px
- Component margin bottom: 16px (forms) or 24px (sections)

## Shape & Borders
- Border radius:
  - Small: 2px (inputs, small buttons)
  - Default: 4px (buttons, cards)
  - Large: 8px (modals, large cards)
- Border width: 1px standard
- Border style: solid

## Typography
Use Chinese/English compatible fonts:
- Font family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- Font sizes:
  - Display: 38px, weight: 600
  - Heading 1: 30px, weight: 600
  - Heading 2: 24px, weight: 600
  - Heading 3: 20px, weight: 600
  - Body: 14px, weight: 400 (main size)
  - Small: 12px, weight: 400
- Line height: 1.5715 (Ant Design standard)
- For Chinese text: consider slightly larger line-height (1.6-1.8)

## Component Specifications

### Buttons
- Height: 24px (small), 32px (default), 40px (large)
- Padding: 4px 15px (default)
- Border radius: 2px
- States:
  - Default: border + transparent background
  - Primary: solid primary color background
  - Dashed: dashed border
  - Text: no border, no background
  - Link: looks like a link
- Include hover state: opacity or color shift

### Form Elements
- Input height: 32px (default), 24px (small), 40px (large)
- Border: 1px solid #d9d9d9
- Border radius: 2px
- Padding: 4px 11px
- Focus state: border-color changes to primary, 2px shadow
- Label: positioned above or inline (12px font, secondary text color)

### Cards
- Border: 1px solid #f0f0f0
- Border radius: 2px
- Padding: 24px
- Header padding: 16px 24px
- Body padding: 24px
- Shadow: { type: "DROP_SHADOW", radius: 6, offset: { x: 0, y: 2 }, color: { r: 0, g: 0, b: 0, a: 0.03 } }

### Tables
- Header background: #fafafa
- Header text: weight 500
- Row height: 54px (default)
- Cell padding: 16px
- Border: 1px solid #f0f0f0
- Hover row: background #f5f5f5
- Selected row: background #e6f7ff

### Modals & Drawers
- Border radius: 4px
- Header height: 55px
- Footer height: 56px
- Padding: 24px
- Mask background: { r: 0, g: 0, b: 0, a: 0.45 }

### Navigation
- Menu item height: 40px
- Menu padding: 0 24px
- Selected background: #e6f7ff (light blue tint)
- Active border: 2px left border with primary color

## Shadows & Elevation
- Shadow-1 (hover): { type: "DROP_SHADOW", radius: 4, offset: { x: 0, y: 2 }, color: { r: 0, g: 0, b: 0, a: 0.08 } }
- Shadow-2 (card): { type: "DROP_SHADOW", radius: 6, offset: { x: 0, y: 2 }, color: { r: 0, g: 0, b: 0, a: 0.12 } }
- Shadow-3 (drawer): { type: "DROP_SHADOW", radius: 16, offset: { x: 0, y: 8 }, color: { r: 0, g: 0, b: 0, a: 0.15 } }

## Layout Patterns
- Use 24-column grid with auto-layout
- Standard page padding: 24px
- Section spacing: 24px vertically
- Component spacing within sections: 16px
- Form item spacing: 24px vertically

## Z-Index Levels (for reference in layering)
- Dropdown: 1050
- Modal mask: 1000
- Modal: 1000
- Notification: 1010
- Message: 1010
- Tooltip: 1060

## Enterprise Considerations
- Data tables are common: use proper alignment and spacing
- Forms often have many fields: use clear grouping and spacing
- Professional color choices: avoid overly bright or playful colors
- Respect information hierarchy: clear headings, organized sections

CRITICAL: Follow Ant Design specifications exactly for enterprise consistency. Pay attention to the 24-column grid and standard component heights.
`.trim()
  },
  
  {
    id: 'none',
    name: 'None',
    displayName: 'No Design System',
    description: 'Use default styling',
    icon: '⚡',
    available: true,
    provider: 'Custom',
    promptTemplate: ''
  }
];

export function getAvailableDesignSystems(): DesignSystemConfig[] {
  return DESIGN_SYSTEMS.filter(system => system.available);
}

export function getDesignSystemById(id: string): DesignSystemConfig | undefined {
  return DESIGN_SYSTEMS.find(system => system.id === id && system.available);
}

export function getDesignSystemPrompt(id?: string): string {
  if (!id || id === 'none') {
    return '';
  }
  
  const system = getDesignSystemById(id);
  return system?.promptTemplate || '';
}