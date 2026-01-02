import OpenAI from 'openai';

import { IExtractTasks } from '../../domain/services/IExtractTasks';
import { Task } from '../../domain/entities/task.entity';
import { FigmaDesign } from '../../domain/entities/figma-design.entity';
import { getModelById } from '../config/ai-models.config';
import { meetingToTasksPrompt, tasksToDesignSystemPrompt } from '../config/prompt.config';
import { IAiCostCalculator } from '../../domain/services/IAiCostCanculator';

export class AiExtractTasksService implements IExtractTasks {
    private openai: OpenAI;
    private model = getModelById('o3');
    private costCalculator: IAiCostCalculator;

    constructor(costCalculator: IAiCostCalculator) {
        this.costCalculator = costCalculator;
        this.openai = new OpenAI({
            baseURL: this.model.baseURL,
            apiKey: this.model.apiKey,
        });
    }

    async extractTasksFromText(text: string): Promise<Task[]> {
        try {
            console.log('🤖 Calling OpenAI API...');
            console.log("text :", this.cleanText(text))
            console.log("meetingToTasksPrompt :", this.cleanText(meetingToTasksPrompt))


            const completion = await this.openai.chat.completions.create({
                model: this.model.id,
                messages: [
                    {
                        role: 'system', content: this.cleanText(meetingToTasksPrompt)
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
                model: this.model.id,
                messages: [
                    {
                        role: 'system', content: this.cleanText(tasksToDesignSystemPrompt)
                    },
                    {
                        role: 'user', content: this.cleanText(userPrompt)
                    },
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
