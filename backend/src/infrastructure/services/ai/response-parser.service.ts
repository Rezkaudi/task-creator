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
     * causing the outer object to close prematurely before the "message" key.
     * Strategy: split at "message" key, strip trailing extra brackets from data portion,
     * then reconstruct.
     */
    private fixExtraClosingBrackets(json: string): string {
        const msgIdx = json.lastIndexOf(',"message":');
        if (msgIdx === -1) return json;

        let dataPart = json.slice(0, msgIdx);
        let msgPart = json.slice(msgIdx + 1); // "message":"...", then final }

        // Strip trailing extra closing brackets from dataPart until depth == 1
        // (outer { still open, data array closed)
        while (this.getDepth(dataPart) < 1) {
            const lastClose = Math.max(dataPart.lastIndexOf('}'), dataPart.lastIndexOf(']'));
            if (lastClose === -1) break;
            dataPart = dataPart.slice(0, lastClose) + dataPart.slice(lastClose + 1);
        }

        // Strip extra trailing } from msgPart (will be re-added for the outer close)
        if (msgPart.endsWith('}')) {
            msgPart = msgPart.slice(0, -1);
        }

        return dataPart + ',' + msgPart + '}';
    }

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
