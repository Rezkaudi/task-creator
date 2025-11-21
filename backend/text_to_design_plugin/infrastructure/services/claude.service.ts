// src/infrastructure/services/claude.service.ts - الكود النهائي مع الـ Prompt المثالي

import { IClaudeGenerator } from '../../domain/IClaudeGenerator';
import fetch from 'node-fetch';

export class ClaudeService implements IClaudeGenerator {
    private readonly apiKey: string;
    private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

    constructor( ) {
        this.apiKey = 'process.env.CLAUDE_API';
        if (!this.apiKey) {
            throw new Error('CLAUDE_API_KEY is missing!');
        }
    }

    async generateDesign(prompt: string): Promise<any> {

        

        const jsonExample = {
            "name": "Example",
            "type": "FRAME",
            "fills": [{"type": "SOLID", "color": {"r": 1, "g": 1, "b": 1}}],
            "children": [
                {"name": "Child Text", "type": "TEXT", "characters": "Hello"}
            ]
        };

        const systemPrompt = `You are a world-class Figma design expert. Your task is to generate a valid JSON object that represents a Figma design based on a user's prompt.

        **CRITICAL INSTRUCTIONS:**
        1.  **Strictly Adhere to the Schema:** The JSON you generate MUST follow the exact structure, property names, and data types shown in this example: ${JSON.stringify(jsonExample)}. Do not invent new properties or deviate from this schema.
        2.  **Valid Node Types:** You must only use node types that are present in the example (e.g., FRAME, TEXT, ELLIPSE, RECTANGLE). Do NOT use invented types like "BUTTON". A button must be a FRAME or RECTANGLE with a TEXT node inside it.
        3.  **Root Element:** The top-level element must always be a single object with "type": "FRAME".
        4.  **Raw JSON Only:** Your entire response must be ONLY the JSON object. It must start with { and end with }. Do not include any explanatory text, comments, or markdown like \`\`\`json.`;
        

        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514", 
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: `Generate a Figma design JSON for: "${prompt}"` }]
                })
            });

            const responseBodyText = await response.text();

            console.log("--- Raw Response Body from Claude API ---");
            console.log(responseBodyText);
            console.log(`--- Status: ${response.status} ${response.statusText} ---`);

            if (!response.ok) {
                throw new Error(`Claude API request failed with status ${response.status}: ${responseBodyText}`);
            }

            const result = JSON.parse(responseBodyText);
            
            if (!result.content || !result.content[0] || !result.content[0].text) {
                throw new Error("Parsed JSON response from Claude is invalid or empty.");
            }

            const rawTextResponse = result.content[0].text;
            const firstBrace = rawTextResponse.indexOf('{');
            const lastBrace = rawTextResponse.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1) {
                console.error("Claude's text content did not contain JSON:", rawTextResponse);
                throw new Error("AI response text did not contain a valid JSON object.");
            }
            
            const jsonString = rawTextResponse.substring(firstBrace, lastBrace + 1);
            
            return JSON.parse(jsonString);

        } catch (error) {
            console.error("An error occurred in ClaudeService:", error);
            throw new Error("Failed to generate design from Claude.");
        }
    }
}
