import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { IClaudeGenerator } from '../../domain/services/IClaudeGenerator';
import { ENV_CONFIG } from '../config/env.config';

export class ClaudeService implements IClaudeGenerator {
    private readonly apiKey: string;
    private readonly cloudeModel: string;

    private systemPrompt: string;
    private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

    constructor() {
        this.apiKey = ENV_CONFIG.CLOUDE_API_KEY!
        this.cloudeModel = ENV_CONFIG.CLOUDE_MODEL

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

            console.log("--- Raw Response Body from Claude API ---");
            console.log(responseBodyText);
            console.log(`--- Status: ${response.status} ${response.statusText} ---`);

            if (!response.ok) {
                throw new Error(`Claude API request failed with status ${response.status}: ${responseBodyText}`);
            }

            const result = JSON.parse(responseBodyText);
            console.log("result :", result)

            if (!result.content || !result.content[0] || !result.content[0].text) {
                throw new Error("Parsed JSON response from Claude is invalid or empty.");
            }

            const rawTextResponse = result.content[0].text;
            console.log("rawTextResponse :", rawTextResponse)

            const jsonDesign = JSON.parse(rawTextResponse);

            return jsonDesign

        } catch (error) {
            console.error("An error occurred in ClaudeService:", error);
            throw new Error("Failed to generate design from Claude.");
        }
    }
}
