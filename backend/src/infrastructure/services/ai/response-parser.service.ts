// src/infrastructure/services/response-parser.service.ts
import fs from "fs";
import { jsonrepair } from 'jsonrepair';

export class ResponseParserService {

    private getDepth(str: string): number {
        let depth = 0, inString = false, escape = false;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (escape) { escape = false; continue; }
            if (ch === '\\' && inString) { escape = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === '{' || ch === '[') depth++;
            else if (ch === '}' || ch === ']') depth--;
        }
        return depth;
    }

    /**
     * Fixes JSON where the AI generated extra closing brackets inside the data array,
     * causing the outer object to close prematurely.
     * Strategy: balance the brackets until depth reaches 0.
     */
    private fixExtraClosingBrackets(json: string): string {
        let maxIterations = 100;
        let depth = this.getDepth(json);
        while (depth !== 0 && maxIterations-- > 0) {
            if (depth < 0) {
                const lastClose = Math.max(json.lastIndexOf('}'), json.lastIndexOf(']'));
                if (lastClose === -1) break;
                json = json.slice(0, lastClose) + json.slice(lastClose + 1);
            } else {
                json = json + '}';
            }
            depth = this.getDepth(json);
        }
        return json;
    }

    /**
     * Universal parser for all AI responses.
     * Expects JSON format: { "data": [...] }
     */
    parseAIResponse(response: string): { data: any[] } {
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
                try {
                    const repaired = jsonrepair(jsonMatch[0]);
                    parsed = JSON.parse(repaired);
                    console.log('✅ JSON successfully repaired and parsed');
                } catch (repairError) {
                    console.warn('jsonrepair failed, attempting bracket balancing...', repairError);
                    const balanced = this.fixExtraClosingBrackets(jsonMatch[0]);
                    parsed = JSON.parse(balanced);
                    console.log('✅ JSON successfully bracket-balanced and parsed');
                }
            }

            return {
                data: parsed.data || [],
            };

        } catch (error: any) {
            fs.writeFileSync('failed_response.txt', response);
            console.error('Failed to parse AI response:', error);
            console.error('Response preview:', response);
            throw new Error('Failed to parse AI response as JSON: ' + error);
        }
    }
}
