import OpenAI from 'openai';
import { Task } from '../shared/types';
import { tasksArraySchema } from '../schemas/taskSchema';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = fs.readFileSync(
    path.join(__dirname, '../../public/prompt/prompt1.txt'),
    'utf-8'
);


const cleanText = (text: string): string => {
    return text
        .replace(/[^\p{L}\p{N}\s,.-]/gu, '') // Keep letters, numbers, spaces, commas, periods, hyphens
        .replace(/- /g, '')                   // Remove bullet points (dash + space)
        .replace(/ +/g, ' ')                  // Replace multiple spaces with single space
        .trim()                               // Remove leading/trailing spaces
        .replace(/\n/g, ', ');                // Replace newlines with comma + space
};

export async function extractTasksFromText(text: string): Promise<Task[]> {
    try {
        console.log('🤖 Calling OpenAI API...');
        console.log("text :", cleanText(text))
        console.log("SYSTEM_PROMPT :", cleanText(SYSTEM_PROMPT))


        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: cleanText(SYSTEM_PROMPT) },
                { role: 'user', content: cleanText(text) },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            throw new Error('No response from OpenAI');
        }

        console.log('📊 GPT Response received');

        // Parse the JSON response
        const parsedResponse = JSON.parse(responseContent);

        // Handle both { tasks: [...] } and direct array responses
        const tasksArray = Array.isArray(parsedResponse)
            ? parsedResponse
            : (parsedResponse.tasks || []);

        // Validate with Zod
        const validatedTasks = tasksArraySchema.parse(tasksArray);

        return validatedTasks;
    } catch (error) {
        console.error('Error extracting tasks from GPT:', error);

        if (error instanceof OpenAI.APIError) {
            throw new Error(`OpenAI API error: ${error.message}`);
        }

        throw new Error('Failed to extract tasks from text');
    }
}