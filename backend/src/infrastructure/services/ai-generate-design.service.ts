import OpenAI from 'openai';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';
import { AIModelConfig, getModelById } from '../config/ai-models.config';
import { PromptBuilderService } from './prompt-builder.service';
import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../domain/services/IAiDesignService';
import { htmlPreviewPrompt } from '../config/prompt.config';
import { CostBreakdown, IAiCostCalculator } from '../../domain/services/IAiCostCanculator';

interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class AiGenerateDesignService implements IAiDesignService {
    private promptBuilder: PromptBuilderService;
    private costCalculator: IAiCostCalculator;

    constructor(promptBuilderService: PromptBuilderService, costCalculator: IAiCostCalculator) {
        this.promptBuilder = promptBuilderService;
        this.costCalculator = costCalculator;
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


            const openai: OpenAI = new OpenAI({
                baseURL: aiModel.baseURL,
                apiKey: aiModel.apiKey,
                timeout: 120000, // Increase to 30 seconds
                // maxRetries: 3,  // Add retry logic
            });

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: enrichedPrompt }
                ],
                // max_completion_tokens: aiModel.maxTokens,
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content;
            const usage = completion.usage;

            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            console.log("responseText", responseText);
            const jsonDesign = JSON.parse(responseText);

            // Calculate cost
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
            const openai: OpenAI = new OpenAI({
                baseURL: aiModel.baseURL,
                apiKey: aiModel.apiKey,
                timeout: 120000, // Increase to 30 seconds
                // maxRetries: 3,  // Add retry logic
            });

            console.log("--- 1. Sending Conversation to GPT for JSON ---");

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
                // max_completion_tokens: aiModel.maxTokens,
            });

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            const designData = this.extractDesignFromResponse(responseText);
            const aiMessage = this.extractMessageFromResponse(responseText);

            let previewHtml: string | null = null;
            let inputTokensForPreview = 0;
            let outputTokensForPreview = 0;

            if (designData) {
                try {
                    console.log("--- 3. Requesting HTML preview ---");
                    const { design, inputTokens, outputTokens } = await this.generateHtmlPreview(designData, openai, aiModel);
                    previewHtml = design
                    inputTokensForPreview = inputTokens;
                    outputTokensForPreview = outputTokens;
                    console.log("--- 4. HTML Preview Generated ---");
                } catch (previewError) {
                    console.error("Could not generate HTML preview. This is a non-critical error.", previewError);
                    previewHtml = "<div style='padding: 20px; text-align: center; color: #666;'>Preview generation failed, but the design is ready.</div>";
                }
            }

            // Calculate cost
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
                // Estimate tokens if usage not available
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
            console.log(`🎨 Design System: ${this.promptBuilder.getDesignSystemDisplayName(designSystemId) || 'None'}`);
            console.log("Design size:", JSON.stringify(currentDesign).length, "characters");

            const openai: OpenAI = new OpenAI({
                baseURL: aiModel.baseURL,
                apiKey: aiModel.apiKey,
                timeout: 120000, // Increase to 30 seconds
                // maxRetries: 3,  // Add retry logic
            });

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
                // max_completion_tokens: aiModel.maxTokens,
            });

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

            if (designData) {
                try {
                    console.log("--- 3. Requesting HTML preview for edited design ---");
                    const { design, inputTokens, outputTokens } = await this.generateHtmlPreview(designData, openai, aiModel);
                    previewHtml = design
                    inputTokensForPreview = inputTokens;
                    outputTokensForPreview = outputTokens;
                    console.log("--- 4. HTML Preview Generated ---");
                } catch (previewError) {
                    console.error("Could not generate HTML preview. This is a non-critical error.", previewError);
                    previewHtml = "<div style='padding: 20px; text-align: center; color: #666;'>Preview generation failed, but the edited design is ready.</div>";
                }
            }

            // Calculate cost
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
                // Estimate tokens if usage not available
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

    private async generateHtmlPreview(designJson: object, openai: OpenAI, aiModel: AIModelConfig): Promise<{ design: string, inputTokens: number, outputTokens: number }> {

        const prompt = `${htmlPreviewPrompt} Here is the JSON data: ${JSON.stringify(designJson, null, 2)}`;
        const messages: AiMessage[] = [
            {
                role: 'system',
                content: "You are an expert at converting design JSON into a single, clean HTML block with inline CSS for preview purposes. You only output raw HTML code."
            },
            { role: 'user', content: prompt }
        ]

        const completion = await openai.chat.completions.create({
            model: aiModel.id,
            messages: messages,
            // max_completion_tokens: aiModel.maxTokens,
        });

        const htmlContent = completion.choices[0]?.message?.content;
        if (!htmlContent) {
            throw new Error("Invalid or empty HTML preview response from GPT.");
        }

        let cleaned = htmlContent;
        if (cleaned.startsWith('```html')) {
            cleaned = cleaned.substring(7, cleaned.length - 3).trim();
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.substring(3, cleaned.length - 3).trim();
        }

        // Calculate cost

        let inputTokens: number = 0
        let outputTokens: number = 0

        const usage = completion.usage

        if (usage) {
            inputTokens = usage.prompt_tokens;
            outputTokens = usage.completion_tokens;
        } else {
            // Estimate tokens if usage not available
            inputTokens = this.costCalculator.estimateTokens(JSON.stringify(messages));
            outputTokens = this.costCalculator.estimateTokens(htmlContent);
        }

        return { design: cleaned, inputTokens, outputTokens };
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

        const messages: AiMessage[] = [
            { role: 'system', content: systemPrompt }
        ];

        const recentHistory = history.slice(-5);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            });
        }

        const designStr = JSON.stringify(currentDesign, null, 2);

        const editRequest = `CURRENT DESIGN:
   \`\`\`json
   ${designStr}
   \`\`\`
   
   USER REQUEST: ${currentMessage}
   
   INSTRUCTIONS:
   1. Understand the current design structure
   2. Apply the user's requested changes
   3. Keep everything else unchanged
   4. Return the complete modified design as valid JSON array
   5. Start your response with a brief description, then the JSON`;

        messages.push({
            role: 'user',
            content: editRequest
        });

        return messages;
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
}