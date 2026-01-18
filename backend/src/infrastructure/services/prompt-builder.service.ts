import { getDesignSystemById } from '../config/design-systems.config';
import { iconInstructionsPrompt, textToDesignSystemPrompt } from '../config/prompt.config';


export class PromptBuilderService {

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