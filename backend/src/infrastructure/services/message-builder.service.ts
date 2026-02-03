// src/infrastructure/services/message-builder.service.ts

import { ConversationMessage } from '../../domain/services/IAiDesignService';
import { PromptBuilderService } from './prompt-builder.service';
import { designSystemChangeWarningPrompt } from '../config/prompt.config';

export interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class MessageBuilderService {
    constructor(private readonly promptBuilder: PromptBuilderService) { }

    buildConversationMessages(
        currentMessage: string,
        history: ConversationMessage[],
        designSystemId: string
    ): AiMessage[] {
        const systemPrompt = this.promptBuilder.buildConversationSystemPrompt(designSystemId);

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        // Add history
        for (const msg of history) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        // // Add current message
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
        const systemPrompt = this.promptBuilder.buildEditSystemPrompt(designSystemId);
        const designSystemName = this.promptBuilder.getDesignSystemDisplayName(designSystemId);

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        const previousDesignSystem = this.detectDesignSystemFromHistory(history);
        const isDesignSystemChanged = Boolean(previousDesignSystem && previousDesignSystem !== designSystemId);

        // Add design system warning if applicable
        if (designSystemId && designSystemName !== 'Default design system') {
            messages.push({
                role: 'system',
                content: this.buildDesignSystemWarning(designSystemName, isDesignSystemChanged)
            });
        }

        // Add history (skip if design system changed)
        const historyToInclude = isDesignSystemChanged ? [] : history.slice(-5);
        for (const msg of historyToInclude) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        // Add edit request
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
        const systemPrompt = this.promptBuilder.buildBasedOnExistingSystemPrompt();

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        // Add recent history
        const recentHistory = history.slice(-3);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        // Add request with reference design
        messages.push({
            role: 'user',
            content: this.buildBasedOnExistingRequest(currentMessage, referenceToon)
        });

        return messages;
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
}
