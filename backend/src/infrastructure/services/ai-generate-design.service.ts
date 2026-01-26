import OpenAI from 'openai';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';
import { AIModelConfig, getModelById } from '../config/ai-models.config';
import { PromptBuilderService } from './prompt-builder.service';
import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../domain/services/IAiDesignService';
import { htmlPreviewPrompt, designSystemChangeWarningPrompt } from '../config/prompt.config';
import { CostBreakdown, IAiCostCalculator } from '../../domain/services/IAiCostCanculator';
import { iconTools } from '../config/ai-tools.config';
import { DesignSystemExtractorService } from './design-system-extractor.service';

interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface FunctionToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

// Default timeout in milliseconds (2 minutes)
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export class AiGenerateDesignService implements IAiDesignService {
    private promptBuilder: PromptBuilderService;
    private costCalculator: IAiCostCalculator;
    private designSystemExtractor: DesignSystemExtractorService;

    constructor(promptBuilderService: PromptBuilderService, costCalculator: IAiCostCalculator) {
        this.promptBuilder = promptBuilderService;
        this.costCalculator = costCalculator;
        this.designSystemExtractor = new DesignSystemExtractorService();
    }

    /**
     * Create OpenAI client with timeout configuration
     */
    private createOpenAIClient(aiModel: AIModelConfig, timeoutMs: number = DEFAULT_TIMEOUT_MS): OpenAI {
        return new OpenAI({
            baseURL: aiModel.baseURL,
            apiKey: aiModel.apiKey,
            timeout: timeoutMs,
            maxRetries: 2,
        });
    }

    async generateDesign(prompt: string, modelId: string, designSystemId: string): Promise<any> {
        try {
            console.log("modelId", modelId);
            console.log("designSystemId", designSystemId);

            const aiModel: AIModelConfig = getModelById(modelId)

            const systemPrompt = this.promptBuilder.buildSystemPrompt(designSystemId);
            const enrichedPrompt = this.promptBuilder.enrichUserMessage(
                `Generate a Figma design JSON for: "${prompt}"`,
                designSystemId
            );

            console.log(`🎨 Generating design with GPT-4${designSystemId ? ` + ${this.promptBuilder.getDesignSystemDisplayName(designSystemId)}` : ''}`);

            const openai = this.createOpenAIClient(aiModel);

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: enrichedPrompt }
                ],
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content;
            const usage = completion.usage;

            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            console.log("responseText", responseText);
            const jsonDesign = JSON.parse(responseText);

            let costBreakdown: CostBreakdown | null = null;
            if (usage) {
                costBreakdown = this.costCalculator.calculateCost(
                    aiModel,
                    usage.prompt_tokens || this.costCalculator.estimateTokens(systemPrompt + enrichedPrompt),
                    usage.completion_tokens || this.costCalculator.estimateTokens(responseText)
                );
                console.log(`💰 Cost breakdown: Input: $${costBreakdown.inputCost}, Output: $${costBreakdown.outputCost}, Total: $${costBreakdown.totalCost}`);
            }

            return {
                design: jsonDesign,
                cost: costBreakdown
            };

        } catch (error) {
            console.error("An error occurred in generateDesign:", error);
            throw new Error(`Failed to generate design from GPT. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[],
        modelId: string,
        designSystemId: string,
    ): Promise<DesignGenerationResult> {
        try {
            console.log("modelId", modelId);
            console.log("designSystemId", designSystemId);

            const messages = this.buildConversationMessages(userMessage, history, designSystemId);
            const aiModel: AIModelConfig = getModelById(modelId)
            const openai = this.createOpenAIClient(aiModel);

            console.log("--- 1. Sending Conversation to GPT for JSON ---");

            let completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
                tools: iconTools,
            });

            // Handle tool calls loop
            while (completion.choices[0]?.message?.tool_calls) {
                const toolCalls = completion.choices[0].message.tool_calls as FunctionToolCall[];
                console.log(`--- Processing ${toolCalls.length} tool calls ---`);

                const toolResults = await this.handleToolCalls(toolCalls);

                messages.push({
                    role: 'assistant',
                    content: completion.choices[0].message.content || '',
                    tool_calls: toolCalls,
                } as any);

                messages.push(...toolResults as any);

                completion = await openai.chat.completions.create({
                    model: aiModel.id,
                    messages: messages,
                    tools: iconTools,
                });
            }

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            const designData = this.extractDesignFromResponse(responseText);
            const aiMessage = this.extractMessageFromResponse(responseText);

            let previewHtml: string | null = null;
            let inputTokensForPreview = 0;
            let outputTokensForPreview = 0;

            let costBreakdown: CostBreakdown | null = null;
            const usage = completion.usage;

            if (usage) {
                costBreakdown = this.costCalculator.calculateCost(
                    aiModel,
                    usage.prompt_tokens + inputTokensForPreview,
                    usage.completion_tokens + outputTokensForPreview
                );
                console.log(`💰 Cost breakdown: Input: $${costBreakdown.inputCost}, Output: $${costBreakdown.outputCost}, Total: $${costBreakdown.totalCost}`);
            } else {
                const inputTokens = this.costCalculator.estimateTokens(JSON.stringify(messages) + inputTokensForPreview);
                const outputTokens = this.costCalculator.estimateTokens(responseText + outputTokensForPreview);
                costBreakdown = this.costCalculator.calculateCost(aiModel, inputTokens, outputTokens);
            }

            return {
                message: aiMessage,
                design: designData,
                previewHtml: previewHtml,
                cost: costBreakdown
            };

        } catch (error) {
            console.error("An error occurred in generateDesignFromConversation:", error);
            throw new Error(`Failed to generate design from conversation. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: FigmaDesign[],
        modelId: string,
        designSystemId: string,
    ): Promise<DesignGenerationResult> {
        try {
            console.log("modelId", modelId);
            console.log("designSystemId", designSystemId);

            const messages = this.buildEditConversationMessages(userMessage, history, currentDesign, designSystemId);
            const aiModel: AIModelConfig = getModelById(modelId);

            console.log("--- 1. Sending Edit Request to GPT ---");
            console.log(`🎨 Design System: ${this.promptBuilder.getDesignSystemDisplayName(designSystemId) || 'default design system'}`);
            console.log("Design size:", JSON.stringify(currentDesign).length, "characters");

            const openai = this.createOpenAIClient(aiModel);

            let completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
                tools: iconTools,
            });

            // Handle tool calls loop
            while (completion.choices[0]?.message?.tool_calls) {
                const toolCalls = completion.choices[0].message.tool_calls as FunctionToolCall[];
                console.log(`--- Processing ${toolCalls.length} tool calls ---`);

                const toolResults = await this.handleToolCalls(toolCalls);

                messages.push({
                    role: 'assistant',
                    content: completion.choices[0].message.content || '',
                    tool_calls: toolCalls,
                } as any);

                messages.push(...toolResults as any);

                completion = await openai.chat.completions.create({
                    model: aiModel.id,
                    messages: messages,
                    tools: iconTools,
                });
            }

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            console.log("--- 2. Received response from GPT ---");

            let designData = this.extractDesignFromResponse(responseText);

            if (!designData) {
                console.error("Failed to extract JSON. Raw response:", responseText);
                throw new Error("Failed to extract valid design JSON from AI response.");
            }

            const aiMessage = this.extractMessageFromResponse(responseText);

            let previewHtml: string | null = null;
            let inputTokensForPreview = 0;
            let outputTokensForPreview = 0;

            let costBreakdown: CostBreakdown | null = null;
            const usage = completion.usage;

            if (usage) {
                costBreakdown = this.costCalculator.calculateCost(
                    aiModel,
                    usage.prompt_tokens + inputTokensForPreview,
                    usage.completion_tokens + outputTokensForPreview
                );
                console.log(`💰 Cost breakdown: Input: $${costBreakdown.inputCost}, Output: $${costBreakdown.outputCost}, Total: $${costBreakdown.totalCost}`);
            } else {
                const inputTokens = this.costCalculator.estimateTokens(JSON.stringify(messages) + inputTokensForPreview);
                const outputTokens = this.costCalculator.estimateTokens(responseText + outputTokensForPreview);
                costBreakdown = this.costCalculator.calculateCost(aiModel, inputTokens, outputTokens);
            }

            return {
                message: aiMessage,
                design: designData,
                previewHtml: previewHtml,
                cost: costBreakdown
            };

        } catch (error) {
            console.error("An error occurred in editDesignWithAI:", error);
            throw new Error(`Failed to edit design. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateDesignBasedOnExisting(
        userMessage: string,
        history: ConversationMessage[],
        referenceDesign: any,
        modelId: string
    ): Promise<DesignGenerationResult> {
        try {
            console.log("🎨 Generating design based on existing design system");
            const originalSize = JSON.stringify(referenceDesign).length;
            console.log("Reference design size:", originalSize, "characters");

            // Extract design system from the reference design
            console.log("--- Extracting design system from reference design ---");
            const extractedDesignSystem = this.designSystemExtractor.extract(referenceDesign);
            const designSystemSummary = this.designSystemExtractor.createSummary(extractedDesignSystem);
            const simplifiedStructure = this.designSystemExtractor.getSimplifiedStructure(referenceDesign, 2);

            console.log("Design system summary length:", designSystemSummary.length, "characters");
            console.log("Simplified structure size:", JSON.stringify(simplifiedStructure).length, "characters");

            // Build messages with extracted design system instead of full design
            const messages = this.buildBasedOnExistingMessages(
                userMessage,
                history,
                extractedDesignSystem,
                designSystemSummary,
                simplifiedStructure
            );

            const aiModel: AIModelConfig = getModelById(modelId);

            const openai = this.createOpenAIClient(aiModel);

            console.log("--- 1. Sending request to create new design based on extracted design system ---");

            let completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
                tools: iconTools,
            });

            // Handle tool calls loop (for icons if needed)
            while (completion.choices[0]?.message?.tool_calls) {
                const toolCalls = completion.choices[0].message.tool_calls as FunctionToolCall[];
                console.log(`--- Processing ${toolCalls.length} tool calls ---`);

                const toolResults = await this.handleToolCalls(toolCalls);

                messages.push({
                    role: 'assistant',
                    content: completion.choices[0].message.content || '',
                    tool_calls: toolCalls,
                } as any);

                messages.push(...toolResults as any);

                completion = await openai.chat.completions.create({
                    model: aiModel.id,
                    messages: messages,
                    tools: iconTools,
                });
            }

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            console.log("--- 2. Received new design from GPT ---");

            const designData = this.extractDesignFromResponse(responseText);
            if (!designData) {
                console.error("Failed to extract JSON. Raw response:", responseText);
                throw new Error("Failed to extract valid design JSON from AI response.");
            }

            const aiMessage = this.extractMessageFromResponse(responseText);

            // Calculate cost
            let costBreakdown: CostBreakdown | null = null;
            const usage = completion.usage;

            if (usage) {
                costBreakdown = this.costCalculator.calculateCost(
                    aiModel,
                    usage.prompt_tokens,
                    usage.completion_tokens
                );
                console.log(`💰 Cost breakdown: Input: $${costBreakdown.inputCost}, Output: $${costBreakdown.outputCost}, Total: $${costBreakdown.totalCost}`);
            } else {
                const inputTokens = this.costCalculator.estimateTokens(JSON.stringify(messages));
                const outputTokens = this.costCalculator.estimateTokens(responseText);
                costBreakdown = this.costCalculator.calculateCost(aiModel, inputTokens, outputTokens);
            }

            return {
                message: aiMessage,
                design: designData,
                previewHtml: null,
                cost: costBreakdown
            };

        } catch (error) {
            console.error("An error occurred in generateDesignBasedOnExisting:", error);

            // Provide more specific error message for timeouts
            if (error instanceof Error && error.message.includes('timed out')) {
                throw new Error(`Request timed out. The reference design may be too complex. Try using a simpler design as reference or break it into smaller parts.`);
            }

            throw new Error(`Failed to generate design based on existing. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private buildBasedOnExistingMessages(
        currentMessage: string,
        history: ConversationMessage[],
        extractedDesignSystem: any,
        designSystemSummary: string,
        simplifiedStructure: any
    ): AiMessage[] {
        const systemPrompt = this.promptBuilder.buildBasedOnExistingSystemPrompt();

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        // Include limited history (only last 2 messages to keep context manageable)
        const recentHistory = history.slice(-2);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        // Build the main request with EXTRACTED design system (not full design)
        const request = `EXTRACTED DESIGN SYSTEM FROM REFERENCE:

${designSystemSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFERENCE STRUCTURE (simplified):
\`\`\`json
${JSON.stringify(simplifiedStructure, null, 2)}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER REQUEST FOR NEW DESIGN: ${currentMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCTIONS:
1. Use the EXTRACTED DESIGN SYSTEM above (colors, typography, spacing, borders, shadows)
2. Create a NEW design based on the user's request
3. Apply the SAME design patterns consistently
4. The new design should feel like it belongs to the same project
5. Return the complete new design as a valid JSON array
6. Start your response with a brief description, then the JSON

IMPORTANT: Use the exact color values, font settings, and spacing from the extracted design system.`;

        messages.push({
            role: 'user',
            content: request
        });

        return messages;
    }

    private buildConversationMessages(
        currentMessage: string,
        history: ConversationMessage[],
        designSystemId: string
    ): AiMessage[] {
        const systemPrompt = this.promptBuilder.buildConversationSystemPrompt(designSystemId);

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        for (const msg of history) {
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

    private buildEditConversationMessages(
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

        if (designSystemId && designSystemName !== 'Default design system') {
            const warningContent = isDesignSystemChanged
                ? `🚨 ACTIVE DESIGN SYSTEM: ${designSystemName.toUpperCase()}\n\n${designSystemChangeWarningPrompt.replace('NEW design system', designSystemName.toUpperCase())}\n\nDO NOT use styles from any other design system.`
                : `🚨 ACTIVE DESIGN SYSTEM: ${designSystemName.toUpperCase()}\n\nYou MUST maintain ${designSystemName.toUpperCase()} in all modifications.\nDO NOT use styles from any other design system.`;

            messages.push({
                role: 'system',
                content: warningContent
            });
        }

        const historyToInclude = isDesignSystemChanged ? [] : history.slice(-5);

        for (const msg of historyToInclude) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        const designStr = JSON.stringify(currentDesign);
        const designSystemReminder = this.buildDesignSystemReminder(designSystemName, isDesignSystemChanged);
        const editInstructions = this.buildEditInstructions(designSystemName, isDesignSystemChanged);

        const editRequest = `CURRENT DESIGN:
\`\`\`json
${designStr}
\`\`\`
${designSystemReminder}
USER REQUEST: ${currentMessage}

${editInstructions}`;

        messages.push({
            role: 'user',
            content: editRequest
        });

        return messages;
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

    private detectDesignSystemFromHistory(history: ConversationMessage[]): string | null {
        const recentHistory = history.slice(-3);

        for (const msg of recentHistory) {
            const content = msg.content.toLowerCase();

            if (content.includes('shadcn') || content.includes('shadcn/ui')) {
                return 'shadcn-ui';
            } else if (content.includes('material design') || content.includes('material-3') || content.includes('material')) {
                return 'material-3';
            } else if (content.includes('ant design') || content.includes('ant-design')) {
                return 'ant-design';
            }
        }

        return null;
    }

    private extractDesignFromResponse(response: string): any {
        try {
            let cleaned = response.trim();

            if (cleaned.includes('```json')) {
                cleaned = cleaned.split('```json')[1].split('```')[0].trim();
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.split('```')[1].split('```')[0].trim();
            }

            const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                return JSON.parse(arrayMatch[0]);
            }

            const objectMatch = cleaned.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                const parsed = JSON.parse(objectMatch[0]);
                return Array.isArray(parsed) ? parsed : [parsed];
            }

            const parsed = JSON.parse(cleaned);
            return Array.isArray(parsed) ? parsed : [parsed];

        } catch (error) {
            console.error("Failed to extract design JSON:", error);
            console.error("Response was:", response.substring(0, 500) + "...");
            return null;
        }
    }

    private extractMessageFromResponse(response: string): string {
        try {
            const lines = response.split('\n');
            const messageLines: string[] = [];

            for (const line of lines) {
                if (line.trim().startsWith('[') ||
                    line.trim().startsWith('{') ||
                    line.includes('```')) {
                    break;
                }
                if (line.trim()) {
                    messageLines.push(line.trim());
                }
            }

            const message = messageLines.join(' ').trim();
            return message || 'Design modified successfully';

        } catch (error) {
            return 'Design modified successfully';
        }
    }

    async searchIcons(query: string): Promise<{ icons: string[] }> {
        console.log(`Searching icons for query: ${query}`);
        console.log(`https://api.iconify.design/search?query=${encodeURIComponent(query)}`);

        const response = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error(`Failed to search icons: ${response.statusText}`);
        }

        const data = await response.json() as { icons?: string[] };
        console.log("icons", data.icons);
        return { icons: data.icons ?? [] };
    }

    getIconUrl(iconData: string): string {
        console.log(`Getting icon URL for: ${iconData}`);
        const [prefix, name] = iconData.split(":");

        if (!prefix || !name) {
            throw new Error(`Invalid icon format: ${iconData}. Expected "prefix:name"`);
        }

        return `https://api.iconify.design/${prefix}/${name}.svg`;
    }

    private async handleToolCalls(
        toolCalls: FunctionToolCall[],
    ): Promise<{ tool_call_id: string; role: 'tool'; content: string }[]> {

        const results = await Promise.all(
            toolCalls.map(async (toolCall) => {
                const { name, arguments: args } = toolCall.function;
                const parsedArgs = JSON.parse(args);

                let result: string;

                switch (name) {
                    case 'searchIcons':
                        const searchResult = await this.searchIcons(parsedArgs.query);
                        result = JSON.stringify(searchResult);
                        break;
                    case 'getIconUrl':
                        const url = this.getIconUrl(parsedArgs.iconData);
                        result = JSON.stringify({ url });
                        break;
                    default:
                        result = JSON.stringify({ error: `Unknown tool: ${name}` });
                }

                return {
                    tool_call_id: toolCall.id,
                    role: 'tool' as const,
                    content: result,
                };
            })
        );

        return results;
    }
}