import { describe, it, expect } from 'vitest';
import { getAllowedTools } from '../src/server/get-allowed-tools';

describe('getAllowedTools', () => {
    const OLD = process.env.MCP_TOOLS;
    afterEach(() => {
        process.env.MCP_TOOLS = OLD;
    });

    it('returns null when MCP_TOOLS is not set', () => {
        delete process.env.MCP_TOOLS;
        expect(getAllowedTools()).toBeNull();
    });

    it('parses JSON array', () => {
        process.env.MCP_TOOLS = JSON.stringify(['get', 'post']);
        expect(getAllowedTools()).toEqual(['get', 'post']);
    });

    it('returns null for JSON "*"', () => {
        process.env.MCP_TOOLS = JSON.stringify('*');
        expect(getAllowedTools()).toBeNull();
    });

    it('parses comma separated list', () => {
        process.env.MCP_TOOLS = 'get, post , ,put';
        expect(getAllowedTools()).toEqual(['get', 'post', 'put']);
    });

    it('returns null for empty comma list', () => {
        process.env.MCP_TOOLS = ',';
        expect(getAllowedTools()).toBeNull();
    });

    it('returns null for empty string', () => {
        process.env.MCP_TOOLS = '';
        expect(getAllowedTools()).toBeNull();
    });

    it('returns null for empty string', () => {
        process.env.MCP_TOOLS = '';
        expect(getAllowedTools()).toBeNull();
    });

});
