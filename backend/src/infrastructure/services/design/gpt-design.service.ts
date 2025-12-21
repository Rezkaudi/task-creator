import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ENV_CONFIG } from '../../config/env.config';
import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../../domain/services/IAiDesignService';
import { FigmaDesign } from '../../../domain/entities/figma-design.entity';

interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class GPTDesignService implements IAiDesignService {
    private openai: OpenAI;
    private systemPrompt: string;
    private model = ENV_CONFIG.MODELS.GPT4O;

    constructor() {
        this.openai = new OpenAI({
            apiKey: ENV_CONFIG.OPENAI_API_KEY,
        });

        this.systemPrompt = fs.readFileSync(
            path.join(__dirname, '../../../../public/prompt/text-to-design-prompt.txt'),
            'utf-8'
        );
    }

    async generateDesign(prompt: string): Promise<any> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.model.name,
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Generate a Figma design JSON for: "${prompt}"` }
                ],
                max_completion_tokens: this.model.maxTokens,
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
        history: ConversationMessage[]
    ): Promise<DesignGenerationResult> {
        try {
            const messages = this.buildConversationMessages(userMessage, history);

            console.log("--- 1. Sending Conversation to GPT for JSON ---");
            const completion = await this.openai.chat.completions.create({
                model: this.model.name,
                messages: messages,
                max_completion_tokens: this.model.maxTokens,
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
                    previewHtml = await this.generateHtmlPreview(designData);
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
        currentDesign: FigmaDesign[]
    ): Promise<DesignGenerationResult> {
        try {
            const messages = this.buildEditConversationMessages(userMessage, history, currentDesign);

            console.log("--- 1. Sending Edit Request to GPT ---");
            console.log("Design size:", JSON.stringify(currentDesign).length, "characters");

            const completion = await this.openai.chat.completions.create({
                model: this.model.name,
                messages: messages,
                max_completion_tokens: this.model.maxTokens,
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
                    previewHtml = await this.generateHtmlPreview(designData);
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

    private async generateHtmlPreview(designJson: object): Promise<string> {
        const prompt = `Based on the following design JSON, generate a single, self-contained HTML block to visually represent this design.
- Use inline CSS for styling.
- Use flexbox or grid for layouts.
- The output must be ONLY the HTML code, without any explanation, comments, or markdown like \`\`\`html. Just provide the raw HTML.
- Make it as visually accurate as possible, but keep it simple. This is for a small preview inside a chat bubble.
- Ensure text is readable and elements are reasonably spaced.

Here is the JSON data:
${JSON.stringify(designJson, null, 2)}`;

        const completion = await this.openai.chat.completions.create({
            model: this.model.name,
            messages: [
                {
                    role: 'system',
                    content: "You are an expert at converting design JSON into a single, clean HTML block with inline CSS for preview purposes. You only output raw HTML code."
                },
                { role: 'user', content: prompt }
            ],
            max_tokens: this.model.maxTokens,
            temperature: 0.7,
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

    private buildConversationMessages(
        currentMessage: string,
        history: ConversationMessage[]
    ): AiMessage[] {
        const messages: AiMessage[] = [
            { role: 'system', content: this.buildConversationSystemPrompt() }
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
        currentDesign: any
    ): AiMessage[] {
        const messages: AiMessage[] = [
            { role: 'system', content: this.buildEditSystemPrompt() }
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

    private buildConversationSystemPrompt(): string {
        return `${this.systemPrompt}

When replying:
1. Start with a brief description of what was created/modified
2. Then provide the complete design JSON array

Example:

Created a login page with email and password fields.

[
  {
    "name": "Login Page",
    "type": "FRAME",
    ...
  }
]`;
    }

    private buildEditSystemPrompt(): string {
        return `${this.systemPrompt}

**EDITING MODE:**

You will receive:
1. The current design in JSON format
2. User's edit request

**YOUR TASK:**
- Understand the current design
- Apply ONLY the requested changes
- Keep everything else exactly as is
- Return the COMPLETE design (not just changes)

**CRITICAL RULES:**
- Maintain exact structure and hierarchy
- Use same node types unless explicitly asked to change
- Colors must be 0-1 range (NOT 0-255)
- Keep all properties not mentioned in edit request
- For TEXT nodes: include all required properties (characters, fontSize, fontName, textAlignHorizontal, textAlignVertical, lineHeight)

**OUTPUT FORMAT:**
Brief description + complete JSON array

Example:

Changed background to blue.

[
  {
    "name": "Design",
    "type": "FRAME",
    ...
  }
]`;
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