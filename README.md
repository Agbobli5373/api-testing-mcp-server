# api-mcp-server

A small Model Context Protocol (MCP) server that exposes a focused set of HTTP/API testing tools over stdio. This repo implements the server in TypeScript and is designed to be embedded in MCP-capable editors and clients.

## What this project provides

- An MCP server binary wrapper: `wrapper.cjs` / `wrapper.js` (stdio transport).
- A set of typed API testing tools exported from `src/tools/index.ts` (see "Available tools").
- A lightweight `ApiClient` utility (`src/api-client/index.ts`) supporting JSON requests, multipart uploads, retries, timeouts and concurrent requests.
- TypeScript-based code with build + typecheck scripts.

## Quick start

Prereqs: Node.js 18+ (recommended), pnpm (or npm/yarn).

1. Install dependencies

```bash
pnpm install
```

2. Type-check

```bash
npx tsc --noEmit
```

3. Build

```bash
pnpm build
```

4. Run the MCP server (stdio transport)

```bash
node ./wrapper.cjs
```

During development you can run the TypeScript directly with `tsx`:

```bash
npx tsx src/index.ts
```

## Available tools (summary)

All tools are defined in `src/tools/index.ts`. Short descriptions and example inputs:

- `http_request` — Generic HTTP requester.

  - Input (JSON): { "method": "POST", "url": "https://example.com/api", "headers": {"Content-Type":"application/json"}, "body": {"x":1}, "timeout": 5000 }

- `get` — Convenience GET wrapper.

  - Input: { "url": "https://example.com/data", "headers": {"Accept":"application/json"} }

- `post`, `put`, `delete` — Convenience wrappers for POST/PUT/DELETE.

  - Input for `post`: { "url": "https://...", "body": {...}, "headers": {...} }

- `upload_multipart` — Upload files using multipart/form-data. Supports local file paths or base64-encoded content.

  - Input example:
    {
    "url": "https://api.example.com/upload",
    "files": [
    { "fieldName": "file", "filePath": "./tests/fixtures/image.png", "filename": "image.png" }
    ],
    "fields": { "userId": "123" }
    }
  - Note: on Node <18 the server will attempt a dynamic import of the `form-data` package; on Node 18+ global `FormData` is available. This project includes `form-data` in `optionalDependencies` — install it if you need the Node fallback.

- `validate_json_schema` — Validate JSON against a JSON Schema using AJV.

  - Input: { "data": {...}, "schema": {...} }
  - Note: AJV is an optional runtime dependency. If AJV is not installed the tool will throw an error instructing how to add it.

- `concurrent_requests` — Run many `http_request` calls concurrently with a configurable worker count.

  - Input example:
    { "requests": [{ "method":"GET","url":"https://..." }, { "method":"POST","url":"...","opts":{"body":{}} }], "concurrency": 5 }

- `assert_status` — Assert that a response status matches expected value(s).
  - Input: { "response": {"status":200,...}, "expected": [200,201] }

See `src/tools/index.ts` for full JSON Schema definitions returned to MCP clients.

## Using the server from an MCP client

The server exposes a stdio-based transport. Example task configuration for an editor MCP client that launches the wrapper:

Windows example (adjust paths):

```json
{
  "servers": {
    "api-mcp": {
      "command": "node",
      "args": ["C:\\path\\to\\api-mcp-server\\wrapper.cjs"]
    }
  }
}
```

macOS / Linux example:

```json
{
  "servers": {
    "api-mcp": {
      "command": "node",
      "args": ["/path/to/api-mcp-server/wrapper.cjs"]
    }
  }
}
```

Control which tools are exposed via the `MCP_TOOLS` environment variable. Examples accepted:

- Not set or `*` — expose all tools
- JSON array string: `MCP_TOOLS='["get","post"]'`
- Comma-separated string: `MCP_TOOLS='get,post'`

You can set the env in your client launch config or export it in your shell before launching the wrapper.

## Implementation notes

- Entry points:

  - `src/index.ts` — starts the MCP server.
  - `src/server/optimized-server.ts` — MCP server wiring and stdio transport.
  - `src/server/get-allowed-tools.ts` — parses `MCP_TOOLS` and filters tools.
  - `src/server/execute-tool-method.ts` — routes tool calls to implementations in `src/tools`.

- HTTP helper: `src/api-client/index.ts` implements a small, dependency-free HTTP helper that uses `fetch`, supports timeouts, retries with exponential backoff, JSON body handling, multipart uploads and concurrent workers.

- Multipart uploads: The code uses `globalThis.FormData` when available (Node 18+) and falls back to dynamically importing `form-data` when needed. `form-data` is included as an optional dependency; install it explicitly if your environment requires it:

```bash
pnpm add form-data
```

- JSON Schema Validation: The validate tool dynamically imports AJV. Install it if you want server-side schema checks:

```bash
pnpm add ajv
```

## Development tips & troubleshooting

- If `tsc` reports missing Node types, ensure `@types/node` is installed as a dev dependency (this project includes it).
- If you previously had issues with `@types/form-data` (TS2688), that package is a deprecated stub — this repo relies on the real `form-data` runtime package instead. Removing the stub and using the runtime package resolves the type lookup issues.
- To debug an individual tool locally, run the server and call the tool from an MCP client or write a small Node script that speaks MCP over stdio.

## Examples

- Simple GET via `http_request`:

Request payload to the tool:

```json
{ "method": "GET", "url": "https://jsonplaceholder.typicode.com/todos/1" }
```

Typical successful response shape returned by `ApiClient` wrappers:

```json
{
  "status": 200,
  "ok": true,
  "headers": { "content-type": "application/json; charset=utf-8" },
  "body": { ...parsed json... },
  "rawBody": "...",
  "timeMs": 123
}
```

- Multipart upload (local file): see `upload_multipart` input example above.

## License

MIT
