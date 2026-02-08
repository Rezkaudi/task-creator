// src/infrastructure/services/message-builder.service.ts

import { ConversationMessage } from '../../domain/services/IAiDesignService';
import { getDesignSystemById } from '../config/design-systems.config';
import { FrameInfo } from '../../domain/entities/prototype-connection.entity';

import {
    basedOnExistingSystemPrompt,
    designSystemChangeWarningPrompt,
    iconInstructionsPrompt,
    prototypeConnectionsPrompt,
    textToDesignSystemPrompt
} from '../config/prompt.config';


export interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class MessageBuilderService {

    buildConversationMessages(
        currentMessage: string,
        history: ConversationMessage[],
        designSystemId: string
    ): AiMessage[] {

        const basePrompt = this.buildPromptAccourdingDesignSystem(designSystemId);
        const systemPrompt = `${basePrompt} ${iconInstructionsPrompt}

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📋 RESPONSE FORMAT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        When replying, follow this structure:

        1. **Brief Description**: One sentence explaining what was created/modified
        2. **JSON Design**: Complete design array in JSON format

        Example:

        Created a login page with email and password fields following Ant Design System Guidelines.

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

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        // for (const msg of history) {
        //     messages.push({
        //         role: msg.role as 'user' | 'assistant',
        //         content: msg.content
        //     });
        // }

        messages.push({
            role: 'user',
            content: currentMessage
        });

        return messages;
    }

    buildEditMessages(
        currentMessage: string,
        history: ConversationMessage[],
        currentDesign: any,
        designSystemId: string
    ): AiMessage[] {
        const systemPrompt = this.buildEditSystemPrompt(designSystemId);
        const designSystemName = this.getDesignSystemDisplayName(designSystemId);

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        const previousDesignSystem = this.detectDesignSystemFromHistory(history);
        const isDesignSystemChanged = Boolean(previousDesignSystem && previousDesignSystem !== designSystemId);

        if (designSystemId && designSystemName !== 'Default design system') {
            messages.push({
                role: 'system',
                content: this.buildDesignSystemWarning(designSystemName, isDesignSystemChanged)
            });
        }

        // const historyToInclude = isDesignSystemChanged ? [] : history.slice(-5);
        // for (const msg of historyToInclude) {
        //     messages.push({
        //         role: msg.role as 'user' | 'assistant',
        //         content: msg.content
        //     });
        // }

        messages.push({
            role: 'user',
            content: this.buildEditRequest(currentMessage, currentDesign, designSystemName, isDesignSystemChanged)
        });

        return messages;
    }

    buildBasedOnExistingMessages(
        currentMessage: string,
        history: ConversationMessage[],
        referenceToon: string
    ): AiMessage[] {
        const systemPrompt = `${textToDesignSystemPrompt} ${iconInstructionsPrompt} ${basedOnExistingSystemPrompt}`;

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        // const recentHistory = history.slice(-3);
        // for (const msg of recentHistory) {
        //     messages.push({
        //         role: msg.role as 'user' | 'assistant',
        //         content: msg.content
        //     });
        // }

        messages.push({
            role: 'user',
            content: this.buildBasedOnExistingRequest(currentMessage, referenceToon)
        });

        return messages;
    }

    buildPrototypeMessages(frames: FrameInfo[]): AiMessage[] {
        let userMessage = `## FRAMES DATA\n\`\`\`json\n${JSON.stringify(frames)}\n\`\`\``;
        userMessage += `\n\n## TASK\nAnalyze these frames and generate intelligent prototype connections. Return ONLY valid JSON with no additional text.`;

        return [
            { role: 'system', content: prototypeConnectionsPrompt },
            { role: 'user', content: userMessage }
        ];
    }

    getDesignSystemDisplayName(designSystemId: string): string {
        if (!designSystemId) {
            return 'Default design system';
        }
        const designSystem = getDesignSystemById(designSystemId);
        return designSystem?.name ?? 'Default design system';
    }



    private buildEditSystemPrompt(designSystemId: string): string {
        const basePrompt = this.buildPromptAccourdingDesignSystem(designSystemId);
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

    // ─────────────────────────────────────────────────────────────────────────
    // Private: Helpers
    // ─────────────────────────────────────────────────────────────────────────

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

    private detectDesignSystemFromHistory(history: ConversationMessage[]): string | null {
        const recentHistory = history.slice(-3);

        const designSystemPatterns: Record<string, string> = {
            'shadcn-ui': 'shadcn|shadcn/ui',
            'material-3': 'material design|material-3|material',
            'ant-design': 'ant design|ant-design'
        };

        for (const msg of recentHistory) {
            const content = msg.content.toLowerCase();
            for (const [systemId, pattern] of Object.entries(designSystemPatterns)) {
                if (new RegExp(pattern).test(content)) {
                    return systemId;
                }
            }
        }

        return null;
    }

    private buildDesignSystemWarning(designSystemName: string, isChanged: boolean): string {
        if (isChanged) {
            return `🚨 ACTIVE DESIGN SYSTEM: ${designSystemName.toUpperCase()}\n\n${designSystemChangeWarningPrompt.replace('NEW design system', designSystemName.toUpperCase())}\n\nDO NOT use styles from any other design system.`;
        }

        return `🚨 ACTIVE DESIGN SYSTEM: ${designSystemName.toUpperCase()}\n\nYou MUST maintain ${designSystemName.toUpperCase()} in all modifications.\nDO NOT use styles from any other design system.`;
    }

    private buildEditRequest(
        userMessage: string,
        currentDesign: any,
        designSystemName: string,
        isChanged: boolean
    ): string {
        const designStr = JSON.stringify(currentDesign);
        const reminder = this.buildDesignSystemReminder(designSystemName, isChanged);
        const instructions = this.buildEditInstructions(designSystemName, isChanged);

        return `CURRENT DESIGN:
                \`\`\`json
                ${designStr}
                \`\`\`
                ${reminder}
                USER REQUEST: ${userMessage}
                ${instructions}`;
    }

    private buildDesignSystemReminder(designSystemName: string, isChanged: boolean): string {
        if (!designSystemName || designSystemName === 'Default design system') {
            return '';
        }

        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🎨 DESIGN SYSTEM: ${designSystemName.toUpperCase()}
            ${isChanged ? '🔄🔄🔄 DESIGN SYSTEM CHANGED - COMPLETE REDESIGN REQUIRED 🔄🔄🔄\n' : ''}
            ⚠️ CRITICAL: ${isChanged ? 'COMPLETELY REDESIGN' : 'Maintain'} ALL elements using ${designSystemName.toUpperCase()}!
            ⚠️ ALL colors, borders, shadows, spacing MUST match ${designSystemName.toUpperCase()}!
            ${isChanged ? `⚠️ The current design uses a different system - CONVERT EVERYTHING to ${designSystemName.toUpperCase()}!` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    private buildEditInstructions(designSystemName: string, isChanged: boolean): string {
        const action = isChanged ? 'COMPLETELY REDESIGN THE ENTIRE DESIGN' : 'MAINTAIN';
        const additionalInstruction = isChanged
            ? `Convert ALL visual elements (colors, borders, shadows, spacing, components) to ${designSystemName.toUpperCase()}`
            : 'Keep the layout structure unchanged (unless requested)';

        return `INSTRUCTIONS:
                1. Understand the current design structure  
                2. Apply the user's requested changes
                3. **${action} using ${designSystemName.toUpperCase()} design system**
                4. ${additionalInstruction}
                5. Return the complete modified design as valid JSON array
                6. Start your response with a brief description, then the JSON`;
    }

    private buildBasedOnExistingRequest(userMessage: string, referenceToon: string): string {
        return `REFERENCE DESIGN (TOON Format - extract design system from this):
            \`\`\`
            ${referenceToon}
            \`\`\`

            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            USER REQUEST FOR NEW DESIGN: ${userMessage}

            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            INSTRUCTIONS:
            1. Analyze the REFERENCE DESIGN (in TOON format) to understand its design system
            - Extract colors, spacing, typography, borders, shadows, component patterns
            2. Create a NEW design based on the user's request
            3. Apply the SAME design system extracted from the reference
            4. The new design should feel like it belongs to the same project
            5. Return the complete new design as a valid Figma JSON array (NOT TOON - return proper JSON!)
            6. Start your response with a brief description, then the JSON`;
    }


    private buildPromptAccourdingDesignSystem(designSystemId: string): string {
        const designSystem = getDesignSystemById(designSystemId);
        return `${textToDesignSystemPrompt} ${designSystem.promptTemplate}`;
    }
}