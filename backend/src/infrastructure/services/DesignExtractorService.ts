import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ENV_CONFIG } from '../config/env.config';

export class DesignExtractorService {
    private openai: OpenAI;
    private systemPrompt: string;

    constructor() {
        this.openai = new OpenAI({ apiKey: ENV_CONFIG.OPENAI_API_KEY });
        this.systemPrompt = fs.readFileSync(
            path.join(__dirname, '../../../public/prompt/prompt3.txt'),
            'utf-8'
        );
    }

    async extractDesignSpecsAndGeneratePrompt(text: string): Promise<string> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: ENV_CONFIG.OPENAI_MODEL,
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: text },
                ],
                response_format: { type: 'text' }, 
            });

            const generatedPrompt = completion.choices[0]?.message?.content?.trim();
            if (!generatedPrompt) throw new Error('No prompt generated');
            return generatedPrompt;
        } catch (error) {
            console.error('Error in design extraction:', error);
            throw error;
        }
    }
}