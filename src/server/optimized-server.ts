#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ApiClient } from "../api-client/index.js";
import { tools as allTools } from "../tools/index.js";
import { getAllowedTools } from "./get-allowed-tools.js";
import { executeToolMethod } from "./execute-tool-method.js";

export class OptimizedApiMCPServer {
    private server: Server;
    private apiClient: ApiClient | null = null;
    private tools: Tool[];

    constructor() {
        const allowedTools = getAllowedTools();

        // Use all tools by default, filter only when specific tools are requested
        if (allowedTools === null) {
            // No MCP_TOOLS specified or "*" specified - use all tools
            this.tools = [...allTools]; // Create a copy to avoid mutations
        } else {
            // Specific tools requested - filter to only those tools
            this.tools = allTools.filter((t: Tool) => allowedTools.includes(t.name));

            // Fallback: if filtering results in no tools, use all tools
            if (this.tools.length === 0) {
                console.error("Warning: No valid tools found after filtering, using all tools as fallback");
                this.tools = [...allTools];
            }
        }

        this.server = new Server({
            name: "api-mcp",
            version: "1.0.0",
        });

        this.setupToolHandlers();
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            // Return a clean copy of tools array
            return {
                tools: this.tools.map(tool => ({ ...tool })),
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                // Initialize API client if not already done
                if (!this.apiClient) {
                    this.apiClient = new ApiClient();
                }

                // Find the tool first to provide a clearer error when missing
                const tool = this.tools.find(t => t.name === name);
                if (!tool) {
                    throw new Error(`Unknown tool: ${name}`);
                }

                // Delegate execution to the extracted tool router
                const result = await executeToolMethod(this.apiClient, name, args || {});

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("API MCP Server running on stdio");
    }
}
