// src/infrastructure/services/ai-generate-design.service.ts
import OpenAI from 'openai';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';
import { FrameInfo, PrototypeConnection } from '../../domain/entities/prototype-connection.entity';
import { CostBreakdown, IAiCostCalculator } from '../../domain/services/IAiCostCanculator';
import { IOpenAIClientFactory } from '../../domain/services/IOpenAIClientFactory';

import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../domain/services/IAiDesignService';

import { iconTools } from '../config/ai-tools.config';
import { AIModelConfig, getModelById } from '../config/ai-models.config';

import { ToolCallHandlerService, FunctionToolCall } from './tool-call-handler.service';
import { ResponseParserService } from './response-parser.service';
import { MessageBuilderService, AiMessage } from './message-builder.service';

interface CompletionResult {
    responseText: string;
    usage: OpenAI.Completions.CompletionUsage | undefined;
}

export class AiGenerateDesignService implements IAiDesignService {
    private readonly costCalculator: IAiCostCalculator;
    private readonly clientFactory: IOpenAIClientFactory;
    private readonly toolCallHandler: ToolCallHandlerService;
    private readonly responseParser: ResponseParserService;
    private readonly messageBuilder: MessageBuilderService;

    constructor(
        costCalculator: IAiCostCalculator,
        clientFactory: IOpenAIClientFactory,
        toolCallHandler: ToolCallHandlerService,
        responseParser: ResponseParserService,
        messageBuilder: MessageBuilderService,
    ) {
        this.costCalculator = costCalculator;
        this.clientFactory = clientFactory;
        this.toolCallHandler = toolCallHandler;
        this.responseParser = responseParser;
        this.messageBuilder = messageBuilder;
    }

    async generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[],
        modelId: string,
        designSystemId: string
    ): Promise<DesignGenerationResult> {

        const aiModel = getModelById(modelId);
        const openai = this.clientFactory.createClient(aiModel);

        console.log('--- 1. Prepare messages  ---');

        const messages = this.messageBuilder.buildConversationMessages(
            userMessage,
            history,
            designSystemId
        );

        console.log('--- 2. Sending messages to AI  ---');

        try {

            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            console.log('--- 3. Response parsed  ---');

            const result = this.responseParser.parseAIResponseForDesign(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                message: result.message,
                design: result.design,
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

        console.log('--- 1. Prepare messages  ---');

        const messages = this.messageBuilder.buildEditMessages(
            userMessage,
            history,
            currentDesign,
            designSystemId
        );

        console.log('--- 2. Sending messages to AI  ---');

        try {
            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            console.log('--- 3. Response parsed  ---');

            const result = this.responseParser.parseAIResponseForDesign(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                message: result.message,
                design: result.design,
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

        console.log('--- 1. Prepare messages  ---');

        const messages = this.messageBuilder.buildBasedOnExistingMessages(
            userMessage,
            history,
            referenceToon
        );

        console.log('--- 2. Sending messages to AI  ---');

        try {
            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            console.log('--- 3. Response parsed  ---');

            const result = this.responseParser.parseAIResponseForDesign(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                message: result.message,
                design: result.design,
                previewHtml: null,
                cost: costBreakdown
            };

        } catch (error) {
            this.handleError(error, 'generateDesignBasedOnExisting');
        }
    }

    async generateConnections(
        frames: FrameInfo[],
        modelId?: string
    ): Promise<{
        connections: PrototypeConnection[];
        message: string;
        reasoning?: string;
        cost?: any;
    }> {
        const aiModel = getModelById(modelId!);
        const openai = this.clientFactory.createClient(aiModel);

        console.log('--- 1. Prepare messages  ---');

        // FIX: Original code referenced undefined `userMessage` — now uses `frames`
        const messages = this.messageBuilder.buildPrototypeMessages(frames);

        try {
            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages
            });

            const responseText = completion.choices[0]?.message?.content;

            if (!responseText) {
                throw new Error('Empty response from AI');
            }

            const result = this.responseParser.parseAIResponseForPrototype(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                completion.usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                connections: result.connections,
                message: `Generated ${result.connections.length} prototype connections`,
                reasoning: result.reasoning,
                cost: costBreakdown
            };

        } catch (error) {
            this.handleError(error, 'generateConnections');
        }
    }

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
}