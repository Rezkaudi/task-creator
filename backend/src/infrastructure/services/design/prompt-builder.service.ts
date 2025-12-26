// src/infrastructure/services/design/prompt-builder.service.ts

import fs from 'fs';
import path from 'path';
import { getDesignSystemById } from '../../config/design-systems.config';


export class PromptBuilderService {
    private baseSystemPrompt: string;

    constructor() {
        this.baseSystemPrompt = fs.readFileSync(
            path.join(__dirname, '../../../../public/prompt/text-to-design-prompt.txt'),
            'utf-8'
        );
    }

    buildSystemPrompt(designSystemId?: string): string {
        if (!designSystemId || designSystemId === 'none') {
            return this.baseSystemPrompt;
        }

        const designSystem = getDesignSystemById(designSystemId);
        
        if (!designSystem || !designSystem.promptTemplate) {
            console.warn(`⚠️ Design System '${designSystemId}' not found, using base prompt`);
            return this.baseSystemPrompt;
        }

        return `${this.baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN SYSTEM: ${designSystem.displayName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${designSystem.promptTemplate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: All generated designs MUST strictly follow ${designSystem.displayName} guidelines.
Do NOT deviate from these specifications unless explicitly requested.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

 
    buildConversationSystemPrompt(designSystemId?: string): string {
        const basePrompt = this.buildSystemPrompt(designSystemId);
        
        const designSystemNote = this.getDesignSystemNote(designSystemId);

        return `${basePrompt}

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

    buildEditSystemPrompt(designSystemId?: string): string {
        const basePrompt = this.buildSystemPrompt(designSystemId);
        
        const designSystemName = this.getDesignSystemDisplayName(designSystemId);
        
        const designSystemMaintainNote = designSystemName
            ? `- MAINTAIN ${designSystemName} design patterns and standards`
            : '';

        const designSystemNewElementsNote = designSystemName
            ? `- All new/modified elements MUST follow ${designSystemName} specifications`
            : '';

        const designSystemNote = this.getDesignSystemNote(designSystemId);

        return `${basePrompt}

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
2. Apply ONLY the requested changes
3. Keep everything else exactly as is
4. Return the COMPLETE design (not just changes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Maintain exact structure and hierarchy
- Use same node types unless explicitly asked to change
- Colors MUST be in 0-1 range (NOT 0-255)
- Keep all properties not mentioned in edit request
- For TEXT nodes: include all required properties (characters, fontSize, fontName, textAlignHorizontal, textAlignVertical, lineHeight)
${designSystemMaintainNote}
${designSystemNewElementsNote}

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

   
    enrichUserMessage(message: string, designSystemId?: string): string {
        if (!designSystemId || designSystemId === 'none') {
            return message;
        }

        const designSystem = getDesignSystemById(designSystemId);
        if (!designSystem) {
            return message;
        }

        return `${message}

[Design System: ${designSystem.displayName}]`;
    }

   
    getDesignSystemDisplayName(designSystemId?: string): string {
        if (!designSystemId || designSystemId === 'none') {
            return 'None';
        }

        const designSystem = getDesignSystemById(designSystemId);
        return designSystem?.displayName ?? 'None';
    }

    
    private getDesignSystemNote(designSystemId?: string): string {
        if (!designSystemId || designSystemId === 'none') {
            return '';
        }

        const displayName = this.getDesignSystemDisplayName(designSystemId);
        if (displayName === 'None') {
            return '';
        }

        return ` following ${displayName} guidelines`;
    }
}