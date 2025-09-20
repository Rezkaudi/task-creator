import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

import { IExtractTasks } from '../../domain/services/IExtractTasks';
import { ENV_CONFIG } from '../config/env.config';
import { Task } from '../../domain/entities/task.entity';

export class GPTService implements IExtractTasks {
    private openai: OpenAI;
    private systemPrompt: string;


    constructor() {
        this.openai = new OpenAI({
            apiKey: ENV_CONFIG.OPENAI_API_KEY,
        });

        this.systemPrompt = fs.readFileSync(
            path.join(__dirname, '../../../public/prompt/prompt1.txt'),
            'utf-8'
        );
    }

    async extractTasksFromText(text: string): Promise<Task[]> {
        try {
            console.log('🤖 Calling OpenAI API...');
            console.log("text :", this.cleanText(text))
            console.log("systemPrompt :", this.cleanText(this.systemPrompt))


            const completion = await this.openai.chat.completions.create({
                model: ENV_CONFIG.OPENAI_MODEL,
                messages: [
                    {
                        role: 'system', content: this.cleanText(this.systemPrompt)
                    },
                    {
                        role: 'user', content: this.cleanText(text)
                    },
                ],
                response_format: { type: 'json_object' },
                // temperature: 0.1,
            });

            console.log('📊 GPT Response:', completion.choices[0]?.message);

            const responseContent = completion.choices[0]?.message?.content;


            if (!responseContent || responseContent.trim() === '{}' || responseContent.trim() === '{}n') {
                throw new Error('No response from OpenAI');
            }

            console.log('📊 GPT Response received');

            // Parse the JSON response
            const extactedTasks = JSON.parse(responseContent);

            console.log("extactedTasks", extactedTasks)

            return extactedTasks.tasks || extactedTasks;

        } catch (error) {
            console.error('Error extracting tasks from GPT:', error);

            if (error instanceof OpenAI.APIError) {
                throw new Error(`OpenAI API error: ${error.message}`);
            }

            throw new Error('Failed to extract tasks from text');
        }
    }

    cleanText(text: string): string {
        return text
            .replace(/[^\p{L}\p{N}\s,.-]/gu, '') // Keep letters, numbers, spaces, commas, periods, hyphens
            .replace(/- /g, '')                   // Remove bullet points (dash + space)
            .replace(/ +/g, ' ')                  // Replace multiple spaces with single space
            .trim()                               // Remove leading/trailing spaces
            .replace(/\n/g, ', ');                // Replace newlines with comma + space
    }

}
