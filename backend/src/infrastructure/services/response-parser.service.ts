// src/infrastructure/services/response-parser.service.ts

import { PrototypeConnection } from '../../domain/entities/prototype-connection.entity';

export class ResponseParserService {

    /**
     * Combined method: extracts both message and design from AI response
     */
    parseAIResponseForDesign(response: string): { message: string; design: any } {
        return {
            message: this.extractMessageFromResponse(response),
            design: this.extractDesignFromResponse(response)
        };
    }

    /**
     * Parse AI response for prototype connections
     */
    parseAIResponseForPrototype(response: string): {
        connections: PrototypeConnection[];
        reasoning?: string;
    } {
        try {
            let cleaned = response.trim();

            // Extract JSON from code blocks
            if (cleaned.includes('```json')) {
                cleaned = cleaned.split('```json')[1].split('```')[0].trim();
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.split('```')[1].split('```')[0].trim();
            }

            // Try to find JSON object
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                connections: parsed.connections || [],
                reasoning: parsed.reasoning
            };

        } catch (error) {
            console.error('Failed to parse AI response for prototype:', error);
            console.error('Raw response:', response.substring(0, 500));
            throw new Error('Failed to parse AI response as JSON');
        }
    }

    extractDesignFromResponse(response: string): any {
        try {
            let cleaned = response.trim();

            // Extract JSON from code blocks
            if (cleaned.includes('```json')) {
                cleaned = cleaned.split('```json')[1].split('```')[0].trim();
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.split('```')[1].split('```')[0].trim();
            }

            // Try to match array first (most common for designs)
            const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                return JSON.parse(arrayMatch[0]);
            }

            // Try to match object
            const objectMatch = cleaned.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                const parsed = JSON.parse(objectMatch[0]);
                return Array.isArray(parsed) ? parsed : [parsed];
            }

            // Try direct parse
            const parsed = JSON.parse(cleaned);
            return Array.isArray(parsed) ? parsed : [parsed];

        } catch (error) {
            console.error('Failed to extract design JSON:', error);
            console.error('Response preview:', response.substring(0, 500) + '...');
            return null;
        }
    }

    extractMessageFromResponse(response: string): string {
        try {
            const lines = response.split('\n');
            const messageLines: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();

                // Stop at JSON content
                if (trimmed.startsWith('[') ||
                    trimmed.startsWith('{') ||
                    trimmed.includes('```')) {
                    break;
                }

                if (trimmed) {
                    messageLines.push(trimmed);
                }
            }

            const message = messageLines.join(' ').trim();
            return message || 'Design modified successfully';

        } catch {
            return 'Design modified successfully';
        }
    }
}