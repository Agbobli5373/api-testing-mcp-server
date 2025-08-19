import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tools for API testing MCP server.
 * Designed to mirror the Selenium MCP tools style but focused on HTTP/API testing.
 */
export const tools: Tool[] = [
  {
    name: "http_request",
    description: "Make a generic HTTP request with method, headers, body, timeout and retry options.",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", description: "HTTP method (GET, POST, PUT, DELETE, etc.)" },
        url: { type: "string", description: "Request URL" },
        headers: { type: "object", additionalProperties: { type: "string" } },
        body: { type: ["object", "string", "null"], description: "Request body (object will be JSON-stringified)" },
        timeout: { type: "number", description: "Timeout in milliseconds" },
        retries: { type: "number", description: "Number of retries on transient errors" },
        backoff: { type: "number", description: "Base backoff in ms for retries (exponential)" }
      },
      required: ["method", "url"]
    }
  },
  {
    name: "get",
    description: "Convenience wrapper for GET requests.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        headers: { type: "object", additionalProperties: { type: "string" } },
        timeout: { type: "number" },
        retries: { type: "number" },
        backoff: { type: "number" }
      },
      required: ["url"]
    }
  },
  {
    name: "post",
    description: "Convenience wrapper for POST requests.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        body: { type: ["object", "string", "null"] },
        headers: { type: "object", additionalProperties: { type: "string" } },
        timeout: { type: "number" },
        retries: { type: "number" },
        backoff: { type: "number" }
      },
      required: ["url"]
    }
  },
  {
    name: "put",
    description: "Convenience wrapper for PUT requests.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        body: { type: ["object", "string", "null"] },
        headers: { type: "object", additionalProperties: { type: "string" } },
        timeout: { type: "number" },
        retries: { type: "number" },
        backoff: { type: "number" }
      },
      required: ["url"]
    }
  },
  {
    name: "delete",
    description: "Convenience wrapper for DELETE requests.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        body: { type: ["object", "string", "null"] },
        headers: { type: "object", additionalProperties: { type: "string" } },
        timeout: { type: "number" },
        retries: { type: "number" },
        backoff: { type: "number" }
      },
      required: ["url"]
    }
  },
  {
    name: "upload_multipart",
    description: "Upload files via multipart/form-data. Supports file paths or base64 content.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fieldName: { type: "string" },
              filePath: { type: "string" },
              filename: { type: "string" },
              contentType: { type: "string" },
              contentBase64: { type: "string" }
            },
            required: ["fieldName"]
          }
        },
        fields: { type: "object", additionalProperties: { type: "string" } },
        headers: { type: "object", additionalProperties: { type: "string" } },
        timeout: { type: "number" }
      },
      required: ["url", "files"]
    }
  },
  {
    name: "validate_json_schema",
    description: "Validate JSON data against a JSON Schema (AJV). Throws error if AJV is not installed.",
    inputSchema: {
      type: "object",
      properties: {
        data: {},
        schema: { type: "object" }
      },
      required: ["data", "schema"]
    }
  },
  {
    name: "concurrent_requests",
    description: "Run many requests concurrently with configurable concurrency.",
    inputSchema: {
      type: "object",
      properties: {
        requests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              method: { type: "string" },
              url: { type: "string" },
              opts: { type: "object" }
            },
            required: ["method", "url"]
          }
        },
        concurrency: { type: "number", description: "Max concurrent workers" }
      },
      required: ["requests"]
    }
  },
  {
    name: "assert_status",
    description: "Assert that a response status matches expected value(s).",
    inputSchema: {
      type: "object",
      properties: {
        response: { type: "object" },
        expected: { type: ["number", "array"] }
      },
      required: ["response", "expected"]
    }
  }
];
