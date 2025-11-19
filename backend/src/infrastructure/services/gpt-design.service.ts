import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

import { IDesignGenerator } from '../../domain/services/IDesignGenerator';
import { ENV_CONFIG } from '../config/env.config';
import { Task } from '../../domain/entities/task.entity';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';

export class GPTDesignService implements IDesignGenerator {
    private openai: OpenAI;
    private systemPrompt: string;

    constructor() {
        this.openai = new OpenAI({
            apiKey: ENV_CONFIG.OPENAI_API_KEY,
        });

        this.systemPrompt = fs.readFileSync(
            path.join(__dirname, '../../../public/prompt/design-prompt.txt'),
            'utf-8'
        );
    }

    async generateDesignFromTasks(tasks: Task[], projectContext?: string): Promise<FigmaDesign[]> {
        try {
            console.log('🎨 Generating Figma design from tasks...');

            const tasksSummary = tasks.map((task, idx) =>
                `${idx + 1}. ${task.title}${task.description ? ` - ${task.description}` : ''}${task.priority ? ` [Priority: ${task.priority}]` : ''}`
            ).join('\n');


            // Project Context: ${projectContext || 'Task management dashboard'}

            const userPrompt = `視覚化するタスク (デザイン関連のタスクのみを選択): ${tasksSummary}`.trim();

            console.log('📝 User prompt:', userPrompt.substring(0, 200) + '...');

            const completion = await this.openai.chat.completions.create({
                model: ENV_CONFIG.OPENAI_MODEL,
                messages: [
                    { role: 'system', content: this.cleanText(this.systemPrompt) },
                    { role: 'user', content: this.cleanText(userPrompt) },
                ],
                response_format: { type: 'json_object' },
                // temperature: 0.3,
            });

            const responseContent = completion.choices[0]?.message?.content;

            if (!responseContent || responseContent.trim() === '{}') {
                throw new Error('No design generated from OpenAI');
            }

            console.log('✅ Design JSON received from GPT');

            const designData = JSON.parse(responseContent);

            // Handle both array and single object responses
            const design: FigmaDesign[] = designData.pages || designData;

            // // Validate the design has required properties
            // if (!design[0].name || !design[0].type || design[0].children === undefined) {
            //     throw new Error('Invalid design structure received from GPT');
            // }
            console.log("design :", design)

            return design;

        } catch (error) {
            console.error('Error generating design from GPT:', error);

            if (error instanceof OpenAI.APIError) {
                throw new Error(`OpenAI API error: ${error.message}`);
            }

            throw new Error('Failed to generate design from tasks');
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