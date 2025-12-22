import fs from 'fs';
import path from 'path';
import { ENV_CONFIG } from '../../config/env.config';
import { ConversationMessage, DesignGenerationResult, IAiDesignService } from '../../../domain/services/IAiDesignService';

interface ClaudeApiResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

export class CloudeDesignService implements IAiDesignService {
    private readonly apiKey: string;
    private readonly cloudeModel: string;
    private systemPrompt: string;
    private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

    constructor() {
        this.apiKey = ENV_CONFIG.CLOUDE_API_KEY!;
        this.cloudeModel = ENV_CONFIG.CLOUDE_MODEL;

        this.systemPrompt = '../../../public/prompt/text-to-design-prompt.txt';
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
     * IMPROVED v2: Better approach - simplify for AI but keep structure intact
     */
    async editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: any
    ): Promise<DesignGenerationResult> {
        try {
            // STEP 1: Convert design to simplified but complete format
            const simplifiedDesign = this.simplifyDesignForAI(currentDesign);

            const messages = this.buildEditConversationMessages(userMessage, history, simplifiedDesign);

            console.log("--- 1. Sending Edit Request to Claude ---");
            console.log("Design size:", JSON.stringify(simplifiedDesign).length, "characters");

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
                console.error("API Response Error:", responseBodyText);
                throw new Error(`Claude API edit request failed with status ${response.status}: ${responseBodyText}`);
            }

            const result = JSON.parse(responseBodyText) as ClaudeApiResponse;
            if (!result.content || !result.content[0] || !result.content[0].text) {
                throw new Error("Parsed JSON response from Claude is invalid or empty.");
            }

            const rawTextResponse = result.content[0].text;
            console.log("--- 2. Received response from Claude ---");

            // STEP 2: Extract and validate the design
            let designData = this.extractDesignFromResponse(rawTextResponse);

            if (!designData) {
                console.error("Failed to extract JSON. Raw response:", rawTextResponse);
                throw new Error("Failed to extract valid design JSON from AI response.");
            }

            // STEP 3: Validate and fix the design structure
            designData = this.validateAndFixDesign(designData);

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

    /**
     * NEW APPROACH: Simplify for AI while keeping all essential structure
     * This keeps the design valid but easier for AI to understand
     */
    private simplifyDesignForAI(design: any): any {
        if (Array.isArray(design)) {
            return design.map(node => this.simplifyNode(node));
        }
        return this.simplifyNode(design);
    }

    private simplifyNode(node: any): any {
        if (!node || typeof node !== 'object') return node;

        // Start with essential properties
        const simplified: any = {
            name: node.name || "Unnamed",
            type: node.type || "FRAME",
            x: node.x ?? 0,
            y: node.y ?? 0,
        };

        // Add dimensions for nodes that have them
        if ('width' in node) simplified.width = node.width;
        if ('height' in node) simplified.height = node.height;

        // Keep visibility and lock status
        if (node.visible === false) simplified.visible = false;
        if (node.locked === true) simplified.locked = true;

        // Keep rotation if present
        if (node.rotation && node.rotation !== 0) {
            simplified.rotation = node.rotation;
        }

        // Simplify fills - keep only visible ones
        if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
            simplified.fills = node.fills
                .filter((fill: any) => fill.visible !== false)
                .map((fill: any) => this.simplifyFill(fill));
        }

        // Simplify strokes - keep only visible ones
        if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
            simplified.strokes = node.strokes
                .filter((stroke: any) => stroke.visible !== false)
                .map((stroke: any) => this.simplifyFill(stroke));

            if (node.strokeWeight) simplified.strokeWeight = node.strokeWeight;
            if (node.strokeAlign) simplified.strokeAlign = node.strokeAlign;
        }

        // Keep effects (shadows, blurs)
        if (node.effects && Array.isArray(node.effects) && node.effects.length > 0) {
            simplified.effects = node.effects.filter((e: any) => e.visible !== false);
        }

        // Keep opacity and blend mode
        if (node.opacity !== undefined && node.opacity !== 1) {
            simplified.opacity = node.opacity;
        }
        if (node.blendMode && node.blendMode !== 'NORMAL' && node.blendMode !== 'PASS_THROUGH') {
            simplified.blendMode = node.blendMode;
        }

        // Keep corner radius
        if (node.cornerRadius && node.cornerRadius !== 0) {
            simplified.cornerRadius = node.cornerRadius;
        }
        if (node.topLeftRadius) simplified.topLeftRadius = node.topLeftRadius;
        if (node.topRightRadius) simplified.topRightRadius = node.topRightRadius;
        if (node.bottomLeftRadius) simplified.bottomLeftRadius = node.bottomLeftRadius;
        if (node.bottomRightRadius) simplified.bottomRightRadius = node.bottomRightRadius;

        // Keep auto-layout properties
        if (node.layoutMode && node.layoutMode !== 'NONE') {
            simplified.layoutMode = node.layoutMode;
            if (node.primaryAxisSizingMode) simplified.primaryAxisSizingMode = node.primaryAxisSizingMode;
            if (node.counterAxisSizingMode) simplified.counterAxisSizingMode = node.counterAxisSizingMode;
            if (node.primaryAxisAlignItems) simplified.primaryAxisAlignItems = node.primaryAxisAlignItems;
            if (node.counterAxisAlignItems) simplified.counterAxisAlignItems = node.counterAxisAlignItems;
            if (node.itemSpacing) simplified.itemSpacing = node.itemSpacing;
            if (node.paddingTop) simplified.paddingTop = node.paddingTop;
            if (node.paddingRight) simplified.paddingRight = node.paddingRight;
            if (node.paddingBottom) simplified.paddingBottom = node.paddingBottom;
            if (node.paddingLeft) simplified.paddingLeft = node.paddingLeft;
        }

        // Keep constraints
        if (node.constraints) {
            simplified.constraints = node.constraints;
        }

        // TEXT node specific properties
        if (node.type === 'TEXT') {
            simplified.characters = node.characters || "";
            simplified.fontSize = node.fontSize || 14;
            simplified.fontName = node.fontName || { family: "Inter", style: "Regular" };
            simplified.textAlignHorizontal = node.textAlignHorizontal || "LEFT";
            simplified.textAlignVertical = node.textAlignVertical || "TOP";
            simplified.lineHeight = node.lineHeight || { unit: "AUTO" };

            if (node.letterSpacing) simplified.letterSpacing = node.letterSpacing;
            if (node.textCase && node.textCase !== 'ORIGINAL') simplified.textCase = node.textCase;
            if (node.textDecoration && node.textDecoration !== 'NONE') simplified.textDecoration = node.textDecoration;
            if (node.textAutoResize) simplified.textAutoResize = node.textAutoResize;
        }

        // Keep children recursively
        if (node.children && Array.isArray(node.children) && node.children.length > 0) {
            simplified.children = node.children.map((child: any) => this.simplifyNode(child));
        }

        return simplified;
    }

    /**
     * Simplify fill/stroke for AI
     */
    private simplifyFill(fill: any): any {
        const simplified: any = {
            type: fill.type,
            visible: fill.visible !== false,
            opacity: fill.opacity ?? 1,
            blendMode: fill.blendMode || 'NORMAL',
        };

        if (fill.color) {
            simplified.color = {
                r: fill.color.r,
                g: fill.color.g,
                b: fill.color.b,
            };
            if ('a' in fill.color) {
                simplified.color.a = fill.color.a;
            }
        }

        // Keep gradient info if present
        if (fill.gradientStops) {
            simplified.gradientStops = fill.gradientStops;
        }

        return simplified;
    }

    /**
     * Validate and fix design structure
     */
    private validateAndFixDesign(design: any): any {
        if (Array.isArray(design)) {
            return design.map(node => this.validateAndFixNode(node));
        }
        return this.validateAndFixNode(design);
    }

    private validateAndFixNode(node: any): any {
        if (!node || typeof node !== 'object') return node;

        const fixed: any = { ...node };

        // Ensure required properties exist
        if (!fixed.name) fixed.name = "Unnamed";
        if (!fixed.type) fixed.type = "FRAME";
        if (typeof fixed.x !== 'number') fixed.x = 0;
        if (typeof fixed.y !== 'number') fixed.y = 0;

        // Validate node type
        const validTypes = [
            'FRAME', 'GROUP', 'RECTANGLE', 'TEXT', 'ELLIPSE',
            'VECTOR', 'LINE', 'POLYGON', 'STAR',
            'COMPONENT', 'INSTANCE', 'BOOLEAN_OPERATION'
        ];

        if (!validTypes.includes(fixed.type)) {
            console.warn(`Invalid node type "${fixed.type}", converting to FRAME`);
            fixed.type = 'FRAME';
        }

        // Fix color values if they're in 0-255 range
        if (fixed.fills && Array.isArray(fixed.fills)) {
            fixed.fills = fixed.fills.map((fill: any) => {
                if (fill.color) {
                    fill.color = this.normalizeColor(fill.color);
                }
                return fill;
            });
        }

        if (fixed.strokes && Array.isArray(fixed.strokes)) {
            fixed.strokes = fixed.strokes.map((stroke: any) => {
                if (stroke.color) {
                    stroke.color = this.normalizeColor(stroke.color);
                }
                return stroke;
            });
        }

        // Ensure TEXT nodes have required properties
        if (fixed.type === 'TEXT') {
            if (!fixed.characters) fixed.characters = "";
            if (!fixed.fontSize) fixed.fontSize = 14;
            if (!fixed.fontName) {
                fixed.fontName = { family: "Inter", style: "Regular" };
            }
            if (!fixed.textAlignHorizontal) fixed.textAlignHorizontal = "LEFT";
            if (!fixed.textAlignVertical) fixed.textAlignVertical = "TOP";
            if (!fixed.lineHeight) {
                fixed.lineHeight = { unit: "AUTO" };
            }
        }

        // Recursively validate children
        if (fixed.children && Array.isArray(fixed.children)) {
            fixed.children = fixed.children.map((child: any) => this.validateAndFixNode(child));
        }

        return fixed;
    }

    /**
     * Normalize color values to 0-1 range
     */
    private normalizeColor(color: any): any {
        if (!color) return color;

        const normalized: any = { ...color };

        // Check if values are in 0-255 range
        if (normalized.r > 1 || normalized.g > 1 || normalized.b > 1) {
            normalized.r = normalized.r / 255;
            normalized.g = normalized.g / 255;
            normalized.b = normalized.b / 255;
        }

        // Clamp to 0-1 range
        normalized.r = Math.max(0, Math.min(1, normalized.r));
        normalized.g = Math.max(0, Math.min(1, normalized.g));
        normalized.b = Math.max(0, Math.min(1, normalized.b));

        if ('a' in normalized) {
            normalized.a = Math.max(0, Math.min(1, normalized.a));
        }

        return normalized;
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

        // Add conversation history (limit to last 5 messages to save tokens)
        const recentHistory = history.slice(-5);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }

        // Format design in a clear way
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

    /**
     * IMPROVED: Edit system prompt - clearer and more directive
     */
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
            // Remove markdown code blocks if present
            let cleaned = response.trim();

            // Remove ```json or ``` markers
            if (cleaned.includes('```json')) {
                cleaned = cleaned.split('```json')[1].split('```')[0].trim();
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.split('```')[1].split('```')[0].trim();
            }

            // Try to extract JSON array first
            const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                return JSON.parse(arrayMatch[0]);
            }

            // Try to extract JSON object
            const objectMatch = cleaned.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                const parsed = JSON.parse(objectMatch[0]);
                // Wrap single object in array if needed
                return Array.isArray(parsed) ? parsed : [parsed];
            }

            // Last resort: try parsing the cleaned response directly
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
            // Extract text before the JSON
            const lines = response.split('\n');
            const messageLines: string[] = [];

            for (const line of lines) {
                // Stop when we hit JSON markers or actual JSON
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