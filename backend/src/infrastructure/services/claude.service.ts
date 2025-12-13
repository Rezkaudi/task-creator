import fs from 'fs';
import path from 'path';
import { IClaudeGenerator, ConversationMessage, DesignGenerationResult } from '../../domain/services/IClaudeGenerator';
import { ENV_CONFIG } from '../config/env.config';

interface ClaudeApiResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

export class ClaudeService implements IClaudeGenerator {
    private readonly apiKey: string;
    private readonly cloudeModel: string;
    private systemPrompt: string;
    private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

    constructor() {
        this.apiKey = ENV_CONFIG.CLOUDE_API_KEY!;
        this.cloudeModel = ENV_CONFIG.CLOUDE_MODEL;

        this.systemPrompt = fs.readFileSync(
            path.join(__dirname, '../../../public/prompt/text-to-design-prompt.txt'),
            'utf-8'
        );
    }

    async generateDesign(prompt: string): Promise<any> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.cloudeModel,
                    system: this.systemPrompt,
                    max_tokens: 16384,
                    messages: [{ role: 'user', content: `Generate a Figma design JSON for: "${prompt}"` }]
                })
            });

            const responseBodyText = await response.text();
            if (!response.ok) {
                throw new Error(`Claude API request failed with status ${response.status}: ${responseBodyText}`);
            }

            const result = JSON.parse(responseBodyText) as ClaudeApiResponse;
            if (!result.content || !result.content[0] || !result.content[0].text) {
                throw new Error("Parsed JSON response from Claude is invalid or empty.");
            }

            const rawTextResponse = result.content[0].text;
            const jsonDesign = JSON.parse(rawTextResponse);
            return jsonDesign;

        } catch (error) {
            console.error("An error occurred in generateDesign:", error);
            throw new Error(`Failed to generate design from Claude. Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[]
    ): Promise<DesignGenerationResult> {
        try {
            const messages = this.buildConversationMessages(userMessage, history);

            console.log("--- 1. Sending Conversation to Claude for JSON ---");
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.cloudeModel,
                    system: this.buildConversationSystemPrompt(),
                    max_tokens: 16384,
                    messages: messages
                })
            });

            const responseBodyText = await response.text();
            if (!response.ok) {
                throw new Error(`Claude API request for JSON failed with status ${response.status}: ${responseBodyText}`);
            }

            const result = JSON.parse(responseBodyText) as ClaudeApiResponse;
            if (!result.content || !result.content[0] || !result.content[0].text) {
                throw new Error("Parsed JSON response from Claude is invalid or empty.");
            }

            const rawTextResponse = result.content[0].text;
            const designData = this.extractDesignFromResponse(rawTextResponse);
            const aiMessage = this.extractMessageFromResponse(rawTextResponse);

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

    /**
     * NEW METHOD: Edit existing design based on user request
     */
    async editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: any
    ): Promise<DesignGenerationResult> {
        try {
            const messages = this.buildEditConversationMessages(userMessage, history, currentDesign);

            console.log("--- 1. Sending Edit Request to Claude ---");
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.cloudeModel,
                    system: this.buildEditSystemPrompt(),
                    max_tokens: 16384,
                    messages: messages
                })
            });

            const responseBodyText = await response.text();
            if (!response.ok) {
                throw new Error(`Claude API edit request failed with status ${response.status}: ${responseBodyText}`);
            }

            const result = JSON.parse(responseBodyText) as ClaudeApiResponse;
            if (!result.content || !result.content[0] || !result.content[0].text) {
                throw new Error("Parsed JSON response from Claude is invalid or empty.");
            }

            const rawTextResponse = result.content[0].text;
            const designData = this.extractDesignFromResponse(rawTextResponse);
            const aiMessage = this.extractMessageFromResponse(rawTextResponse);

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

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.cloudeModel,
                system: "You are an expert at converting design JSON into a single, clean HTML block with inline CSS for preview purposes. You only output raw HTML code.",
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to generate HTML preview. Status: ${response.status}, Body: ${errorText}`);
        }

        const result = await response.json() as ClaudeApiResponse;
        if (!result.content || !result.content[0] || !result.content[0].text) {
            throw new Error("Invalid or empty HTML preview response from Claude.");
        }

        let htmlContent = result.content[0].text;
        if (htmlContent.startsWith('```html')) {
            htmlContent = htmlContent.substring(7, htmlContent.length - 3).trim();
        } else if (htmlContent.startsWith('```')) {
            htmlContent = htmlContent.substring(3, htmlContent.length - 3).trim();
        }

        return htmlContent;
    }


    private buildConversationMessages(
        currentMessage: string,
        history: ConversationMessage[]
    ): Array<{ role: string; content: string }> {
        const messages: Array<{ role: string; content: string }> = [];

        for (const msg of history) {
            messages.push({
                role: msg.role,
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
    ): Array<{ role: string; content: string }> {
        const messages: Array<{ role: string; content: string }> = [];

        // Add conversation history
        for (const msg of history) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }

        // Add current design and edit request
        const editRequest = `Here is the current design in JSON format:
${JSON.stringify(currentDesign, null, 2)}

User's edit request: ${currentMessage}

Please modify the design according to the user's request and return the complete updated JSON.`;

        messages.push({
            role: 'user',
            content: editRequest
        });

        return messages;
    }

    private buildConversationSystemPrompt(): string {
        return `${this.systemPrompt}

When replying to a user:
1. If this is a new design, the design must be complete.
2. If it's a modification request, amend the previous design.
3. Begin your reply with a short description in English of what was done.
4. Then add the design's JSON.

Example reply:

The login page was created with a blue button and email and password fields.

{
"name": "Login Page",
"type": "FRAME",
...
}`;
    }

    private buildEditSystemPrompt(): string {
        return `${this.systemPrompt}

You are helping a user edit an existing Figma design. The user will provide:
1. The current design in JSON format
2. Their requested changes

Your task:
1. Understand the current design structure
2. Apply the requested changes accurately
3. Return the complete modified design JSON
4. Preserve any properties not mentioned in the edit request
5. Maintain valid Figma JSON structure

When replying:
1. Start with a brief description of the changes made
2. Then provide the complete updated JSON

Example reply:

I've changed the background color to blue and increased the text size to 18px.

{
"name": "Updated Login Page",
"type": "FRAME",
...
}`;
    }

    private extractDesignFromResponse(response: string): any {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (error) {
            console.error("Failed to extract design JSON:", error);
            return null;
        }
    }

    private extractMessageFromResponse(response: string): string {
        try {
            const beforeJson = response.split('{')[0].trim();
            if (beforeJson && beforeJson.length > 0) {
                return beforeJson;
            }
            return 'The design was successfully created.';
        } catch (error) {
            return 'Design created successfully';
        }
    }
}