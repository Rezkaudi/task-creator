// src/infrastructure/services/message-builder.service.ts

import { ConversationMessage } from '../../domain/services/IAiDesignService';
import { getDesignSystemById } from '../config/design-systems.config';
import { FrameInfo } from '../../domain/entities/prototype-connection.entity';

import {
    schemaInstructionsPrompt,
    iconInstructionsPrompt,
    responseInstructionsPrompt,
    createDesignPrompt,
    editDesignPrompt,
    basedOnExistingPrompt,
    prototypeConnectionsPrompt
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
        const designSystem = getDesignSystemById(designSystemId);
        const systemPrompt = [
            createDesignPrompt,
            schemaInstructionsPrompt,
            iconInstructionsPrompt,
            designSystem.promptTemplate,
            responseInstructionsPrompt,
        ].join('\n\n');

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        const recentHistory = history.slice(-3);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

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
        const designSystem = getDesignSystemById(designSystemId);
        const systemPrompt = [
            editDesignPrompt,
            schemaInstructionsPrompt,
            iconInstructionsPrompt,
            designSystem.promptTemplate,
            responseInstructionsPrompt
        ].join('\n\n');

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        const recentHistory = history.slice(-3);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        messages.push({
            role: 'user',
            content: `CURRENT DESIGN:\n\`\`\`json\n${JSON.stringify(currentDesign)}\n\`\`\`\n\nUSER REQUEST: ${currentMessage}`
        });

        return messages;
    }

    buildBasedOnExistingMessages(
        currentMessage: string,
        history: ConversationMessage[],
        referenceToon: string
    ): AiMessage[] {
        const systemPrompt = [
            basedOnExistingPrompt,
            schemaInstructionsPrompt,
            iconInstructionsPrompt,
            responseInstructionsPrompt,
        ].join('\n\n');

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        const recentHistory = history.slice(-3);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        messages.push({
            role: 'user',
            content: `REFERENCE DESIGN:\n\`\`\`\n${referenceToon}\n\`\`\`\n\nUSER REQUEST: ${currentMessage}`
        });

        return messages;
    }

    buildPrototypeMessages(frames: FrameInfo[]): AiMessage[] {
        return [
            { role: 'system', content: prototypeConnectionsPrompt },
            { role: 'user', content: `\`\`\`json\n${JSON.stringify(frames)}\n\`\`\`` }
        ];
    }
}
