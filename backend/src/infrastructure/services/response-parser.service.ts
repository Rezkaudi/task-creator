// src/infrastructure/services/response-parser.service.ts

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

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                data: parsed.data || [],
                message: parsed.message || 'Done'
            };

        } catch (error: any) {
            console.error('Failed to parse AI response:', error);
            console.error('Response preview:', response);
            throw new Error('Failed to parse AI response as JSON: ' + error);
        }
    }
}
