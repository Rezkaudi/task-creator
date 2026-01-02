import OpenAI from 'openai';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';
import { AIModelConfig, getModelById } from '../config/ai-models.config';
import { PromptBuilderService } from './prompt-builder.service';
import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../domain/services/IAiDesignService';
import { htmlPreviewPrompt } from '../config/prompt.config';

interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class AiGenerateDesignService implements IAiDesignService {
    private promptBuilder: PromptBuilderService;

    constructor(promptBuilderService: PromptBuilderService) {
        this.promptBuilder = promptBuilderService;
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
            });

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: enrichedPrompt }
                ],
                response_format: { type: 'json_object' },
            });

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }
            console.log("responseText", responseText);

            const jsonDesign = JSON.parse(responseText);
            return jsonDesign;

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
            });

            console.log("--- 1. Sending Conversation to GPT for JSON ---");
            console.log(`🎨 Design System: ${this.promptBuilder.getDesignSystemDisplayName(designSystemId) || 'None'}`);

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
            });

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error("GPT API returned empty response.");
            }

            const designData = this.extractDesignFromResponse(responseText);
            const aiMessage = this.extractMessageFromResponse(responseText);

            let previewHtml: string | null = null;
            if (designData) {
                try {
                    console.log("--- 3. Requesting HTML preview ---");
                    previewHtml = await this.generateHtmlPreview(designData, openai, aiModel);
                    console.log("--- 4. HTML Preview Generated ---");
                } catch (previewError) {
                    console.error("Could not generate HTML preview. This is a non-critical error.", previewError);
                    previewHtml = "<div style='padding: 20px; text-align: center; color: #666;'>Preview generation failed, but the design is ready.</div>";
                }
            }

            return {
                message: aiMessage,
                design: designData,
                previewHtml: previewHtml
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
            });

            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: messages,
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
            if (designData) {
                try {
                    console.log("--- 3. Requesting HTML preview for edited design ---");
                    previewHtml = await this.generateHtmlPreview(designData, openai, aiModel);
                    console.log("--- 4. HTML Preview Generated ---");
                } catch (previewError) {
                    console.error("Could not generate HTML preview. This is a non-critical error.", previewError);
                    previewHtml = "<div style='padding: 20px; text-align: center; color: #666;'>Preview generation failed, but the edited design is ready.</div>";
                }
            }

            return {
                message: aiMessage,
                design: designData,
                previewHtml: previewHtml
            };

        } catch (error) {
            console.error("An error occurred in editDesignWithAI:", error);
            throw new Error(`Failed to edit design. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async generateHtmlPreview(
        designJson: object, 
        openai: OpenAI, 
        aiModel: AIModelConfig
    ): Promise<string> {

        const prompt = `${htmlPreviewPrompt} Here is the JSON data: ${JSON.stringify(designJson, null, 2)}`;

        const completion = await openai.chat.completions.create({
            model: aiModel.id,
            messages: [
                {
                    role: 'system',
                    content: "You are an expert at converting design JSON into a single, clean HTML block with inline CSS for preview purposes. You only output raw HTML code."
                },
                { role: 'user', content: prompt }
            ],
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

        return cleaned;
    }

    // ✅ FIX: Add design system reminder to conversation messages
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

        // ✅ Add design system reminder in user message
        let enrichedMessage = currentMessage;
        if (designSystemId) {
            const designSystemName = this.promptBuilder.getDesignSystemDisplayName(designSystemId);
            enrichedMessage = `${currentMessage}

IMPORTANT REMINDER: You MUST strictly follow the ${designSystemName} design system rules including:
- Use ONLY the approved color tokens and palette
- Follow the exact typography scale and font families
- Apply proper spacing tokens and layout grid
- Use correct component variants and styles
- Maintain consistent design patterns`;
        }

        messages.push({
            role: 'user',
            content: enrichedMessage
        });

        console.log(`📝 Conversation: ${messages.length} messages | Design System: ${designSystemId ? this.promptBuilder.getDesignSystemDisplayName(designSystemId) : 'None'} | Reminder: ${!!designSystemId}`);

        return messages;
    }

    // ✅ FIX: Add explicit design system reminder to edit messages
    // Now detects if design system changed and enforces migration
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

        // ✅ Detect if design system might have changed
        const currentDesignSystemInHistory = this.detectDesignSystemInHistory(recentHistory);
        const isDesignSystemChanged = currentDesignSystemInHistory && 
                                      currentDesignSystemInHistory !== designSystemId;

        // ✅ Add explicit design system constraints with migration warning
        let designSystemReminder = '';
        if (designSystemId) {
            const designSystemName = this.promptBuilder.getDesignSystemDisplayName(designSystemId);
            
            if (isDesignSystemChanged) {
                // ⚠️ DESIGN SYSTEM CHANGED - Need migration
                designSystemReminder = `
   
   ⚠️⚠️⚠️ CRITICAL: DESIGN SYSTEM MIGRATION REQUIRED ⚠️⚠️⚠️
   
   The current design was built with a DIFFERENT design system, but you MUST now convert it to ${designSystemName}.
   
   🔄 MIGRATION INSTRUCTIONS:
   
   1. REPLACE ALL COLORS with ${designSystemName} color tokens
      - Map old colors to equivalent ${designSystemName} colors
      - Example: If old primary was blue, use ${designSystemName}'s primary blue token
      - DO NOT keep any colors from the previous design system
   
   2. REPLACE ALL TYPOGRAPHY with ${designSystemName} type scale
      - Map old font sizes to ${designSystemName} scale
      - Use ${designSystemName} font families and weights
      - Update line heights and letter spacing
   
   3. REPLACE ALL SPACING with ${designSystemName} spacing tokens
      - Convert old padding/margins to ${designSystemName} scale
      - Follow ${designSystemName} grid system
   
   4. CONVERT ALL COMPONENTS to ${designSystemName} patterns
      - Rebuild components using ${designSystemName} structure
      - Apply ${designSystemName} component variants
      - Use ${designSystemName} states and interactions
   
   🎯 YOUR TASK:
   - Apply the user's requested changes
   - SIMULTANEOUSLY migrate EVERYTHING to ${designSystemName}
   - The final design MUST be 100% ${designSystemName} compliant
   - Remove ALL traces of the previous design system
   
   ⚠️ This is a COMPLETE REDESIGN using ${designSystemName} - not just a color swap!`;
            } else {
                // Normal edit - same design system
                designSystemReminder = `
   
   🎨 DESIGN SYSTEM CONSTRAINTS - ${designSystemName}:
   You MUST follow ${designSystemName} design system for ALL modifications:
   
   1. COLORS: Use ONLY approved color tokens from ${designSystemName}
      - Do NOT introduce new colors or hex codes outside the system
      - Maintain color semantic meaning (primary, secondary, etc.)
   
   2. TYPOGRAPHY: Follow ${designSystemName} type scale exactly
      - Use specified font families and weights
      - Apply correct font sizes from the scale
      - Maintain proper line heights and letter spacing
   
   3. SPACING: Use ONLY the spacing tokens from ${designSystemName}
      - Follow the spacing scale (4px, 8px, 16px, etc.)
      - Maintain consistent padding and margins
   
   4. COMPONENTS: Use standard ${designSystemName} component patterns
      - Follow component structure and variants
      - Apply proper states (hover, active, disabled)
   
   ⚠️ Any modification that violates ${designSystemName} rules will be REJECTED.`;
            }
        }

        const editRequest = `CURRENT DESIGN:
   \`\`\`json
   ${designStr}
   \`\`\`
   ${designSystemReminder}
   
   USER REQUEST: ${currentMessage}
   
   INSTRUCTIONS:
   1. ${isDesignSystemChanged ? '🔄 MIGRATE the entire design to the new design system first' : 'Analyze the current design structure'}
   2. Apply the user's requested changes ${isDesignSystemChanged ? 'within the NEW design system' : ''}
   3. ${isDesignSystemChanged ? 'Ensure EVERY element follows the new design system' : 'Keep everything else UNCHANGED'}
   4. ${designSystemId ? `STRICTLY maintain ${this.promptBuilder.getDesignSystemDisplayName(designSystemId)} design system compliance` : 'Maintain consistent styling'}
   5. Validate all colors, fonts, spacing against ${designSystemId ? this.promptBuilder.getDesignSystemDisplayName(designSystemId) : 'the design system'}
   6. Return the complete modified design as valid JSON array
   7. Start your response with a brief description of what you changed, then provide the JSON`;

        messages.push({
            role: 'user',
            content: editRequest
        });

        console.log(`✏️ Edit Request:
   - Design System: ${designSystemId ? this.promptBuilder.getDesignSystemDisplayName(designSystemId) : 'None'}
   - Design System Changed: ${isDesignSystemChanged ? 'YES - Migration Required!' : 'No'}
   - Current Design: ${designStr.length} characters
   - History: ${recentHistory.length} messages
   - Migration Mode: ${isDesignSystemChanged ? 'ENABLED ⚠️' : 'disabled'}`);

        return messages;
    }

    // Helper method to detect design system from conversation history
    private detectDesignSystemInHistory(history: ConversationMessage[]): string | null {
        // Look through history for design system mentions
        for (const msg of history.reverse()) {
            if (msg.role === 'user') {
                const content = msg.content.toLowerCase();
                // Common design system names
                if (content.includes('material design') || content.includes('material-ui')) return 'material-design';
                if (content.includes('ant design') || content.includes('antd')) return 'ant-design';
                if (content.includes('bootstrap')) return 'bootstrap';
                if (content.includes('tailwind')) return 'tailwind';
                if (content.includes('chakra')) return 'chakra-ui';
                // Add more design systems as needed
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
}