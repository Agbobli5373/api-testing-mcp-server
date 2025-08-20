import { describe, it, expect } from 'vitest';
import { executeToolMethod } from '../src/server/execute-tool-method';

class MockClient {
    calls: any[] = [];
    async request(method: string, url: string, opts: any) { this.calls.push(['request', method, url, opts]); return { status: 200 }; }
    async get(url: string, opts: any) { this.calls.push(['get', url, opts]); return { status: 200 }; }
    async post(url: string, body: any, opts: any) { this.calls.push(['post', url, body, opts]); return { status: 201 }; }
    async put(url: string, body: any, opts: any) { this.calls.push(['put', url, body, opts]); return { status: 204 }; }
    async delete(url: string, body: any, opts: any) { this.calls.push(['delete', url, body, opts]); return { status: 200 }; }
    async uploadMultipart(url: string, files: any[], fields: any, opts: any) { this.calls.push(['upload', url, files, fields, opts]); return { status: 201 }; }
    async validateJsonSchema(data: any, schema: any) { this.calls.push(['validate', data, schema]); return { valid: true, errors: [] }; }
    async concurrentRequests(requests: any[], concurrency: number) { this.calls.push(['concurrent', requests, concurrency]); return []; }
    assertStatus(response: any, expected: any) { this.calls.push(['assert', response, expected]); return true; }
}

describe('executeToolMethod', () => {
    const client = new MockClient();

    it('dispatches http_request', async () => {
        const res = await executeToolMethod(client as any, 'http_request', { method: 'GET', url: 'https://example' });
        expect(res).toEqual({ status: 200 });
        expect(client.calls[0][0]).toBe('request');
    });

    it('dispatches get/post/put/delete wrappers', async () => {
        await executeToolMethod(client as any, 'get', { url: 'https://g' });
        await executeToolMethod(client as any, 'post', { url: 'https://p', body: { x: 1 } });
        await executeToolMethod(client as any, 'put', { url: 'https://u', body: { x: 2 } });
        await executeToolMethod(client as any, 'delete', { url: 'https://d', body: null });
        expect(client.calls.map((c: any) => c[0])).toEqual(expect.arrayContaining(['get', 'post', 'put', 'delete']));
    });

    it('dispatches upload_multipart', async () => {
        const files = [{ fieldName: 'f', filePath: 'a' }];
        const r = await executeToolMethod(client as any, 'upload_multipart', { url: 'https://up', files, fields: { a: 'b' } });
        expect(r).toEqual({ status: 201 });
    });

    it('dispatches validate_json_schema', async () => {
        const r = await executeToolMethod(client as any, 'validate_json_schema', { data: { a: 1 }, schema: {} });
        expect(r).toEqual({ valid: true, errors: [] });
    });

    it('throws for unknown tool', async () => {
        await expect(executeToolMethod(client as any, 'nope', {})).rejects.toThrow(/Unknown tool/);
    });
});
