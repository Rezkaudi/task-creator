// src/infrastructure/services/tool-call-handler.service.ts

import { IIconService } from '../../../domain/services/IIconService';

export interface FunctionToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ToolResult {
    tool_call_id: string;
    role: 'tool';
    content: string;
}

export class ToolCallHandlerService {
    constructor(private readonly iconService: IIconService) { }

    async handleToolCalls(toolCalls: FunctionToolCall[]): Promise<ToolResult[]> {
        console.log(`🛠️ [tools] start — ${toolCalls.length} tool call(s)`);
        const start = Date.now();

        const results = await Promise.all(
            toolCalls.map(toolCall => this.handleSingleToolCall(toolCall))
        );

        console.log(`✅ [tools] done — ${toolCalls.length} tool call(s) in ${Date.now() - start}ms`);
        return results;
    }

    private async handleSingleToolCall(toolCall: FunctionToolCall): Promise<ToolResult> {
        const { name, arguments: args } = toolCall.function;

        let result: string;

        try {
            const parsedArgs = JSON.parse(args);

            switch (name) {
                case 'searchIcons':
                    const searchResult = await this.iconService.searchIcons(parsedArgs.query);
                    result = JSON.stringify(searchResult);
                    break;

                default:
                    result = JSON.stringify({ error: `Unknown tool: ${name}` });
            }
        } catch (error) {
            console.error(`❌ [tools] error in ${name}:`, error);
            result = JSON.stringify({
                error: `Tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }

        return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: result,
        };
    }
}
