// src/infrastructure/services/tool-call-handler.service.ts

import { IIconService } from '../../../domain/services/IIconService';
import { ENV_CONFIG } from '../../config/env.config';

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

        // Run with concurrency throttle to avoid overwhelming external APIs
        const results = await this.runWithConcurrency(
            toolCalls,
            tc => this.handleSingleToolCall(tc),
            ENV_CONFIG.MAX_CONCURRENT_TOOL_CALLS
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

    /**
     * Runs async tasks with a concurrency limit.
     * Avoids blasting external APIs with unbounded parallel requests.
     */
    private async runWithConcurrency<T, R>(
        items: T[],
        fn: (item: T) => Promise<R>,
        limit: number
    ): Promise<R[]> {
        if (items.length <= limit) {
            return Promise.all(items.map(fn));
        }

        const results: R[] = new Array(items.length);
        let nextIndex = 0;

        async function worker() {
            while (nextIndex < items.length) {
                const idx = nextIndex++;
                results[idx] = await fn(items[idx]);
            }
        }

        const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
        await Promise.all(workers);
        return results;
    }
}
