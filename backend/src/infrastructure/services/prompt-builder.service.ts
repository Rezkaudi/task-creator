import { getDesignSystemById } from '../config/design-systems.config';
import { iconInstructionsPrompt, textToDesignSystemPrompt } from '../config/prompt.config';


export class PromptBuilderService {

buildBasedOnExistingSystemPrompt(): string {
    return `${textToDesignSystemPrompt}

${iconInstructionsPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN BASED ON EXISTING MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will receive:
1. **Reference Design**: An existing design in JSON format
2. **User's Request**: What new design they want to create

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **ANALYZE** the reference design to extract its design system:
   - Color palette (primary, secondary, background, text colors)
   - Typography (font families, sizes, weights, line heights)
   - Spacing system (padding, margins, gaps)
   - Border styles (radius, width, colors)
   - Shadow patterns (elevation, blur, spread)
   - Component patterns (buttons, inputs, cards, etc.)

2. **CREATE** a completely new design based on the user's request

3. **APPLY** the extracted design system to the new design:
   - Use the SAME color palette
   - Use the SAME typography styles
   - Use the SAME spacing patterns
   - Use the SAME border radius and styles
   - Use the SAME shadow patterns
   - Follow the SAME component design patterns

4. **ENSURE CONSISTENCY**:
   - The new design should feel like it belongs to the same project
   - Maintain visual harmony with the reference design
   - Use similar component structures where applicable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **DO NOT copy the reference design** - create something NEW
- **DO extract and reuse the design system** - colors, spacing, styles
- Colors MUST be in 0-1 range (NOT 0-255)
- For TEXT nodes: include all required properties (characters, fontSize, fontName, textAlignHorizontal, textAlignVertical, lineHeight)
- Return complete, valid JSON that can be imported to Figma

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EXAMPLE WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference Design: Sign Up Page with:
- Primary color: Blue (#3B82F6 → 0.23, 0.51, 0.96)
- Border radius: 8px
- Shadow: 0 2px 8px rgba(0,0,0,0.1)
- Font: Inter, 16px

User Request: "Create a login page"

Your Output: Login Page with:
- SAME blue primary color (0.23, 0.51, 0.96)
- SAME 8px border radius
- SAME shadow pattern
- SAME Inter font at 16px
- NEW layout and content (email, password, login button)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Brief description + complete JSON array

Example:

Created a login page following the same design system as the reference sign up page.

\`\`\`json
[
  {
    "name": "Login Page",
    "type": "FRAME",
    "x": 0,
    "y": 0,
    "width": 400,
    "height": 600,
    "fills": [...],
    "children": [...]
  }
]
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

    buildSystemPrompt(designSystemId: string): string {
        if (!designSystemId) {
            return textToDesignSystemPrompt;
        }

        const designSystem = getDesignSystemById(designSystemId);

        if (!designSystem || !designSystem.promptTemplate) {
            console.warn(`⚠️ Design System '${designSystemId}' not found, using base prompt`);
            return textToDesignSystemPrompt;
        }

        return `${textToDesignSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN SYSTEM: ${designSystem.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${designSystem.promptTemplate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: All generated designs MUST strictly follow ${designSystem.name} guidelines.
Do NOT deviate from these specifications unless explicitly requested.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }


    buildConversationSystemPrompt(designSystemId: string): string {
        const basePrompt = this.buildSystemPrompt(designSystemId);

        const designSystemNote = this.getDesignSystemNote(designSystemId);

        return `${basePrompt}

 ${iconInstructionsPrompt}  // <-- Add this


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When replying, follow this structure:

1. **Brief Description**: One sentence explaining what was created/modified
2. **JSON Design**: Complete design array in JSON format

Example:

Created a login page with email and password fields${designSystemNote}.

\`\`\`json
[
  {
    "name": "Login Page",
    "type": "FRAME",
    "x": 0,
    "y": 0,
    "width": 400,
    "height": 600,
    "fills": [...],
    "children": [...]
  }
]
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    buildEditSystemPrompt(designSystemId: string): string {
        const basePrompt = this.buildSystemPrompt(designSystemId);

        const designSystemName = this.getDesignSystemDisplayName(designSystemId);

        const designSystemMaintainNote = designSystemName && designSystemName !== 'Default design system'
            ? `- **CONVERT ALL ELEMENTS TO ${designSystemName.toUpperCase()} DESIGN SYSTEM** (colors, spacing, components, borders, shadows)`
            : '';

        const designSystemNewElementsNote = designSystemName && designSystemName !== 'Default design system'
            ? `- **EVERY ELEMENT must be redesigned using ${designSystemName.toUpperCase()} specifications**`
            : '';

        const designSystemNote = this.getDesignSystemNote(designSystemId);

        const designSystemWarning = designSystemName && designSystemName !== 'Default design system'
            ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 MANDATORY DESIGN SYSTEM: ${designSystemName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ YOU MUST CONVERT THE ENTIRE DESIGN TO ${designSystemName.toUpperCase()}
⚠️ DO NOT KEEP OLD DESIGN SYSTEM STYLES
⚠️ REDESIGN EVERYTHING TO MATCH ${designSystemName.toUpperCase()} PATTERNS
⚠️ Change colors, spacing, borders, shadows, typography to ${designSystemName.toUpperCase()} standards

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
            : '';

        return `${basePrompt}

${designSystemWarning}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ EDITING MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will receive:
1. **Current Design**: JSON structure of existing design
2. **User's Edit Request**: Specific changes to apply

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Understand the current design structure
2. Apply the user's requested changes
3. ${designSystemName && designSystemName !== 'Default design system' ? `**CONVERT THE ENTIRE DESIGN TO ${designSystemName.toUpperCase()} DESIGN SYSTEM**` : 'Keep the current style'}
4. Keep the layout structure unchanged (unless requested)
5. Return the COMPLETE design (not just changes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Maintain exact structure and hierarchy
- Use same node types unless explicitly asked to change
- Colors MUST be in 0-1 range (NOT 0-255)
- For TEXT nodes: include all required properties (characters, fontSize, fontName, textAlignHorizontal, textAlignVertical, lineHeight)
${designSystemMaintainNote}
${designSystemNewElementsNote}
${designSystemName && designSystemName !== 'Default design system' ? `- **REDESIGN all visual properties (colors, borders, shadows, spacing) to match ${designSystemName.toUpperCase()}**` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Brief description + complete JSON array

Example:

Changed background to blue${designSystemNote}.

\`\`\`json
[
  {
    "name": "Design",
    "type": "FRAME",
    ...
  }
]
\`\`\`

${designSystemName && designSystemName !== 'Default design system' ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 FINAL REMINDER: CONVERT EVERYTHING TO ${designSystemName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}`;
    }

    enrichUserMessage(message: string, designSystemId: string): string {
        if (!designSystemId) {
            return message;
        }

        const designSystem = getDesignSystemById(designSystemId);
        if (!designSystem) {
            return message;
        }

        return `${message}

[Design System: ${designSystem.name}]`;
    }


    getDesignSystemDisplayName(designSystemId: string): string {
        if (!designSystemId) {
            return 'Default design system';
        }

        const designSystem = getDesignSystemById(designSystemId);
        return designSystem?.name ?? 'Default design system';
    }
    




    private getDesignSystemNote(designSystemId: string): string {
        if (!designSystemId) {
            return '';
        }

        const displayName = this.getDesignSystemDisplayName(designSystemId);
        if (displayName === 'Default design system') {
            return '';
        }

        return ` following ${displayName} guidelines`;
    }

    
}