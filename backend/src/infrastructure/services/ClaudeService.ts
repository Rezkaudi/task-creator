import axios from 'axios';
import { ENV_CONFIG } from '../config/env.config';

export class ClaudeService {
    async generateDesignFromPrompt(prompt: string): Promise<any> {
        try {
            const model = ENV_CONFIG.MODEL_CLAUDE ;

            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: model,
                    max_tokens: 4000,
                    temperature: 0.7,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                },
                {
                    headers: {
                        'x-api-key': ENV_CONFIG.CLAUDE_API,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json',
                    },
                }
            );

            const rawText = response.data.content[0].text;
            console.log('Raw response (first 500 chars):', rawText.substring(0, 500));

            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Claude response. Raw: ' + rawText.substring(0, 200));
            }

            let jsonString = jsonMatch[0];

            jsonString = jsonString
                .replace(/,\s*}/g, '}')    
                .replace(/,\s*]/g, ']')     
                .replace(/:\s*"#/g, ': "#')  
                .trim();

            let jsonOutput;
            try {
                jsonOutput = JSON.parse(jsonString, (key, value) => {
                    if (typeof value === 'string') {
                        if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                            return value.padEnd(7, 'F'); 
                        }
                        if (value.endsWith('"') && !value.startsWith('"')) return value;
                    }
                    return value;
                });
            } catch (e: any) {
                console.error('JSON after cleanup:', jsonString);
                throw new Error('Final JSON parse failed: ' + e.message);
            }

            return jsonOutput;

        } catch (error: any) {
            console.error('Claude API Error:', {
                message: error.message,
                rawText: error.response?.data?.content?.[0]?.text?.substring(0, 300) || 'N/A'
            });
            throw error;
        }
    }
}