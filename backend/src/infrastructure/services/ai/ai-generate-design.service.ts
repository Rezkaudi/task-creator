// src/infrastructure/services/ai-generate-design.service.ts
import OpenAI from 'openai';
import { FigmaDesign } from '../../../domain/entities/figma-design.entity';
import { FrameInfo, PrototypeConnection } from '../../../domain/entities/prototype-connection.entity';
import { CostBreakdown, IAiCostCalculator } from '../../../domain/services/IAiCostCanculator';
import { IOpenAIClientFactory } from '../../../domain/services/IOpenAIClientFactory';

import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../../domain/services/IAiDesignService';

import { iconTools } from '../../config/ai-tools.config';
import { AIModelConfig, getModelById } from '../../config/ai-models.config';
import { ENV_CONFIG } from '../../config/env.config';

import { ToolCallHandlerService, FunctionToolCall } from './tool-call-handler.service';
import { ResponseParserService } from './response-parser.service';
import { MessageBuilderService, AiMessage } from './message-builder.service';
import { S3Service } from '../storage/s3.service';

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
    private readonly s3Service: S3Service;

    constructor(
        costCalculator: IAiCostCalculator,
        clientFactory: IOpenAIClientFactory,
        toolCallHandler: ToolCallHandlerService,
        responseParser: ResponseParserService,
        messageBuilder: MessageBuilderService,
        s3Service: S3Service,
    ) {
        this.costCalculator = costCalculator;
        this.clientFactory = clientFactory;
        this.toolCallHandler = toolCallHandler;
        this.responseParser = responseParser;
        this.messageBuilder = messageBuilder;
        this.s3Service = s3Service;
    }

    async generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[],
        modelId: string,
        designSystemId: string,
        imageDataUrl?: string,
    ): Promise<DesignGenerationResult> {

        const aiModel = getModelById(modelId);
        const openai = this.clientFactory.createClient(aiModel);

        console.log('--- 1. Prepare messages  ---');

        let uploadedImageUrl: string | undefined;
        if (imageDataUrl) {
            console.log('--- Uploading image to S3 ---');
            uploadedImageUrl = await this.s3Service.uploadBase64Image(imageDataUrl, 'vision-temp');
        }

        const messages = this.messageBuilder.buildConversationMessages(
            userMessage,
            history,
            designSystemId,
            uploadedImageUrl ?? imageDataUrl,
        );

        console.log('--- 2. Sending messages to AI  ---');

        try {

            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            console.log('--- 3. Response parsed  ---');

            const result = this.responseParser.parseAIResponse(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText,
                !!imageDataUrl,
            );

            return {
                design: result.data,
                cost: costBreakdown
            };

        } catch (error) {
            this.handleError(error, 'generateDesignFromConversation');
        } finally {
            if (uploadedImageUrl) {
                console.log('--- Deleting temp image from S3 ---');
                this.s3Service.deleteImageByUrl(uploadedImageUrl).catch(err =>
                    console.error('Failed to delete temp image from S3:', err)
                );
            }
        }
        return undefined as never;
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

            const result = this.responseParser.parseAIResponse(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                design: result.data,
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
        modelId: string,
        pinnedInstructions?: string,
        imageDataUrl?: string,
    ): Promise<DesignGenerationResult> {
        const aiModel = getModelById(modelId);
        const openai = this.clientFactory.createClient(aiModel);

        console.log('--- 1. Prepare messages  ---');

        let uploadedImageUrl: string | undefined;
        if (imageDataUrl) {
            console.log('--- Uploading image to S3 ---');
            uploadedImageUrl = await this.s3Service.uploadBase64Image(imageDataUrl, 'vision-temp');
        }

        const messages = this.messageBuilder.buildBasedOnExistingMessages(
            userMessage,
            history,
            referenceToon,
            pinnedInstructions,
            uploadedImageUrl ?? imageDataUrl,
        );

        console.log('--- 2. Sending messages to AI  ---');

        try {
            const { responseText, usage } = await this.executeWithToolCalls(
                openai,
                aiModel,
                messages
            );

            console.log('--- 3. Response parsed  ---');

            const result = this.responseParser.parseAIResponse(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                design: result.data,
                cost: costBreakdown
            };

        } catch (error) {
            this.handleError(error, 'generateDesignBasedOnExisting');
        } finally {
            if (uploadedImageUrl) {
                console.log('--- Deleting temp image from S3 ---');
                this.s3Service.deleteImageByUrl(uploadedImageUrl).catch(err =>
                    console.error('Failed to delete temp image from S3:', err)
                );
            }
        }
        return undefined as never;
    }

    async generateConnections(
        frames: FrameInfo[],
        modelId?: string
    ): Promise<{
        connections: PrototypeConnection[];
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
                messages: messages as any,
                // response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content;

            if (!responseText) {
                throw new Error('Empty response from AI');
            }

            const result = this.responseParser.parseAIResponse(responseText);

            console.log('--- 4. Calculating cost  ---');

            const costBreakdown = this.calculateCost(
                aiModel,
                completion.usage,
                JSON.stringify(messages),
                responseText
            );

            return {
                connections: result.data,
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
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        let completion = await openai.chat.completions.create({
            model: aiModel.id,
            messages: messages as any,
            tools: iconTools,
        });

        totalInputTokens += completion.usage?.prompt_tokens ?? 0;
        totalOutputTokens += completion.usage?.completion_tokens ?? 0;

        // Handle tool calls loop (capped to prevent runaway token costs)
        const maxRounds = ENV_CONFIG.MAX_TOOL_CALL_ROUNDS;
        let round = 0;
        while (completion.choices[0]?.message?.tool_calls && round < maxRounds) {
            round++;
            const toolCalls = completion.choices[0].message.tool_calls as FunctionToolCall[];
            console.log(`--- Processing ${toolCalls.length} tool calls (round ${round}/${maxRounds}) ---`);

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
                messages: messages as any,
                tools: iconTools,
            });

            totalInputTokens += completion.usage?.prompt_tokens ?? 0;
            totalOutputTokens += completion.usage?.completion_tokens ?? 0;
        }

        if (round >= maxRounds && completion.choices[0]?.message?.tool_calls) {
            console.warn(`⚠️ Tool call loop hit max rounds (${maxRounds}). Forcing final completion without tools.`);
            // Request one final completion without tools to get the text response
            completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages as any,
            });
            totalInputTokens += completion.usage?.prompt_tokens ?? 0;
            totalOutputTokens += completion.usage?.completion_tokens ?? 0;
        }

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
            throw new Error('LLM API returned empty response.');
        }

        return {
            responseText,
            usage: {
                prompt_tokens: totalInputTokens,
                completion_tokens: totalOutputTokens,
                total_tokens: totalInputTokens + totalOutputTokens,
            }
        };
    }

    private calculateCost(
        aiModel: AIModelConfig,
        usage: OpenAI.Completions.CompletionUsage | undefined,
        inputContent: string,
        outputContent: string,
        hasImage = false,
    ): CostBreakdown {
        // const IMAGE_TOKEN_ESTIMATE = 765;
        console.log("usage:", usage);
        let inputTokens = usage?.prompt_tokens ?? this.costCalculator.estimateTokens(inputContent);
        // if (hasImage) {
        //     inputTokens += IMAGE_TOKEN_ESTIMATE;
        // }
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