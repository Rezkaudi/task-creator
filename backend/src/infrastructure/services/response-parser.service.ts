// src/infrastructure/services/response-parser.service.ts
import fs from "fs";
import { jsonrepair } from 'jsonrepair';

export class ResponseParserService {

    /**
     * Universal parser for all AI responses.
     * Expects JSON format: { "data": [...], "message": "..." }
     */
    parseAIResponse(response: string): { data: any[]; message: string } {
        try {
            let cleaned = response.trim();

            // Extract JSON from code blocks
            if (cleaned.includes('```json')) {
                cleaned = cleaned.split('```json')[1].split('```')[0].trim();
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.split('```')[1].split('```')[0].trim();
            }

            // Find the JSON object
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.log("response", response);
                throw new Error('No JSON object found in response');
            }

            let parsed: any;
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.warn('JSON.parse failed, attempting repair with jsonrepair...', parseError);
                const repaired = jsonrepair(jsonMatch[0]);
                parsed = JSON.parse(repaired);
                console.log('✅ JSON successfully repaired and parsed');
            }

            return {
                data: parsed.data || [],
                message: parsed.message || 'Done'
            };

        } catch (error: any) {
            fs.writeFileSync('failed_response.txt', response);
            console.error('Failed to parse AI response:', error);
            console.error('Response preview:', response);
            throw new Error('Failed to parse AI response as JSON: ' + error);
        }
    }
}
