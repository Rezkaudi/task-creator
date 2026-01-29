// src/infrastructure/services/ai-generate-design.service.ts

import OpenAI from 'openai';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';
import { AIModelConfig, getModelById } from '../config/ai-models.config';
import { PromptBuilderService } from './prompt-builder.service';
import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../domain/services/IAiDesignService';
import { CostBreakdown, IAiCostCalculator } from '../../domain/services/IAiCostCanculator';
import { iconTools } from '../config/ai-tools.config';

// Extracted services
import { IIconService } from '../../domain/services/IIconService';
import { IOpenAIClientFactory } from '../../domain/services/IOpenAIClientFactory';
import { ToolCallHandlerService, FunctionToolCall } from './tool-call-handler.service';
import { ResponseParserService } from './response-parser.service';
import { MessageBuilderService, AiMessage } from './message-builder.service';
import { Timer } from './timer.service';

interface CompletionResult {
    responseText: string;
    usage: OpenAI.Completions.CompletionUsage | undefined;
}

export class AiGenerateDesignService implements IAiDesignService {
    private readonly promptBuilder: PromptBuilderService;
    private readonly costCalculator: IAiCostCalculator;
    private readonly iconService: IIconService;
    private readonly clientFactory: IOpenAIClientFactory;
    private readonly toolCallHandler: ToolCallHandlerService;
    private readonly responseParser: ResponseParserService;
    private readonly messageBuilder: MessageBuilderService;
    private readonly timer: Timer;

    constructor(
        promptBuilderService: PromptBuilderService,
        costCalculator: IAiCostCalculator,
        iconService: IIconService,
        clientFactory: IOpenAIClientFactory,
        toolCallHandler: ToolCallHandlerService,
        responseParser: ResponseParserService,
        messageBuilder: MessageBuilderService,
        timer: Timer
    ) {
        this.promptBuilder = promptBuilderService;
        this.costCalculator = costCalculator;
        this.iconService = iconService;
        this.clientFactory = clientFactory;
        this.toolCallHandler = toolCallHandler;
        this.responseParser = responseParser;
        this.messageBuilder = messageBuilder;
        this.timer = timer;
    }

    async generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[],
        modelId: string,
        designSystemId: string
    ): Promise<DesignGenerationResult> {
        this.timer.start();

        const aiModel = getModelById(modelId);
        const openai = this.clientFactory.createClient(aiModel);

        const messages = this.messageBuilder.buildConversationMessages(
            userMessage,
            history,
            designSystemId
        );

        console.log('--- 1. Sending Conversation ---');
        // console.log(JSON.stringify(messages, null, 2));

        try {
            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            const designData = this.responseParser.extractDesignFromResponse(responseText);
            const aiMessage = this.responseParser.extractMessageFromResponse(responseText);

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            this.timer.stop();
            console.log(`⏱️ Preparation Time: ${this.timer.durationFormatted}`);

            return {
                message: aiMessage,
                design: designData,
                previewHtml: null,
                cost: costBreakdown
            };

        } catch (error) {
            this.handleError(error, 'generateDesignFromConversation');
        }
    }

    async editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: FigmaDesign[],
        modelId: string,
        designSystemId: string
    ): Promise<DesignGenerationResult> {
        const aiModel = getModelById(modelId);
        const openai = this.clientFactory.createClient(aiModel);

        const messages = this.messageBuilder.buildEditMessages(
            userMessage,
            history,
            currentDesign,
            designSystemId
        );

        console.log('--- 1. Sending Edit Request to GPT ---');
        console.log(`🎨 Design System: ${this.promptBuilder.getDesignSystemDisplayName(designSystemId) || 'default'}`);
        console.log(`📊 Design size: ${JSON.stringify(currentDesign).length} characters`);

        try {
            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            const designData = this.responseParser.extractDesignFromResponse(responseText);
            if (!designData) {
                console.error('Failed to extract JSON. Raw response:', responseText);
                throw new Error('Failed to extract valid design JSON from AI response.');
            }

            const aiMessage = this.responseParser.extractMessageFromResponse(responseText);
            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                message: aiMessage,
                design: designData,
                previewHtml: null,
                cost: costBreakdown
            };

        } catch (error) {
            this.handleError(error, 'editDesignWithAI');
        }
    }

    async generateDesignBasedOnExisting(
        userMessage: string,
        history: ConversationMessage[],
        referenceToon: string,
        modelId: string
    ): Promise<DesignGenerationResult> {
        const aiModel = getModelById(modelId);
        const openai = this.clientFactory.createClient(aiModel);

        const messages = this.messageBuilder.buildBasedOnExistingMessages(
            userMessage,
            history,
            referenceToon
        );

        console.log('🎨 Generating design based on existing design system');
        console.log(`📊 Reference design size (TOON): ${referenceToon.length} characters`);

        try {
            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            const designData = this.responseParser.extractDesignFromResponse(responseText);
            if (!designData) {
                console.error('Failed to extract JSON. Raw response:', responseText);
                throw new Error('Failed to extract valid design JSON from AI response.');
            }

            const aiMessage = this.responseParser.extractMessageFromResponse(responseText);
            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                message: aiMessage,
                design: designData,
                previewHtml: null,
                cost: costBreakdown
            };

        } catch (error) {
            // Provide more specific error for timeouts
            if (error instanceof Error && error.message.includes('timed out')) {
                throw new Error(
                    'Request timed out. The reference design may be too complex. ' +
                    'Try using a simpler design as reference or break it into smaller parts.'
                );
            }
            this.handleError(error, 'generateDesignBasedOnExisting');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Private Methods
    // ─────────────────────────────────────────────────────────────────────────────

    private async executeWithToolCalls(
        openai: OpenAI,
        aiModel: AIModelConfig,
        messages: AiMessage[]
    ): Promise<CompletionResult> {
        let completion = await openai.chat.completions.create({
            model: aiModel.id,
            messages: messages,
            tools: iconTools,
        });

        // Handle tool calls loop
        while (completion.choices[0]?.message?.tool_calls) {
            const toolCalls = completion.choices[0].message.tool_calls as FunctionToolCall[];
            console.log(`--- Processing ${toolCalls.length} tool calls ---`);

            const toolResults = await this.toolCallHandler.handleToolCalls(toolCalls);

            // Add assistant message with tool calls
            messages.push({
                role: 'assistant',
                content: completion.choices[0].message.content || '',
                tool_calls: toolCalls,
            } as any);

            // Add tool results
            messages.push(...toolResults as any);

            // Get next completion
            completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
                tools: iconTools,
            });
        }

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('GPT API returned empty response.');
        }

        return {
            responseText,
            usage: completion.usage
        };
    }

    private calculateCost(
        aiModel: AIModelConfig,
        usage: OpenAI.Completions.CompletionUsage | undefined,
        inputContent: string,
        outputContent: string
    ): CostBreakdown {
        const inputTokens = usage?.prompt_tokens ?? this.costCalculator.estimateTokens(inputContent);
        const outputTokens = usage?.completion_tokens ?? this.costCalculator.estimateTokens(outputContent);

        const costBreakdown = this.costCalculator.calculateCost(aiModel, inputTokens, outputTokens);
        console.log(`💰 Cost: Input: ${costBreakdown.inputCost}, Output: ${costBreakdown.outputCost}, Total: ${costBreakdown.totalCost}`);

        return costBreakdown;
    }

    private handleError(error: unknown, methodName: string): never {
        console.error(`An error occurred in ${methodName}:`, error);
        throw new Error(
            `Failed to ${methodName.replace(/([A-Z])/g, ' $1').toLowerCase()}. ` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Legacy methods for backward compatibility (delegate to iconService)
    // ─────────────────────────────────────────────────────────────────────────────

    async searchIcons(query: string): Promise<{ icons: string[] }> {
        return this.iconService.searchIcons(query);
    }

    getIconUrl(iconData: string): string {
        return this.iconService.getIconUrl(iconData);
    }
}
